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
const ALLOW_LOCAL_FALLBACK = IS_LOCAL_DEV;
const SUPABASE_EMPLOYEES_TABLE = 'employees';
const SUPABASE_CHECKINS_TABLE = 'checkins';

function ensureSupabaseEnabled() {
  if (!SUPABASE_ENABLED) {
    throw new Error(
      'Supabase is not configured for this environment. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
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
    verified: Boolean(row.verified ?? row.is_verified ?? true)
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
    created_at: typeof createdAtValue === 'string' ? createdAtValue : undefined
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
        imageUrl: employeeData.imageUrl || undefined
      };

      const { error: insertError } = await adminClient
        .from(SUPABASE_CHECKINS_TABLE)
        .insert([{ ...newLog, created_at: new Date().toISOString() }]);

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
      const { error } = await adminClient
        .from(SUPABASE_EMPLOYEES_TABLE)
        .insert([{ ...employee, created_at: new Date().toISOString() }]);
      if (error) {
        throw error;
      }
      const appData = await loadSupabaseData();
      return { employees: appData.employees, stats: appData.stats };
    } catch (error) {
      console.error('Supabase addEmployee failed:', error);
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
      const { error } = await adminClient
        .from(SUPABASE_EMPLOYEES_TABLE)
        .update({
          name: employee.name,
          email: employee.email,
          department: employee.department,
          position: employee.position,
          status: employee.status,
          imageUrl: employee.imageUrl,
          verified: employee.verified
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
