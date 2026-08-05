import { useEffect, useState, useCallback } from 'react';
import { PrintToolbar } from './reports/PrintToolbar';
import { ReportPage } from './reports/ReportPage';
import { fetchReportData } from '../services/reportService';
import { addNairobiDays, getNairobiDateKey } from '../timePolicy';
import type { CheckInLog, DashboardStats, Employee } from '../types';

interface ReportsTabProps {
  employees?: Employee[];
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

function escapeCsvValue(value: string | number | undefined) {
  const text = value == null ? '' : String(value);
  const escaped = text.replace(/"/g, '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ReportsTab({ employees, logs, stats }: ReportsTabProps) {
  const [reportData, setReportData] = useState<{
    employees: Employee[];
    logs: CheckInLog[];
    stats: DashboardStats;
  }>({ employees: employees ?? [], logs: logs ?? [], stats: stats ?? DEFAULT_STATS });
  const [selectedDate, setSelectedDate] = useState(getNairobiDateKey(new Date()));
  const [startDate, setStartDate] = useState(getNairobiDateKey(new Date()));
  const [endDate, setEndDate] = useState(getNairobiDateKey(new Date()));

  const [loading, setLoading] = useState(!(employees || logs || stats));
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchReportData();
      setReportData(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (employees || logs || stats) {
      setReportData({ employees: employees ?? [], logs: logs ?? [], stats: stats ?? DEFAULT_STATS });
      setLoading(false);
      setError(null);
      return;
    }

    loadData();
  }, [employees, logs, stats, loadData]);

  const availableDates = Array.from(new Set((reportData.logs || []).map((log) => log.dateKey).filter(Boolean) as string[])).sort((a, b) => b.localeCompare(a));

  const getDateRangeLogs = useCallback((items: CheckInLog[]) => {
    const safeStart = startDate || getNairobiDateKey(new Date());
    const safeEnd = endDate || safeStart;
    const normalizedStart = safeStart <= safeEnd ? safeStart : safeEnd;
    const normalizedEnd = safeStart <= safeEnd ? safeEnd : safeStart;

    return items.filter((log) => {
      const dayKey = log.dateKey || getNairobiDateKey(new Date());
      return dayKey >= normalizedStart && dayKey <= normalizedEnd;
    });
  }, [startDate, endDate]);

  const dateRangeLogs = getDateRangeLogs(reportData.logs || []);
  const selectedDateLabel = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
  const visibleStats: DashboardStats = {
    totalEmployees: reportData.employees.length,
    checkedIn: dateRangeLogs.length,
    onTime: dateRangeLogs.filter((log) => log.status === 'ON TIME').length,
    gracePeriod: dateRangeLogs.filter((log) => log.status === 'GRACE PERIOD').length,
    lateArrivals: dateRangeLogs.filter((log) => log.status === 'LATE').length,
    unaccounted: Math.max(0, reportData.employees.length - dateRangeLogs.length)
  };

  const weeklySummary = Array.from({ length: 7 }, (_, index) => {
    const dayKey = addNairobiDays(new Date(), index - 6);
    const dayLogs = (reportData.logs || []).filter((log) => (log.dateKey || getNairobiDateKey(new Date())) === dayKey);

    return {
      date: dayKey,
      checkedIn: dayLogs.length,
      late: dayLogs.filter((log) => log.status === 'LATE').length,
      absent: Math.max(0, reportData.employees.length - dayLogs.length)
    };
  });

  const moveDate = (delta: number) => {
    const nextStart = addNairobiDays(startDate, delta);
    setStartDate(nextStart);
    setEndDate(nextStart);
    setSelectedDate(nextStart);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const header = ['No', 'Staff Number', 'Employee Name', 'Designation', 'Department', 'Check-In Date', 'Check-In Time'];
    const rows = dateRangeLogs.map((log, index) => [
      index + 1,
      log.employeeId,
      log.employeeName,
      log.position ?? 'Employee',
      log.department,
      log.dateKey || startDate,
      log.checkInTime || '-'
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
      .join('\r\n');

    downloadFile(`attendance-report-${startDate}${startDate === endDate ? '' : `-to-${endDate}`}.csv`, csv, 'text/csv;charset=utf-8;');
  };

  const handleExportExcel = () => {
    const header = ['No', 'Staff Number', 'Employee Name', 'Designation', 'Department', 'Check-In Date', 'Check-In Time'];
    const rows = dateRangeLogs.map((log, index) => [
      index + 1,
      log.employeeId,
      log.employeeName,
      log.position ?? 'Employee',
      log.department,
      log.dateKey || startDate,
      log.checkInTime || '-'
    ]);

    const tableRows = [header, ...rows]
      .map(
        (row) =>
          `<tr>${row
            .map((cell) => `<td style="border:1px solid #ccc;padding:6px;">${String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`)
            .join('')}</tr>`
      )
      .join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;}td,th{border:1px solid #ccc;padding:6px;}</style></head><body><table>${tableRows}</table></body></html>`;
    downloadFile(`attendance-report-${startDate}${startDate === endDate ? '' : `-to-${endDate}`}.xls`, html, 'application/vnd.ms-excel');
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Attendance Report ${selectedDateLabel}`);
    const body = encodeURIComponent(`Please review the attendance report for ${selectedDateLabel} in the Nairobi Water attendance system.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

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
    <div className="space-y-6">
      <div className="no-print rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <PrintToolbar
            onPrint={handlePrint}
            onDownloadPdf={handleDownloadPdf}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
            onSendEmail={handleSendEmail}
            onRefresh={loadData}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => moveDate(-1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Previous day
            </button>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <label>
                <span className="sr-only">Start date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    const nextStart = event.target.value || getNairobiDateKey(new Date());
                    setStartDate(nextStart);
                    setEndDate(nextStart <= endDate ? endDate : nextStart);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <span>to</span>
              <label>
                <span className="sr-only">End date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    const nextEnd = event.target.value || getNairobiDateKey(new Date());
                    setEndDate(nextEnd >= startDate ? nextEnd : startDate);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => moveDate(1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Next day
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {weeklySummary.map((day) => (
          <div key={day.date} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{day.date}</p>
            <p className="mt-3 text-2xl font-black text-slate-900">{day.checkedIn}</p>
            <p className="text-sm text-slate-600">Checked in</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Late: {day.late}</span>
              <span>Absent: {day.absent}</span>
            </div>
          </div>
        ))}
      </div>

      <ReportPage
        employees={reportData.employees}
        logs={dateRangeLogs}
        stats={visibleStats}
        currentUser="Admin User"
      />
    </div>
  );
}
