import { useState, useEffect } from 'react';
import {
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Bell,
  type LucideIcon
} from 'lucide-react';
import {
  Employee,
  CheckInLog,
  Tab,
  DashboardStats,
  CheckInStatus,
  AttendanceWindowStatus
} from './types';
import {
  loadAppData,
  checkInEmployee,
  addEmployee,
  editEmployee,
  deleteEmployee,
  adminLogin,
  adminChangePassword,
  adminForgotPassword,
  adminResetPassword
} from './services/api';

import AttendanceTab from './components/AttendanceTab';
import AttendanceDetailPage from './components/AttendanceDetailPage';
import DashboardTab from './components/DashboardTab';
import AdminTab from './components/AdminTab';
import ReportsTab from './components/ReportsTab';

const DEFAULT_STATS: DashboardStats = {
  totalEmployees: 0,
  checkedIn: 0,
  onTime: 0,
  gracePeriod: 0,
  lateArrivals: 0,
  unaccounted: 0
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
  { id: 'admin', label: 'Admin', Icon: ShieldCheck }
];

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@nairobi.local';

const DEFAULT_APP_DATA = {
  employees: [] as Employee[],
  logs: [] as CheckInLog[],
  stats: DEFAULT_STATS
};

function getSystemCheckInStatus(date: Date): AttendanceWindowStatus {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const openStart = 6 * 60; // 06:00
  const onTimeCutoff = 8 * 60; // 08:00 inclusive
  const closeAt = 16 * 60; // 16:00 (4 PM)

  if (minutes < openStart || minutes > closeAt) return 'CLOSED';
  if (minutes <= onTimeCutoff) return 'ON TIME';
  return 'LATE';
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
  const initialRoute = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '/';
  const initialPagePath = initialRoute.includes('/admin') ? 'admin' : 'reception';
  const [activeTab, setActiveTab] = useState<Tab>(initialPagePath === 'admin' ? 'dashboard' : 'attendance');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<CheckInLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await loadAppData();
        setEmployees(Array.isArray(data.employees) ? data.employees : []);
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setStats(data.stats ?? DEFAULT_STATS);
      } catch (err) {
        setError((err as Error).message || 'Unable to load app data.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const checkedInIds: Set<string> = new Set((logs ?? []).map((log) => log.employeeId));
  const [detailSection, setDetailSection] = useState<'roster' | 'active' | 'recorded' | 'pending' | null>(null);

  const [clockTime, setClockTime] = useState('');
  const [clockDate, setClockDate] = useState('');
  const [systemCheckInStatus, setSystemCheckInStatus] = useState<AttendanceWindowStatus>(() =>
    getSystemCheckInStatus(new Date())
  );
  const [pagePath, setPagePath] = useState<'reception' | 'admin'>(initialPagePath);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.localStorage.getItem('nw-admin-auth') === 'true'
  );
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  // Admin auth & password management UI state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotToken, setForgotToken] = useState<string | null>(null);
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [showChangeForm, setShowChangeForm] = useState(false);
  const [changeCurrentPassword, setChangeCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [changeMessage, setChangeMessage] = useState<string | null>(null);

  const isCheckInClosed = systemCheckInStatus === 'CLOSED';
  const isReceptionPage = pagePath === 'reception';
  const isAdminPage = pagePath === 'admin';

  const handleShowDetail = (section: 'roster' | 'active' | 'recorded' | 'pending') => {
    setDetailSection(section);
    setActiveTab('attendance');
  };
  const handleCloseDetail = () => {
    setDetailSection(null);
  };

  const navigateToPath = (path: string) => {
    const nextPage = path.toLowerCase().includes('/admin') ? 'admin' : 'reception';
    window.history.pushState(null, '', nextPage === 'admin' ? '/admin' : '/reception');
    setPagePath(nextPage);
    setActiveTab(nextPage === 'admin' ? 'dashboard' : 'attendance');
  };

  useEffect(() => {
    if (isReceptionPage && activeTab !== 'attendance' && activeTab !== 'reports') {
      setActiveTab('attendance');
    }
  }, [isReceptionPage, activeTab]);

  useEffect(() => {
    const onPopState = () => {
      const pathname = window.location.pathname.toLowerCase();
      const nextPage = pathname.includes('/admin') ? 'admin' : 'reception';
      setPagePath(nextPage);
      setActiveTab(nextPage === 'admin' ? 'dashboard' : 'attendance');
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('resetToken');
      if (token) {
        setResetTokenInput(token);
        setShowForgot(true);
        setResetMessage('A reset token has been loaded from the link. Enter a new password to complete the reset.');
      }
    }
  }, []);

  const handleAdminLogin = () => {
    setAdminError(null);
    setAdminLoading(true);
    (async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        const res = await adminLogin(adminPassword);
        if (res && (res as any).success) {
          setIsAdminAuthenticated(true);
          window.localStorage.setItem('nw-admin-auth', 'true');
          setError(null);
          setAdminError(null);
        } else {
          setAdminError('Admin password is incorrect.');
        }
      } catch (err) {
        setAdminError((err as Error).message || 'Admin password is incorrect.');
      } finally {
        setAdminLoading(false);
      }
    })();
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    window.localStorage.removeItem('nw-admin-auth');
    setError(null);
    setAdminPassword('');
  };

  // Forgot / Reset password
  const handleForgotRequest = async () => {
    setResetMessage(null);
    setForgotToken(null);

    try {
      const res = await adminForgotPassword();
      if (res && res.token) {
        setForgotToken(res.token);
      }
      setResetMessage(res.message || `A reset link has been sent to ${ADMIN_EMAIL}.`);
    } catch (err) {
      setResetMessage((err as Error).message || 'Unable to request password reset.');
    }
  };

  const handleResetWithToken = async () => {
    setResetMessage(null);
    const token = resetTokenInput || forgotToken || '';
    if (!token || !resetNewPassword) {
      setResetMessage('Please provide token and new password.');
      return;
    }

    try {
      await adminResetPassword(token, resetNewPassword);
      setResetMessage('Password has been reset. You can now login with the new password.');
      setForgotToken(null);
      setResetTokenInput('');
      setResetNewPassword('');
    } catch (err) {
      setResetMessage((err as Error).message || 'Unable to reset password.');
    }
  };

  // Change password while authenticated
  const handleChangePassword = async () => {
    setChangeMessage(null);
    if (!changeCurrentPassword || !changeNewPassword) {
      setChangeMessage('Please fill both current and new passwords');
      return;
    }
    if (changeNewPassword !== changeConfirmPassword) {
      setChangeMessage('New passwords do not match');
      return;
    }

    try {
      await adminChangePassword(changeCurrentPassword, changeNewPassword);
      setChangeMessage('Password changed successfully');
      setChangeCurrentPassword('');
      setChangeNewPassword('');
      setChangeConfirmPassword('');
      setShowChangeForm(false);
    } catch (err) {
      setChangeMessage((err as Error).message || 'Unable to change password.');
    }
  };

  const handleCheckIn = async (employeeId: string): Promise<{ success: boolean; status?: CheckInStatus }> => {
    if (isCheckInClosed) return { success: false };

    try {
      const result = await checkInEmployee(employeeId);
      setEmployees(result.employees);
      setLogs(result.logs);
      setStats(result.stats);
      setError(null);
      return { success: true, status: result.status };
    } catch (err) {
      setError((err as Error).message || 'Unable to check in employee.');
      return { success: false };
    }
  };

  // Add/Edit/Delete Employees in state
  const handleAddEmployee = async (newEmp: Employee) => {
    try {
      const result = await addEmployee(newEmp);
      setEmployees(result.employees);
      setStats(result.stats);
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'Unable to add employee.');
    }
  };

  const handleEditEmployee = async (updatedEmp: Employee) => {
    try {
      const result = await editEmployee(updatedEmp);
      setEmployees(result.employees);
      setStats(result.stats);
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'Unable to update employee.');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const result = await deleteEmployee(id);
      setEmployees(result.employees);
      setLogs(result.logs);
      setStats(result.stats);
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'Unable to delete employee.');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-center">
          <p className="text-lg font-semibold">Loading attendance data...</p>
          <p className="text-sm text-slate-500 mt-2">Please wait while the system initializes.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-700 px-4">
        <div className="max-w-lg rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold">Unable to load the attendance system</h2>
          <p className="mt-3 text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`print-scope relative min-h-screen overflow-hidden app-background flex flex-col selection:bg-[#0B5ED7]/15 ${isAdminPage && activeTab !== 'reports' ? 'admin-print-mode' : ''}`}>
      {/* Print-only header: visible when printing, hidden on screen */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-[linear-gradient(135deg,rgba(0,86,179,0.08),rgba(12,164,255,0.04),rgba(255,255,255,0.45))] print:hidden" />
      {/* Top Application Header (Fixed for clean navigation) */}
      <header className="no-print sticky top-0 z-50 border-b border-white/20 bg-gradient-to-r from-[#003f87] via-[#0056b3] to-[#2f7fe8] text-white shadow-[0_20px_60px_-24px_rgba(0,63,135,0.7)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white p-1 sm:p-2 shadow-2xl ring-4 ring-white/70 z-50 transition-transform duration-200 hover:scale-105">
              <img
                src="/logo-nairobi.png"
                alt="Nairobi Water logo"
                title="Nairobi Water"
                className="h-14 w-14 sm:h-18 sm:w-18 object-contain object-center transition-transform duration-200 will-change-transform"
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">
                Nairobi Water
              </h1>
              <p className="truncate text-xs font-medium text-blue-50 sm:text-sm">
                {isReceptionPage ? 'Reception Attendance' : 'Admin Management'}
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
              <span className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                Admin
              </span>
            </div>
            </div>
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
          {activeTab === 'attendance' && (isReceptionPage || (isAdminPage && isAdminAuthenticated)) && detailSection === null && (
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

          {activeTab === 'attendance' && (isReceptionPage || (isAdminPage && isAdminAuthenticated)) && detailSection !== null && (
            <AttendanceDetailPage
              section={detailSection}
              employees={employees}
              logs={logs}
              checkedInIds={checkedInIds}
              onBack={handleCloseDetail}
            />
          )}

          {activeTab === 'reports' && isReceptionPage && (
            <ReportsTab
              employees={employees}
              logs={logs}
              stats={stats}
            />
          )}

          {isAdminPage && !isAdminAuthenticated && (
            <div className="no-print relative max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            {adminLoading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl">
                <div className="flex flex-col items-center gap-4">
                  <div className="login-loader-overlay-ring" />
                  <div className="text-sm font-semibold text-slate-700">Unlocking admin area...</div>
                </div>
              </div>
            )}
            <h2 className="text-2xl font-bold text-slate-900">Admin login</h2>
            <p className="mt-2 text-sm text-slate-600">
              Enter the admin password to access employee management and sensitive controls.
            </p>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Enter admin password"
              />
              {adminError && (
                <p className="text-sm text-red-600">{adminError}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAdminLogin}
                  disabled={adminLoading}
                  className={`inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white transition ${adminLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                >
                  {adminLoading ? (
                    <span className="inline-flex items-center gap-3">
                      <span className="login-loader-ring" />
                      <span>Unlocking admin area...</span>
                    </span>
                  ) : (
                    'Unlock admin area'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForgot((s) => !s); setResetMessage(null); setForgotToken(null); }}
                  disabled={adminLoading}
                  className={`text-sm underline ${adminLoading ? 'text-slate-400 cursor-not-allowed' : 'text-[#003f87] hover:opacity-90'}`}
                >
                  Forgot password?
                </button>
              </div>

              {showForgot && (
                <div className="mt-4 space-y-3 rounded-lg border border-dashed p-4 bg-gray-50">
                  <p className="text-sm text-[#424752]">A reset link will be automatically sent to the admin email address configured for this app.</p>
                  <p className="text-sm text-slate-700">Admin email: <span className="font-semibold">{ADMIN_EMAIL}</span></p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleForgotRequest}
                      className="rounded-lg bg-[#0056b3] px-4 py-2 text-white text-sm"
                    >
                      Send reset email
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(false); setResetMessage(null); setForgotToken(null); }}
                      className="rounded-lg border px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>

                  {forgotToken && (
                    <div className="mt-3 text-sm text-[#003f87]">
                      <p>Reset token (for testing):</p>
                      <pre className="mt-1 rounded bg-white/90 p-2 text-xs">{forgotToken}</pre>
                      <p className="mt-2 text-xs text-[#727784]">Use the token below to set a new password.</p>
                    </div>
                  )}

                  {resetMessage && (
                    <p className="mt-2 text-sm text-[#424752]">{resetMessage}</p>
                  )}

                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      value={resetTokenInput}
                      onChange={(e) => setResetTokenInput(e.target.value)}
                      placeholder="Enter reset token"
                      className="rounded-lg border border-slate-300 px-3 py-2"
                    />
                    <input
                      type="password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="New password"
                      className="rounded-lg border border-slate-300 px-3 py-2"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleResetWithToken}
                        className="rounded-lg bg-green-600 px-4 py-2 text-white text-sm"
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={() => { setResetTokenInput(''); setResetNewPassword(''); setResetMessage(null); }}
                        className="rounded-lg border px-4 py-2 text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {isAdminPage && isAdminAuthenticated && (
          <>
            <div className="no-print mb-6 flex items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangeForm((s) => !s)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Change password
                </button>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Sign out
                </button>
              </div>
            </div>

            {showChangeForm && (
              <div className="no-print max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
                <h3 className="text-lg font-bold">Change admin password</h3>
                <p className="mt-2 text-sm text-slate-600">Provide your current password and a new password to update.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input
                    type="password"
                    value={changeCurrentPassword}
                    onChange={(e) => setChangeCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    type="password"
                    value={changeNewPassword}
                    onChange={(e) => setChangeNewPassword(e.target.value)}
                    placeholder="New password"
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    type="password"
                    value={changeConfirmPassword}
                    onChange={(e) => setChangeConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={handleChangePassword} className="rounded-lg bg-[#0056b3] px-4 py-2 text-white text-sm">Save</button>
                  <button type="button" onClick={() => { setShowChangeForm(false); setChangeMessage(null); }} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
                </div>
                {changeMessage && <p className="mt-3 text-sm text-red-600">{changeMessage}</p>}
              </div>
            )}

            {activeTab === 'dashboard' && (
              <DashboardTab
                employees={employees}
                logs={logs}
                stats={stats}
                onNavigateToTab={setActiveTab}
                onShowDetail={handleShowDetail}
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
          </>
        )}
      </div>

      {/* Bottom Fixed Navigation Bar (no-print) */}
      <nav
        aria-label="Primary navigation"
        className="no-print fixed bottom-0 left-1/2 z-50 flex w-[calc(100%-1rem)] max-w-xl -translate-x-1/2 items-center justify-around gap-1 rounded-t-2xl border border-b-0 border-blue-100 bg-white/70 px-2 py-2 shadow-lg backdrop-blur-xl"
      >
        {isReceptionPage ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              aria-current={activeTab === 'attendance' ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 py-2 transition-all duration-200 active:scale-95 cursor-pointer ${activeTab === 'attendance'
                ? 'bg-[#0056b3] text-white font-bold shadow-sm'
                : 'text-[#424752] hover:bg-[#E5F2FF] hover:text-[#0056b3]'
                }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="mt-1 max-w-full truncate text-[10px] font-bold tracking-wider uppercase">
                Attendance
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              aria-current={activeTab === 'reports' ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 py-2 transition-all duration-200 active:scale-95 cursor-pointer ${activeTab === 'reports'
                ? 'bg-[#0056b3] text-white font-bold shadow-sm'
                : 'text-[#424752] hover:bg-[#E5F2FF] hover:text-[#0056b3]'
                }`}
            >
              <FileText className="w-5 h-5" />
              <span className="mt-1 max-w-full truncate text-[10px] font-bold tracking-wider uppercase">
                Reports
              </span>
            </button>
          </>
        ) : (
          <>
            {isAdminAuthenticated && (
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                aria-current={activeTab === 'reports' ? 'page' : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 py-2 transition-all duration-200 active:scale-95 cursor-pointer ${activeTab === 'reports'
                  ? 'bg-[#0056b3] text-white font-bold shadow-sm'
                  : 'text-[#424752] hover:bg-[#E5F2FF] hover:text-[#0056b3]'
                  }`}
              >
                <FileText className="w-5 h-5" />
                <span className="mt-1 max-w-full truncate text-[10px] font-bold tracking-wider uppercase">
                  Reports
                </span>
              </button>
            )}
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
          </>
        )}
      </nav>
    </div>
  );
}
