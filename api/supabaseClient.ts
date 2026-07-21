import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  _supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  });
}

export const supabaseAdmin = _supabaseAdmin;
