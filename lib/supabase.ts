import 'server-only';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let _supabase: SupabaseClient<any, "public", any> | null = null;

export function getSupabaseClient(): SupabaseClient<any, "public", any> | null {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }
  if (!_supabase) {
    _supabase = createClient<any>(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabase;
}

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceRoleKey);
}
