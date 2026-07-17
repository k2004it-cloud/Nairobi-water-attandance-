import { useEffect, useState } from 'react';
import { ReportPage } from './reports/ReportPage';
import { fetchReportData } from '../services/reportService';
import type { CheckInLog, DashboardStats, Employee } from '../types';

interface ReportsTabProps {
  logs?: CheckInLog[];
  stats?: DashboardStats;
}

const DEFAULT_STATS: DashboardStats = {
  totalEmployees: 0,
  checkedIn: 0,
  onTime: 0,
  gracePeriod: 0,
  lateArrivals: 0,
  unaccounted: 0
};

export default function ReportsTab({ logs, stats }: ReportsTabProps) {
  const [reportData, setReportData] = useState<{
    employees: Employee[];
    logs: CheckInLog[];
    stats: DashboardStats;
  }>({ employees: [], logs: logs ?? [], stats: stats ?? DEFAULT_STATS });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchReportData();
        setReportData(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">Loading report data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm">
        <p>Unable to load report data: {error}</p>
      </div>
    );
  }

  return (
    <ReportPage
      employees={reportData.employees}
      logs={reportData.logs}
      stats={reportData.stats}
      currentUser="Admin User"
    />
  );
}
