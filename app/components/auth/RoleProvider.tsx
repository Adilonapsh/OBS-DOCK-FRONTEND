'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import {
  DEFAULT_ROLE,
  getRolePermissions,
  hasAnyPermission,
  hasEveryPermission,
  hasPermission,
  isAdminRole,
  isWidgetKey,
  normalizeRole,
  resolveWidgetAccess,
  type Permission,
  type Role,
  type WidgetAccessMap,
  type WidgetKey,
  type WidgetOverrides,
} from '@/lib/auth';

type RoleContextValue = {
  user: User | null;
  role: Role;
  permissions: readonly Permission[];
  widgets: WidgetAccessMap;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** Cek satu permission. */
  can: (permission: Permission) => boolean;
  /** Cek salah satu permission cukup. */
  canAny: (permissions: readonly Permission[]) => boolean;
  /** Cek semua permission harus terpenuhi. */
  canEvery: (permissions: readonly Permission[]) => boolean;
  /** Cek akses widget (default role + override per user). */
  canWidget: (key: WidgetKey) => boolean;
  /** Muat ulang role dari DB (mis. setelah admin mengubah role). */
  refresh: () => Promise<void>;
};

const RoleContext = createContext<RoleContextValue | null>(null);

/**
 * Provider role untuk kebutuhan UI (menyembunyikan menu/tombol).
 *
 * PENTING: ini BUKAN lapisan keamanan. Otorisasi sebenarnya ada di:
 *   1. RLS + trigger di Supabase
 *   2. proxy.ts (route guard)
 *   3. requirePermission() di Server Component / Server Action
 * Provider ini hanya untuk UX supaya user tidak melihat menu yang tidak boleh.
 */
export default function RoleProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('guest');
  const [widgetOverrides, setWidgetOverrides] = useState<WidgetOverrides>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        // getSession() hanya membaca cookie/localStorage (cepat). Untuk UI,
        // ini cukup; verifikasi user tetap dilakukan server-side.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const authUser = session?.user ?? null;
        setUser(authUser);

        if (!authUser) {
          setRole('guest');
          setWidgetOverrides({});
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', authUser.id)
          .maybeSingle();

        const profileRow = profile as {
          role?: unknown
          is_active?: unknown
        } | null;

        // Akun nonaktif diperlakukan sebagai guest. Proxy tetap yang
        // mengarahkan mereka ke /blocked.
        const inactive = !error && profileRow?.is_active === false;

        // Kalau kolom role belum ada / query gagal, anggap user biasa.
        setRole(
          inactive
            ? 'guest'
            : error
              ? DEFAULT_ROLE
              : normalizeRole(profileRow?.role, DEFAULT_ROLE)
        );

        const { data: widgetRows, error: widgetError } = await supabase
          .from('user_widget_permissions')
          .select('widget_key, allowed')
          .eq('user_id', authUser.id);

        const overrides: WidgetOverrides = {};
        if (!widgetError && Array.isArray(widgetRows)) {
          for (const row of widgetRows as Array<{
            widget_key: string;
            allowed: boolean;
          }>) {
            if (isWidgetKey(row.widget_key)) {
              overrides[row.widget_key] = row.allowed === true;
            }
          }
        }
        setWidgetOverrides(overrides);
      } catch {
        setRole('guest');
        setWidgetOverrides({});
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    // Defer supaya tidak memicu cascading render langsung di body effect.
    const initialLoad = setTimeout(() => void load(true), 0);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Hindari deadlock: callback Supabase berjalan di dalam lock,
      // jadi jangan await Supabase call langsung di sini.
      setTimeout(() => void load(false), 0);
    });

    return () => {
      clearTimeout(initialLoad);
      subscription.unsubscribe();
    };
  }, [load, supabase]);

  const value = useMemo<RoleContextValue>(() => {
    const permissions = getRolePermissions(role);
    const widgets = resolveWidgetAccess(role, widgetOverrides);

    return {
      user,
      role,
      permissions,
      widgets,
      loading,
      isAuthenticated: !!user,
      isAdmin: isAdminRole(role),
      can: (permission) => hasPermission(role, permission),
      canAny: (list) => hasAnyPermission(role, list),
      canEvery: (list) => hasEveryPermission(role, list),
      canWidget: (key) => widgets[key] === true,
      refresh: () => load(true),
    };
  }, [load, loading, role, user, widgetOverrides]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

/** Akses role & permission di Client Component. */
export function usePermissions(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('usePermissions harus dipakai di dalam <RoleProvider>');
  }
  return context;
}

/** Alias semantik yang lebih pendek. */
export function useRole(): RoleContextValue {
  return usePermissions();
}
