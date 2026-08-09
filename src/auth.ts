export type SystemRole =
  | 'system_admin'
  | 'hr_coordinator'
  | 'hr_supervisor'
  | 'secretary'
  | 'regional_manager'
  | 'it_technician';

export type PermissionName =
  | 'attendance:view'
  | 'attendance:checkin'
  | 'reports:view'
  | 'reports:export'
  | 'dashboard:view'
  | 'employees:manage'
  | 'users:manage'
  | 'support:view'
  | 'support:reset_password';

export interface AppUser {
  id: string;
  fullName: string;
  username: string;
  role: SystemRole;
  department: string;
  region: string;
  permissions: PermissionName[];
  status: 'active' | 'locked';
}

export const REGION_OPTIONS = ['All Regions', 'Nairobi', 'Central', 'Coast', 'Western', 'Rift Valley'];

export function isGlobalRegionScope(user: AppUser | null) {
  return !user || user.region === 'All Regions';
}

export function matchesRegionScope(user: AppUser | null, region?: string) {
  if (!user) return true;
  if (isGlobalRegionScope(user)) return true;
  if (!region) return false;
  return user.region === region;
}

export const ROLE_DEFINITIONS: Record<SystemRole, { label: string; department: string; permissions: PermissionName[] }> = {
  system_admin: {
    label: 'System Admin',
    department: 'Administration',
    permissions: ['attendance:view', 'attendance:checkin', 'reports:view', 'reports:export', 'dashboard:view', 'employees:manage', 'users:manage', 'support:view', 'support:reset_password']
  },
  hr_coordinator: {
    label: 'HR Coordinator',
    department: 'Human Resources',
    permissions: ['attendance:view', 'attendance:checkin', 'reports:view', 'reports:export', 'dashboard:view']
  },
  hr_supervisor: {
    label: 'HR Supervisor',
    department: 'Human Resources',
    permissions: ['attendance:view', 'attendance:checkin', 'reports:view', 'reports:export', 'dashboard:view']
  },
  secretary: {
    label: 'Secretary',
    department: 'Administration',
    permissions: ['attendance:view', 'reports:view']
  },
  regional_manager: {
    label: 'Regional Manager',
    department: 'Regional Office',
    permissions: ['attendance:view', 'reports:view', 'reports:export', 'dashboard:view']
  },
  it_technician: {
    label: 'IT Technician',
    department: 'IT Support',
    permissions: ['users:manage', 'support:view', 'support:reset_password']
  }
};

const STORAGE_KEY = 'nw-role-users';
const CURRENT_USER_KEY = 'nw-current-user';

const seedUsers: AppUser[] = [
  {
    id: 'user-admin',
    fullName: 'System Administrator',
    username: 'NWC01',
    role: 'system_admin',
    department: 'Administration',
    region: 'All Regions',
    permissions: ROLE_DEFINITIONS.system_admin.permissions,
    status: 'active'
  },
  {
    id: 'user-hr-coord',
    fullName: 'Mary Wanjiku',
    username: 'NWC02',
    role: 'hr_coordinator',
    department: 'Human Resources',
    region: 'All Regions',
    permissions: ROLE_DEFINITIONS.hr_coordinator.permissions,
    status: 'active'
  },
  {
    id: 'user-hr-sup',
    fullName: 'James Kamau',
    username: 'NWC03',
    role: 'hr_supervisor',
    department: 'Human Resources',
    region: 'All Regions',
    permissions: ROLE_DEFINITIONS.hr_supervisor.permissions,
    status: 'active'
  },
  {
    id: 'user-secretary',
    fullName: 'Faith Njeri',
    username: 'NWC04',
    role: 'secretary',
    department: 'Administration',
    region: 'Nairobi',
    permissions: ROLE_DEFINITIONS.secretary.permissions,
    status: 'active'
  },
  {
    id: 'user-region',
    fullName: 'Samuel Oduor',
    username: 'NWC05',
    role: 'regional_manager',
    department: 'Regional Office',
    region: 'Nairobi',
    permissions: ROLE_DEFINITIONS.regional_manager.permissions,
    status: 'active'
  },
  {
    id: 'user-it',
    fullName: 'Daniel Otieno',
    username: 'NWC06',
    role: 'it_technician',
    department: 'IT Support',
    region: 'All Regions',
    permissions: ROLE_DEFINITIONS.it_technician.permissions,
    status: 'active'
  },
  {
    id: 'user-nairobi-mandate',
    fullName: 'Grace Akinyi',
    username: 'NWC07',
    role: 'hr_coordinator',
    department: 'Human Resources',
    region: 'Nairobi',
    permissions: ROLE_DEFINITIONS.hr_coordinator.permissions,
    status: 'active'
  },
  {
    id: 'user-central-mandate',
    fullName: 'John Muiruri',
    username: 'NWC08',
    role: 'regional_manager',
    department: 'Regional Office',
    region: 'Central',
    permissions: ROLE_DEFINITIONS.regional_manager.permissions,
    status: 'active'
  },
  {
    id: 'user-coast-mandate',
    fullName: 'Amina Salim',
    username: 'NWC09',
    role: 'secretary',
    department: 'Administration',
    region: 'Coast',
    permissions: ROLE_DEFINITIONS.secretary.permissions,
    status: 'active'
  },
  {
    id: 'user-western-mandate',
    fullName: 'Paul Wanjala',
    username: 'NWC10',
    role: 'hr_supervisor',
    department: 'Human Resources',
    region: 'Western',
    permissions: ROLE_DEFINITIONS.hr_supervisor.permissions,
    status: 'active'
  },
  {
    id: 'user-rift-mandate',
    fullName: 'Cynthia Chebet',
    username: 'NWC11',
    role: 'regional_manager',
    department: 'Regional Office',
    region: 'Rift Valley',
    permissions: ROLE_DEFINITIONS.regional_manager.permissions,
    status: 'active'
  }
];

