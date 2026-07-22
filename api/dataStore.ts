import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Employee, CheckInLog, DashboardStats, CheckInStatus } from '../src/types.js';
import { supabaseAdmin } from './supabaseClient.js';
import { INITIAL_EMPLOYEES, INITIAL_LOGS } from './seedData.js';

const STORE_FILE = path.join(os.tmpdir(), 'attendance-store.json');
let storeInitialized = false;

const SUPABASE_ENABLED = Boolean(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseAdmin);
const SUPABASE_EMPLOYEES_TABLE = 'employees';
const SUPABASE_CHECKINS_TABLE = 'checkins';

let employees: Employee[] = [];
let logs: CheckInLog[] = [];
let stats: DashboardStats = computeStats();
// Simple in-memory admin record for prototype purposes
let admin = {
  // default can be overridden by VERCEL env vars or local env when deployed
  password: process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'admin2030',
  email: process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'admin@nairobi.local'
};

// reset tokens stored as token -> { email, expires }
const resetTokens: Record<string, { email: string; expires: number }> = {};

function getSystemCheckInStatus(date: Date): CheckInStatus | 'CLOSED' {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const openStart = 7 * 60; // 07:00
  const onTimeCutoff = 8 * 60; // 08:00 inclusive
  const closeAt = 16 * 60; // 16:00 (4 PM)

  if (minutes < openStart || minutes > closeAt) return 'CLOSED';
  if (minutes <= onTimeCutoff) return 'ON TIME';
  return 'LATE';
}

function formatLateRemarks(minutesLate: number, date: Date): string | undefined {
  if (minutesLate <= 0) return undefined;
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

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

function computeStatsForData(employeesData: Employee[], logsData: CheckInLog[]): DashboardStats {
  const totalEmployees = employeesData.length;
  const checkedIn = logsData.length;
  const onTime = logsData.filter((log) => log.status === 'ON TIME').length;
  const gracePeriod = logsData.filter((log) => log.status === 'GRACE PERIOD').length;
  const lateArrivals = logsData.filter((log) => log.status === 'LATE').length;

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
  return computeStatsForData(employees, logs);
}

async function fetchSupabaseEmployees(): Promise<Employee[]> {
  const { data, error } = await supabaseAdmin
    .from(SUPABASE_EMPLOYEES_TABLE)
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    throw error;
  }

  return data as Employee[] ?? [];
}

