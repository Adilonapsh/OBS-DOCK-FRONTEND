'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  LogOut,
  Menu,
  RefreshCw,
  ScrollText,
  Shield,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { logoutToLogin } from '@/utils/logout';
import type {
  AdminAuditEntry,
  AdminAuditPayload,
} from '@/lib/auth/admin-types';
import { listAuditLogAction } from '../../actions/admin';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';

const PAGE_SIZE = 50;

const ACTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Semua aksi' },
  { value: 'role.set', label: 'Ubah role' },
  { value: 'role.bulk', label: 'Ubah role massal' },
  { value: 'status.block', label: 'Blokir akun' },
  { value: 'status.activate', label: 'Aktifkan akun' },
  { value: 'status.bulk_block', label: 'Blokir massal' },
  { value: 'status.bulk_activate', label: 'Aktifkan massal' },
  { value: 'widget.set', label: 'Atur widget' },
  { value: 'widget.bulk', label: 'Atur widget massal' },
  { value: 'widget.reset', label: 'Reset widget' },
  { value: 'widget.bulk_reset', label: 'Reset widget massal' },
];

const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  ACTION_OPTIONS.filter((item) => item.value).map((item) => [
    item.value,
    item.label,
  ])
);

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function summarizeValue(value: Record<string, unknown> | null): string {
  if (!value) return '—';

  if (typeof value.role === 'string') {
    return value.role;
  }

  if (typeof value.is_active === 'boolean') {
    return value.is_active ? 'Aktif' : 'Nonaktif';
  }

  const keys = Object.keys(value);
  if (keys.length === 0) return 'Default role';

  const allowed = keys.filter((key) => value[key] === true).length;
  if (keys.every((key) => typeof value[key] === 'boolean')) {
    return `${allowed}/${keys.length} widget aktif`;
  }

  return `${keys.length} field`;
}

function actionClass(action: string): string {
  if (action.startsWith('role.')) {
    return 'border-amber-500/25 bg-amber-500/10 text-amber-300';
  }
  if (action.includes('activate')) {
    return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300';
  }
  if (action.includes('block')) {
    return 'border-red-500/25 bg-red-500/10 text-red-300';
  }
  if (action.startsWith('widget.')) {
    return 'border-sky-500/25 bg-sky-500/10 text-sky-300';
  }
  return 'border-white/10 bg-white/5 text-gray-300';
}

