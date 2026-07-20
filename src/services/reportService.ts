import type { Employee, CheckInLog, DashboardStats } from '../types';

const DEFAULT_STATS: DashboardStats = {
  totalEmployees: 0,
  checkedIn: 0,
  onTime: 0,
  gracePeriod: 0,
  lateArrivals: 0,
  unaccounted: 0
};

export async function fetchReportData(): Promise<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats }> {
  const response = await fetch('/api/appData', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Unable to fetch report data.');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return { employees: [], logs: [], stats: DEFAULT_STATS };
  }

  try {
    const payload = await response.json();
    return {
      employees: Array.isArray(payload.employees) ? payload.employees : [],
      logs: Array.isArray(payload.logs) ? payload.logs : [],
      stats: payload.stats ?? DEFAULT_STATS
    };
  } catch {
    return { employees: [], logs: [], stats: DEFAULT_STATS };
  }
}
