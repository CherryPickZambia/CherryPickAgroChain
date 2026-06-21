import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client.
 *
 * Uses the SERVICE_ROLE key when available so trusted server routes (webhooks,
 * payment processing) can read/write regardless of RLS. This module must NEVER
 * be imported into client components — it is for API routes / server code only.
 *
 * Falls back to the anon key if the service role key is not configured, so the
 * app keeps working in environments where only the anon key is present.
 */
let adminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminInstance) return adminInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn('Supabase admin client not configured (missing URL or key)');
    return null;
  }

  adminInstance = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminInstance;
}
