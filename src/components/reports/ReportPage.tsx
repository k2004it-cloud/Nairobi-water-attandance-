import { useMemo, useState } from 'react';
import { ReportHeader } from './ReportHeader';
import { ReportSummary } from './ReportSummary';
import { FilterBar } from './FilterBar';
import { PrintToolbar } from './PrintToolbar';
import { AttendanceTable } from './AttendanceTable';
import { ReportFooter } from './ReportFooter';
import type { CheckInLog, Employee, DashboardStats } from '../../types';

interface ReportPageProps {
  employees: Employee[];
  logs: CheckInLog[];
  stats: DashboardStats;
  currentUser: string;
}

const pageSize = 12;

function formatAttendancePercentage(logs: CheckInLog[], totalStaff: number) {
  if (totalStaff === 0) return '0%';
  const present = logs.filter((log) => log.status === 'ON TIME' || log.status === 'GRACE PERIOD').length;
  return `${Math.round((present / totalStaff) * 100)}%`;
}

function formatAbsentCount(logs: CheckInLog[], totalStaff: number) {
  return Math.max(0, totalStaff - logs.filter((log) => log.status !== 'ABSENT').length);
}

export function ReportPage({ employees, logs, stats, currentUser }: ReportPageProps) {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [status, setStatus] = useState('All Statuses');
  const [page, setPage] = useState(1);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (department !== 'All Departments' && log.department !== department) return false;
      if (status !== 'All Statuses') {
        if (status === 'PRESENT' && log.status === 'LATE') return false;
        if (status === 'LATE' && log.status !== 'LATE') return false;
        if (status === 'ABSENT' && log.status !== 'ABSENT') return false;
      }
      if (search.trim() !== '') {
        const query = search.trim().toLowerCase();
        return (
          log.employeeName.toLowerCase().includes(query) ||
          log.employeeId.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [logs, department, status, search]);

  const attendancePercentage = formatAttendancePercentage(filteredLogs, employees.length);
  const absentCount = formatAbsentCount(filteredLogs, employees.length);
  const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const printedOn = new Date().toLocaleString();

  const handlePrint = () => window.print();
  const handleDownloadPdf = () => window.print();
  const handleExportExcel = () => {
    const headers = ['No', 'Staff Number', 'Employee Name', 'Designation', 'Department', 'Check-In Time', 'Expected Time', 'Minutes Late', 'Status', 'Remarks'];
    const rows = filteredLogs.map((log, index) => [
      `${index + 1}`,
      log.employeeId,
      log.employeeName,
      log.position || 'Employee',
      log.department,
      log.checkInTime,
      '08:00 AM',
      log.checkInTime ? log.checkInTime : '-',
      log.status,
      log.remarks || '-'
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${reportDate.replace(/ /g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleExportCsv = handleExportExcel;
  const handleSendEmail = () => {
    window.alert('Email report feature is not configured in this prototype.');
  };
  const handleRefresh = () => window.location.reload();

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="no-print flex justify-end">
        <PrintToolbar
          onPrint={handlePrint}
          onDownloadPdf={handleDownloadPdf}
          onExportExcel={handleExportExcel}
          onExportCsv={handleExportCsv}
          onSendEmail={handleSendEmail}
          onRefresh={handleRefresh}
        />
      </div>

      <div className="grid gap-6">
        <ReportHeader reportDate={reportDate} reportTime={reportTime} printedBy={currentUser} pageNumber="1" />
        <div className="no-print text-center">
          <h2 className="text-lg font-bold uppercase tracking-[0.22em] text-[#0f172a]">DAILY CHECK-IN REPORT</h2>
        </div>
        <div className="no-print">
          <ReportSummary
            totalStaff={employees.length}
            checkedIn={stats.checkedIn}
            lateArrivals={stats.lateArrivals}
            absent={absentCount}
            attendancePercentage={attendancePercentage}
          />
        </div>
        <div className="no-print">
          <FilterBar
            searchValue={search}
            departmentValue={department}
            statusValue={status}
            onSearchChange={setSearch}
            onDepartmentChange={setDepartment}
            onStatusChange={setStatus}
            onRefresh={handleRefresh}
          />
        </div>
        <AttendanceTable logs={filteredLogs} page={page} pageSize={pageSize} onPageChange={setPage} />
        <ReportFooter preparedBy={currentUser} approvedBy="HR Manager" printedOn={printedOn} />
      </div>
    </div>
  );
}
