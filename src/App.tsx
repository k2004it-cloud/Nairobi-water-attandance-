import { useState, useEffect } from 'react';
import {
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Bell,
  type LucideIcon
} from 'lucide-react';
import { Employee, CheckInLog, Tab, DashboardStats, CheckInStatus, AttendanceWindowStatus } from './types';
import { INITIAL_EMPLOYEES, INITIAL_LOGS } from './data';

import AttendanceTab from './components/AttendanceTab';
import AttendanceDetailPage from './components/AttendanceDetailPage';
import DashboardTab from './components/DashboardTab';
import AdminTab from './components/AdminTab';
import ReportsTab from './components/ReportsTab';

const STORAGE_KEYS = {
  employees: 'nw_employees',
  logs: 'nw_logs',
  stats: 'nw_stats'
} as const;

const DEFAULT_STATS: DashboardStats = {
  totalEmployees: 450,
  checkedIn: 320,
  onTime: 280,
  gracePeriod: 30,
  lateArrivals: 10,
  unaccounted: 130
};

const AVATAR_BG_COLORS = [
  'bg-[#0056b3]',
  'bg-[#335f9d]',
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-teal-600',
  'bg-amber-600'
];

const NAV_ITEMS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'attendance', label: 'Attendance', Icon: ClipboardList },
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'admin', label: 'Admin', Icon: ShieldCheck },
  { id: 'reports', label: 'Reports', Icon: FileText }
];

function getSystemCheckInStatus(date: Date): AttendanceWindowStatus {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const openStart = 7 * 60;
  const onTimeCutoff = 8 * 60 + 20;
  const graceCutoff = 8 * 60 + 40;
  const closeAt = 9 * 60;

  if (minutes < openStart || minutes > closeAt) return 'CLOSED';
  if (minutes <= onTimeCutoff) return 'ON TIME';
  if (minutes <= graceCutoff) return 'GRACE PERIOD';
  return 'LATE';
}

function loadStoredValue<T>(key: string, fallback: T): T {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function saveStoredValue(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail in private mode or when the quota is full.
  }
}

function formatCheckInTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('attendance');

  const [employees, setEmployees] = useState<Employee[]>(() => {
    return loadStoredValue(STORAGE_KEYS.employees, INITIAL_EMPLOYEES);
  });

  const [logs, setLogs] = useState<CheckInLog[]>(() => {
    return loadStoredValue(STORAGE_KEYS.logs, INITIAL_LOGS);
  });

  const [stats, setStats] = useState<DashboardStats>(() => {
    return loadStoredValue(STORAGE_KEYS.stats, DEFAULT_STATS);
  });

  useEffect(() => {
    saveStoredValue(STORAGE_KEYS.employees, employees);
  }, [employees]);

  useEffect(() => {
    saveStoredValue(STORAGE_KEYS.logs, logs);
  }, [logs]);

  useEffect(() => {
    saveStoredValue(STORAGE_KEYS.stats, stats);
  }, [stats]);

  const checkedInIds: Set<string> = new Set(logs.map((log) => log.employeeId));
  const [detailSection, setDetailSection] = useState<'roster' | 'active' | 'recorded' | 'pending' | null>(null);

  const [clockTime, setClockTime] = useState('');
  const [clockDate, setClockDate] = useState('');
  const [systemCheckInStatus, setSystemCheckInStatus] = useState<AttendanceWindowStatus>(() =>
    getSystemCheckInStatus(new Date())
  );

  const isCheckInClosed = systemCheckInStatus === 'CLOSED';
  const handleShowDetail = (section: 'roster' | 'active' | 'recorded' | 'pending') => {
    setDetailSection(section);
  };
  const handleCloseDetail = () => {
    setDetailSection(null);
  };

  const handleCheckIn = (employeeId: string): { success: boolean; status?: CheckInStatus } => {
    if (isCheckInClosed) return { success: false };
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return { success: false };

    const alreadyCheckedIn = logs.some((l) => l.employeeId === employeeId);
    if (alreadyCheckedIn) return { success: false };

    const randomBg = AVATAR_BG_COLORS[Math.floor(Math.random() * AVATAR_BG_COLORS.length)];
    const checkedAt = new Date();
    const status = getSystemCheckInStatus(checkedAt);
    if (status === 'CLOSED') return { success: false };

    const newLog: CheckInLog = {
      id: `LOG-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      checkInTime: formatCheckInTime(checkedAt),
      status,
      avatarInitials: getInitials(employee.name),
      avatarBg: randomBg,
      imageUrl: employee.imageUrl || undefined
    };

    setLogs((prev) => [newLog, ...prev]);

    setStats((prev) => {
      const nextCheckedIn = prev.checkedIn + 1;
      const nextOnTime = status === 'ON TIME' ? prev.onTime + 1 : prev.onTime;
      const nextGrace = status === 'GRACE PERIOD' ? prev.gracePeriod + 1 : prev.gracePeriod;
      const nextLate = status === 'LATE' ? prev.lateArrivals + 1 : prev.lateArrivals;
      const nextUnaccounted = Math.max(0, prev.totalEmployees - nextCheckedIn);

      return {
        totalEmployees: prev.totalEmployees,
        checkedIn: nextCheckedIn,
        onTime: nextOnTime,
        gracePeriod: nextGrace,
        lateArrivals: nextLate,
        unaccounted: nextUnaccounted
      };
    });

    return { success: true, status };
  };

  // Add/Edit/Delete Employees in state
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees((prev) => [newEmp, ...prev]);
    setStats((prev) => ({
      ...prev,
      totalEmployees: prev.totalEmployees + 1,
      unaccounted: prev.unaccounted + 1
    }));
  };

  const handleEditEmployee = (updatedEmp: Employee) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === updatedEmp.id ? updatedEmp : emp))
    );
    setLogs((prev) =>
      prev.map((log) =>
        log.employeeId === updatedEmp.id
          ? {
            ...log,
            employeeName: updatedEmp.name,
            department: updatedEmp.department,
            avatarInitials: getInitials(updatedEmp.name),
            imageUrl: updatedEmp.imageUrl || undefined
          }
          : log
      )
    );
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    setLogs((prev) => prev.filter((log) => log.employeeId !== id));
    setStats((prev) => {
      const isCheckedIn = logs.some((l) => l.employeeId === id);
      const nextTotal = Math.max(0, prev.totalEmployees - 1);
      const nextCheckedIn = isCheckedIn ? Math.max(0, prev.checkedIn - 1) : prev.checkedIn;

      const userLog = logs.find((l) => l.employeeId === id);
      const status = userLog?.status;
      const nextOnTime = status === 'ON TIME' ? Math.max(0, prev.onTime - 1) : prev.onTime;
      const nextGrace = status === 'GRACE PERIOD' ? Math.max(0, prev.gracePeriod - 1) : prev.gracePeriod;
      const nextLate = status === 'LATE' ? Math.max(0, prev.lateArrivals - 1) : prev.lateArrivals;
      const nextUnaccounted = Math.max(0, nextTotal - nextCheckedIn);

      return {
        totalEmployees: nextTotal,
        checkedIn: nextCheckedIn,
        onTime: nextOnTime,
        gracePeriod: nextGrace,
        lateArrivals: nextLate,
        unaccounted: nextUnaccounted
      };
    });
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockTime(now.toLocaleTimeString('en-GB', { hour12: false }));
      setClockDate(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase());
      setSystemCheckInStatus(getSystemCheckInStatus(now));
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden app-background flex flex-col selection:bg-[#0B5ED7]/15">
      {/* Print-only header: visible when printing, hidden on screen */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-[linear-gradient(135deg,rgba(0,86,179,0.08),rgba(12,164,255,0.04),rgba(255,255,255,0.45))] print:hidden" />
      {/* Top Application Header (Fixed for clean navigation) */}
      <header className="no-print sticky top-0 z-50 border-b border-white/20 bg-gradient-to-r from-[#003f87] via-[#0056b3] to-[#2f7fe8] text-white shadow-[0_20px_60px_-24px_rgba(0,63,135,0.7)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-white/30 bg-transparent shadow-sm ring-1 ring-white/40 sm:h-24 sm:w-32">
              <img
                src="/logo-nairobi-cropped.png"
                alt="Nairobi Water logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">
                Nairobi Water
              </h1>
              <p className="truncate text-xs font-medium text-blue-50 sm:text-sm">
                Attendance System
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-br from-slate-950/80 via-slate-900/75 to-slate-800/80 px-4 py-3 text-right shadow-[0_30px_80px_-34px_rgba(15,23,42,0.7)] backdrop-blur-xl sm:px-5 sm:py-4">
              <div className="absolute -right-6 top-1 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl"></div>
              <div className="absolute -left-6 bottom-1 h-20 w-20 rounded-full bg-white/10 blur-3xl"></div>
              <p className="relative text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                Live clock
              </p>
              <p className="relative mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-[1.5rem]">
                {clockTime}
              </p>
              <p className="relative mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-300/90">
                {clockDate}
              </p>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-[0_10px_30px_-18px_rgba(255,255,255,0.85)] transition hover:bg-white/20 sm:h-12 sm:w-12"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-6 pb-28 sm:px-6 sm:py-8">
        {activeTab === 'attendance' && detailSection === null && (
          <AttendanceTab
            employees={employees}
            logs={logs}
            onCheckIn={handleCheckIn}
            onNavigateToTab={setActiveTab}
            onShowDetail={handleShowDetail}
            systemCheckInStatus={systemCheckInStatus}
            isCheckInClosed={isCheckInClosed}
          />
        )}

        {activeTab === 'attendance' && detailSection !== null && (
          <AttendanceDetailPage
            section={detailSection}
            employees={employees}
            logs={logs}
            checkedInIds={checkedInIds}
            onBack={handleCloseDetail}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            employees={employees}
            logs={logs}
            stats={stats}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'admin' && (
          <AdminTab
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            logs={logs}
            stats={stats}
          />
        )}
      </div>

      {/* Bottom Fixed Navigation Bar (no-print) */}
      <nav
        aria-label="Primary navigation"
        className="no-print fixed bottom-0 left-1/2 z-50 flex w-[calc(100%-1rem)] max-w-xl -translate-x-1/2 items-center justify-around gap-1 rounded-t-2xl border border-b-0 border-blue-100 bg-white/70 px-2 py-2 shadow-lg backdrop-blur-xl"
      >
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 py-2 transition-all duration-200 active:scale-95 cursor-pointer ${isActive
                ? 'bg-[#0056b3] text-white font-bold shadow-sm'
                : 'text-[#424752] hover:bg-[#E5F2FF] hover:text-[#0056b3]'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="mt-1 max-w-full truncate text-[10px] font-bold tracking-wider uppercase">
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
