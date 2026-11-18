import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase dengan secret key (server-only).
 *
 * Dipakai hanya untuk operasi Admin API, mis. memblokir login user.
 * Jangan pernah diimpor dari Client Component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.NEXT_SUPABASE_SECRET_KEY;

  if (!url || !secret) return null;

  return createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
