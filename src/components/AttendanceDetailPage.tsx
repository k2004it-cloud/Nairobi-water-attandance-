import { BadgeCheck, Clock3, Users, UserCheck } from 'lucide-react';
import { CheckInLog, Employee, Tab } from '../types';

interface AttendanceDetailPageProps {
  section: 'roster' | 'active' | 'recorded' | 'pending';
  employees: Employee[];
  logs: CheckInLog[];
  checkedInIds: Set<string>;
  onBack: () => void;
}

const SECTION_TITLES: Record<AttendanceDetailPageProps['section'], string> = {
  roster: 'Roster Details',
  active: 'Active Staff',
  recorded: 'Checked-in Staff',
  pending: 'Pending Check-ins'
};

const SECTION_DESCRIPTIONS: Record<AttendanceDetailPageProps['section'], string> = {
  roster: 'All staff currently available in the directory.',
  active: 'Employees eligible for check-in right now.',
  recorded: 'Latest attendance records from today.',
  pending: 'Staff who still need attendance recorded.'
};

export default function AttendanceDetailPage({
  section,
  employees,
  logs,
  checkedInIds,
  onBack
}: AttendanceDetailPageProps) {
  const renderContent = () => {
    if (section === 'roster') {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {employees.map((employee) => (
            <div key={employee.id} className="rounded-2xl border border-[#e1e4e8] bg-[#f8fafc] p-4">
              <p className="text-sm font-bold text-[#181c1c]">{employee.name}</p>
              <p className="mt-1 text-xs text-[#727784]">{employee.id} • {employee.department}</p>
              <p className="mt-2 text-xs text-[#475569]">{employee.position}</p>
            </div>
          ))}
        </div>
      );
    }

    if (section === 'active') {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {employees.filter((employee) => employee.status === 'Active').map((employee) => (
            <div key={employee.id} className="rounded-2xl border border-[#e1e4e8] bg-[#f0fdf4] p-4">
              <p className="text-sm font-bold text-[#181c1c]">{employee.name}</p>
              <p className="mt-1 text-xs text-[#166534]">{employee.position}</p>
              <p className="mt-1 text-xs text-[#475569]">{employee.department}</p>
            </div>
          ))}
        </div>
      );
    }

    if (section === 'recorded') {
      return (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-[#e1e4e8] bg-[#eff6ff] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#181c1c]">{log.employeeName}</p>
                  <p className="mt-1 text-xs text-[#475569]">{log.department}</p>
                </div>
                <span className="text-xs font-bold text-[#335f9d]">{log.checkInTime}</span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#334155]">{log.status}</p>
              {log.remarks && (
                <p className="mt-1 text-xs text-[#7c3aed]">{log.remarks}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {employees.filter((employee) => employee.status === 'Active' && !checkedInIds.has(employee.id)).map((employee) => (
          <div key={employee.id} className="rounded-2xl border border-[#e1e4e8] bg-[#fffbeb] p-4">
            <p className="text-sm font-bold text-[#181c1c]">{employee.name}</p>
            <p className="mt-1 text-xs text-[#92400e]">{employee.position}</p>
            <p className="mt-1 text-xs text-[#475569]">{employee.department}</p>
          </div>
        ))}
      </div>
    );
  };

  const Icon = section === 'roster' ? Users : section === 'active' ? UserCheck : section === 'recorded' ? BadgeCheck : Clock3;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="rounded-3xl border border-[#e1e4e8] bg-white/95 p-6 shadow-soft backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-[#eaf2ff] text-[#003f87] shadow-sm">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#4f5667]">Detail page</p>
              <h1 className="mt-2 text-3xl font-black text-[#181c1c]">{SECTION_TITLES[section]}</h1>
              <p className="mt-2 text-sm text-[#525f7f]">{SECTION_DESCRIPTIONS[section]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-[#c2c6d4] bg-white px-5 text-sm font-bold text-[#003f87] transition hover:bg-[#d7e2ff]"
          >
            Back to Attendance
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-[#e1e4e8] bg-white/95 p-6 shadow-soft backdrop-blur-xl">
        {renderContent()}
      </div>
    </div>
  );
}
