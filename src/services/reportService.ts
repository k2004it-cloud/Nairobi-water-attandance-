import type { Employee, CheckInLog, DashboardStats } from '../types';

export async function fetchReportData(): Promise<{ employees: Employee[]; logs: CheckInLog[]; stats: DashboardStats }> {
  const response = await fetch('/api/appData', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Unable to fetch report data.');
  }

  const payload = await response.json();
  return {
    employees: Array.isArray(payload.employees) ? payload.employees : [],
    logs: Array.isArray(payload.logs) ? payload.logs : [],
    stats: payload.stats ?? { totalEmployees: 0, checkedIn: 0, onTime: 0, gracePeriod: 0, lateArrivals: 0, unaccounted: 0 }
  };
}
