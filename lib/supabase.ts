import 'server-only';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || '';

let _supabase: SupabaseClient<any, "public", any> | null = null;

export function getSupabaseClient(): SupabaseClient<any, "public", any> | null {
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
  return !!(supabaseUrl && supabaseServiceKey);
}


