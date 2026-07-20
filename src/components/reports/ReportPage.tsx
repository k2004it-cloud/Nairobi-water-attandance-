import { ReportHeader } from './ReportHeader';
import { AttendanceTable } from './AttendanceTable';
import { ReportFooter } from './ReportFooter';
import { ReportSummary } from './ReportSummary';
import type { CheckInLog, Employee, DashboardStats } from '../../types';

interface ReportPageProps {
  employees: Employee[];
  logs: CheckInLog[];
  stats: DashboardStats;
  currentUser: string;
}

export function ReportPage({ employees, logs, stats, currentUser }: ReportPageProps) {
  const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const printedOn = new Date().toLocaleString();
  const attendancePercentage = stats.totalEmployees > 0 ? `${Math.round((stats.checkedIn / stats.totalEmployees) * 100)}%` : '0%';

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8 report-sheet">
      <ReportHeader reportDate={reportDate} reportTime={reportTime} printedBy={currentUser} pageNumber="1" />

      <div className="mt-8 space-y-6">
        <ReportSummary
          reportType="Daily Check-In Report"
          reportDate={reportDate}
          totalStaff={stats.totalEmployees}
          checkedIn={stats.checkedIn}
          lateArrivals={stats.lateArrivals}
          absent={stats.unaccounted}
          attendancePercentage={attendancePercentage}
        />

        <AttendanceTable logs={logs} />
        <ReportFooter preparedBy={currentUser} approvedBy="HR Manager" printedOn={printedOn} />
      </div>
    </div>
  );
}
