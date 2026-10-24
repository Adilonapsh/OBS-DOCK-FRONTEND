import type { Role } from './roles';

export type AdminUser = {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  role: Role;
  is_active: boolean;
  blocked_at: string | null;
  blocked_by: string | null;
  block_reason: string | null;
  created_at: string;
  updated_at: string | null;
  last_sign_in_at: string | null;
};

export type AdminUsersPayload = {
  users: AdminUser[];
  /** Jumlah user yang cocok dengan search/filter saat ini. */
  total: number;
  /** Jumlah seluruh user di database. */
  global_total: number;
  counts: Record<Role, number>;
  status_counts: {
    active: number;
    blocked: number;
  };
  limit: number;
  offset: number;
  filters?: {
    search: string;
    role: Role | null;
    status: 'active' | 'blocked' | null;
  };
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
  blocked_at?: string | null;
  blocked_by?: string | null;
  block_reason?: string | null;
  auth_warning?: string | null;
};

export type BulkSkippedDetail = {
  id: string;
  label: string | null;
  reason: string;
};

/** Hasil aksi massal role / status. */
export type BulkUpdateResult = {
  updated: number;
  skipped: number;
  unchanged: number;
  /** ID user yang benar-benar diubah (khusus blokir/aktifkan). */
  updated_ids?: string[];
  /** Detail user yang dilewati beserta alasannya. */
  skipped_details?: BulkSkippedDetail[];
  /** Peringatan non-fatal, mis. sinkronisasi ban ke Supabase Auth gagal. */
  auth_warning?: string | null;
};

/** Hasil aksi massal akses widget. */
export type BulkWidgetUpdateResult = {
  updated: number;
  skipped: number;
  skipped_details?: BulkSkippedDetail[];
};

/** Hasil reset akses widget satu user. */
export type WidgetResetResult = {
  user_id: string;
  deleted: number;
};

/** Override akses widget milik satu user. */
export type UserWidgetPermissions = {
  user_id: string;
  role: Role;
  overrides: Record<string, boolean>;
};

export type AdminAuditEntry = {
  id: number;
  batch_id: string;
  actor_id: string | null;
  actor_email: string | null;
  target_id: string | null;
  target_label: string | null;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
};

export type AdminAuditPayload = {
  entries: AdminAuditEntry[];
  total: number;
  limit: number;
  offset: number;
};
