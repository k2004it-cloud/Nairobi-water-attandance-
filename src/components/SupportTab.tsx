import { useMemo, useState } from 'react';
import { KeyRound, LockOpen, RefreshCcw, ShieldCheck, UserCog, UserPlus } from 'lucide-react';
import { REGION_OPTIONS, createUserAccount, listUsers, resetPasswordForUser, unlockUser, type AppUser, ROLE_DEFINITIONS, type SystemRole } from '../auth';

const DEFAULT_NEW_USER = {
  fullName: '',
  username: '',
  role: 'hr_coordinator' as SystemRole,
  department: 'Human Resources',
  region: 'All Regions',
  password: ''
};

export default function SupportTab() {
  const [users, setUsers] = useState<AppUser[]>(() => listUsers());
  const [selectedUsername, setSelectedUsername] = useState('ittechnician');
  const [tempPassword, setTempPassword] = useState('Reset@2026');
  const [message, setMessage] = useState<string | null>(null);
  const [newUser, setNewUser] = useState(DEFAULT_NEW_USER);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const selectedUser = useMemo(
    () => users.find((user) => user.username === selectedUsername) ?? users[0],
    [selectedUsername, users]
  );

  const handleReset = () => {
    const ok = resetPasswordForUser(selectedUser.username, tempPassword.trim() || 'Reset@2026');
    unlockUser(selectedUser.username);
    setMessage(ok ? `Password reset for ${selectedUser.fullName}. Temporary password: ${tempPassword || 'Reset@2026'}` : 'Unable to reset password.');
    setUsers(listUsers());
  };

  const handleCreateUser = () => {
    if (!newUser.fullName.trim() || !newUser.username.trim() || !newUser.password.trim()) {
      setCreateMessage('Please fill in the full name, username, and password.');
      return;
    }

    const created = createUserAccount({
      fullName: newUser.fullName,
      username: newUser.username,
      role: newUser.role,
      department: newUser.department,
      region: newUser.region,
      password: newUser.password
    });

    if (!created) {
      setCreateMessage('That username already exists or the details are incomplete.');
      return;
    }

    setUsers(listUsers());
    setSelectedUsername(created.username);
    setNewUser(DEFAULT_NEW_USER);
    setCreateMessage(`User account created for ${created.fullName}.`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">IT Support</p>
            <h2 className="text-2xl font-black text-slate-900">System support, user creation and password recovery</h2>
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-700">
          <UserPlus className="h-5 w-5" />
          <h3 className="text-lg font-bold">Create mandated staff account</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="block xl:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
            <input
              value={newUser.fullName}
              onChange={(event) => setNewUser((current) => ({ ...current, fullName: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Mary Wanjiku"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Username</span>
            <input
              value={newUser.username}
              onChange={(event) => setNewUser((current) => ({ ...current, username: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="mary.wanjiku"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Role</span>
            <select
              value={newUser.role}
              onChange={(event) => {
                const nextRole = event.target.value as SystemRole;
                setNewUser((current) => ({
                  ...current,
                  role: nextRole,
                  department: ROLE_DEFINITIONS[nextRole].department
                }));
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {Object.entries(ROLE_DEFINITIONS).map(([role, config]) => (
                <option key={role} value={role}>{config.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Region</span>
            <select
              value={newUser.region}
              onChange={(event) => setNewUser((current) => ({ ...current, region: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {REGION_OPTIONS.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <input
              type="password"
              value={newUser.password}
              onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Temporary password"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCreateUser}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <UserPlus className="h-4 w-4" />
            Save account
          </button>
          <span className="text-sm text-slate-500">Attendance-only staff remain separate employee records and do not need login credentials.</span>
        </div>

        {createMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {createMessage}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-700">
            <UserCog className="h-5 w-5" />
            <h3 className="text-lg font-bold">User accounts</h3>
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUsername(user.username)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${selectedUser?.username === user.username ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
              >
                <div>
                  <p className="font-bold text-slate-900">{user.fullName}</p>
                  <p className="text-xs text-slate-500">{user.role} • {user.department}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {user.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-700">
            <KeyRound className="h-5 w-5" />
            <h3 className="text-lg font-bold">Password recovery</h3>
          </div>

          {selectedUser && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Selected user</p>
                <p className="mt-2 text-lg font-black text-slate-900">{selectedUser.fullName}</p>
                <p className="text-sm text-slate-600">Username: {selectedUser.username}</p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Temporary password</span>
                <input
                  value={tempPassword}
                  onChange={(event) => setTempPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset password
                </button>
                <button
                  type="button"
                  onClick={() => { unlockUser(selectedUser.username); setUsers(listUsers()); setMessage(`User account ${selectedUser.fullName} unlocked.`); }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <LockOpen className="h-4 w-4" />
                  Unlock account
                </button>
              </div>

              {message && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  {message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
