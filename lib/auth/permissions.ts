import { type Role, roleAtLeast } from './roles';

/**
 * Permission adalah unit terkecil dari otorisasi.
 * Nama mengikuti pola `domain.action` dan stabil (jangan rename sembarangan,
 * karena dipakai juga di route guard).
 */
export const PERMISSIONS = {
  // --- Public / guest -------------------------------------------------
  /** Melihat overlay & widget display di OBS (termasuk monitor fullscreen). */
  OVERLAY_READ: 'overlay.read',
  /** Mengontrol dock (OBS scene, timer, poll, dll) via private key. */
  DOCK_CONTROL: 'dock.control',

  // --- Workspace (user) ----------------------------------------------
  /** Melihat dashboard & ringkasan workspace. */
  WORKSPACE_VIEW: 'workspace.view',
  /** Melihat daftar & pengaturan widget. */
  WIDGET_READ: 'widget.read',
  /** Membuat/mengubah/menghapus widget, tema, dan layout. */
  WIDGET_WRITE: 'widget.write',
  /** Melihat riwayat donasi & konfigurasi donasi. */
  DONATION_READ: 'donation.read',
  /** Mengubah konfigurasi donasi, goal, dan webhook. */
  DONATION_WRITE: 'donation.write',
  /** Mengelola integrasi (Streamer.bot, TikTok, MediaMTX). */
  INTEGRATION_MANAGE: 'integration.manage',
  /** Mengelola koneksi OBS / Stream Deck / server media. */
  CONNECTION_MANAGE: 'connection.manage',
  /** Mengubah profil, email, password, avatar, private key. */
  ACCOUNT_MANAGE: 'account.manage',

  // --- Admin ---------------------------------------------------------
  /** Membuka panel admin. */
  ADMIN_ACCESS: 'admin.access',
  /** Melihat daftar user & statistik role. */
  ADMIN_USERS_READ: 'admin.users.read',
  /** Mengubah role user (guest/user/admin). */
  ADMIN_USERS_MANAGE: 'admin.users.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.OVERLAY_READ]: 'Lihat overlay & display',
  [PERMISSIONS.DOCK_CONTROL]: 'Kontrol dock',
  [PERMISSIONS.WORKSPACE_VIEW]: 'Lihat dashboard',
  [PERMISSIONS.WIDGET_READ]: 'Lihat widget',
  [PERMISSIONS.WIDGET_WRITE]: 'Kelola widget',
  [PERMISSIONS.DONATION_READ]: 'Lihat donasi',
  [PERMISSIONS.DONATION_WRITE]: 'Kelola donasi',
  [PERMISSIONS.INTEGRATION_MANAGE]: 'Kelola integrasi',
  [PERMISSIONS.CONNECTION_MANAGE]: 'Kelola koneksi',
  [PERMISSIONS.ACCOUNT_MANAGE]: 'Kelola akun',
  [PERMISSIONS.ADMIN_ACCESS]: 'Akses panel admin',
  [PERMISSIONS.ADMIN_USERS_READ]: 'Lihat user',
  [PERMISSIONS.ADMIN_USERS_MANAGE]: 'Kelola role user',
};

const GUEST_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.OVERLAY_READ,
  PERMISSIONS.DOCK_CONTROL,
];

const USER_PERMISSIONS: readonly Permission[] = [
  ...GUEST_PERMISSIONS,
  PERMISSIONS.WORKSPACE_VIEW,
  PERMISSIONS.WIDGET_READ,
  PERMISSIONS.WIDGET_WRITE,
  PERMISSIONS.DONATION_READ,
  PERMISSIONS.DONATION_WRITE,
  PERMISSIONS.INTEGRATION_MANAGE,
  PERMISSIONS.CONNECTION_MANAGE,
  PERMISSIONS.ACCOUNT_MANAGE,
];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...USER_PERMISSIONS,
  PERMISSIONS.ADMIN_ACCESS,
  PERMISSIONS.ADMIN_USERS_READ,
  PERMISSIONS.ADMIN_USERS_MANAGE,
];

/** Satu sumber kebenaran permission per role. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  guest: GUEST_PERMISSIONS,
  user: USER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
};

export function getRolePermissions(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? GUEST_PERMISSIONS;
}

export function hasPermission(
  role: Role | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false;
  return getRolePermissions(role).includes(permission);
}

export function hasAnyPermission(
  role: Role | null | undefined,
  permissions: readonly Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasEveryPermission(
  role: Role | null | undefined,
  permissions: readonly Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/** Cek minimal role (mis. `roleAtLeast(role, 'user')`). */
export { roleAtLeast };

export type { Role };
