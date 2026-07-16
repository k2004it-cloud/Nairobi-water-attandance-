import type { Employee, CheckInLog, DashboardStats, CheckInStatus } from '../src/types';
import { INITIAL_EMPLOYEES, INITIAL_LOGS } from '../src/data';

let employees: Employee[] = [...INITIAL_EMPLOYEES];
let logs: CheckInLog[] = [...INITIAL_LOGS];
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
  const openStart = 7 * 60;
  const onTimeCutoff = 8 * 60 + 20;
  const graceCutoff = 8 * 60 + 40;
  const closeAt = 9 * 60;

  if (minutes < openStart || minutes > closeAt) return 'CLOSED';
  if (minutes <= onTimeCutoff) return 'ON TIME';
  if (minutes <= graceCutoff) return 'GRACE PERIOD';
  return 'LATE';
}

function computeStats(): DashboardStats {
  const totalEmployees = employees.length;
  const checkedIn = logs.length;
  const onTime = logs.filter((log) => log.status === 'ON TIME').length;
  const gracePeriod = logs.filter((log) => log.status === 'GRACE PERIOD').length;
  const lateArrivals = logs.filter((log) => log.status === 'LATE').length;

  return {
    totalEmployees,
    checkedIn,
    onTime,
    gracePeriod,
    lateArrivals,
    unaccounted: Math.max(0, totalEmployees - checkedIn)
  };
}

function resetStore() {
  employees = [...INITIAL_EMPLOYEES];
  logs = [...INITIAL_LOGS];
  stats = computeStats();
}

function ensureStore() {
  if (employees.length === 0 && logs.length === 0) {
    resetStore();
  }
}

export function getAppData() {
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

export function checkIn(employeeId: string) {
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

  const newLog: CheckInLog = {
    id: `LOG-${Date.now()}`,
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    checkInTime: now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    status,
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

  return {
    employees,
    logs,
    stats,
    status
  };
}

export function addEmployee(employee: Employee) {
  ensureStore();

  if (employees.some((existing) => existing.id === employee.id)) {
    throw new Error('Employee ID already exists');
  }

  employees = [employee, ...employees];
  stats = computeStats();

  return { employees, stats };
}

export function editEmployee(employee: Employee) {
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

  return { employees, stats };
}

export function deleteEmployee(employeeId: string) {
  ensureStore();

  if (!employees.some((existing) => existing.id === employeeId)) {
    throw new Error('Employee not found');
  }

  employees = employees.filter((existing) => existing.id !== employeeId);
  logs = logs.filter((log) => log.employeeId !== employeeId);
  stats = computeStats();

  return { employees, logs, stats };
}
