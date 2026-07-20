import { useEffect, useState, useCallback } from 'react';
import { PrintToolbar } from './reports/PrintToolbar';
import { ReportPage } from './reports/ReportPage';
import { fetchReportData } from '../services/reportService';
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const header = ['No', 'Staff Number', 'Employee Name', 'Designation', 'Department', 'Check-In Time'];
    const rows = reportData.logs.map((log, index) => [
      index + 1,
      log.employeeId,
      log.employeeName,
      log.position ?? 'Employee',
      log.department,
      log.checkInTime || '-'
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
      .join('\r\n');

    downloadFile('attendance-report.csv', csv, 'text/csv;charset=utf-8;');
  };

  const handleExportExcel = () => {
    const header = ['No', 'Staff Number', 'Employee Name', 'Designation', 'Department', 'Check-In Time'];
    const rows = reportData.logs.map((log, index) => [
      index + 1,
      log.employeeId,
      log.employeeName,
      log.position ?? 'Employee',
      log.department,
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
    downloadFile('attendance-report.xls', html, 'application/vnd.ms-excel');
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent('Attendance Report');
    const body = encodeURIComponent('Please review the attendance report in the Nairobi Water attendance system. Use the export buttons to save the file.');
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
        <PrintToolbar
          onPrint={handlePrint}
          onDownloadPdf={handleDownloadPdf}
          onExportExcel={handleExportExcel}
          onExportCsv={handleExportCsv}
          onSendEmail={handleSendEmail}
          onRefresh={loadData}
        />
      </div>

      <ReportPage
        employees={reportData.employees}
        logs={reportData.logs}
        stats={reportData.stats}
        currentUser="Admin User"
      />
    </div>
  );
}
