'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getAuthContext } from '@/lib/auth/server';
import {
  PERMISSIONS,
  WIDGET_KEYS,
  hasPermission,
  isRole,
  type Role,
} from '@/lib/auth';
import type {
  ActionResult,
  ActiveUpdateResult,
  AdminAuditPayload,
  AdminUsersPayload,
  BulkUpdateResult,
  BulkWidgetUpdateResult,
  RoleUpdateResult,
  UserWidgetPermissions,
  WidgetResetResult,
} from '@/lib/auth/admin-types';

function friendlyDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('could not find') || lower.includes('does not exist')) {
    return 'Fitur role/permission belum aktif di database. Jalankan migration 021, 022, 023, dan 024 dulu.';
  }
  if (lower.includes('akses ditolak') || lower.includes('forbidden')) {
    return 'Akses ditolak. Hanya admin yang bisa melakukan aksi ini.';
  }
  return message;
}

/** Validasi + dedupe daftar user untuk aksi massal. */
function normalizeUserIds(userIds: unknown): string[] | null {
  if (!Array.isArray(userIds)) return null;

  const ids = Array.from(
    new Set(
      userIds.filter(
        (id): id is string => typeof id === 'string' && id.trim().length > 0
      )
    )
  );

  if (ids.length === 0 || ids.length > 200) return null;
  return ids;
}

function sanitizeWidgetPermissions(
  permissions: unknown
):
  | { ok: true; data: Record<string, boolean> }
  | { ok: false; error: string } {
  if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
    return { ok: false, error: 'Format permission widget tidak valid.' };
  }

  const input = permissions as Record<string, unknown>;
  const sanitized: Record<string, boolean> = {};

  for (const key of WIDGET_KEYS) {
    const value = input[key];
    if (typeof value !== 'boolean') {
      return {
        ok: false,
        error: `Nilai akses untuk widget "${key}" tidak valid.`,
      };
    }
    sanitized[key] = value;
  }

  return { ok: true, data: sanitized };
}

/**
 * Sinkronkan status blokir ke Supabase Auth (best-effort).
 * Kalau secret key tidak tersedia / Admin API gagal, status di database
 * tetap tersimpan dan proxy tetap menolak akses aplikasi.
 */
async function syncAuthBan(
  userId: string,
  isActive: boolean
): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  try {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: isActive ? 'none' : '876000h',
    });

    return error ? error.message : null;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : 'Gagal sinkronisasi status login.';
  }
}

async function syncAuthBans(
  userIds: string[],
  isActive: boolean
): Promise<string | null> {
  if (userIds.length === 0 || !process.env.NEXT_SUPABASE_SECRET_KEY) {
    return null;
  }

  // Batasi konkurensi supaya tidak membanjiri Supabase Auth Admin API.
  const batchSize = 10;
  const failures: string[] = [];

  for (let index = 0; index < userIds.length; index += batchSize) {
    const batch = userIds.slice(index, index + batchSize);
    const results = await Promise.all(
      batch.map((userId) => syncAuthBan(userId, isActive))
    );
    failures.push(
      ...results.filter((message): message is string => !!message)
    );
  }

  return failures.length > 0
    ? `${failures.length} akun gagal disinkronkan ke Supabase Auth: ${failures[0]}`
    : null;
}

export async function listUsersAction(input?: {
  search?: string;
  role?: Role | '';
  status?: 'active' | 'blocked' | '';
  limit?: number;
  offset?: number;
}): Promise<ActionResult<AdminUsersPayload>> {
  const context = await getAuthContext();

  if (!context) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  }

  if (!hasPermission(context.role, PERMISSIONS.ADMIN_USERS_READ)) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  const role = input?.role || null;
  const status = input?.status || null;

  if (role !== null && !isRole(role)) {
    return { ok: false, error: 'Filter role tidak valid.' };
  }

  if (status !== null && status !== 'active' && status !== 'blocked') {
    return { ok: false, error: 'Filter status tidak valid.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_search: input?.search?.trim() ?? '',
    p_limit: input?.limit ?? 50,
    p_offset: input?.offset ?? 0,
    p_role: role,
    p_status: status,
  });

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  return { ok: true, data: data as AdminUsersPayload };
}

