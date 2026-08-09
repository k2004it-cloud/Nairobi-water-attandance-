import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { supabaseAdmin } from './supabaseClient.js';

const scrypt = promisify(scryptCallback);
const USERS_TABLE = 'admin_users';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_BOOTSTRAP_PASSWORD || 'change-this-session-secret';
const REGION_CODES: Record<string, string> = {
  'All Regions': 'ALL',
  Nairobi: 'NRB',
  Central: 'CEN',
  Coast: 'CST',
  Western: 'WST',
  'Rift Valley': 'RFT'
};
const ROLE_PERMISSIONS: Record<string, string[]> = {
  system_admin: ['attendance:view', 'attendance:checkin', 'reports:view', 'reports:export', 'dashboard:view', 'employees:manage', 'users:manage', 'support:view', 'support:reset_password'],
  hr_coordinator: ['attendance:view', 'attendance:checkin', 'reports:view', 'reports:export', 'dashboard:view'],
  hr_supervisor: ['attendance:view', 'attendance:checkin', 'reports:view', 'reports:export', 'dashboard:view'],
  secretary: ['attendance:view', 'reports:view'],
  regional_manager: ['attendance:view', 'attendance:checkin', 'reports:view', 'reports:export', 'dashboard:view', 'employees:manage', 'users:manage'],
  it_technician: ['users:manage', 'support:view', 'support:reset_password']
};

type SessionUser = { username: string; role: string; region: string; region_id: string; exp: number };

