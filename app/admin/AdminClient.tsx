'use client';

import { useCallback, useEffect, useMemo, useState, type ElementType, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Menu,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  UserRound,
  Users,
  Ghost,
  LogOut,
  LayoutGrid,
  X,
  Check,
  Ban,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { logoutToLogin } from '@/utils/logout';
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLES,
  WIDGET_CATALOG,
  WIDGET_CATEGORY_LABELS,
  WIDGET_CATEGORY_ORDER,
  WIDGET_KEYS,
  resolveWidgetAccess,
  type Role,
  type WidgetKey,
  type WidgetOverrides,
} from '@/lib/auth';
import type { AdminUser, AdminUsersPayload } from '@/lib/auth/admin-types';
import {
  bulkSetUserActiveAction,
  bulkUpdateUserRoleAction,
  getUserWidgetPermissionsAction,
  listUsersAction,
  setUserActiveAction,
  updateUserRoleAction,
  updateUsersWidgetPermissionsAction,
  updateUserWidgetPermissionsAction,
} from '../actions/admin';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import RoleBadge from '../components/auth/RoleBadge';

type Notice = { type: 'success' | 'error'; text: string } | null;

const ROLE_ICONS: Record<Role, ElementType> = {
  admin: ShieldCheck,
  user: UserRound,
  guest: Ghost,
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Belum pernah';
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

/** "1 jam yang lalu", "3 hari yang lalu", dst. */
function formatRelativeTime(
  value: string | null | undefined,
  now: number
): string {
  if (!value) return 'Belum pernah';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = now - date.getTime();
  if (diffMs < 0) return 'Baru saja';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit yang lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari yang lalu`;

  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks} minggu yang lalu`;

  const months = Math.floor(days / 30);
  if (days < 365) return `${months} bulan yang lalu`;

  const years = Math.floor(days / 365);
  return `${years} tahun yang lalu`;
}

export default function AdminClient({
  user,
  currentUserId,
  initialData,
  initialError,
}: {
  user: User;
  currentUserId: string;
  initialData: AdminUsersPayload | null;
  initialError: string | null;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  // null saat SSR/hydration; diisi setelah mount supaya teks relatif tidak
  // menyebabkan hydration mismatch.
  const [now, setNow] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AdminUsersPayload | null>(initialData);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState<Role | ''>('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(
    initialError ? { type: 'error', text: initialError } : null
  );
  const [widgetTarget, setWidgetTarget] = useState<AdminUser | null>(null);
  const [widgetBulkIds, setWidgetBulkIds] = useState<string[] | null>(null);
  const [widgetAllowed, setWidgetAllowed] = useState<Record<WidgetKey, boolean>>(
    () => resolveWidgetAccess('user')
  );
  const [widgetLoading, setWidgetLoading] = useState(false);
  const [widgetSaving, setWidgetSaving] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  const reload = useCallback(async (term: string) => {
    setLoading(true);
    const result = await listUsersAction({ search: term });
    if (result.ok) {
      setData(result.data);
    } else {
      setNotice({ type: 'error', text: result.error });
    }
    setLoading(false);
  }, []);

  // Hilangkan notice otomatis.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  // Perbarui label "x jam yang lalu" tiap menit.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedIds([]);
    await reload(search);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = (data?.users ?? [])
      .filter((item) => item.id !== currentUserId)
      .map((item) => item.id);

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const applyBulkRole = async () => {
    if (!bulkRole) return;

    const ids = selectedIds.filter((id) => id !== currentUserId);
    if (ids.length === 0) {
      setNotice({ type: 'error', text: 'Tidak ada user yang bisa diubah.' });
      return;
    }

    setBulkBusy(true);
    const result = await bulkUpdateUserRoleAction(ids, bulkRole);

    if (!result.ok) {
      setNotice({ type: 'error', text: result.error });
      setBulkBusy(false);
      return;
    }

    const { updated, skipped, unchanged } = result.data;
    setNotice({
      type: updated > 0 ? 'success' : 'error',
      text: `${updated} user diubah ke ${ROLE_LABELS[bulkRole]}. ${unchanged} tidak berubah, ${skipped} dilewati.${
        updated === 0 ? ' Tidak ada role yang berubah.' : ''
      }`,
    });
    setBulkBusy(false);
    setSelectedIds([]);
    setBulkRole('');
    await reload(search);
  };

  const applyBulkActive = async (isActive: boolean) => {
    const ids = selectedIds.filter((id) => id !== currentUserId);
    if (ids.length === 0) {
      setNotice({ type: 'error', text: 'Tidak ada user yang bisa diubah.' });
      return;
    }

    setBulkBusy(true);
    const result = await bulkSetUserActiveAction(ids, isActive);

    if (!result.ok) {
      setNotice({ type: 'error', text: result.error });
      setBulkBusy(false);
      return;
    }

    const { updated, skipped, unchanged, auth_warning } = result.data;
    setNotice({
      type: updated > 0 ? 'success' : 'error',
      text: `${updated} user ${isActive ? 'diaktifkan' : 'diblokir'}. ${unchanged} tidak berubah, ${skipped} dilewati.${
        auth_warning ? ` Peringatan: ${auth_warning}` : ''
      }`,
    });
    setBulkBusy(false);
    setSelectedIds([]);
    await reload(search);
  };

  const handleStatusChange = async (target: AdminUser, isActive: boolean) => {
    setStatusSavingId(target.id);
    const result = await setUserActiveAction(target.id, isActive);

    if (!result.ok) {
      setNotice({ type: 'error', text: result.error });
      setStatusSavingId(null);
      return;
    }

    const warning = result.data.auth_warning;
    setNotice({
      type: 'success',
      text: `${target.username || target.email || 'User'} ${
        isActive ? 'diaktifkan' : 'diblokir'
      }.${warning ? ` Peringatan: ${warning}` : ''}`,
    });

    if (!isActive) {
      setSelectedIds((prev) => prev.filter((id) => id !== target.id));
    }

    setStatusSavingId(null);
    await reload(search);
  };

  const handleRoleChange = async (target: AdminUsersPayload['users'][number], role: Role) => {
    if (role === target.role) return;
    setSavingId(target.id);
    const result = await updateUserRoleAction(target.id, role);

    if (!result.ok) {
      setNotice({ type: 'error', text: result.error });
      setSavingId(null);
      return;
    }

    setNotice({
      type: 'success',
      text: `Role ${target.username || target.email || 'user'} diubah ke ${ROLE_LABELS[role]}.`,
    });
    setSavingId(null);
    router.refresh();
    await reload(search);
  };

  const openWidgetModal = async (target: AdminUser) => {
    if (target.role === 'admin') {
      setNotice({
        type: 'error',
        text: 'Admin otomatis punya akses ke semua widget. Tidak perlu diatur.',
      });
      return;
    }

    if (target.role !== 'user') {
      setNotice({
        type: 'error',
        text: 'Guest tidak punya akses workspace/widget. Ubah role ke User dulu.',
      });
      return;
    }

    setWidgetBulkIds(null);
    setWidgetTarget(target);
    setWidgetError(null);
    setWidgetAllowed(resolveWidgetAccess(target.role));
    setWidgetLoading(true);

    const result = await getUserWidgetPermissionsAction(target.id);

    if (!result.ok) {
      setWidgetError(result.error);
      setWidgetLoading(false);
      return;
    }

    const overrides: WidgetOverrides = {};
    for (const key of WIDGET_KEYS) {
      const value = result.data.overrides?.[key];
      if (typeof value === 'boolean') overrides[key] = value;
    }

    setWidgetAllowed(resolveWidgetAccess(result.data.role, overrides));
    setWidgetLoading(false);
  };

  const openBulkWidgetModal = () => {
    const ids = selectedIds.filter((id) => id !== currentUserId);
    if (ids.length === 0) {
      setNotice({ type: 'error', text: 'Pilih user terlebih dahulu.' });
      return;
    }

    const targets = (data?.users ?? []).filter(
      (item) => ids.includes(item.id) && item.role === 'user'
    );

    if (targets.length === 0) {
      setNotice({
        type: 'error',
        text: 'Tidak ada user dengan role User di pilihan. Admin/Guest tidak bisa diatur akses widget-nya.',
      });
      return;
    }

    setWidgetTarget(null);
    setWidgetBulkIds(targets.map((item) => item.id));
    setWidgetAllowed(resolveWidgetAccess('user'));
    setWidgetError(null);
    setWidgetLoading(false);
  };

  const closeWidgetModal = () => {
    if (widgetSaving) return;
    setWidgetTarget(null);
    setWidgetBulkIds(null);
  };

  const saveWidgetModal = async () => {
    const bulkIds = widgetBulkIds;
    const target = widgetTarget;

    if (!bulkIds && !target) return;

    setWidgetSaving(true);
    setWidgetError(null);

    const result = bulkIds
      ? await updateUsersWidgetPermissionsAction(bulkIds, widgetAllowed)
      : await updateUserWidgetPermissionsAction(target!.id, widgetAllowed);

    if (!result.ok) {
      setWidgetError(result.error);
      setWidgetSaving(false);
      return;
    }

    const allowedCount = WIDGET_KEYS.filter((key) => widgetAllowed[key]).length;

    if (bulkIds) {
      const { updated, skipped } = result.data as {
        updated: number;
        skipped: number;
      };
      setNotice({
        type: 'success',
        text: `Akses widget ${updated} user disimpan (${allowedCount}/${WIDGET_KEYS.length} aktif). ${skipped} user dilewati karena bukan role User.`,
      });
      setSelectedIds([]);
    } else {
      setNotice({
        type: 'success',
        text: `Akses widget ${target!.username || target!.email || 'user'} disimpan (${allowedCount}/${WIDGET_KEYS.length} aktif).`,
      });
    }

    setWidgetSaving(false);
    setWidgetTarget(null);
    setWidgetBulkIds(null);
    await reload(search);
  };

  const setAllWidgets = (allowed: boolean) => {
    const next = {} as Record<WidgetKey, boolean>;
    for (const key of WIDGET_KEYS) next[key] = allowed;
    setWidgetAllowed(next);
  };

  const toggleWidget = (key: WidgetKey) => {
    setWidgetAllowed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await logoutToLogin(supabase);
  };

  const counts = data?.counts ?? { admin: 0, user: 0, guest: 0 };
  const statusCounts = data?.status_counts ?? { active: 0, blocked: 0 };
  const total = data?.total ?? 0;
  const allowedWidgetCount = WIDGET_KEYS.filter((key) => widgetAllowed[key]).length;
  const selectableUsers = (data?.users ?? []).filter(
    (item) => item.id !== currentUserId
  );
  const allSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((item) => selectedIds.includes(item.id));

  return (
    <div className="admin-page min-h-screen bg-[#0a0a0a] flex">
      <Sidebar
        active="admin"
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
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase text-gray-300"
            >
              <ArrowLeft className="w-3 h-3" /> Dashboard
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
              <Shield className="w-5 h-5 text-amber-300" /> Role & Permission
            </h1>
            <p className="text-gray-500 text-[11px] mt-1 max-w-2xl leading-relaxed">
              Kelola role dan widget yang boleh dipakai tiap akun.
              <span className="text-white font-bold"> Admin</span> memiliki akses penuh,{' '}
              <span className="text-white font-bold">User</span> mengelola workspace sendiri
              (widget bisa dibatasi), dan <span className="text-white font-bold">Guest</span>{' '}
              hanya bisa melihat overlay/display serta dock via private key.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Total user" value={total} icon={Users} />
            {ROLES.map((role) => {
              const Icon = ROLE_ICONS[role];
              return (
                <div
                  key={role}
                  className="bg-[#161616] border border-white/10 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                      {ROLE_LABELS[role]}
                    </span>
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-white font-black text-[26px] mt-2">{counts[role] ?? 0}</p>
                  <p className="text-gray-500 text-[10px] mt-1 leading-relaxed">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
              );
            })}
            <StatCard
              label="Nonaktif"
              value={statusCounts.blocked}
              icon={Ban}
              hint="Akun diblokir/nonaktif"
            />
          </div>

          <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 md:p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-3">
              <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari username atau email..."
                    className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-[12px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 px-4 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                >
                  Cari
                </button>
              </form>
              <button
                type="button"
                onClick={() => {
                  setSelectedIds([]);
                  setBulkRole('');
                  reload(search);
                }}
                disabled={loading}
                className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Muat ulang
              </button>
            </div>

            {notice && (
              <div
                className={`mx-4 md:mx-5 mt-4 rounded-xl border px-4 py-3 text-[11px] font-bold ${
                  notice.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {notice.text}
              </div>
            )}

            {selectedIds.length > 0 && (
              <div className="mx-4 md:mx-5 mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-200">
                  {bulkBusy && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {selectedIds.length} user dipilih
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                  <select
                    value={bulkRole}
                    onChange={(event) =>
                      setBulkRole(event.target.value as Role | '')
                    }
                    disabled={bulkBusy}
                    className="h-8 px-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-white focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                  >
                    <option value="" className="bg-[#161616]">
                      Ubah role…
                    </option>
                    {ROLES.map((role) => (
                      <option key={role} value={role} className="bg-[#161616]">
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={applyBulkRole}
                    disabled={!bulkRole || bulkBusy}
                    className="h-8 px-3 bg-white text-black rounded-lg text-[9px] font-black uppercase tracking-wider disabled:opacity-40"
                  >
                    Terapkan
                  </button>

                  <button
                    type="button"
                    onClick={openBulkWidgetModal}
                    disabled={bulkBusy}
                    className="h-8 px-3 inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-300 disabled:opacity-40"
                  >
                    <LayoutGrid className="w-3 h-3" /> Widget
                  </button>

                  <button
                    type="button"
                    onClick={() => applyBulkActive(false)}
                    disabled={bulkBusy}
                    className="h-8 px-3 inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 rounded-lg text-[9px] font-black uppercase tracking-wider text-red-300 disabled:opacity-40"
                  >
                    <Ban className="w-3 h-3" /> Blokir
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBulkActive(true)}
                    disabled={bulkBusy}
                    className="h-8 px-3 inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-lg text-[9px] font-black uppercase tracking-wider text-emerald-300 disabled:opacity-40"
                  >
                    <Check className="w-3 h-3" /> Aktifkan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIds([]);
                      setBulkRole('');
                    }}
                    disabled={bulkBusy}
                    className="h-8 px-3 inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-300 disabled:opacity-40"
                  >
                    <X className="w-3 h-3" /> Batal
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-gray-500 border-b border-white/5">
                    <th className="px-3 md:px-4 py-3 font-black w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        disabled={selectableUsers.length === 0}
                        aria-label="Pilih semua user"
                        className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-amber-400 disabled:opacity-40"
                      />
                    </th>
                    <th className="px-4 md:px-5 py-3 font-black">User</th>
                    <th className="px-4 md:px-5 py-3 font-black">Role</th>
                    <th className="px-4 md:px-5 py-3 font-black">Widget</th>
                    <th className="px-4 md:px-5 py-3 font-black">Status</th>
                    <th className="px-4 md:px-5 py-3 font-black hidden md:table-cell">
                      Terakhir login
                    </th>
                    <th className="px-4 md:px-5 py-3 font-black hidden lg:table-cell">
                      Bergabung
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.users ?? []).map((target) => {
                    const isSelf = target.id === currentUserId;
                    const saving = savingId === target.id;
                    const statusSaving = statusSavingId === target.id;
                    const selected = selectedIds.includes(target.id);
                    // Default aktif kalau migration 023 belum jalan.
                    const isActive = target.is_active !== false;

                    return (
                      <tr
                        key={target.id}
                        className={`border-b border-white/5 last:border-b-0 ${
                          selected ? 'bg-amber-500/[0.03]' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="px-3 md:px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(target.id)}
                            disabled={isSelf}
                            aria-label={`Pilih ${target.username || target.email || 'user'}`}
                            title={isSelf ? 'Tidak bisa aksi massal ke akun sendiri' : undefined}
                            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-amber-400 disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-4 md:px-5 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {target.avatar_url ? (
                              <img
                                src={target.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/10 text-white grid place-items-center text-[10px] font-black shrink-0">
                                {(target.username || target.email || 'U')
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-white font-bold text-[12px] truncate">
                                  {target.username || target.email?.split('@')[0] || 'User'}
                                </span>
                                {isSelf && (
                                  <span className="text-[8px] font-black uppercase tracking-widest text-amber-300 border border-amber-500/30 bg-amber-500/10 rounded px-1.5 py-0.5">
                                    Kamu
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-500 text-[10px] truncate">
                                {target.email || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-5 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={target.role}
                              disabled={isSelf || saving}
                              onChange={(event) =>
                                handleRoleChange(target, event.target.value as Role)
                              }
                              className="h-8 px-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase text-white focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                            >
                              {ROLES.map((role) => (
                                <option key={role} value={role} className="bg-[#161616]">
                                  {ROLE_LABELS[role]}
                                </option>
                              ))}
                            </select>
                            <RoleBadge role={target.role} />
                            {saving && (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 md:px-5 py-3">
                          <button
                            type="button"
                            onClick={() => openWidgetModal(target)}
                            disabled={target.role !== 'user'}
                            title={
                              target.role === 'admin'
                                ? 'Admin selalu punya akses semua widget'
                                : target.role === 'guest'
                                  ? 'Guest tidak punya akses workspace widget'
                                  : 'Atur widget yang boleh dipakai user ini'
                            }
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <LayoutGrid className="w-3.5 h-3.5" /> Atur
                          </button>
                        </td>
                        <td className="px-4 md:px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 h-6 px-2 rounded-md border text-[8px] font-black uppercase tracking-widest ${
                                isActive
                                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                                  : 'border-red-500/25 bg-red-500/10 text-red-300'
                              }`}
                            >
                              {isActive ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Ban className="w-3 h-3" />
                              )}
                              {isActive ? 'Aktif' : 'Nonaktif'}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(target, !isActive)
                              }
                              disabled={isSelf || statusSaving}
                              title={
                                isSelf
                                  ? 'Tidak bisa memblokir akun sendiri'
                                  : isActive
                                    ? 'Blokir akun ini'
                                    : 'Aktifkan akun ini'
                              }
                              className={`h-6 px-2 rounded-md border text-[8px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed ${
                                isActive
                                  ? 'border-red-500/25 bg-red-500/5 hover:bg-red-500/15 text-red-300'
                                  : 'border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-300'
                              }`}
                            >
                              {statusSaving ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : isActive ? (
                                'Blokir'
                              ) : (
                                'Aktifkan'
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 md:px-5 py-3 text-[10px] text-gray-400 hidden md:table-cell">
                          {target.last_sign_in_at ? (
                            <time
                              dateTime={target.last_sign_in_at}
                              title={formatDateTime(target.last_sign_in_at)}
                              className="cursor-help border-b border-dotted border-white/20"
                            >
                              {now === null
                                ? formatDate(target.last_sign_in_at)
                                : formatRelativeTime(target.last_sign_in_at, now)}
                            </time>
                          ) : (
                            'Belum pernah'
                          )}
                        </td>
                        <td className="px-4 md:px-5 py-3 text-[10px] text-gray-400 hidden lg:table-cell">
                          {formatDate(target.created_at)}
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && (data?.users ?? []).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-[11px] text-gray-500">
                        Tidak ada user yang cocok.
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-[11px] text-gray-500">
                        Memuat data...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 md:px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                Menampilkan {data?.users.length ?? 0} dari {total} user
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                Role disimpan di database, bukan metadata
              </span>
            </div>
          </div>
        </main>
      </div>

      {(widgetTarget || widgetBulkIds) && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeWidgetModal}
        >
          <div
            className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl shadow-black/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-white font-black text-[14px] flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-amber-300" />
                  {widgetBulkIds ? 'Akses Widget Massal' : 'Akses Widget'}
                </h2>
                <p className="text-gray-500 text-[10px] mt-1 truncate">
                  {widgetBulkIds
                    ? `${widgetBulkIds.length} user role User dipilih`
                    : widgetTarget?.username || widgetTarget?.email || 'User'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {widgetBulkIds ? (
                  <span className="text-[8px] font-black uppercase tracking-widest text-amber-300 border border-amber-500/30 bg-amber-500/10 rounded px-1.5 py-0.5">
                    Bulk
                  </span>
                ) : widgetTarget ? (
                  <RoleBadge role={widgetTarget.role} />
                ) : null}
                <button
                  type="button"
                  onClick={closeWidgetModal}
                  className="w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {widgetLoading ? (
                <div className="py-12 text-center text-[11px] text-gray-500">
                  Memuat akses widget...
                </div>
              ) : (
                <>
                  {widgetBulkIds && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-[10px] text-amber-200/80 leading-relaxed">
                      Pengaturan ini akan menimpa akses widget{' '}
                      <span className="font-black text-amber-200">
                        {widgetBulkIds.length} user
                      </span>
                      . Admin dan Guest di pilihan otomatis dilewati.
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-gray-400">
                      {allowedWidgetCount} dari {WIDGET_KEYS.length} widget aktif
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAllWidgets(true)}
                        className="inline-flex items-center gap-1 h-8 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-lg text-[9px] font-black uppercase tracking-wider text-emerald-300"
                      >
                        <Check className="w-3 h-3" /> Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllWidgets(false)}
                        className="inline-flex items-center gap-1 h-8 px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-300"
                      >
                        <Ban className="w-3 h-3" /> Tidak ada
                      </button>
                    </div>
                  </div>

                  {widgetError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[11px] font-bold text-red-300">
                      {widgetError}
                    </div>
                  )}

                  {WIDGET_CATEGORY_ORDER.map((category) => {
                    const items = WIDGET_CATALOG.filter(
                      (widget) => widget.category === category
                    );
                    if (items.length === 0) return null;

                    return (
                      <div key={category} className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">
                          {WIDGET_CATEGORY_LABELS[category]}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {items.map((widget) => {
                            const allowed = widgetAllowed[widget.key] === true;
                            return (
                              <button
                                key={widget.key}
                                type="button"
                                onClick={() => toggleWidget(widget.key)}
                                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                                  allowed
                                    ? 'border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10'
                                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                                }`}
                              >
                                <span className="min-w-0">
                                  <span className="block text-white font-bold text-[11px] truncate">
                                    {widget.title}
                                  </span>
                                  <span
                                    className={`block text-[8px] font-black uppercase tracking-widest mt-0.5 ${
                                      allowed ? 'text-emerald-400' : 'text-gray-500'
                                    }`}
                                  >
                                    {allowed ? 'Diizinkan' : 'Diblokir'}
                                  </span>
                                </span>
                                <span
                                  className={`w-8 h-4 rounded-full p-0.5 flex shrink-0 ${
                                    allowed
                                      ? 'bg-emerald-500 justify-end'
                                      : 'bg-white/15 justify-start'
                                  }`}
                                >
                                  <span className="w-3 h-3 rounded-full bg-white" />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="px-5 py-4 border-t border-white/5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeWidgetModal}
                disabled={widgetSaving}
                className="h-9 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-300 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveWidgetModal}
                disabled={widgetLoading || widgetSaving}
                className="h-9 px-4 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
              >
                {widgetSaving ? 'Menyimpan...' : 'Simpan Akses'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint = 'Semua akun terdaftar',
}: {
  label: string;
  value: number;
  icon: ElementType;
  hint?: string;
}) {
  return (
    <div className="bg-[#161616] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
          {label}
        </span>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <p className="text-white font-black text-[26px] mt-2">{value}</p>
      <p className="text-gray-500 text-[10px] mt-1">{hint}</p>
    </div>
  );
}
