import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import {
  DEFAULT_ROLE,
  getFallbackRoute,
  getRolePermissions,
  hasPermission,
  isWidgetKey,
  normalizeRole,
  resolveWidgetAccess,
  type Permission,
  type Role,
  type WidgetAccessMap,
  type WidgetKey,
  type WidgetOverrides,
} from '@/lib/auth';

export type ProfileSummary = {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  role: Role;
};

type ProfileRow = {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  role: unknown;
  is_active?: unknown;
};

export type AuthContext = {
  user: User;
  role: Role;
  permissions: readonly Permission[];
  widgets: WidgetAccessMap;
  profile: ProfileSummary | null;
  can: (permission: Permission) => boolean;
  canWidget: (key: WidgetKey) => boolean;
};

/**
 * Ambil user + role dari request saat ini.
 *
 * - Role SELALU dibaca dari tabel `profiles` (bukan user_metadata), karena
 *   user_metadata bisa diubah sendiri oleh user.
 * - Kalau kolom role belum ada (migration 021 belum jalan), fallback ke
 *   'user' agar aplikasi tidak terkunci.
 * - Dibungkus `cache()` supaya hanya 1 query per request di server.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, email, avatar_url, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  const profileRow = (profile as ProfileRow | null) ?? null;

  // Akun diblokir/nonaktif tidak dianggap punya sesi untuk aksi aplikasi.
  // Kalau kolom belum ada / query error, jangan kunci user.
  if (!profileError && profileRow?.is_active === false) {
    return null;
  }

  const rawRole = profileRow?.role;
  const role = profileError
    ? DEFAULT_ROLE
    : normalizeRole(rawRole, DEFAULT_ROLE);

  const summary: ProfileSummary | null = profileRow
    ? {
        id: profileRow.id,
        username: profileRow.username ?? null,
        email: profileRow.email ?? user.email ?? null,
        avatar_url: profileRow.avatar_url ?? null,
        role,
      }
    : null;

  // Override widget per user. Kalau tabel belum ada (migration 022 belum
  // jalan), pakai default role saja.
  const { data: widgetRows, error: widgetError } = await supabase
    .from('user_widget_permissions')
    .select('widget_key, allowed')
    .eq('user_id', user.id);

  const widgetOverrides: WidgetOverrides = {};
  if (!widgetError && Array.isArray(widgetRows)) {
    for (const row of widgetRows as Array<{ widget_key: string; allowed: boolean }>) {
      if (isWidgetKey(row.widget_key)) {
        widgetOverrides[row.widget_key] = row.allowed === true;
      }
    }
  }

  const widgets = resolveWidgetAccess(role, widgetOverrides);

  return {
    user,
    role,
    permissions: getRolePermissions(role),
    widgets,
    profile: summary,
    can: (permission) => hasPermission(role, permission),
    canWidget: (key) => widgets[key] === true,
  };
});

/** Wajib login. `next` dipakai untuk redirect balik setelah login. */
export async function requireAuth(next?: string): Promise<AuthContext> {
  const context = await getAuthContext();
  if (context) return context;

  const loginUrl = next
    ? `/login?next=${encodeURIComponent(next)}`
    : '/login';
  redirect(loginUrl);
}

/**
 * Wajib punya permission tertentu. Dipakai di Server Component / layout.
 * Untuk Server Action, gunakan `getAuthContext()` lalu cek `can()` agar
 * bisa mengembalikan error tanpa redirect.
 */
export async function requirePermission(
  permission: Permission,
  options?: { next?: string }
): Promise<AuthContext> {
  const context = await getAuthContext();

  if (!context) {
    const loginUrl = options?.next
      ? `/login?next=${encodeURIComponent(options.next)}`
      : '/login';
    redirect(loginUrl);
  }

  if (!context.can(permission)) {
    const fallback = getFallbackRoute(context.role);
    redirect(`${fallback}?denied=${encodeURIComponent(permission)}`);
  }

  return context;
}