async function fetchSupabaseLogs(): Promise<CheckInLog[]> {
  const { data, error } = await supabaseAdmin
    .from(SUPABASE_CHECKINS_TABLE)
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function loadSupabaseData(): Promise<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats }> {
  const [employeesData, logsData] = await Promise.all([fetchSupabaseEmployees(), fetchSupabaseLogs()]);
  return {
    employees: employeesData,
    logs: logsData,
    stats: computeStatsForData(employeesData, logsData)
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

  ensureStore();
  return { employees, logs, stats };
}

export function verifyAdminPassword(password: string) {
  return password === admin.password;
}

export function setAdminPassword(currentPassword: string, newPassword: string) {
  if (currentPassword !== admin.password) {
    throw new Error('Current admin password is incorrect');
  }
  admin.password = newPassword;
  return { email: admin.email };
}

export function createResetToken(email: string) {
  // In a real system we'd email this token; here we store and return it for testing
  if (email !== admin.email) {
    // don't reveal whether email exists in production
    throw new Error('If the email is registered, a reset link will be sent');
  }

  const token = `rt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const expires = Date.now() + 1000 * 60 * 60; // 1 hour
  resetTokens[token] = { email, expires };
  return token;
}

export function resetPasswordWithToken(token: string, newPassword: string) {
  const entry = resetTokens[token];
  if (!entry || entry.expires < Date.now()) {
    throw new Error('Reset token is invalid or has expired');
  }

  if (entry.email !== admin.email) {
    throw new Error('Reset token email mismatch');
  }

  admin.password = newPassword;
  delete resetTokens[token];
  return { email: admin.email };
}

export async function checkIn(employeeId: string) {
  if (SUPABASE_ENABLED) {
    try {
      const { data: employeeData, error: employeeError } = await supabaseAdmin
        .from(SUPABASE_EMPLOYEES_TABLE)
        .select('*')
        .eq('id', employeeId)
        .single();

      if (employeeError || !employeeData) {
        throw new Error(employeeError?.message || 'Employee not found');
      }

      const { data: existingLogs, error: existingError } = await supabaseAdmin
        .from(SUPABASE_CHECKINS_TABLE)
        .select('id')
        .eq('employeeId', employeeId);

      if (existingError) {
        throw existingError;
      }

      if (existingLogs && existingLogs.length > 0) {
        throw new Error('Employee has already checked in');
      }

      const now = new Date();
      const status = getSystemCheckInStatus(now);
      if (status === 'CLOSED') {
        throw new Error('Check-in is closed for today');
      }

      const minutesLate = Math.max(0, now.getHours() * 60 + now.getMinutes() - 8 * 60);
      const newLog: CheckInLog = {
        id: `LOG-${Date.now()}`,
        employeeId: employeeData.id,
        employeeName: employeeData.name,
        department: employeeData.department,
        position: employeeData.position,
        checkInTime: now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        status,
        remarks: status === 'LATE' ? formatLateRemarks(minutesLate, now) : undefined,
        avatarInitials: employeeData.name
          .trim()
          .split(/\s+/)
          .map((part) => part[0])
          .join('')
          .substring(0, 2)
          .toUpperCase(),
        avatarBg: ['bg-[#0056b3]', 'bg-[#335f9d]', 'bg-indigo-600', 'bg-emerald-600', 'bg-teal-600', 'bg-amber-600'][
          Math.floor(Math.random() * 6)
        ],
        imageUrl: employeeData.imageUrl || undefined
      };

      const { error: insertError } = await supabaseAdmin
        .from(SUPABASE_CHECKINS_TABLE)
        .insert([{ ...newLog, created_at: new Date().toISOString() }]);

      if (insertError) {
        throw insertError;
      }

      const appData = await loadSupabaseData();
      return { ...appData, status };
    } catch (error) {
      console.error('Supabase checkIn failed:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  ensureStore();

  const employee = employees.find((emp) => emp.id === employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  const alreadyCheckedIn = logs.some((log) => log.employeeId === employeeId);
  if (alreadyCheckedIn) {
    throw new Error('Employee has already checked in');
  }

  const now = new Date();
  const status = getSystemCheckInStatus(now);
  if (status === 'CLOSED') {
    throw new Error('Check-in is closed for today');
  }

  const minutesLate = Math.max(0, now.getHours() * 60 + now.getMinutes() - 8 * 60);
  const newLog: CheckInLog = {
    id: `LOG-${Date.now()}`,
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    position: employee.position,
    checkInTime: now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
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
    imageUrl: employee.imageUrl || undefined
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
      const { error } = await supabaseAdmin
        .from(SUPABASE_EMPLOYEES_TABLE)
        .insert([{ ...employee, created_at: new Date().toISOString() }]);
      if (error) {
        throw error;
      }
      const appData = await loadSupabaseData();
      return { employees: appData.employees, stats: appData.stats };
    } catch (error) {
      console.error('Supabase addEmployee failed:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  ensureStore();

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
      const { error } = await supabaseAdmin
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

      const { error: logUpdateError } = await supabaseAdmin
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
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  ensureStore();

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
      const { error: deleteLogsError } = await supabaseAdmin
        .from(SUPABASE_CHECKINS_TABLE)
        .delete()
        .eq('employeeId', employeeId);
      if (deleteLogsError) {
        throw deleteLogsError;
      }

      const { error: deleteEmployeeError } = await supabaseAdmin
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
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  ensureStore();

  if (!employees.some((existing) => existing.id === employeeId)) {
    throw new Error('Employee not found');
  }

  employees = employees.filter((existing) => existing.id !== employeeId);
  logs = logs.filter((log) => log.employeeId !== employeeId);
  stats = computeStats();
  saveStore();

  return { employees, logs, stats };
}
