import type { AppUser, SystemRole } from '../auth';

const SESSION_KEY = 'nw-central-session';

function getSession() {
  return typeof window === 'undefined' ? '' : window.localStorage.getItem(SESSION_KEY) || '';
}

async function request<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getSession() ? { Authorization: `Bearer ${getSession()}` } : {})
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Central user service request failed.');
  return payload as T;
}

export async function loginCentralUser(username: string, password: string) {
  const result = await request<{ user: AppUser; session: string }>({ action: 'login', username, password });
  window.localStorage.setItem(SESSION_KEY, result.session);
  return result.user;
}

export async function listCentralUsers() {
  const result = await request<{ users: AppUser[] }>({ action: 'list' });
  return result.users;
}

export async function createCentralUser(input: { fullName: string; username: string; role: SystemRole; department: string; region: string; password: string }) {
  const result = await request<{ user: AppUser }>({ action: 'create', ...input });
  return result.user;
}

export async function setCentralUserStatus(username: string, status: 'active' | 'locked') {
  await request({ action: status === 'locked' ? 'lock' : 'unlock', username });
}

export async function updateCentralUser(input: { username: string; fullName: string; role: SystemRole; department: string; region: string; status: 'active' | 'locked'; password?: string }) {
  const result = await request<{ user: AppUser }>({ action: 'update', ...input });
  return result.user;
}

export async function deleteCentralUser(username: string) {
  await request({ action: 'delete', username });
}

export function clearCentralSession() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_KEY);
}
