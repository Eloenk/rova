import 'server-only';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from './env/server';

let _supabase: SupabaseClient<any, "public", any> | null = null;

export function getSupabaseClient(): SupabaseClient<any, "public", any> | null {
  const supabaseUrl = serverEnv.supabaseUrl;
  const supabaseServiceKey = serverEnv.supabaseSecretKey;
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  if (!_supabase) {
    _supabase = createClient<any>(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabase;
}

export function isSupabaseConfigured(): boolean {
  return !!(serverEnv.supabaseUrl && serverEnv.supabaseSecretKey);
}


