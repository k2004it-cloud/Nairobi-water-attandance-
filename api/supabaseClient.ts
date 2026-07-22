import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const normalizeSupabaseUrl = (url?: string) => {
  if (!url) return undefined;
  const trimmed = url.replace(/\/+$|\s+$/g, '');
  return trimmed.replace(/\/rest\/v1$/i, '');
};

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

let _supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  _supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  });
}

export const supabaseAdmin = _supabaseAdmin;
