/**
 * Role definitions & hierarchy.
 *
 * guest : pengunjung / browser source (tanpa login, akses via private key)
 * user  : pemilik workspace (akun login normal)
 * admin : user + akses panel admin dan manajemen role
 */

export const ROLES = ['guest', 'user', 'admin'] as const;

export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = 'user';
export const GUEST_ROLE: Role = 'guest';

/** Peringkat dipakai untuk pengecekan "minimal role". */
export const ROLE_RANK: Record<Role, number> = {
  guest: 0,
  user: 1,
  admin: 2,
};

export const ROLE_LABELS: Record<Role, string> = {
  guest: 'Guest',
  user: 'User',
  admin: 'Admin',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  guest:
    'Akses terbatas: overlay/display dan dock dengan private key. Tidak punya workspace.',
  user: 'Pemilik workspace: dashboard, dock, widget, donasi, integrasi, dan akun.',
  admin: 'Akses penuh: semua fitur user + panel admin dan manajemen role.',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/**
 * Ubah nilai dari DB/API menjadi Role yang aman.
 * `fallback` dipakai saat nilainya tidak dikenal.
 */
export function normalizeRole(value: unknown, fallback: Role = 'guest'): Role {
  return isRole(value) ? value : fallback;
}

export function roleAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function isAdminRole(role: Role | null | undefined): boolean {
  return role === 'admin';
}
