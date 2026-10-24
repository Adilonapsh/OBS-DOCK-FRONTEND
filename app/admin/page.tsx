import type { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { requirePermission } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/auth';
import type { AdminUsersPayload } from '@/lib/auth/admin-types';
import AdminClient from './AdminClient';

export const metadata: Metadata = { title: 'Role & Permission' };

// Role bisa berubah kapan saja, jadi jangan di-cache.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const context = await requirePermission(PERMISSIONS.ADMIN_ACCESS, {
    next: '/admin',
  });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_search: '',
    p_limit: 200,
    p_offset: 0,
  });

  const initialData = error ? null : (data as AdminUsersPayload);
  const initialError = error ? error.message : null;

  return (
    <AdminClient
      user={context.user}
      currentUserId={context.user.id}
      initialData={initialData}
      initialError={initialError}
    />
  );
}
