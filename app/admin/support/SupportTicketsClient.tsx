'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Hash,
  LifeBuoy,
  Mail,
  Menu,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
} from 'lucide-react';
import { gooeyToast } from 'goey-toast';
import { createClient } from '@/utils/supabase/client';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';

export type SupportTicket = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  page_url: string | null;
  user_agent: string | null;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug / Error',
  account: 'Akun & Login',
  widget: 'Widget / Overlay',
  integration: 'Integrasi',
  feature: 'Saran Fitur',
  other: 'Lainnya',
};

const STATUS_META: Record<SupportTicket['status'], { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  in_progress: { label: 'In Progress', className: 'bg-blue-500/15 border-blue-500/30 text-blue-300' },
  resolved: { label: 'Resolved', className: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
};

type Filter = 'all' | SupportTicket['status'];

// ID pendek yang enak dibaca, full UUID tetap disimpan di title/copy.
function shortTicketId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function notifySupportChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('keluno:support-tickets-changed'));
  }
}

// Hanya izinkan link http(s) - cegah javascript:/data: URL dari input publik.
function safeHttpUrl(url: string | null): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
}

export default function SupportTicketsClient({
  user,
  initialTickets,
  initialError,
}: {
  user: User;
  initialTickets: SupportTicket[];
  initialError: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [error, setError] = useState<string | null>(initialError);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [batchTarget, setBatchTarget] = useState<SupportTicket['status'] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (fetchError) setError(fetchError.message);
      else {
        setTickets((data as SupportTicket[] | null) ?? []);
        setSelected([]);
        notifySupportChanged();
      }
    } catch (e) {
      console.error('refresh tickets', e);
      setError('Gagal memuat tiket.');
    } finally {
      setRefreshing(false);
    }
  };

  const updateStatus = async (id: string, status: SupportTicket['status']) => {
    const previous = tickets;
    setUpdatingId(id);
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({ status } as any)
        .eq('id', id);
      if (updateError) {
        setTickets(previous);
        setError(updateError.message);
      } else {
        notifySupportChanged();
        gooeyToast.success(`Tiket #${shortTicketId(id)} → ${STATUS_META[status].label}`);
      }
    } catch (e) {
      setTickets(previous);
      console.error('update ticket status', e);
      setError('Gagal mengubah status tiket.');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearSelection = () => setSelected([]);

  const copyTicketId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
      gooeyToast.success(`ID tiket #${shortTicketId(id)} disalin`);
    } catch {
      setError('Gagal menyalin ID tiket. Salin manual dari title ID.');
    }
  };

  const bulkUpdate = async (status: SupportTicket['status']) => {
    if (selected.length === 0 || batchUpdating) return;

    const ids = [...selected];
    const previous = tickets;
    setBatchUpdating(true);
    setBatchTarget(status);
    setError(null);
    setTickets((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, status } : t)));

    try {
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({ status } as any)
        .in('id', ids);

      if (updateError) {
        setTickets(previous);
        setError(updateError.message);
        gooeyToast.error('Gagal mengubah status tiket');
        return;
      }

      setSelected([]);
      notifySupportChanged();
      gooeyToast.success(`${ids.length} tiket diubah ke ${STATUS_META[status].label}`);
    } catch (e) {
      setTickets(previous);
      console.error('bulk update ticket status', e);
      setError('Gagal mengubah status tiket.');
    } finally {
      setBatchUpdating(false);
      setBatchTarget(null);
    }
  };

  const counts = useMemo(
    () => ({
      all: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
    }),
    [tickets]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filter !== 'all' && t.status !== filter) return false;
      if (!q) return true;
      return `${t.id} ${t.subject} ${t.message} ${t.email} ${t.name}`.toLowerCase().includes(q);
    });
  }, [tickets, filter, search]);

  const filteredIds = filtered.map((t) => t.id);
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((t) => selected.includes(t.id));
  const toggleSelectAll = () => {
    setSelected((prev) =>
      allFilteredSelected
        ? prev.filter((id) => !filteredIds.includes(id))
        : Array.from(new Set([...prev, ...filteredIds]))
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="admin-support" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[8px] font-black tracking-widest text-amber-300">
              <Shield className="w-3 h-3" /> ADMIN
            </span>
            <span className="hidden md:inline text-[10px] text-gray-500 font-bold">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 btn-secondary border rounded-lg text-[10px] font-black uppercase"
            >
              <ArrowLeft className="w-3 h-3" /> Admin
            </Link>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 btn-primary rounded-lg text-[10px] font-black uppercase disabled:opacity-60"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 w-full max-w-[1040px] mx-auto space-y-4">
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-blue-400" /> Support Tickets
            </h1>
            <p className="text-[11px] text-gray-500 mt-1">
              Laporan bug & kontak dari halaman /support. Balas via email pelapor.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-[11px] font-bold text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {([
                ['all', 'Semua', counts.all],
                ['open', 'Open', counts.open],
                ['in_progress', 'In Progress', counts.in_progress],
                ['resolved', 'Resolved', counts.resolved],
              ] as const).map(([key, label, count]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-colors ${
                    filter === key ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ID, judul, email..."
                className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-lg text-[11px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-[#005ea6]"
              />
            </div>
          </div>

          {/* Batch update tiket */}
          <div className="flex flex-wrap items-center gap-2 bg-[#161616] border border-white/10 rounded-xl px-3 py-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              role="checkbox"
              aria-checked={allFilteredSelected}
              disabled={filtered.length === 0 || batchUpdating}
              className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span
                className={`w-3.5 h-3.5 rounded border grid place-items-center ${
                  allFilteredSelected
                    ? 'bg-[#005ea6] border-[#005ea6] text-white'
                    : 'border-white/20 bg-white/5'
                }`}
              >
                {allFilteredSelected && <Check className="w-2.5 h-2.5" />}
              </span>
              Pilih semua
            </button>

            <span className="text-[9px] font-black uppercase tracking-wider text-gray-600">
              {selected.length} dipilih
            </span>

            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
              {(['open', 'in_progress', 'resolved'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => bulkUpdate(s)}
                  disabled={selected.length === 0 || batchUpdating}
                  title={`Ubah ${selected.length} tiket ke ${STATUS_META[s].label}`}
                  className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-[8px] font-black uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${STATUS_META[s].className}`}
                >
                  {batchUpdating && batchTarget === s ? (
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <Check className="w-2.5 h-2.5" />
                  )}
                  {STATUS_META[s].label}
                </button>
              ))}
              <button
                type="button"
                onClick={clearSelection}
                disabled={selected.length === 0 || batchUpdating}
                className="h-7 px-2.5 rounded-lg btn-secondary border text-[8px] font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-10 text-center">
              <LifeBuoy className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-[12px] font-bold text-gray-400">Belum ada tiket yang cocok.</p>
              <p className="text-[10px] text-gray-600 mt-1">Laporan baru dari /support akan muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((ticket) => {
                const status = STATUS_META[ticket.status] ?? STATUS_META.open;
                const isSelected = selected.includes(ticket.id);
                return (
                  <article
                    key={ticket.id}
                    className={`bg-[#161616] border rounded-2xl overflow-hidden transition-colors ${
                      isSelected ? 'border-[#005ea6]/60 ring-1 ring-[#005ea6]/30' : 'border-white/10'
                    }`}
                  >
                    <div className="px-4 py-3 border-b border-white/5 flex flex-wrap items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSelect(ticket.id)}
                          role="checkbox"
                          aria-checked={isSelected}
                          aria-label={`Pilih tiket #${shortTicketId(ticket.id)}`}
                          className={`w-4 h-4 shrink-0 rounded border grid place-items-center transition-colors ${
                            isSelected
                              ? 'bg-[#005ea6] border-[#005ea6] text-white'
                              : 'border-white/20 bg-white/5 hover:border-white/40'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyTicketId(ticket.id)}
                          title={`Salin ID tiket: ${ticket.id}`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black tracking-wider text-gray-400 hover:text-white hover:border-white/25 transition-colors"
                        >
                          <Hash className="w-2.5 h-2.5" /> {shortTicketId(ticket.id)}
                          {copiedId === ticket.id ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-wider text-gray-400">
                          {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${status.className}`}>
                          {status.label}
                        </span>
                        <span className="text-[9px] text-gray-600 font-bold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(ticket.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {updatingId === ticket.id && <RefreshCw className="w-3 h-3 animate-spin text-gray-500" />}
                        <select
                          value={ticket.status}
                          onChange={(e) => updateStatus(ticket.id, e.target.value as SupportTicket['status'])}
                          className="h-7 px-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-white focus:outline-none focus:border-[#005ea6] cursor-pointer"
                        >
                          <option value="open" className="bg-[#161616]">Open</option>
                          <option value="in_progress" className="bg-[#161616]">In Progress</option>
                          <option value="resolved" className="bg-[#161616]">Resolved</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-[13px] font-black text-white leading-snug">{ticket.subject}</h3>
                      <p className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap">{ticket.message}</p>

                      <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-gray-500">
                        <a href={`mailto:${encodeURIComponent(ticket.email)}`} className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                          <Mail className="w-3 h-3" /> {ticket.email}
                        </a>
                        {ticket.name && <span>dari {ticket.name}</span>}
                        {ticket.page_url && (
                          safeHttpUrl(ticket.page_url) ? (
                            <a href={safeHttpUrl(ticket.page_url)!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white transition-colors truncate max-w-full">
                              <MessageSquare className="w-3 h-3" /> {ticket.page_url}
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 truncate max-w-full">
                              <MessageSquare className="w-3 h-3" /> {ticket.page_url}
                            </span>
                          )
                        )}
                        {ticket.status === 'resolved' && (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Selesai
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
