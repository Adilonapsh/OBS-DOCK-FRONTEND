'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { getSocketUrl } from '@/app/widgets/_shared/utils/socket';
import Sidebar from '@/app/components/Sidebar';
import ThemeToggle from '@/app/components/ThemeToggle';
import { io, Socket } from 'socket.io-client';
import {
  Search, RefreshCw, Download, ExternalLink, Menu, Eye, EyeOff,
  TrendingUp, Users, Wallet, Wallet2, Calendar, Copy, Filter, X, ChevronLeft, ChevronRight,
  Gift, Music, Link2, Clock, Hash
} from 'lucide-react';
import { gooeyToast } from 'goey-toast';
import { Suspense } from 'react';

type DonationLog = {
  id: string;
  platform: string;
  donor_name: string;
  amount: number;
  currency: string;
  amount_formatted: string;
  message: string;
  transaction_id: string | null;
  raw: Record<string, unknown> | null;
  created_at: string;
  donorName?: string;
  amountFormatted?: string;
  donor_name_alt?: string;
};

const PLATFORM_META: Record<string, { label: string; color: string; bg: string }> = {
  saweria: { label: 'Saweria', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/20' },
  tiptap: { label: 'TipTap', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/20' },
  trakteer: { label: 'Trakteer', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/20' },
  bagibagi: { label: 'BagiBagi', color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/20' },
  socialbuzz: { label: 'SocialBuzz', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/20' },
  tako: { label: 'Tako', color: 'text-pink-400', bg: 'bg-pink-500/15 border-pink-500/20' },
  sibagi: { label: 'SiBagi', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/20' },
  generic: { label: 'Generic', color: 'text-zinc-400', bg: 'bg-white/5 border-white/10' },
};

const PLATFORMS = ['all', 'saweria', 'tiptap', 'trakteer', 'bagibagi', 'socialbuzz', 'tako', 'sibagi'] as const;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getMediaShare(raw: Record<string, unknown> | null): string | null {
  if (!raw) return null;
  const v = (raw as any).mediaShareUrl || (raw as any).media_url || (raw as any).url || (raw as any).mediaShare || null;
  if (v && typeof v === 'string' && v.startsWith('http')) return v;
  // also check nested raw field
  const nested = (raw as any).raw;
  if (nested && typeof nested === 'object') {
    const nv = (nested as any).mediaShareUrl || (nested as any).media_url;
    if (nv && typeof nv === 'string' && nv.startsWith('http')) return nv;
  }
  return null;
}

function DonationsInner() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [privateKey, setPrivateKey] = useState<string>(searchParams.get('key') || '');
  const [logs, setLogs] = useState<DonationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [showRaw, setShowRaw] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // resolve privateKey + user
  useEffect(() => {
    const init = async () => {
      const urlKey = searchParams.get('key')?.trim();
      if (urlKey) { setPrivateKey(urlKey); return; }
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) setUser(u);
      // try privateKey from profiles / sessionStorage
      let pk = sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '';
      if (u && !pk) {
        try {
          const { data: p } = await supabase.from('profiles').select('private_key').eq('id', u.id).single();
          pk = (p as any)?.private_key || '';
        } catch {}
      }
      if (pk) setPrivateKey(pk);
    };
    init();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // 1. try RPC via privateKey (bypass RLS, works for anon + auth)
      const keyToUse = privateKey || searchParams.get('key') || sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '';
      if (keyToUse) {
        const { data: rpc, error } = await (supabase as any).rpc('get_donations_by_private_key', { p_key: keyToUse, p_limit: 100 });
        if (!error && Array.isArray(rpc) && rpc.length > 0) {
          setLogs(rpc as DonationLog[]);
          setLoading(false);
          return;
        }
      }
      // 2. try authenticated direct query
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase.from('donation_logs').select('*').order('created_at', { ascending: false }).limit(100);
        if (!error && data) {
          setLogs(data as DonationLog[]);
          setLoading(false);
          return;
        }
      }
      // 3. fallback to backend in-memory history via proxy (bebas CORS)
      if (keyToUse) {
        try {
          const res = await fetch(`/api/donation/history?key=${encodeURIComponent(keyToUse)}`, { cache: 'no-store' });
          const j = await res.json();
          if (Array.isArray(j.donations)) {
            // map backend DonationEvent to DonationLog shape
            const mapped: DonationLog[] = j.donations.map((d: any) => ({
              id: d.id || d.transactionId || Math.random().toString(36),
              platform: d.platform || 'generic',
              donor_name: d.donorName || d.donor_name || 'Donatur',
              amount: d.amount || 0,
              currency: d.currency || 'IDR',
              amount_formatted: d.amountFormatted || d.amount_formatted || `Rp ${Number(d.amount||0).toLocaleString('id-ID')}`,
              message: d.message || '',
              transaction_id: d.transactionId || d.transaction_id || null,
              raw: d.raw || d,
              created_at: new Date(d.timestamp || Date.now()).toISOString(),
            }));
            setLogs(mapped);
            setLoading(false);
            return;
          }
        } catch {}
      }
      setLogs([]);
    } catch (e) {
      console.error(e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [privateKey]);

  // realtime via socket
  useEffect(() => {
    const key = privateKey || searchParams.get('key') || '';
    if (!key) return;
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    socket.on('connect', () => {
      socket.emit('join-room', key);
      socket.emit('donation-get', { privateKey: key, key });
    });
    socket.on('donation', (data: any) => {
      const mapped: DonationLog = {
        id: data.id || data.transactionId || Math.random().toString(36),
        platform: data.platform || 'generic',
        donor_name: data.donorName || data.donor_name || 'Donatur',
        amount: data.amount || 0,
        currency: data.currency || 'IDR',
        amount_formatted: data.amountFormatted || data.amount_formatted || `Rp ${Number(data.amount||0).toLocaleString('id-ID')}`,
        message: data.message || '',
        transaction_id: data.transactionId || data.transaction_id || null,
        raw: data.raw || data,
        created_at: new Date(data.timestamp || Date.now()).toISOString(),
      };
      setLogs((prev) => [mapped, ...prev].slice(0, 100));
    });
    return () => { socket.disconnect(); };
  }, [privateKey]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const matchPlatform = platformFilter === 'all' || l.platform === platformFilter;
      if (!matchPlatform) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        l.donor_name.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q) ||
        l.platform.toLowerCase().includes(q) ||
        (l.transaction_id || '').toLowerCase().includes(q) ||
        l.amount_formatted.toLowerCase().includes(q)
      );
    });
  }, [logs, search, platformFilter]);

  const totalAmount = useMemo(() => filtered.reduce((s, l) => s + (Number(l.amount) || 0), 0), [filtered]);
  const totalCount = filtered.length;
  const uniqueDonors = useMemo(() => new Set(filtered.map((l) => l.donor_name.toLowerCase())).size, [filtered]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => setCurrentPage(1), [search, platformFilter]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    gooeyToast.success('Copied');
  };
  const handleExport = () => {
    const headers = ['Waktu', 'Platform', 'Donatur', 'Jumlah', 'Currency', 'Pesan', 'MediaShare', 'TransactionID'];
    const rows = filtered.map((l) => [
      formatDate(l.created_at),
      l.platform,
      l.donor_name,
      String(l.amount),
      l.currency,
      l.message.replace(/"/g, '""'),
      getMediaShare(l.raw) || '',
      l.transaction_id || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="donations" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 text-black rounded-full text-[10px] font-black tracking-widest uppercase"><Wallet2 className="w-3 h-3" /> DONASI</span>
            <span className="hidden md:inline text-[10px] text-gray-500 font-bold">{filtered.length} logs • {privateKey ? `${privateKey.slice(0, 6)}…` : 'global'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchLogs} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
            <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><Download className="w-3 h-3" /> Export CSV</button>
            <Link href="/widgets/donation-leaderboard" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase"><Trophy className="w-3 h-3" /> Leaderboard</Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest"><Wallet className="w-3.5 h-3.5" /> Total Donasi</div>
              <div className="text-white font-black text-[18px] mt-1">Rp {totalAmount.toLocaleString('id-ID')}</div>
              <div className="text-gray-500 text-[11px]">{totalCount} transaksi • {uniqueDonors} donatur unik</div>
            </div>
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest"><TrendingUp className="w-3.5 h-3.5" /> Rata-rata</div>
              <div className="text-white font-black text-[18px] mt-1">Rp {totalCount ? Math.round(totalAmount / totalCount).toLocaleString('id-ID') : 0}</div>
              <div className="text-gray-500 text-[11px]">per donasi</div>
            </div>
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest"><Users className="w-3.5 h-3.5" /> Platform Top</div>
              <div className="text-white font-black text-[14px] mt-1 capitalize">{(() => { const c: Record<string, number> = {}; filtered.forEach((l) => c[l.platform] = (c[l.platform]||0)+1); const top = Object.entries(c).sort((a,b)=>b[1]-a[1])[0]; return top ? `${top[0]} (${top[1]})` : '-'; })()}</div>
              <div className="text-gray-500 text-[11px]">paling banyak donasi</div>
            </div>
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest"><Calendar className="w-3.5 h-3.5" /> Terbaru</div>
              <div className="text-white font-black text-[12px] mt-1 truncate">{logs[0] ? `${logs[0].donor_name} • ${logs[0].amount_formatted}` : '-'}</div>
              <div className="text-gray-500 text-[11px]">{logs[0] ? formatShortDate(logs[0].created_at) : 'belum ada'}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="relative flex-1 max-w-[420px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari donatur, pesan, platform, trx id..." className="w-full h-9 pl-9 pr-8 bg-black/40 border border-white/10 rounded-xl text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="hidden sm:inline-flex items-center gap-1 text-gray-500 text-[10px] font-black uppercase tracking-widest"><Filter className="w-3 h-3" /> Platform</span>
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`shrink-0 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-colors ${platformFilter === p ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
                >
                  {p === 'all' ? 'Semua' : p}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-black/40 border-b border-white/5">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <th className="px-4 py-3 whitespace-nowrap"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Waktu</span></th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Donatur</th>
                    <th className="px-4 py-3">Jumlah</th>
                    <th className="px-4 py-3 hidden md:table-cell">Pesan</th>
                    <th className="px-4 py-3 hidden lg:table-cell">MediaShare</th>
                    <th className="px-4 py-3 hidden xl:table-cell"><span className="flex items-center gap-1"><Hash className="w-3 h-3" /> Trx</span></th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-3 bg-white/5 rounded w-20" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-white/5 rounded-full w-16" /></td>
                        <td className="px-4 py-3"><div className="h-3 bg-white/10 rounded w-24" /></td>
                        <td className="px-4 py-3"><div className="h-3 bg-amber-500/10 rounded w-16" /></td>
                        <td className="px-4 py-3 hidden md:table-cell"><div className="h-3 bg-white/5 rounded w-32" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-3 bg-white/5 rounded w-20" /></td>
                        <td className="px-4 py-3 hidden xl:table-cell"><div className="h-3 bg-white/5 rounded w-16" /></td>
                        <td className="px-4 py-3"><div className="h-6 bg-white/5 rounded w-12 ml-auto" /></td>
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 grid place-items-center mx-auto"><Gift className="w-5 h-5 text-gray-600" /></div>
                        <div className="text-white font-black uppercase text-[11px] mt-3">Belum ada donasi</div>
                        <div className="text-gray-500 text-[11px] mt-1">Donasi via Saweria/TipTap/Trakteer/BagiBagi akan muncul di sini (per privateKey).</div>
                        <div className="mt-3 flex justify-center gap-2">
                          <button onClick={fetchLogs} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Refresh</button>
                          <Link href="/integrations" className="px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase">Atur Webhook</Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((l) => {
                      const media = getMediaShare(l.raw);
                      const meta = PLATFORM_META[l.platform] || PLATFORM_META.generic;
                      return (
                        <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-[11px] font-mono text-gray-400" title={l.created_at}>{formatShortDate(l.created_at)}</td>
                          <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase border ${meta.bg} ${meta.color}`}>{meta.label}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(l.donor_name)}&background=random&size=32`} alt={l.donor_name} className="w-6 h-6 rounded-full border border-white/10 shrink-0 hidden sm:block" />
                              <span className="text-white font-bold text-[12px] truncate max-w-[120px]">{l.donor_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/15 border border-amber-500/20 rounded-full text-amber-400 font-black text-[11px] whitespace-nowrap">{l.amount_formatted || `Rp ${Number(l.amount).toLocaleString('id-ID')}`}</span></td>
                          <td className="px-4 py-3 hidden md:table-cell max-w-[260px]"><span className="text-gray-300 text-[11px] line-clamp-2 leading-relaxed" title={l.message}>{l.message || <span className="text-gray-600 italic">— tanpa pesan —</span>}</span></td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {media ? (
                              <a href={media} target="_blank" className="inline-flex items-center gap-1 px-2 py-1 bg-violet-500/15 border border-violet-500/20 rounded-full text-violet-300 text-[10px] font-bold hover:bg-violet-500/20 max-w-[160px] truncate"><Music className="w-3 h-3 shrink-0" /> <span className="truncate">{media.slice(0, 32)}…</span> <Link2 className="w-3 h-3 shrink-0" /></a>
                            ) : <span className="text-gray-600 text-[11px]">—</span>}
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell"><span className="font-mono text-[10px] text-gray-500 truncate max-w-[100px] inline-block" title={l.transaction_id || ''}>{l.transaction_id ? `${l.transaction_id.slice(0, 8)}…` : '—'}</span></td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleCopy(l.transaction_id || l.id)} className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white" title="Copy Trx ID"><Copy className="w-3 h-3" /></button>
                              <button onClick={() => setShowRaw(showRaw === l.id ? null : l.id)} className={`p-1.5 border rounded-lg ${showRaw === l.id ? 'bg-white text-black border-white' : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400 hover:text-white'}`} title="View raw"><Eye className="w-3 h-3" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Raw expand */}
            {showRaw && (() => {
              const item = logs.find((l) => l.id === showRaw);
              if (!item) return null;
              return (
                <div className="border-t border-white/5 bg-black/40 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-black uppercase text-[10px] tracking-widest">Raw JSON — {item.donor_name}</span>
                    <button onClick={() => setShowRaw(null)} className="p-1 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <pre className="text-[11px] font-mono text-gray-300 bg-black border border-white/10 rounded-xl p-3 overflow-x-auto max-h-[240px]">{JSON.stringify(item.raw || item, null, 2)}</pre>
                </div>
              );
            })()}

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-black/20">
              <span className="text-[11px] text-gray-500 font-bold">{filtered.length} logs • Hal {currentPage} / {totalPages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 grid place-items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 grid place-items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div>
              <div className="text-amber-300 font-black uppercase text-[11px]">Webhook Donasi</div>
              <div className="text-gray-400 text-[11px] mt-1">Atur token di <Link href="/connections" className="text-white font-bold underline">Connections → Donation</Link>.</div>
            </div>
            <Link href="/connection" className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-black rounded-xl text-[11px] font-black uppercase"><ExternalLink className="w-3 h-3" /> Atur Webhook</Link>
          </div>
        </main>
      </div>
    </div>
  );
}

// Trophy icon fallback (lucide)
function Trophy({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 13c0 2.5 2 4 6 4s6-1.5 6-4V5H6v8z" /><path d="M18 5h2a2 2 0 0 1 0 4h-2M6 5H4a2 2 0 0 0 0 4h2M12 17v4M8 21h8" /></svg>;
}

export default function DonationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <DonationsInner />
    </Suspense>
  );
}
