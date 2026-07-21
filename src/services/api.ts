import type { Employee, CheckInLog, DashboardStats, CheckInStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const LOCAL_STORAGE_KEY = 'nairobi_water_attendance_data';

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

function formatLateRemarks(minutesLate: number): string | undefined {
  if (minutesLate <= 0) return undefined;
  if (minutesLate < 60) {
    return `${minutesLate} min${minutesLate === 1 ? '' : 's'} late`;
  }

  const hours = Math.floor(minutesLate / 60);
  const minutes = minutesLate % 60;
  const hourLabel = `${hours} hr${hours === 1 ? '' : 's'}`;
  return minutes > 0
    ? `${hourLabel} ${minutes} min${minutes === 1 ? '' : 's'} late`
    : `${hourLabel} late`;
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
  const localData = loadLocalAppData();

  try {
    const response = await fetch(`${API_BASE}/api/appData`, {
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
  } catch (error) {
    return localData ?? DEFAULT_APP_DATA;
  }
}

export async function checkInEmployee(employeeId: string): Promise<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats; status: CheckInStatus }> {
  const localData = loadLocalAppData() ?? DEFAULT_APP_DATA;

  try {
    const response = await fetch(`${API_BASE}/api/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId })
    });

    const result = await parseResponse<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats; status: CheckInStatus }>(response);
    saveLocalAppData({ employees: result.employees, logs: result.logs, stats: result.stats });
    return result;
  } catch (error) {
    const employee = localData.employees.find((emp) => emp.id === employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    if (localData.logs.some((log) => log.employeeId === employeeId)) {
      throw new Error('Employee has already checked in');
    }

    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const openStart = 6 * 60;
    const onTimeCutoff = 8 * 60;
    const closeAt = 16 * 60;
    let status: CheckInStatus = 'ON TIME';

    if (minutes < openStart || minutes > closeAt) {
      throw new Error('Check-in is closed for today');
    }

    if (minutes > onTimeCutoff) {
      status = 'LATE';
    }

    const minutesLate = Math.max(0, now.getHours() * 60 + now.getMinutes() - 8 * 60);
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
      remarks: status === 'LATE' ? formatLateRemarks(minutesLate) : undefined,
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

    const appData = createAppData(localData.employees, [newLog, ...localData.logs]);
    saveLocalAppData(appData);
    return { ...appData, status };
  }
}

export async function addEmployee(employee: Employee): Promise<{ employees: Employee[]; stats: DashboardStats }> {
  const localData = loadLocalAppData() ?? DEFAULT_APP_DATA;

  try {
    const response = await fetch(`${API_BASE}/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee)
    });

    const result = await parseResponse<{ employees: Employee[]; stats: DashboardStats }>(response);
    saveLocalAppData({ employees: result.employees, logs: localData.logs, stats: result.stats });
    return result;
  } catch (error) {
    if (localData.employees.some((existing) => existing.id === employee.id)) {
      throw new Error('Employee ID already exists');
    }

    const appData = createAppData([employee, ...localData.employees], localData.logs);
    saveLocalAppData(appData);
    return { employees: appData.employees, stats: appData.stats };
  }
}

export async function editEmployee(employee: Employee): Promise<{ employees: Employee[]; stats: DashboardStats }> {
  const localData = loadLocalAppData() ?? DEFAULT_APP_DATA;

  try {
    const response = await fetch(`${API_BASE}/api/employees`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee)
    });

    const result = await parseResponse<{ employees: Employee[]; stats: DashboardStats }>(response);
    saveLocalAppData({ employees: result.employees, logs: localData.logs, stats: result.stats });
    return result;
  } catch (error) {
    if (!localData.employees.some((existing) => existing.id === employee.id)) {
      throw new Error('Employee not found');
    }

    const employees = localData.employees.map((existing) =>
      existing.id === employee.id ? employee : existing
    );
    const logs = localData.logs.map((log) =>
      log.employeeId === employee.id
        ? { ...log, employeeName: employee.name, department: employee.department, imageUrl: employee.imageUrl || undefined }
        : log
    );
    const appData = createAppData(employees, logs);
    saveLocalAppData(appData);
    return { employees: appData.employees, stats: appData.stats };
  }
}

export async function deleteEmployee(id: string): Promise<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats }> {
  const localData = loadLocalAppData() ?? DEFAULT_APP_DATA;

  try {
    const response = await fetch(`${API_BASE}/api/employees?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });

    const result = await parseResponse<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats }>(response);
    saveLocalAppData({ employees: result.employees, logs: result.logs, stats: result.stats });
    return result;
  } catch (error) {
    if (!localData.employees.some((existing) => existing.id === id)) {
      throw new Error('Employee not found');
    }

    const employees = localData.employees.filter((existing) => existing.id !== id);
    const logs = localData.logs.filter((log) => log.employeeId !== id);
    const appData = createAppData(employees, logs);
    saveLocalAppData(appData);
    return { employees: appData.employees, logs: appData.logs, stats: appData.stats };
  }
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
