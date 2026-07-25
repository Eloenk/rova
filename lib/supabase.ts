import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

let _supabase: SupabaseClient<any, "public", any> | null = null;

export function getSupabaseClient(): SupabaseClient<any, "public", any> | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!_supabase) {
    _supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}
