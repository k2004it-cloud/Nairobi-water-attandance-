import type { Employee, CheckInLog, DashboardStats, CheckInStatus } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE || '').trim().replace(/\/$/, '');
const LOCAL_STORAGE_KEY = 'nairobi_water_attendance_data';

function apiUrl(path: string) {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return `${API_BASE}${path}`;
}

export type AppData = {
  employees: Employee[];
  logs: CheckInLog[];
  stats: DashboardStats;
};

const DEFAULT_STATS: DashboardStats = {
  totalEmployees: 0,
  checkedIn: 0,
  onTime: 0,
  gracePeriod: 0,
  lateArrivals: 0,
  unaccounted: 0
};

const DEFAULT_APP_DATA: AppData = {
  employees: [],
  logs: [],
  stats: DEFAULT_STATS
};

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

function loadLocalAppData(): AppData | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw) as Partial<AppData>;
    const employees = Array.isArray(payload.employees) ? payload.employees : [];
    const logs = Array.isArray(payload.logs) ? payload.logs : [];
    const stats = payload.stats ?? computeStats(employees, logs);
    return { employees, logs, stats };
  } catch {
    return null;
  }
}

function saveLocalAppData(data: AppData) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

function createAppData(employees: Employee[], logs: CheckInLog[]): AppData {
  return { employees, logs, stats: computeStats(employees, logs) };
}

function computeStats(employees: Employee[], logs: CheckInLog[]): DashboardStats {
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

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error(response.statusText || 'API request failed');
    }
    throw new Error('API did not return JSON');
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = typeof payload === 'object' && payload !== null && 'error' in payload ? (payload as any).error : response.statusText;
    throw new Error(error || 'API request failed');
  }

  return payload as T;
}

export async function loadAppData(): Promise<AppData> {
  const response = await fetch(apiUrl('/api/appData'), {
    cache: 'no-store'
  });

  const payload = await parseResponse<Partial<AppData>>(response);
  const employees = Array.isArray(payload.employees) ? payload.employees : [];
  const logs = Array.isArray(payload.logs) ? payload.logs : [];
  const remoteData: AppData = {
    employees,
    logs,
    stats: payload.stats ?? computeStats(employees, logs)
  };

  saveLocalAppData(remoteData);
  return remoteData;
}

export async function checkInEmployee(employeeId: string): Promise<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats; status: CheckInStatus }> {
  const response = await fetch(apiUrl('/api/checkin'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId })
  });

  const result = await parseResponse<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats; status: CheckInStatus }>(response);
  saveLocalAppData({ employees: result.employees, logs: result.logs, stats: result.stats });
  return result;
}

export async function addEmployee(employee: Employee): Promise<{ employees: Employee[]; stats: DashboardStats }> {
  const response = await fetch(apiUrl('/api/employees'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee)
  });

  const result = await parseResponse<{ employees: Employee[]; stats: DashboardStats }>(response);
  const localData = loadLocalAppData() ?? DEFAULT_APP_DATA;
  saveLocalAppData({ employees: result.employees, logs: localData.logs, stats: result.stats });
  return result;
}

export async function editEmployee(employee: Employee): Promise<{ employees: Employee[]; stats: DashboardStats }> {
  const localData = loadLocalAppData() ?? DEFAULT_APP_DATA;

  const response = await fetch(apiUrl('/api/employees'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee)
  });

  const result = await parseResponse<{ employees: Employee[]; stats: DashboardStats }>(response);
  saveLocalAppData({ employees: result.employees, logs: localData.logs, stats: result.stats });
  return result;
}

export async function deleteEmployee(id: string): Promise<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats }> {
  const response = await fetch(apiUrl(`/api/employees?id=${encodeURIComponent(id)}`), {
    method: 'DELETE'
  });

  const result = await parseResponse<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats }>(response);
  saveLocalAppData({ employees: result.employees, logs: result.logs, stats: result.stats });
  return result;
}

// Admin API helpers
export async function adminLogin(password: string): Promise<{ success: boolean }> {
  const response = await fetch(apiUrl('/api/admin'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', password })
  });

  return parseResponse(response);
}

export async function adminChangePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
  const response = await fetch(apiUrl('/api/admin'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'change', currentPassword, newPassword })
  });

  return parseResponse(response);
}

export async function adminForgotPassword(): Promise<{ success: boolean; token?: string; message?: string; email?: string }> {
  const response = await fetch(apiUrl('/api/admin'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'forgot' })
  });

  return parseResponse(response);
}

export async function adminResetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
  const response = await fetch(apiUrl('/api/admin'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset', token, newPassword })
  });

  return parseResponse(response);
}
