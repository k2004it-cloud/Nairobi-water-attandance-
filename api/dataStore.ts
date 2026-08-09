import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Employee, CheckInLog, DashboardStats, CheckInStatus } from '../src/types.js';
import { supabaseAdmin } from './supabaseClient.js';
import { INITIAL_EMPLOYEES, INITIAL_LOGS } from './seedData.js';
import { getErrorMessage } from './errorMessage.js';
import {
  formatNairobiCheckInTime,
  getMinutesLate,
  getNairobiDateKey,
  getSystemCheckInStatus,
  isNairobiWeekend,
  isSameAttendanceDay
} from '../src/timePolicy.js';

const STORE_FILE = path.join(os.tmpdir(), 'attendance-store.json');
let storeInitialized = false;

const IS_LOCAL_DEV = process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production';
const SUPABASE_ENABLED = Boolean(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseAdmin);
const ALLOW_LOCAL_FALLBACK = IS_LOCAL_DEV || !SUPABASE_ENABLED;
const SUPABASE_EMPLOYEES_TABLE = 'employees';
const SUPABASE_CHECKINS_TABLE = 'checkins';
const SUPABASE_REGIONS_TABLE = 'regions';

// ============================================================================
// REGION MAPPING FOR BACKWARD COMPATIBILITY
// Maps region names (text) to their standard codes for UUID lookup
// These codes match the values inserted in the Supabase migration script
// ============================================================================
const REGION_NAME_TO_CODE: Record<string, string> = {
  'All Regions': 'ALL',
  'Nairobi': 'NRB',
  'Central': 'CEN',
  'Coast': 'CST',
  'Western': 'WST',
  'Rift Valley': 'RFT'
};

const REGION_CODE_TO_NAME: Record<string, string> = {
  'ALL': 'All Regions',
  'NRB': 'Nairobi',
  'CEN': 'Central',
  'CST': 'Coast',
  'WST': 'Western',
  'RFT': 'Rift Valley'
};

// In-memory cache of regions to avoid repeated queries
let regionsCache: Map<string, string> = new Map(); // code -> id (UUID)
let regionsCacheExpiry = 0;