export async function updateUserRoleAction(
  userId: string,
  role: Role
): Promise<ActionResult<RoleUpdateResult>> {
  const context = await getAuthContext();

  if (!context) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  }

  if (!hasPermission(context.role, PERMISSIONS.ADMIN_USERS_MANAGE)) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  if (!userId || typeof userId !== 'string') {
    return { ok: false, error: 'User ID tidak valid.' };
  }

  if (!isRole(role)) {
    return { ok: false, error: 'Role tidak valid.' };
  }

  if (userId === context.user.id && role !== 'admin') {
    return { ok: false, error: 'Tidak bisa mengubah role akun sendiri.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_set_user_role', {
    p_user_id: userId,
    p_role: role,
  });

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  revalidatePath('/admin');
  return { ok: true, data: data as RoleUpdateResult };
}

export async function getUserWidgetPermissionsAction(
  userId: string
): Promise<ActionResult<UserWidgetPermissions>> {
  const context = await getAuthContext();

  if (!context) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  }

  if (!hasPermission(context.role, PERMISSIONS.ADMIN_USERS_READ)) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  if (!userId || typeof userId !== 'string') {
    return { ok: false, error: 'User ID tidak valid.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    'admin_get_user_widget_permissions',
    { p_user_id: userId }
  );

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  return { ok: true, data: data as UserWidgetPermissions };
}

export async function updateUserWidgetPermissionsAction(
  userId: string,
  permissions: Record<string, boolean>
): Promise<ActionResult<{ user_id: string; count: number }>> {
  const context = await getAuthContext();

  if (!context) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  }

  if (!hasPermission(context.role, PERMISSIONS.ADMIN_USERS_MANAGE)) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  if (!userId || typeof userId !== 'string') {
    return { ok: false, error: 'User ID tidak valid.' };
  }

  const sanitized = sanitizeWidgetPermissions(permissions);
  if (!sanitized.ok) {
    return { ok: false, error: sanitized.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    'admin_set_user_widget_permissions',
    { p_user_id: userId, p_permissions: sanitized.data }
  );

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  revalidatePath('/admin');
  return {
    ok: true,
    data: data as { user_id: string; count: number },
  };
}

export async function setUserActiveAction(
  userId: string,
  isActive: boolean,
  reason?: string
): Promise<ActionResult<ActiveUpdateResult>> {
  const context = await getAuthContext();

  if (!context) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  }

  if (!hasPermission(context.role, PERMISSIONS.ADMIN_USERS_MANAGE)) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  if (!userId || typeof userId !== 'string') {
    return { ok: false, error: 'User ID tidak valid.' };
  }

  if (typeof isActive !== 'boolean') {
    return { ok: false, error: 'Status akun tidak valid.' };
  }

  if (userId === context.user.id && !isActive) {
    return { ok: false, error: 'Tidak bisa memblokir akun sendiri.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_set_user_active', {
    p_user_id: userId,
    p_is_active: isActive,
    p_reason: reason?.trim().slice(0, 500) || null,
  });

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  const result = data as ActiveUpdateResult;
  const authWarning = result.unchanged
    ? null
    : await syncAuthBan(userId, isActive);

  revalidatePath('/admin');
  return {
    ok: true,
    data: { ...result, auth_warning: authWarning },
  };
}

export async function bulkUpdateUserRoleAction(
  userIds: string[],
  role: Role
): Promise<ActionResult<BulkUpdateResult>> {
  const context = await getAuthContext();

  if (!context) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  }

  if (!hasPermission(context.role, PERMISSIONS.ADMIN_USERS_MANAGE)) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  const ids = normalizeUserIds(userIds);
  if (!ids) {
    return { ok: false, error: 'Pilih 1–200 user yang valid.' };
  }

  if (!isRole(role)) {
    return { ok: false, error: 'Role tidak valid.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_bulk_set_user_role', {
    p_user_ids: ids,
    p_role: role,
  });

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  revalidatePath('/admin');
  return { ok: true, data: data as BulkUpdateResult };
}

