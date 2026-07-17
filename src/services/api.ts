import type { Employee, CheckInLog, DashboardStats, CheckInStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

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

export async function loadAppData(): Promise<AppData> {
  try {
    const response = await fetch(`${API_BASE}/api/appData`, {
      cache: 'no-store'
    });

    const payload = await parseResponse<Partial<AppData>>(response);
    const employees = Array.isArray(payload.employees) ? payload.employees : [];
    const logs = Array.isArray(payload.logs) ? payload.logs : [];

    return {
      employees,
      logs,
      stats: payload.stats ?? computeStats(employees, logs)
    };
  } catch (error) {
    console.warn('Falling back to empty app data because API was unavailable:', error);
    return {
      employees: [],
      logs: [],
      stats: DEFAULT_STATS
    };
  }
}

export async function checkInEmployee(employeeId: string): Promise<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats; status: CheckInStatus }> {
  const response = await fetch(`${API_BASE}/api/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId })
  });

  return parseResponse(response);
}

export async function addEmployee(employee: Employee): Promise<{ employees: Employee[]; stats: DashboardStats }> {
  const response = await fetch(`${API_BASE}/api/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee)
  });

  return parseResponse(response);
}

export async function editEmployee(employee: Employee): Promise<{ employees: Employee[]; stats: DashboardStats }> {
  const response = await fetch(`${API_BASE}/api/employees`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee)
  });

  return parseResponse(response);
}

export async function deleteEmployee(id: string): Promise<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats }> {
  const response = await fetch(`${API_BASE}/api/employees?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });

  return parseResponse(response);
}

// Admin API helpers
export async function adminLogin(password: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', password })
  });

  return parseResponse(response);
}

export async function adminChangePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'change', currentPassword, newPassword })
  });

  return parseResponse(response);
}

export async function adminForgotPassword(): Promise<{ success: boolean; token?: string; message?: string; email?: string }> {
  const response = await fetch(`${API_BASE}/api/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'forgot' })
  });

  return parseResponse(response);
}

export async function adminResetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset', token, newPassword })
  });

  return parseResponse(response);
}
