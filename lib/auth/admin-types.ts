import type { Role } from './roles';

export type AdminUser = {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  last_sign_in_at: string | null;
};

export type AdminUsersPayload = {
  users: AdminUser[];
  total: number;
  counts: Record<Role, number>;
  status_counts: {
    active: number;
    blocked: number;
  };
  limit: number;
  offset: number;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type RoleUpdateResult = {
  id: string;
  role: Role;
  previous_role: Role;
  unchanged: boolean;
};

export type ActiveUpdateResult = {
  id: string;
  is_active: boolean;
  previous_is_active: boolean;
  unchanged: boolean;
  auth_warning?: string | null;
};

/** Hasil aksi massal role / status. */
export type BulkUpdateResult = {
  updated: number;
  skipped: number;
  unchanged: number;
  /** Hanya ada pada aksi blokir/aktifkan. */
  updated_ids?: string[];
  /** Peringatan non-fatal, mis. sinkronisasi ban ke Supabase Auth gagal. */
  auth_warning?: string | null;
};

/** Hasil aksi massal akses widget. */
export type BulkWidgetUpdateResult = {
  updated: number;
  skipped: number;
};

/** Override akses widget milik satu user. */
export type UserWidgetPermissions = {
  user_id: string;
  role: Role;
  overrides: Record<string, boolean>;
};
