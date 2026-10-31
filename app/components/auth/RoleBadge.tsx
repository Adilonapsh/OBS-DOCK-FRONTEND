'use client';

import { ROLE_LABELS, type Role } from '@/lib/auth';

const ROLE_STYLES: Record<Role, string> = {
  admin: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  user: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  guest: 'bg-white/5 text-gray-400 border-white/10',
};

export default function RoleBadge({
  role,
  className = '',
}: {
  role: Role;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${ROLE_STYLES[role]} ${className}`}
      title={ROLE_LABELS[role]}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