export async function bulkSetUserActiveAction(
  userIds: string[],
  isActive: boolean,
  reason?: string
): Promise<ActionResult<BulkUpdateResult>> {
  const context = await getAuthContext();

  if (!context) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  }

  if (!hasPermission(context.role, PERMISSIONS.ADMIN_USERS_MANAGE)) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  const ids = normalizeUserIds(userIds);
  if (!ids) {
    return { ok: false, error: 'Pilih 1–200 user yang valid.' };
  }

  if (typeof isActive !== 'boolean') {
    return { ok: false, error: 'Status akun tidak valid.' };
  }

  if (!isActive && ids.includes(context.user.id)) {
    return { ok: false, error: 'Tidak bisa memblokir akun sendiri.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_bulk_set_user_active', {
    p_user_ids: ids,
    p_is_active: isActive,
    p_reason: reason?.trim().slice(0, 500) || null,
  });

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  const result = data as BulkUpdateResult;
  const authWarning = await syncAuthBans(result.updated_ids ?? [], isActive);

  revalidatePath('/admin');
  return {
    ok: true,
    data: { ...result, auth_warning: authWarning },
  };
}

export async function updateUsersWidgetPermissionsAction(
  userIds: string[],
  permissions: Record<string, boolean>
): Promise<ActionResult<BulkWidgetUpdateResult>> {
  const context = await getAuthContext();

  if (!context) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  }

  if (!hasPermission(context.role, PERMISSIONS.ADMIN_USERS_MANAGE)) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  const ids = normalizeUserIds(userIds);
  if (!ids) {
    return { ok: false, error: 'Pilih 1–200 user yang valid.' };
  }

  const sanitized = sanitizeWidgetPermissions(permissions);
  if (!sanitized.ok) {
    return { ok: false, error: sanitized.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    'admin_bulk_set_user_widget_permissions',
    { p_user_ids: ids, p_permissions: sanitized.data }
  );

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  revalidatePath('/admin');
  return { ok: true, data: data as BulkWidgetUpdateResult };
}

export async function resetUserWidgetPermissionsAction(
  userId: string
): Promise<ActionResult<WidgetResetResult>> {
  const context = await getAuthContext();

  if (!context) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  }

  if (!hasPermission(context.role, PERMISSIONS.ADMIN_USERS_MANAGE)) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  if (!userId || typeof userId !== 'string') {
    return { ok: false, error: 'User ID tidak valid.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    'admin_reset_user_widget_permissions',
    { p_user_id: userId }
  );

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  revalidatePath('/admin');
  return { ok: true, data: data as WidgetResetResult };
}

export async function resetUsersWidgetPermissionsAction(
  userIds: string[]
): Promise<ActionResult<BulkWidgetUpdateResult>> {
  const context = await getAuthContext();

  if (!context) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  }

  if (!hasPermission(context.role, PERMISSIONS.ADMIN_USERS_MANAGE)) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  const ids = normalizeUserIds(userIds);
  if (!ids) {
    return { ok: false, error: 'Pilih 1–200 user yang valid.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    'admin_bulk_reset_user_widget_permissions',
    { p_user_ids: ids }
  );

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  revalidatePath('/admin');
  return { ok: true, data: data as BulkWidgetUpdateResult };
}

export async function listAuditLogAction(input?: {
  limit?: number;
  offset?: number;
  action?: string;
  targetId?: string;
}): Promise<ActionResult<AdminAuditPayload>> {
  const context = await getAuthContext();

  if (!context) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  }

  if (!hasPermission(context.role, PERMISSIONS.ADMIN_USERS_READ)) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_list_audit_log', {
    p_limit: input?.limit ?? 50,
    p_offset: input?.offset ?? 0,
    p_action: input?.action?.trim() || null,
    p_target_id: input?.targetId || null,
  });

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  return { ok: true, data: data as AdminAuditPayload };
}