function ensureSupabaseEnabled() {
  if (!SUPABASE_ENABLED && !ALLOW_LOCAL_FALLBACK) {
    throw new Error(
      'Supabase is not configured for this environment. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
}

/**
 * Fetch and cache regions from Supabase.
 * The cache is valid for 5 minutes to avoid excessive database queries.
 */
async function getRegionsCache(): Promise<Map<string, string>> {
  const now = Date.now();
  if (regionsCache.size > 0 && now < regionsCacheExpiry) {
    return regionsCache;
  }

  if (!SUPABASE_ENABLED) {
    // For local development, return mock region UUIDs
    regionsCache = new Map(Object.entries(REGION_NAME_TO_CODE).map(([name, code]) => [code, `mock-${code}`]));
    regionsCacheExpiry = now + 5 * 60 * 1000;
    return regionsCache;
  }

  try {
    const adminClient = supabaseAdmin!;
    const { data: regions, error } = await adminClient
      .from(SUPABASE_REGIONS_TABLE)
      .select('id, code');

    if (error) {
      console.warn('Failed to fetch regions from Supabase:', error);
      regionsCache = new Map();
      return regionsCache;
    }

    const codeToId = new Map<string, string>();
    for (const region of (regions ?? [])) {
      if (region.id && region.code) {
        codeToId.set(region.code, region.id);
      }
    }

    regionsCache = codeToId;
    regionsCacheExpiry = now + 5 * 60 * 1000;
    return regionsCache;
  } catch (error) {
    console.error('Error fetching regions:', error);
    regionsCache = new Map();
    return regionsCache;
  }
}

/**
 * Get the region UUID from a region name (text).
 * Handles backward compatibility between text names and UUID IDs.
 */
async function getRegionIdFromName(regionName?: string): Promise<string | undefined> {
  if (!regionName) return undefined;

  const code = REGION_NAME_TO_CODE[regionName];
  if (!code) {
    console.warn(`Unknown region name: ${regionName}`);
    return undefined;
  }

  const cache = await getRegionsCache();
  return cache.get(code);
}

/**
 * Get the region name (text) from a region UUID.
 * Used for backward compatibility when displaying regions.
 */
function getRegionNameFromId(regionId: string): string | undefined {
  // Try to find by matching against cache
  for (const [code, id] of regionsCache) {
    if (id === regionId) {
      return REGION_CODE_TO_NAME[code];
    }
  }
  return undefined;
}


let employees: Employee[] = [];
let logs: CheckInLog[] = [];
let stats: DashboardStats = computeStats();

function formatLateRemarks(minutesLate: number, date: Date): string | undefined {
  if (minutesLate <= 0) return undefined;
  const isWeekend = isNairobiWeekend(date);

  if (minutesLate < 60) {
    return isWeekend ? `${minutesLate} min` : `${minutesLate} min${minutesLate === 1 ? '' : 's'} late`;
  }

  const hours = Math.floor(minutesLate / 60);
  const minutes = minutesLate % 60;
  const hourLabel = `${hours} hr`;
  const minuteLabel = `${minutes} min`;

  if (isWeekend) {
    return minutes > 0 ? `${hourLabel} ${minuteLabel}` : hourLabel;
  }

  return minutes > 0 ? `${hourLabel} ${minuteLabel} late` : `${hourLabel} late`;
}

function computeStatsForData(employeesData: Employee[], logsData: CheckInLog[], dateKeyOverride?: string): DashboardStats {
  const dayKey = dateKeyOverride ?? getNairobiDateKey(new Date());
  const filteredLogs = logsData.filter((log) => log.dateKey === dayKey);

  const totalEmployees = employeesData.length;
  const checkedIn = filteredLogs.length;
  const onTime = filteredLogs.filter((log) => log.status === 'ON TIME').length;
  const gracePeriod = filteredLogs.filter((log) => log.status === 'GRACE PERIOD').length;
  const lateArrivals = filteredLogs.filter((log) => log.status === 'LATE').length;

  return {
    totalEmployees,
    checkedIn,
    onTime,
    gracePeriod,
    lateArrivals,
    unaccounted: Math.max(0, totalEmployees - checkedIn)
  };
}

function computeStats(): DashboardStats {
  return computeStatsForData(employees, logs, getNairobiDateKey(new Date()));
}

function normalizeEmployeeRow(row: Record<string, unknown> | null | undefined): Employee | null {
  if (!row) return null;

  const statusValue = String(row.status ?? 'Active');
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    department: String(row.department ?? ''),
    position: String(row.position ?? ''),
    status: (statusValue === 'Active' || statusValue === 'Inactive' || statusValue === 'On Leave')
      ? (statusValue as Employee['status'])
      : 'Active',
    imageUrl: String(row.imageUrl ?? row.image_url ?? ''),
    verified: Boolean(row.verified ?? row.is_verified ?? true),
    region: typeof row.region === 'string' ? row.region : String(row.region ?? ''),
    region_id: typeof row.region_id === 'string' ? row.region_id : undefined
  };
}

function normalizeCheckInRow(row: Record<string, unknown> | null | undefined): CheckInLog | null {
  if (!row) return null;

  const createdAtValue = row.created_at;
  const createdAt = typeof createdAtValue === 'string' ? new Date(createdAtValue) : new Date();
  const normalizedStatus = String(row.status ?? 'ON TIME') as CheckInStatus;
  const record: CheckInLog & { created_at?: string } = {
    id: String(row.id ?? `LOG-${Date.now()}`),
    employeeId: String(row.employeeId ?? row.employee_id ?? ''),
    employeeName: String(row.employeeName ?? row.employee_name ?? ''),
    department: String(row.department ?? ''),
    position: typeof row.position === 'string' ? row.position : undefined,
    checkInTime: String(row.checkInTime ?? row.check_in_time ?? formatNairobiCheckInTime(createdAt)),
    status: normalizedStatus,
    avatarInitials: String(row.avatarInitials ?? row.avatar_initials ?? ''),
    avatarBg: String(row.avatarBg ?? row.avatar_bg ?? 'bg-[#0056b3]'),
    imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : typeof row.image_url === 'string' ? row.image_url : undefined,
    remarks: typeof row.remarks === 'string' ? row.remarks : undefined,
    created_at: typeof createdAtValue === 'string' ? createdAtValue : undefined,
    region_id: typeof row.region_id === 'string' ? row.region_id : undefined
  };

  return {
    ...record,
    dateKey: getNairobiDateKey(createdAt)
  };
}

async function fetchSupabaseEmployees(): Promise<Employee[]> {
  const adminClient = supabaseAdmin!;
  const { data, error } = await adminClient
    .from(SUPABASE_EMPLOYEES_TABLE)
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => normalizeEmployeeRow(row as Record<string, unknown>)).filter(Boolean) as Employee[];
}

