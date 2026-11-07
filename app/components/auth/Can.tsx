'use client';

import type { ReactNode } from 'react';
import { usePermissions } from './RoleProvider';
import type { Permission } from '@/lib/auth';

type CanProps = {
  /** Satu permission yang wajib dipenuhi. */
  permission?: Permission;
  /** Salah satu permission cukup terpenuhi. */
  anyOf?: readonly Permission[];
  /** Semua permission harus terpenuhi. */
  allOf?: readonly Permission[];
  /** Ditampilkan kalau akses ditolak. Default: null. */
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Gate untuk elemen UI.
 *
 * Contoh:
 *   <Can permission={PERMISSIONS.ADMIN_ACCESS}>
 *     <Link href="/admin">Admin</Link>
 *   </Can>
 */
export default function Can({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: CanProps) {
  const { can, canAny, canEvery, loading } = usePermissions();

  if (loading) return <>{fallback}</>;

  const allowed =
    (permission ? can(permission) : true) &&
    (anyOf ? canAny(anyOf) : true) &&
    (allOf ? canEvery(allOf) : true);

  return <>{allowed ? children : fallback}</>;
}
