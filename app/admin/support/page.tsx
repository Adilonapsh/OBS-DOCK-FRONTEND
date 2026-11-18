import type { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { requirePermission } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/auth';
import SupportTicketsClient, { type SupportTicket } from './SupportTicketsClient';

export const metadata: Metadata = { title: 'Support Tickets' };

export const dynamic = 'force-dynamic';

export default async function AdminSupportPage() {
  const context = await requirePermission(PERMISSIONS.ADMIN_ACCESS, {
    next: '/admin/support',
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <SupportTicketsClient
      user={context.user}
      initialTickets={(data as SupportTicket[] | null) ?? []}
      initialError={error ? error.message : null}
    />
  );
}