const DEFAULT_PASSWORDS: Record<string, string> = {
  NWC01: 'Admin@2030',
  NWC02: 'Mary@2026',
  NWC03: 'James@2026',
  NWC04: 'Faith@2026',
  NWC05: 'Samuel@2026',
  NWC06: 'Daniel@2026',
  NWC07: 'Grace@2026',
  NWC08: 'John@2026',
  NWC09: 'Amina@2026',
  NWC10: 'Paul@2026',
  NWC11: 'Cynthia@2026'
};

function normalizeUsers(input: unknown): AppUser[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((user) => {
      if (!user || typeof user !== 'object') return null;
      const candidate = user as Partial<AppUser> & Record<string, unknown>;
      const role = candidate.role as SystemRole | undefined;
      if (!candidate.id || !candidate.username || !role || !candidate.fullName) return null;

      return {
        id: String(candidate.id),
        fullName: String(candidate.fullName),
        username: String(candidate.username),
        role,
        department: String(candidate.department ?? ROLE_DEFINITIONS[role].department),
        region: String(candidate.region ?? 'All Regions'),
        permissions: Array.isArray(candidate.permissions) ? candidate.permissions as PermissionName[] : ROLE_DEFINITIONS[role].permissions,
        status: candidate.status === 'locked' ? 'locked' : 'active'
      };
    })
    .filter(Boolean) as AppUser[];
}

function getPasswordKey(username: string) {
  return `nw-password-${username}`;
}

export function ensureDefaultUsers() {
  if (typeof window === 'undefined') return;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  const currentUsers = stored ? normalizeUsers(JSON.parse(stored)) : [];

  const mergedUsers = [...currentUsers];
  const currentMap = new Map(mergedUsers.map((user) => [user.username.trim().toLowerCase(), user]));

  for (const seed of seedUsers) {
    const key = seed.username.trim().toLowerCase();
    const existing = currentMap.get(key);

    if (existing) {
      const nextUser: AppUser = {
        ...existing,
        id: existing.id || seed.id,
        fullName: seed.fullName,
        role: seed.role,
        department: seed.department,
        permissions: seed.permissions,
        status: existing.status === 'locked' ? 'locked' : 'active'
      };

      const index = mergedUsers.findIndex((user) => user.username.trim().toLowerCase() === key);
      if (index >= 0) {
        mergedUsers[index] = nextUser;
      }
    } else {
      mergedUsers.push({ ...seed, status: 'active' });
    }

    const defaultPassword = DEFAULT_PASSWORDS[seed.username] ?? 'Password@123';
    const storedPassword = window.localStorage.getItem(getPasswordKey(seed.username));
    if (!storedPassword || storedPassword !== defaultPassword) {
      window.localStorage.setItem(getPasswordKey(seed.username), defaultPassword);
    }
  }

  if (mergedUsers.length > 0) {
    saveUsers(mergedUsers);
  }
}

export function listUsers(): AppUser[] {
  if (typeof window === 'undefined') return seedUsers;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    ensureDefaultUsers();
    return seedUsers;
  }

  const parsed = normalizeUsers(JSON.parse(raw));
  return parsed.length ? parsed : seedUsers;
}

export function createUserAccount(input: {
  fullName: string;
  username: string;
  role: SystemRole;
  department?: string;
  region?: string;
  password: string;
  status?: 'active' | 'locked';
}): AppUser | null {
  if (typeof window === 'undefined') return null;

  const fullName = input.fullName.trim();
  const username = input.username.trim();
  const password = input.password.trim();
  const department = (input.department ?? ROLE_DEFINITIONS[input.role].department).trim();
  const region = input.region?.trim() || 'All Regions';

  if (!fullName || !username || !password) return null;

  const users = listUsers();
  const alreadyExists = users.some((user) => user.username.trim().toLowerCase() === username.toLowerCase());
  if (alreadyExists) return null;

  const user: AppUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fullName,
    username,
    role: input.role,
    department,
    region,
    permissions: ROLE_DEFINITIONS[input.role].permissions,
    status: input.status === 'locked' ? 'locked' : 'active'
  };

  users.push(user);
  saveUsers(users);
  window.localStorage.setItem(getPasswordKey(username), password);
  return user;
}