async function fetchSupabaseLogs(): Promise<CheckInLog[]> {
  const adminClient = supabaseAdmin!;
  const { data, error } = await adminClient
    .from(SUPABASE_CHECKINS_TABLE)
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => normalizeCheckInRow(row as Record<string, unknown>))
    .filter(Boolean)
    .map((log) => normalizeSupabaseLog(log as CheckInLog & { created_at?: unknown }));
}

/**
 * Earlier Vercel records stored a UTC-formatted display time. The ISO timestamp
 * is authoritative, so use it to show historical records in Nairobi time too.
 */
function normalizeSupabaseLog(log: CheckInLog & { created_at?: unknown }): CheckInLog {
  if (typeof log.created_at !== 'string') return log;

  const recordedAt = new Date(log.created_at);
  if (Number.isNaN(recordedAt.getTime())) return log;

  const status = getSystemCheckInStatus(recordedAt);
  if (status === 'CLOSED') return log;

  const minutesLate = getMinutesLate(recordedAt);
  return {
    ...log,
    checkInTime: formatNairobiCheckInTime(recordedAt),
    status,
    remarks: status === 'LATE' ? formatLateRemarks(minutesLate, recordedAt) : undefined
  };
}

async function loadSupabaseData(): Promise<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats }> {
  const [employeesData, logsData] = await Promise.all([fetchSupabaseEmployees(), fetchSupabaseLogs()]);
  const todayKey = getNairobiDateKey(new Date());
  return {
    employees: employeesData,
    logs: logsData,
    stats: computeStatsForData(employeesData, logsData, todayKey)
  };
}

function loadStore() {
  if (storeInitialized) return;
  storeInitialized = true;

  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(raw) as {
        employees?: Employee[];
        logs?: CheckInLog[];
        stats?: DashboardStats;
      };

      employees = Array.isArray(data.employees) ? data.employees : [];
      logs = Array.isArray(data.logs) ? data.logs : [];
      stats = data.stats ?? computeStats();
      return;
    }
  } catch {
    // If loading fails, continue with an empty store.
  }

  employees = INITIAL_EMPLOYEES;
  logs = INITIAL_LOGS;
  stats = computeStats();
}

