import type { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { requirePermission } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/auth';
import type { AdminAuditPayload } from '@/lib/auth/admin-types';
import AuditClient from './AuditClient';

export const metadata: Metadata = { title: 'Audit Log Admin' };

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  const context = await requirePermission(PERMISSIONS.ADMIN_ACCESS, {
    next: '/admin/audit',
  });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_list_audit_log', {
    p_limit: 50,
    p_offset: 0,
    p_action: null,
    p_target_id: null,
  });

  return (
    <AuditClient
      user={context.user}
      initialData={error ? null : (data as AdminAuditPayload)}
      initialError={error ? error.message : null}
    />
  );
}
