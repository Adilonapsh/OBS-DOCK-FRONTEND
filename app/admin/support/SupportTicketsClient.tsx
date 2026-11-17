'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Mail,
  Menu,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
} from 'lucide-react';
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
      else setTickets((data as SupportTicket[] | null) ?? []);
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
      }
    } catch (e) {
      setTickets(previous);
      console.error('update ticket status', e);
      setError('Gagal mengubah status tiket.');
    } finally {
      setUpdatingId(null);
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
      return `${t.subject} ${t.message} ${t.email} ${t.name}`.toLowerCase().includes(q);
    });
  }, [tickets, filter, search]);

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
                placeholder="Cari judul, email, isi..."
                className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-lg text-[11px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-[#005ea6]"
              />
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
                return (
                  <article key={ticket.id} className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 flex flex-wrap items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 min-w-0">
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