function saveStore() {
  try {
    const payload = { employees, logs, stats };
    fs.writeFileSync(STORE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // Ignore save failures; keep in-memory store available.
  }
}

function ensureStore() {
  loadStore();
}

export async function getAppData() {
  if (SUPABASE_ENABLED) {
    return await loadSupabaseData();
  }

  if (ALLOW_LOCAL_FALLBACK) {
    ensureStore();
    return { employees, logs, stats };
  }

  ensureSupabaseEnabled();
}

export async function checkIn(employeeId: string) {
  if (SUPABASE_ENABLED) {
    try {
      const adminClient = supabaseAdmin!;
      const { data: employeeData, error: employeeError } = await adminClient
        .from(SUPABASE_EMPLOYEES_TABLE)
        .select('*')
        .eq('id', employeeId)
        .single();

      if (employeeError || !employeeData) {
        throw new Error(employeeError?.message || 'Employee not found');
      }

      const now = new Date();
      const todayKey = getNairobiDateKey(now);
      const [year, month, day] = todayKey.split('-');
      const todayStart = new Date(`${year}-${month}-${day}T00:00:00+03:00`).toISOString();
      const todayEnd = new Date(`${year}-${month}-${day}T00:00:00+03:00`);
      todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);
      const todayEndStr = todayEnd.toISOString();

      const { data: existingLogs, error: existingError } = await adminClient
        .from(SUPABASE_CHECKINS_TABLE)
        .select('id')
        .eq('employeeId', employeeId)
        .gte('created_at', todayStart)
        .lt('created_at', todayEndStr);

      if (existingError) {
        throw existingError;
      }

      if (existingLogs && existingLogs.length > 0) {
        throw new Error('Employee has already checked in for today');
      }

      const status = getSystemCheckInStatus(now);
      if (status === 'CLOSED') {
        throw new Error('Check-in is closed for today');
      }

      const minutesLate = getMinutesLate(now);
      const newLog: CheckInLog = {
        id: `LOG-${Date.now()}`,
        employeeId: employeeData.id,
        employeeName: employeeData.name,
        department: employeeData.department,
        position: employeeData.position,
        checkInTime: formatNairobiCheckInTime(now),
        status,
        remarks: status === 'LATE' ? formatLateRemarks(minutesLate, now) : undefined,
        avatarInitials: employeeData.name
          .trim()
          .split(/\s+/)
          .map((part: string) => part[0])
          .join('')
          .substring(0, 2)
          .toUpperCase(),
        avatarBg: ['bg-[#0056b3]', 'bg-[#335f9d]', 'bg-indigo-600', 'bg-emerald-600', 'bg-teal-600', 'bg-amber-600'][
          Math.floor(Math.random() * 6)
        ],
        imageUrl: employeeData.imageUrl || undefined,
        region_id: employeeData.region_id
      };

      const { error: insertError } = await adminClient
        .from(SUPABASE_CHECKINS_TABLE)
        .insert([{ 
          ...newLog, 
          created_at: new Date().toISOString(),
          region_id: employeeData.region_id
        }]);

      if (insertError) {
        throw insertError;
      }

      const appData = await loadSupabaseData();
      return { ...appData, status };
    } catch (error) {
      console.error('Supabase checkIn failed:', error);
      throw new Error(getErrorMessage(error, 'Unable to record attendance'));
    }
  }

  if (ALLOW_LOCAL_FALLBACK) {
    ensureStore();
  } else {
    ensureSupabaseEnabled();
  }

  const employee = employees.find((emp) => emp.id === employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  const now = new Date();
  const dateKey = getNairobiDateKey(now);
  const alreadyCheckedIn = logs.some((log) =>
    log.employeeId === employeeId && (!log.dateKey || isSameAttendanceDay(log.dateKey, dateKey))
  );
  if (alreadyCheckedIn) {
    throw new Error('Employee has already checked in for this day');
  }

  const status = getSystemCheckInStatus(now);
  if (status === 'CLOSED') {
    throw new Error('Check-in is closed for today');
  }

  const minutesLate = getMinutesLate(now);
  const newLog: CheckInLog = {
    id: `LOG-${Date.now()}`,
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    position: employee.position,
    checkInTime: formatNairobiCheckInTime(now),
    status,
    remarks: status === 'LATE' ? formatLateRemarks(minutesLate, now) : undefined,
    avatarInitials: employee.name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase(),
    avatarBg: ['bg-[#0056b3]', 'bg-[#335f9d]', 'bg-indigo-600', 'bg-emerald-600', 'bg-teal-600', 'bg-amber-600'][
      Math.floor(Math.random() * 6)
    ],
    imageUrl: employee.imageUrl || undefined,
    dateKey
  };

  logs = [newLog, ...logs];
  stats = computeStats();
  saveStore();

  return {
    employees,
    logs,
    stats,
    status
  };
}

export async function addEmployee(employee: Employee) {
  if (SUPABASE_ENABLED) {
    try {
      const adminClient = supabaseAdmin!;
      
      // Check if employee ID already exists before attempting insert
      const { data: existing, error: checkError } = await adminClient
        .from(SUPABASE_EMPLOYEES_TABLE)
        .select('id')
        .eq('id', employee.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existing) {
        throw new Error('Employee ID already exists');
      }
      
      // Resolve region name to UUID if not already set
      let regionId = employee.region_id;
      if (!regionId && employee.region) {
        regionId = await getRegionIdFromName(employee.region);
        if (!regionId) {
          console.warn(`Could not resolve region: ${employee.region}, defaulting to All Regions`);
          regionId = await getRegionIdFromName('All Regions');
        }
      }
      
      // Insert employee with both region (text) and region_id (UUID)
      // RLS will enforce that the inserted region_id matches the user's region
      const { error } = await adminClient
        .from(SUPABASE_EMPLOYEES_TABLE)
        .insert([{
          ...employee,
          region: employee.region ?? '',
          region_id: regionId,
          created_at: new Date().toISOString()
        }]);
      if (error) {
        throw error;
      }
      const appData = await loadSupabaseData();
      return { employees: appData.employees, stats: appData.stats };
    } catch (error) {
      console.error('Supabase addEmployee failed:', error);
      if (ALLOW_LOCAL_FALLBACK) {
        ensureStore();
        if (employees.some((existing) => existing.id === employee.id)) {
          throw new Error('Employee ID already exists');
        }
        employees = [employee, ...employees];
        stats = computeStats();
        saveStore();
        return { employees, stats };
      }
      throw new Error(getErrorMessage(error, 'Unable to add employee'));
    }
  }

  if (ALLOW_LOCAL_FALLBACK) {
    ensureStore();
  } else {
    ensureSupabaseEnabled();
  }

  if (employees.some((existing) => existing.id === employee.id)) {
    throw new Error('Employee ID already exists');
  }

  employees = [employee, ...employees];
  stats = computeStats();
  saveStore();

  return { employees, stats };
}

export async function editEmployee(employee: Employee) {
  if (SUPABASE_ENABLED) {
    try {
      const adminClient = supabaseAdmin!;
      
      // Fetch the current employee to preserve region_id
      const { data: currentEmployee, error: fetchError } = await adminClient
        .from(SUPABASE_EMPLOYEES_TABLE)
        .select('region_id')
        .eq('id', employee.id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!currentEmployee) {
        throw new Error('Employee not found');
      }
      
      // Update the employee, preserving region_id
      // RLS policies will prevent unauthorized updates across regions
      const { error } = await adminClient
        .from(SUPABASE_EMPLOYEES_TABLE)
        .update({
          name: employee.name,
          email: employee.email,
          department: employee.department,
          position: employee.position,
          region: employee.region ?? '',
          status: employee.status,
          imageUrl: employee.imageUrl,
          verified: employee.verified,
          region_id: currentEmployee.region_id // Preserve existing region_id
        })
        .eq('id', employee.id);

      if (error) {
        throw error;
      }

      const { error: logUpdateError } = await adminClient
        .from(SUPABASE_CHECKINS_TABLE)
        .update({
          employeeName: employee.name,
          department: employee.department,
          position: employee.position,
          imageUrl: employee.imageUrl
        })
        .eq('employeeId', employee.id);

      if (logUpdateError) {
        throw logUpdateError;
      }

      const appData = await loadSupabaseData();
      return { employees: appData.employees, stats: appData.stats };
    } catch (error) {
      console.error('Supabase editEmployee failed:', error);
      throw new Error(getErrorMessage(error, 'Unable to update employee'));
    }
  }

  if (ALLOW_LOCAL_FALLBACK) {
    ensureStore();
  } else {
    ensureSupabaseEnabled();
  }

  if (!employees.some((existing) => existing.id === employee.id)) {
    throw new Error('Employee not found');
  }

  employees = employees.map((existing) => (existing.id === employee.id ? employee : existing));
  logs = logs.map((log) =>
    log.employeeId === employee.id
      ? { ...log, employeeName: employee.name, department: employee.department, imageUrl: employee.imageUrl || undefined }
      : log
  );
  stats = computeStats();
  saveStore();

  return { employees, stats };
}

export async function deleteEmployee(employeeId: string) {
  if (SUPABASE_ENABLED) {
    try {
      const adminClient = supabaseAdmin!;
      const { error: deleteLogsError } = await adminClient
        .from(SUPABASE_CHECKINS_TABLE)
        .delete()
        .eq('employeeId', employeeId);
      if (deleteLogsError) {
        throw deleteLogsError;
      }

      const { error: deleteEmployeeError } = await adminClient
        .from(SUPABASE_EMPLOYEES_TABLE)
        .delete()
        .eq('id', employeeId);
      if (deleteEmployeeError) {
        throw deleteEmployeeError;
      }

      const appData = await loadSupabaseData();
      return { employees: appData.employees, logs: appData.logs, stats: appData.stats };
    } catch (error) {
      console.error('Supabase deleteEmployee failed:', error);
      throw new Error(getErrorMessage(error, 'Unable to delete employee'));
    }
  }

  if (ALLOW_LOCAL_FALLBACK) {
    ensureStore();
  } else {
    ensureSupabaseEnabled();
  }

  if (!employees.some((existing) => existing.id === employeeId)) {
    throw new Error('Employee not found');
  }

  employees = employees.filter((existing) => existing.id !== employeeId);
  logs = logs.filter((log) => log.employeeId !== employeeId);
  stats = computeStats();
  saveStore();

  return { employees, logs, stats };
}
