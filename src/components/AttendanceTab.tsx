import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle
} from 'lucide-react';
import type { CheckInLog, CheckInStatus, Employee, Tab } from '../types';
import { DEPARTMENTS } from '../data';

interface AttendanceTabProps {
  employees: Employee[];
  logs: CheckInLog[];
  onCheckIn: (employeeId: string) => Promise<{ success: boolean; status?: CheckInStatus }>;
  onNavigateToTab: (tab: Tab) => void;
  onShowDetail: (section: 'roster' | 'active' | 'recorded' | 'pending') => void;
  systemCheckInStatus: CheckInStatus | 'CLOSED';
  isCheckInClosed: boolean;
}

type Notice = {
  tone: 'success' | 'error';
  text: string;
};

const STATUS_BADGE_CLASSES: Record<CheckInStatus | 'CLOSED', string> = {
  'ON TIME': 'bg-green-50 text-green-800 border-green-200',
  'GRACE PERIOD': 'bg-amber-50 text-amber-800 border-amber-200',
  LATE: 'bg-red-50 text-[#ba1a1a] border-[#ffdad6]',
  CLOSED: 'bg-red-50 text-[#ba1a1a] border-[#ffdad6]'
};

const EMPLOYEE_STATUS_CLASSES: Record<Employee['status'], string> = {
  Active: 'bg-green-50 text-green-800 border-green-200',
  Inactive: 'bg-gray-100 text-gray-700 border-gray-200',
  'On Leave': 'bg-amber-50 text-amber-800 border-amber-200'
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function employeeMatchesSearch(employee: Employee, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [employee.name, employee.id, employee.department, employee.position]
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

export default function AttendanceTab({
  employees,
  logs,
  onCheckIn,
  onNavigateToTab,
  onShowDetail,
  systemCheckInStatus,
  isCheckInClosed
}: AttendanceTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkedInIds = useMemo<Set<string>>(
    () => new Set(logs.map((log) => log.employeeId)),
    [logs]
  );

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesDepartment =
        selectedDept === 'All Departments' || employee.department === selectedDept;

      return matchesDepartment && employeeMatchesSearch(employee, searchQuery);
    });
  }, [employees, searchQuery, selectedDept]);

  const activeStaffCount = employees.filter((employee) => employee.status === 'Active').length;
  const pendingStaffCount = employees.filter(
    (employee) => employee.status === 'Active' && !checkedInIds.has(employee.id)
  ).length;
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);
  const recentLogs = logs.slice(0, 6);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!selectedEmployee) {
      setNotice({ tone: 'error', text: 'Select a staff member before checking in.' });
      return;
    }
    if (isCheckInClosed) {
      setNotice({ tone: 'error', text: 'Check-in is closed after 09:00. System window has ended.' });
      return;
    }

    if (selectedEmployee.status !== 'Active') {
      setNotice({
        tone: 'error',
        text: `${selectedEmployee.name} cannot be checked in while marked ${selectedEmployee.status}.`
      });
      return;
    }

    if (checkedInIds.has(selectedEmployee.id)) {
      setNotice({
        tone: 'error',
        text: `${selectedEmployee.name} is already recorded in today's attendance log.`
      });
      return;
    }

    setIsLoading(true);
    setNotice(null);

    window.setTimeout(async () => {
      const result = await onCheckIn(selectedEmployee.id);
      setIsLoading(false);

      if (!result.success) {
        setNotice({
          tone: 'error',
          text: 'Check-in could not be completed. Refresh the list and try again.'
        });
        return;
      }

      setNotice({
        tone: 'success',
        text: '✓ Attendance Recorded Successfully'
      });
      setSelectedEmployeeId('');
    }, 1000);
  };

  const selectEmployee = (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
    setNotice(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-blue-100/70 bg-white/85 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#003f87] shadow-sm backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4" />
            Reception desk
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#003f87] sm:text-4xl">
            Staff Attendance Check-In
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[#424752]">
            Search staff records, verify the employee profile, and submit daily attendance from one focused console.
          </p>
        </div>

        <div className={`rounded-2xl border px-4 py-3 text-right shadow-lg ${STATUS_BADGE_CLASSES[systemCheckInStatus]} bg-white/85 backdrop-blur-sm`}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em]">
            Current system check-in status
          </p>
          <p className="mt-1 text-xl font-black tracking-tight">
            {systemCheckInStatus === 'CLOSED' ? 'CLOSED' : systemCheckInStatus}
          </p>
          <p className="mt-1 text-[10px] text-[#424752]">
            Based on current system time, not staff selection.
          </p>
          {systemCheckInStatus === 'CLOSED' && (
            <p className="mt-1 text-[10px] text-[#ba1a1a]">
              Check-in window has closed for the day.
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => onShowDetail('roster')}
          className="rounded-3xl border border-white/30 bg-white/45 p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.09)] backdrop-blur-2xl transition duration-300 hover:border-blue-200 hover:bg-white/65"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#d7e2ff] text-[#003f87] shadow-sm">
              <Users className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4b5563]">Roster</span>
          </div>
          <p className="text-2xl font-black text-[#111827]">{employees.length}</p>
          <p className="mt-1 text-xs font-semibold text-[#52525b]">Total staff</p>
        </button>

        <button
          type="button"
          onClick={() => onShowDetail('active')}
          className="rounded-3xl border border-white/30 bg-white/45 p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.09)] backdrop-blur-2xl transition duration-300 hover:border-blue-200 hover:bg-white/65"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-green-50 text-green-700 shadow-sm">
              <UserCheck className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4b5563]">Active</span>
          </div>
          <p className="text-2xl font-black text-green-700">{activeStaffCount}</p>
          <p className="mt-1 text-xs font-semibold text-[#52525b]">Eligible staff</p>
        </button>

        <button
          type="button"
          onClick={() => onShowDetail('recorded')}
          className="rounded-3xl border border-white/30 bg-white/45 p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.09)] backdrop-blur-2xl transition duration-300 hover:border-blue-200 hover:bg-white/65"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#d6e3ff] text-[#335f9d] shadow-sm">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4b5563]">Recorded</span>
          </div>
          <p className="text-2xl font-black text-[#335f9d]">{logs.length}</p>
          <p className="mt-1 text-xs font-semibold text-[#52525b]">Checked in</p>
        </button>

        <button
          type="button"
          onClick={() => onShowDetail('pending')}
          className="rounded-3xl border border-white/30 bg-white/45 p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.09)] backdrop-blur-2xl transition duration-300 hover:border-blue-200 hover:bg-white/65"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-700 shadow-sm">
              <Clock3 className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4b5563]">Pending</span>
          </div>
          <p className="text-2xl font-black text-amber-700">{pendingStaffCount}</p>
          <p className="mt-1 text-xs font-semibold text-[#52525b]">Awaiting check-in</p>
        </button>
      </section>


      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.32)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-4 border-b border-[#e1e4e8] pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight text-[#181c1c]">
                Check-In Console
              </h3>
              <p className="mt-1 text-sm font-medium text-[#424752]">
                Select an active employee and record their arrival.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('dashboard')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#c2c6d4] bg-white px-4 text-sm font-bold text-[#003f87] transition-colors hover:bg-blue-50"
            >
              <Users className="h-4 w-4" />
              Dashboard
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#727784]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search name, staff ID, department..."
                className="h-12 w-full rounded-lg border border-[#c2c6d4] bg-white pl-10 pr-4 text-sm font-medium text-[#181c1c] outline-none transition focus:border-[#335f9d] focus:ring-2 focus:ring-[#335f9d]/20"
              />
            </label>

            <select
              value={selectedDept}
              onChange={(event) => setSelectedDept(event.target.value)}
              className="h-12 rounded-lg border border-[#c2c6d4] bg-white px-3 text-sm font-semibold text-[#181c1c] outline-none transition focus:border-[#335f9d] focus:ring-2 focus:ring-[#335f9d]/20"
            >
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-hidden rounded-lg border border-[#e1e4e8]">
              <div className="max-h-[400px] overflow-y-auto">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => {
                    const isSelected = selectedEmployeeId === employee.id;
                    const isCheckedIn = checkedInIds.has(employee.id);
                    const canCheckIn = employee.status === 'Active' && !isCheckedIn;

                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => selectEmployee(employee)}
                        className={`flex w-full items-center gap-3 border-b border-[#e1e4e8] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#f8fafc] ${isSelected ? 'bg-[#eaf5ff]' : 'bg-white'
                          }`}
                      >
                        {employee.imageUrl ? (
                          <img
                            src={employee.imageUrl}
                            alt={employee.name}
                            referrerPolicy="no-referrer"
                            className="h-12 w-12 shrink-0 rounded-lg border border-[#c2c6d4] object-cover"
                          />
                        ) : (
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-[#c2c6d4] bg-[#f1f4f3] text-sm font-black text-[#003f87]">
                            {getInitials(employee.name)}
                          </span>
                        )}

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-[#181c1c]">
                            {employee.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-[#727784]">
                            {employee.id} - {employee.position}
                          </span>
                        </span>

                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${EMPLOYEE_STATUS_CLASSES[employee.status]}`}>
                            {employee.status}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${canCheckIn ? 'text-[#0056b3]' : 'text-[#727784]'
                            }`}>
                            {isCheckedIn ? 'Recorded' : canCheckIn ? 'Ready' : 'Blocked'}
                          </span>
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="flex min-h-48 flex-col items-center justify-center px-4 py-10 text-center">
                    <Search className="h-8 w-8 text-[#727784]" />
                    <p className="mt-3 text-sm font-bold text-[#181c1c]">No staff found</p>
                    <p className="mt-1 text-xs font-medium text-[#727784]">
                      Adjust the search or department filter.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.24)] backdrop-blur-xl">
              {selectedEmployee ? (
                <div>
                  <div className="flex items-center gap-3">
                    {selectedEmployee.imageUrl ? (
                      <img
                        src={selectedEmployee.imageUrl}
                        alt={selectedEmployee.name}
                        referrerPolicy="no-referrer"
                        className="h-16 w-16 rounded-lg border border-[#c2c6d4] object-cover"
                      />
                    ) : (
                      <span className="grid h-16 w-16 place-items-center rounded-lg border border-[#c2c6d4] bg-white text-lg font-black text-[#003f87]">
                        {getInitials(selectedEmployee.name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-[#181c1c]">
                        {selectedEmployee.name}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#727784]">
                        {selectedEmployee.id}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="font-semibold text-[#727784]">Department</dt>
                      <dd className="text-right font-bold text-[#181c1c]">{selectedEmployee.department}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="font-semibold text-[#727784]">Position</dt>
                      <dd className="text-right font-bold text-[#181c1c]">{selectedEmployee.position}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="font-semibold text-[#727784]">Clearance</dt>
                      <dd className="flex items-center justify-end gap-1.5 font-bold text-[#181c1c]">
                        {selectedEmployee.verified ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-700" />
                            Verified
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 text-amber-700" />
                            Pending
                          </>
                        )}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="submit"
                    disabled={selectedEmployee.status !== 'Active' || checkedInIds.has(selectedEmployee.id) || isLoading || isCheckInClosed}
                    className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-[#0056b3] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#003f87] disabled:cursor-not-allowed disabled:bg-[#c2c6d4]"
                  >
                    {isLoading ? (
                      <>
                        <span className="loader-ring h-5 w-5" />
                        Checking Attendance... Please wait...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-5 w-5" />
                        Check In Staff
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex min-h-[290px] flex-col items-center justify-center text-center">
                  <BadgeCheck className="h-10 w-10 text-[#335f9d]" />
                  <p className="mt-4 text-base font-black text-[#181c1c]">
                    Select staff to verify
                  </p>
                  <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-[#727784]">
                    The profile, department, and check-in eligibility will appear here before submission.
                  </p>
                </div>
              )}

              {notice && (
                <div className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${notice.tone === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-[#ba1a1a]'
                  }`}>
                  {notice.tone === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{notice.text}</span>
                </div>
              )}
            </div>
          </div>
        </form>

        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-6">
            <div className="w-full max-w-sm rounded-[32px] border border-white/70 bg-white/95 p-6 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-blue-200 bg-blue-50">
                <span className="loader-ring h-16 w-16" />
              </div>
              <p className="text-xl font-black text-[#003f87]">Checking in…</p>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Please wait while we process your attendance.
              </p>
            </div>
          </div>
        )}

        <aside className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.24)] backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black tracking-tight text-[#181c1c]">
                Recent Arrivals
              </h3>
              <p className="mt-1 text-sm font-medium text-[#424752]">
                Latest recorded attendance activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('reports')}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#c2c6d4] text-[#003f87] transition hover:bg-blue-50"
              title="Open reports"
            >
              <FileText className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 rounded-3xl border border-white/40 bg-white/70 p-3 backdrop-blur-xl"
                >
                  {log.imageUrl ? (
                    <img
                      src={log.imageUrl}
                      alt={log.employeeName}
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 shrink-0 rounded-lg border border-[#c2c6d4] object-cover"
                    />
                  ) : (
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg text-sm font-black text-white ${log.avatarBg || 'bg-[#0056b3]'}`}>
                      {log.avatarInitials}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[#181c1c]">{log.employeeName}</p>
                    <p className="mt-0.5 truncate text-xs font-medium text-[#727784]">
                      {log.department} - {log.checkInTime}
                    </p>
                    {log.remarks && (
                      <p className="mt-1 truncate text-xs font-semibold text-[#ba1a1a]">{log.remarks}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${STATUS_BADGE_CLASSES[log.status]}`}>
                    {log.status === 'GRACE PERIOD' ? 'Grace' : log.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-white/40 bg-white/70 px-4 py-10 text-center backdrop-blur-xl">
                <Clock3 className="mx-auto h-8 w-8 text-[#727784]" />
                <p className="mt-3 text-sm font-bold text-[#181c1c]">No arrivals yet</p>
                <p className="mt-1 text-xs font-medium text-[#727784]">
                  New check-ins will appear in this stream.
                </p>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