export function saveUsers(users: AppUser[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function hashPassword(password: string): string {
  if (!password) return '';
  let hash = 0;
  for (let index = 0; index < password.length; index += 1) {
    hash = (hash << 5) - hash + password.charCodeAt(index);
    hash |= 0;
  }
  return `pw-${Math.abs(hash).toString(16)}`;
}

export function authenticateUser(username: string, password: string): AppUser | null {
  if (typeof window === 'undefined') return null;

  const users = listUsers();
  const match = users.find((user) => user.username.trim().toLowerCase() === username.trim().toLowerCase());
  if (!match) return null;

  const storedPassword = window.localStorage.getItem(getPasswordKey(match.username));
  const inputHash = hashPassword(password);
  const storedHash = storedPassword ? hashPassword(storedPassword) : '';
  const defaultPassword = DEFAULT_PASSWORDS[match.username] ?? null;

  if (match.status === 'locked') return null;
  if (inputHash !== storedHash && password !== storedPassword) {
    if (defaultPassword && password === defaultPassword) {
      window.localStorage.setItem(getPasswordKey(match.username), defaultPassword);
    } else {
      return null;
    }
  }

  return { ...match, permissions: match.permissions.length ? match.permissions : ROLE_DEFINITIONS[match.role].permissions };
}

export function setCurrentUser(user: AppUser | null) {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    return;
  }

  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function getCurrentUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function getRoleAccess(role: SystemRole) {
  return ROLE_DEFINITIONS[role] ?? ROLE_DEFINITIONS.hr_coordinator;
}

export function canAccess(permission: PermissionName, userRole?: SystemRole): boolean {
  if (!userRole) return false;
  return ROLE_DEFINITIONS[userRole].permissions.includes(permission);
}

export function resetPasswordForUser(username: string, newPassword: string) {
  if (typeof window === 'undefined') return false;
  const users = listUsers();
  const index = users.findIndex((user) => user.username.trim().toLowerCase() === username.trim().toLowerCase());
  if (index === -1) return false;

  window.localStorage.setItem(getPasswordKey(users[index].username), newPassword);
  return true;
}

export function updateUserAccount(username: string, updates: Partial<Pick<AppUser, 'fullName' | 'role' | 'department' | 'region' | 'status'>>): AppUser | null {
  const users = listUsers();
  const index = users.findIndex((user) => user.username.trim().toLowerCase() === username.trim().toLowerCase());
  if (index === -1) return null;

  const current = users[index];
  const nextUser: AppUser = {
    ...current,
    fullName: updates.fullName?.trim() || current.fullName,
    role: updates.role || current.role,
    department: updates.department?.trim() || current.department,
    region: updates.region?.trim() || current.region,
    status: updates.status || current.status,
    permissions: updates.role ? ROLE_DEFINITIONS[updates.role].permissions : current.permissions
  };

  users[index] = nextUser;
  saveUsers(users);
  return nextUser;
}

export function deleteUserAccount(username: string) {
  const users = listUsers();
  const filtered = users.filter((user) => user.username.trim().toLowerCase() !== username.trim().toLowerCase());
  saveUsers(filtered);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(getPasswordKey(username));
  }
}

export function unlockUser(username: string) {
  const users = listUsers();
  const next = users.map((user) =>
    user.username.trim().toLowerCase() === username.trim().toLowerCase() ? { ...user, status: 'active' as const } : user
  );
  saveUsers(next);
}

export function lockUser(username: string) {
  const users = listUsers();
  const next = users.map((user) =>
    user.username.trim().toLowerCase() === username.trim().toLowerCase() ? { ...user, status: 'locked' as const } : user
  );
  saveUsers(next);
}

export function getVisibleNavigation(role: SystemRole | null): Array<'attendance' | 'dashboard' | 'admin' | 'reports' | 'support' | 'region'> {
  if (!role) return ['attendance'];

  switch (role) {
    case 'system_admin':
      return ['attendance', 'dashboard', 'admin', 'reports', 'support', 'region'];
    case 'hr_coordinator':
      return ['attendance', 'dashboard', 'reports', 'region'];
    case 'hr_supervisor':
      return ['attendance', 'dashboard', 'reports', 'region'];
    case 'secretary':
      return ['attendance', 'reports', 'region'];
    case 'regional_manager':
      return ['dashboard', 'reports', 'region'];
    case 'it_technician':
      return ['support', 'region'];
    default:
      return ['attendance'];
  }
}