export default function AuditClient({
  user,
  initialData,
  initialError,
}: {
  user: User;
  initialData: AdminAuditPayload | null;
  initialError: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AdminAuditPayload | null>(initialData);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(initialError);

  const load = useCallback(
    async (nextAction: string, nextPage: number) => {
      setLoading(true);
      const result = await listAuditLogAction({
        action: nextAction,
        limit: PAGE_SIZE,
        offset: nextPage * PAGE_SIZE,
      });

      if (result.ok) {
        setData(result.data);
        setNotice(null);
      } else {
        setNotice(result.error);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleFilterChange = async (nextAction: string) => {
    setActionFilter(nextAction);
    setPage(0);
    await load(nextAction, 0);
  };

  const goToPage = async (nextPage: number) => {
    if (nextPage < 0 || loading) return;
    setPage(nextPage);
    await load(actionFilter, nextPage);
  };

  const handleLogout = async () => {
    await logoutToLogin(supabase);
  };

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const offset = data?.offset ?? 0;
  const rangeStart = entries.length > 0 ? offset + 1 : 0;
  const rangeEnd = offset + entries.length;
  const canPrev = page > 0 && !loading;
  const canNext = offset + entries.length < total && !loading;

  return (
    <div className="admin-page min-h-screen bg-[#0a0a0a] flex">
      <Sidebar
        active="admin-audit"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[8px] font-black tracking-widest text-amber-300">
              <Shield className="w-3 h-3" /> ADMIN
            </span>
            <span className="hidden md:inline text-[10px] text-gray-500 font-bold">
              {user.email}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase text-gray-300"
            >
              <ArrowLeft className="w-3 h-3" /> Role & Permission
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase text-gray-300"
            >
              <LogOut className="w-3 h-3" /> Keluar
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-8xl w-full mx-auto space-y-6">
          <div className="bg-[#161616] border border-white/10 rounded-2xl p-6">
            <h1 className="text-white font-black text-[18px] tracking-tight flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-amber-300" /> Audit Log Admin
            </h1>
            <p className="text-gray-500 text-[11px] mt-1 max-w-2xl leading-relaxed">
              Riwayat perubahan role, status akun, dan akses widget. Setiap aksi
              massal dicatat per user dengan <span className="text-white font-bold">batch ID</span>{' '}
              yang sama.
            </p>
          </div>

          <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 md:p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <select
                  value={actionFilter}
                  onChange={(event) => handleFilterChange(event.target.value)}
                  disabled={loading}
                  aria-label="Filter aksi"
                  className="h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                >
                  {ACTION_OPTIONS.map((option) => (
                    <option
                      key={option.value || 'all'}
                      value={option.value}
                      className="bg-[#161616]"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => load(actionFilter, page)}
                disabled={loading}
                className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Muat ulang
              </button>
            </div>

            {notice && (
              <div className="mx-4 md:mx-5 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[11px] font-bold text-red-300">
                {notice}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-gray-500 border-b border-white/5">
                    <th className="px-4 md:px-5 py-3 font-black">Waktu</th>
                    <th className="px-4 md:px-5 py-3 font-black">Aktor</th>
                    <th className="px-4 md:px-5 py-3 font-black">Aksi</th>
                    <th className="px-4 md:px-5 py-3 font-black">Target</th>
                    <th className="px-4 md:px-5 py-3 font-black hidden lg:table-cell">
                      Detail
                    </th>
                    <th className="px-4 md:px-5 py-3 font-black hidden xl:table-cell">
                      Alasan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry: AdminAuditEntry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 md:px-5 py-3 text-[10px] text-gray-400 whitespace-nowrap">
                        <time dateTime={entry.created_at}>
                          {formatDateTime(entry.created_at)}
                        </time>
                      </td>
                      <td className="px-4 md:px-5 py-3 text-[10px] text-gray-300">
                        <span className="block truncate max-w-[180px]">
                          {entry.actor_email || entry.actor_id || 'Sistem'}
                        </span>
                      </td>
                      <td className="px-4 md:px-5 py-3">
                        <span
                          className={`inline-flex items-center h-6 px-2 rounded-md border text-[8px] font-black uppercase tracking-widest ${actionClass(
                            entry.action
                          )}`}
                        >
                          {ACTION_LABELS[entry.action] || entry.action}
                        </span>
                      </td>
                      <td className="px-4 md:px-5 py-3 text-[10px] text-gray-300">
                        <span className="block truncate max-w-[180px]">
                          {entry.target_label || entry.target_id || '—'}
                        </span>
                      </td>
                      <td className="px-4 md:px-5 py-3 text-[10px] text-gray-400 hidden lg:table-cell">
                        <span className="block truncate max-w-[220px]">
                          {summarizeValue(entry.old_value)} →{' '}
                          {summarizeValue(entry.new_value)}
                        </span>
                      </td>
                      <td className="px-4 md:px-5 py-3 text-[10px] text-gray-400 hidden xl:table-cell">
                        <span className="block truncate max-w-[220px]" title={entry.reason || undefined}>
                          {entry.reason || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!loading && entries.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-[11px] text-gray-500"
                      >
                        Belum ada aksi admin yang tercatat.
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-[11px] text-gray-500"
                      >
                        Memuat audit log...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 md:px-5 py-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                Menampilkan {rangeStart}–{rangeEnd} dari {total} entri
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={!canPrev}
                  className="w-8 h-8 grid place-items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 min-w-[70px] text-center">
                  {page + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={!canNext}
                  className="w-8 h-8 grid place-items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
