import { PERMISSIONS, type Permission } from './permissions';
import { type Role } from './roles';

/**
 * Peta route -> permission.
 *
 * Dipakai oleh proxy (middleware) sebagai lapisan pertama.
 * Urutan tidak penting: pencarian memakai prefix terpanjang yang cocok.
 */
export const ROUTE_PERMISSIONS: ReadonlyArray<{
  path: string;
  permission: Permission;
}> = [
  // Display / browser source (boleh guest)
  { path: '/overlay/display', permission: PERMISSIONS.OVERLAY_READ },
  { path: '/widgets/display', permission: PERMISSIONS.OVERLAY_READ },
  { path: '/designer/display', permission: PERMISSIONS.OVERLAY_READ },
  { path: '/monitor/fullscreen', permission: PERMISSIONS.OVERLAY_READ },

  // Workspace
  { path: '/dashboard', permission: PERMISSIONS.WORKSPACE_VIEW },
  { path: '/dock', permission: PERMISSIONS.DOCK_CONTROL },
  { path: '/monitor', permission: PERMISSIONS.WORKSPACE_VIEW },
  { path: '/widgets', permission: PERMISSIONS.WIDGET_READ },
  { path: '/donations', permission: PERMISSIONS.DONATION_READ },
  { path: '/integrations', permission: PERMISSIONS.INTEGRATION_MANAGE },
  { path: '/connection', permission: PERMISSIONS.CONNECTION_MANAGE },
  { path: '/config', permission: PERMISSIONS.CONNECTION_MANAGE },
  { path: '/account', permission: PERMISSIONS.ACCOUNT_MANAGE },
  { path: '/overlay', permission: PERMISSIONS.WIDGET_READ },
  { path: '/designer', permission: PERMISSIONS.WIDGET_WRITE },

  // Admin
  { path: '/admin', permission: PERMISSIONS.ADMIN_ACCESS },
];

/** Route yang memang bisa diakses tanpa login (form auth, callback, dll). */
export const PUBLIC_PATH_PREFIXES: readonly string[] = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/privacy',
  '/terms',
];

/** Halaman yang kalau sudah login harus dialihkan ke workspace. */
export const AUTH_ENTRY_PATHS: readonly string[] = [
  '/login',
  '/register',
  '/forgot-password',
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

/**
 * Permission yang dibutuhkan untuk sebuah path.
 * Prefix terpanjang menang, jadi `/widgets/display` tidak terkena `/widgets`.
 */
export function getRoutePermission(pathname: string): Permission | null {
  const match = [...ROUTE_PERMISSIONS]
    .filter((route) => matchesPrefix(pathname, route.path))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return match?.permission ?? null;
}

/** Tujuan redirect yang aman ketika akses ditolak (hindari redirect loop). */
export function getFallbackRoute(role: Role): string {
  return role === 'guest' ? '/dock' : '/dashboard';
}
