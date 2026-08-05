import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { supabaseAdmin } from './supabaseClient.js';

const scrypt = promisify(scryptCallback);
const ADMIN_ID = 'primary';
const ADMIN_CREDENTIALS_TABLE = 'admin_credentials';
const PASSWORD_RESET_TOKENS_TABLE = 'admin_password_reset_tokens';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const IS_LOCAL_DEV = process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production';
const PERSISTENT_AUTH_ENABLED = Boolean(
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseAdmin
);

type AdminCredentials = {
  id: string;
  email: string;
  password_hash: string;
};

type ResetToken = {
  token: string;
  email: string;
};

let localCredentials: AdminCredentials | null = null;
const localResetTokens = new Map<string, { expiresAt: number }>();

function getConfiguredAdminEmail() {
  return process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'admin@nairobi.local';
}

function getBootstrapPassword() {
  const password =
    process.env.ADMIN_BOOTSTRAP_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    // Backward-compatible migration path only. Do not keep this VITE_ variable in production.
    process.env.VITE_ADMIN_PASSWORD;

  if (password) return password;
  if (IS_LOCAL_DEV) return 'admin2030';

  throw new Error(
    'Admin authentication is not configured. Set ADMIN_BOOTSTRAP_PASSWORD in Vercel, run supabase/admin-auth.sql, then redeploy.'
  );
}

function assertValidNewPassword(password: string) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('New password must contain at least 8 characters.');
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

async function passwordsMatch(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, storedKey] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !storedKey) return false;

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const expectedKey = Buffer.from(storedKey, 'hex');
  return expectedKey.length === derivedKey.length && timingSafeEqual(expectedKey, derivedKey);
}

function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function isMissingAuthTable(error: any) {
  const code = typeof error?.code === 'string' ? error.code : '';
  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
  return code === '42P01' || code === 'PGRST205' || message.includes('admin_credentials') || message.includes('admin_password_reset_tokens');
}

function storageError(error: unknown): Error {
  if (isMissingAuthTable(error)) {
    return new Error('Admin authentication storage is not ready. Run supabase/admin-auth.sql in Supabase, then try again.');
  }

  return new Error('Admin authentication storage is temporarily unavailable. Please try again.');
}

async function getPersistentCredentials(): Promise<AdminCredentials> {
  const client = supabaseAdmin!;
  const { data, error } = await client
    .from(ADMIN_CREDENTIALS_TABLE)
    .select('id, email, password_hash')
    .eq('id', ADMIN_ID)
    .maybeSingle();

  if (error) throw storageError(error);
  if (data) return data as AdminCredentials;

  const initialCredentials: AdminCredentials = {
    id: ADMIN_ID,
    email: getConfiguredAdminEmail(),
    password_hash: await hashPassword(getBootstrapPassword())
  };
  const { data: created, error: createError } = await client
    .from(ADMIN_CREDENTIALS_TABLE)
    .insert(initialCredentials)
    .select('id, email, password_hash')
    .single();

  if (!createError && created) return created as AdminCredentials;

  // A simultaneous first request can create the singleton before this request does.
  if (createError?.code === '23505') return getPersistentCredentials();
  throw storageError(createError);
}

async function getLocalCredentials(): Promise<AdminCredentials> {
  if (!localCredentials) {
    localCredentials = {
      id: ADMIN_ID,
      email: getConfiguredAdminEmail(),
      password_hash: await hashPassword(getBootstrapPassword())
    };
  }
  return localCredentials;
}

async function getCredentials(): Promise<AdminCredentials> {
  if (PERSISTENT_AUTH_ENABLED) return getPersistentCredentials();
  if (IS_LOCAL_DEV) return getLocalCredentials();

  throw new Error(
    'Admin authentication is not configured. Set VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and ADMIN_BOOTSTRAP_PASSWORD in Vercel.'
  );
}

async function savePasswordHash(adminId: string, passwordHash: string) {
  if (PERSISTENT_AUTH_ENABLED) {
    const { error } = await supabaseAdmin!
      .from(ADMIN_CREDENTIALS_TABLE)
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', adminId);
    if (error) throw storageError(error);
    return;
  }

  if (localCredentials) localCredentials.password_hash = passwordHash;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const credentials = await getCredentials();
  return passwordsMatch(password, credentials.password_hash);
}

export async function setAdminPassword(currentPassword: string, newPassword: string) {
  assertValidNewPassword(newPassword);
  const credentials = await getCredentials();

  if (!(await passwordsMatch(currentPassword, credentials.password_hash))) {
    throw new Error('Current admin password is incorrect.');
  }
  if (await passwordsMatch(newPassword, credentials.password_hash)) {
    throw new Error('Choose a new password that differs from the current password.');
  }

  await savePasswordHash(credentials.id, await hashPassword(newPassword));
  return { email: credentials.email };
}

export async function createResetToken(): Promise<ResetToken> {
  const credentials = await getCredentials();
  const token = `rt_${randomBytes(32).toString('base64url')}`;
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;

  if (PERSISTENT_AUTH_ENABLED) {
    const { error } = await supabaseAdmin!
      .from(PASSWORD_RESET_TOKENS_TABLE)
      .insert({
        token_hash: hashResetToken(token),
        admin_id: credentials.id,
        expires_at: new Date(expiresAt).toISOString()
      });
    if (error) throw storageError(error);
  } else {
    localResetTokens.set(hashResetToken(token), { expiresAt });
  }

  return { token, email: credentials.email };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  assertValidNewPassword(newPassword);
  const tokenHash = hashResetToken(token);

  if (PERSISTENT_AUTH_ENABLED) {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin!
      .from(PASSWORD_RESET_TOKENS_TABLE)
      .update({ used_at: now })
      .eq('token_hash', tokenHash)
      .is('used_at', null)
      .gt('expires_at', now)
      .select('admin_id')
      .maybeSingle();

    if (error) throw storageError(error);
    if (!data) throw new Error('Reset link is invalid or has expired. Request a new one.');

    const credentials = await getCredentials();
    if (data.admin_id !== credentials.id) {
      throw new Error('Reset link is invalid or has expired. Request a new one.');
    }

    await savePasswordHash(credentials.id, await hashPassword(newPassword));
    return { email: credentials.email };
  }

  const localToken = localResetTokens.get(tokenHash);
  if (!localToken || localToken.expiresAt <= Date.now()) {
    throw new Error('Reset link is invalid or has expired. Request a new one.');
  }

  const credentials = await getCredentials();
  await savePasswordHash(credentials.id, await hashPassword(newPassword));
  localResetTokens.delete(tokenHash);
  return { email: credentials.email };
}