function assertConfigured() {
  if (!supabaseAdmin) throw new Error('Central user storage is not configured. Set Supabase environment variables.');
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${key.toString('hex')}`;
}

async function matchesPassword(password: string, stored: string) {
  if (stored === 'BOOTSTRAP_REQUIRED') {
    const bootstrap = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSWORD;
    if (!bootstrap || password !== bootstrap) return false;
    return true;
  }
  const [algorithm, salt, keyHex] = stored.split('$');
  if (algorithm !== 'scrypt' || !salt || !keyHex) return false;
  const expected = (await scrypt(password, salt, 64)) as Buffer;
  const actual = Buffer.from(keyHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function encodeSession(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64url');
  const signature = createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function decodeSession(token: string): SessionUser {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) throw new Error('Authentication required.');
  const expected = createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('Authentication required.');
  }
  const user = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionUser;
  if (!user.exp || user.exp < Date.now()) throw new Error('Session expired. Please log in again.');
  return user;
}

function getToken(req: any) {
  const header = String(req.headers?.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

async function getRegion(regionName: string) {
  const code = REGION_CODES[regionName] || regionName;
  const { data, error } = await supabaseAdmin!.from('regions').select('id, name, code').eq('code', code).single();
  if (error || !data) throw new Error(`Unknown region: ${regionName}`);
  return data as { id: string; name: string; code: string };
}

function toUser(row: any, region: { name: string; id: string }) {
  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    role: row.role,
    department: row.department,
    region: region.name,
    region_id: region.id,
    permissions: ROLE_PERMISSIONS[row.role] || [],
    status: row.status === 'locked' ? 'locked' : 'active'
  };
}

async function findUser(username: string) {
  const { data, error } = await supabaseAdmin!.from(USERS_TABLE).select('*').eq('username', username.trim()).single();
  if (error || !data) throw new Error('Invalid username or password.');
  const { data: region, error: regionError } = await supabaseAdmin!.from('regions').select('id, name, code').eq('id', data.region_id).single();
  if (regionError || !region) throw new Error('User region is not configured.');
  return { row: data, region: region as { id: string; name: string; code: string } };
}

function assertCanManage(actor: SessionUser, targetRole?: string, targetRegionId?: string) {
  if (actor.role === 'system_admin') return;
  if (actor.role !== 'regional_manager') throw new Error('You are not allowed to manage users.');
  if (targetRole === 'system_admin' || targetRole === 'regional_manager') throw new Error('Only the System Admin can manage Branch Admin accounts.');
  if (targetRegionId && targetRegionId !== actor.region_id) throw new Error('You can only manage users in your branch.');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    assertConfigured();
    const { action } = req.body || {};

    if (action === 'login') {
      const found = await findUser(String(req.body.username || ''));
      if (found.row.status === 'locked' || !(await matchesPassword(String(req.body.password || ''), found.row.password_hash))) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }
      if (found.row.password_hash === 'BOOTSTRAP_REQUIRED') {
        const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSWORD;
        if (password) {
          await supabaseAdmin!.from(USERS_TABLE).update({ password_hash: await hashPassword(password), updated_at: new Date().toISOString() }).eq('id', found.row.id);
        }
      }
      const user = toUser(found.row, found.region);
      const session = encodeSession({ username: user.username, role: user.role, region: user.region, region_id: user.region_id, exp: Date.now() + SESSION_TTL_MS });
      return res.json({ user, session });
    }

    const actor = decodeSession(getToken(req));
    if (action === 'list') {
      let query = supabaseAdmin!.from(USERS_TABLE).select('id, username, full_name, department, role, region_id, status').order('full_name');
      if (actor.role === 'regional_manager') query = query.eq('region_id', actor.region_id);
      const { data, error } = await query;
      if (error) throw error;
      const users = [];
      for (const row of data || []) {
        const region = await supabaseAdmin!.from('regions').select('id, name').eq('id', row.region_id).single();
        if (region.data) users.push(toUser(row, region.data));
      }
      return res.json({ users });
    }

    if (action === 'create') {
      const region = await getRegion(String(req.body.region || 'All Regions'));
      assertCanManage(actor, req.body.role, region.id);
      const password = String(req.body.password || '');
      if (password.length < 8) throw new Error('Password must contain at least 8 characters.');
      const { data, error } = await supabaseAdmin!.from(USERS_TABLE).insert({
        username: String(req.body.username || '').trim(),
        full_name: String(req.body.fullName || '').trim(),
        department: String(req.body.department || 'Administration').trim(),
        role: String(req.body.role || 'secretary'),
        region_id: region.id,
        password_hash: await hashPassword(password),
        status: 'active'
      }).select('*').single();
      if (error) throw error;
      return res.json({ user: toUser(data, region) });
    }

    const target = await findUser(String(req.body.username || ''));
    assertCanManage(actor, target.row.role, target.row.region_id);
    if (action === 'update') {
      const region = await getRegion(String(req.body.region || target.region.name));
      assertCanManage(actor, String(req.body.role || target.row.role), region.id);
      const updates: Record<string, unknown> = {
        full_name: String(req.body.fullName || target.row.full_name).trim(),
        department: String(req.body.department || target.row.department).trim(),
        role: String(req.body.role || target.row.role),
        region_id: region.id,
        status: req.body.status === 'locked' ? 'locked' : 'active',
        updated_at: new Date().toISOString()
      };
      if (req.body.password) updates.password_hash = await hashPassword(String(req.body.password));
      const { data, error } = await supabaseAdmin!.from(USERS_TABLE).update(updates).eq('id', target.row.id).select('*').single();
      if (error) throw error;
      return res.json({ user: toUser(data, region) });
    }
    if (action === 'lock' || action === 'unlock') {
      const { error } = await supabaseAdmin!.from(USERS_TABLE).update({ status: action === 'lock' ? 'locked' : 'active', updated_at: new Date().toISOString() }).eq('id', target.row.id);
      if (error) throw error;
      return res.json({ success: true });
    }
    if (action === 'delete') {
      if (target.row.username === 'NWC01') throw new Error('The primary System Admin cannot be deleted.');
      const { error } = await supabaseAdmin!.from(USERS_TABLE).delete().eq('id', target.row.id);
      if (error) throw error;
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Unable to process user request.' });
  }
}
