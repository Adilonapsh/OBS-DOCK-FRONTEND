'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import { AutoScale } from '../../_shared/components/AutoScale';
import { donationLeaderboardThemeComponents } from '../themes/registry';
import type { DonationEntry } from '../themes/types';
import { createClient } from '@/utils/supabase/client';

function getDonationTime(d: Record<string, unknown>): number {
  // d.timestamp (ms) or d.created_at (ISO) or d.raw.created_at
  const ts = (d as any).timestamp;
  if (typeof ts === 'number' && ts > 0) return ts;
  const ca = (d as any).created_at || (d as any).createdAt || (d as any).raw?.created_at;
  if (typeof ca === 'string') {
    const t = Date.parse(ca);
    if (!Number.isNaN(t)) return t;
  }
  return Date.now();
}

function isInPeriod(timeMs: number, period: string): boolean {
  const d = new Date(timeMs);
  const now = new Date();
  // normalize to local time 00:00
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;
  if (period === 'today') return timeMs >= startOfToday && timeMs < startOfTomorrow;
  if (period === 'yesterday') {
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    return timeMs >= startOfYesterday && timeMs < startOfToday;
  }
  if (period === 'week') {
    // minggu ini: Senin 00:00 sampai sekarang (Senin = 1)
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const diffToMonday = day === 0 ? 6 : day - 1;
    const startOfWeek = startOfToday - diffToMonday * 24 * 60 * 60 * 1000;
    return timeMs >= startOfWeek;
  }
  if (period === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return timeMs >= startOfMonth;
  }
  return true; // all
}

function aggregate(donations: Record<string, unknown>[], limit: number, minAmount: number, period: string): DonationEntry[] {
  const map = new Map<string, DonationEntry>();
  for (const raw of donations) {
    const time = getDonationTime(raw);
    if (!isInPeriod(time, period)) continue;
    const amount = Number((raw as any).amount || 0);
    if (amount < minAmount) continue;
    const name = String((raw as any).donorName || (raw as any).donor_name || 'Donatur').trim() || 'Donatur';
    const key = name.toLowerCase();
    const prev = map.get(key);
    if (prev) {
      prev.total += amount;
      prev.count += 1;
      prev.lastMessage = String((raw as any).message || prev.lastMessage);
      prev.lastTimestamp = time;
      prev.amountFormatted = `Rp ${prev.total.toLocaleString('id-ID')}`;
      if (amount > prev.total / prev.count) prev.platform = String((raw as any).platform || prev.platform);
    } else {
      map.set(key, {
        donorName: name,
        total: amount,
        count: 1,
        amountFormatted: String((raw as any).amountFormatted || (raw as any).amount_formatted || `Rp ${amount.toLocaleString('id-ID')}`),
        platform: String((raw as any).platform || 'saweria'),
        lastMessage: String((raw as any).message || ''),
        lastTimestamp: time,
      });
    }
  }
  return [...map.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((e) => ({ ...e, amountFormatted: `Rp ${e.total.toLocaleString('id-ID')}` }));
}

function DonationLeaderboardInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const fontSize = Math.max(10, Math.min(32, getIntParam(params, 'fontSize', 16)));
  const accent = getStringParam(params, 'accent', '#f59e0b');
  const bg = getStringParam(params, 'bg', 'transparent');
  const textColor = getStringParam(params, 'textColor', '');
  const title = getStringParam(params, 'title', 'Top Donatur');
  const limit = Math.max(1, Math.min(10, getIntParam(params, 'limit', 5)));
  const showAmount = getBoolParam(params, 'showAmount', true);
  const showPlatform = getBoolParam(params, 'showPlatform', true);
  const showAvatar = getBoolParam(params, 'showAvatar', true);
  const minAmount = Math.max(0, getIntParam(params, 'minAmount', 0));
  const period = getStringParam(params, 'period', 'all') as 'today' | 'yesterday' | 'week' | 'month' | 'all';
  const pos = getStringParam(params, 'pos', 'center');
  const posStyle = getPositionStyle(pos);

  const [donations, setDonations] = useState<Record<string, unknown>[]>([]);
  const [connected, setConnected] = useState(simulate);

  useEffect(() => loadGoogleFont(font, '400;700;900', 'leaderboard-font'), [font]);

  // simulate dummy
  useEffect(() => {
    if (!simulate) return;
    const demo: Record<string, unknown>[] = [
      { donorName: 'BudiSantuy', amount: 100000, amountFormatted: 'Rp 100.000', platform: 'saweria', message: 'Gas terus!', timestamp: Date.now() },
      { donorName: 'SitiPlay', amount: 75000, amountFormatted: 'Rp 75.000', platform: 'trakteer', message: 'Keren!' },
      { donorName: 'Rizky_JR', amount: 50000, amountFormatted: 'Rp 50.000', platform: 'tiptap', message: '' },
      { donorName: 'Mimin', amount: 25000, amountFormatted: 'Rp 25.000', platform: 'saweria', message: 'Semangat' },
      { donorName: 'BudiSantuy', amount: 30000, amountFormatted: 'Rp 30.000', platform: 'saweria', message: 'Lagi!' },
    ];
    setDonations(demo);
    const t = window.setInterval(() => {
      const names = ['BudiSantuy', 'SitiPlay', 'Rizky_JR', 'Mimin', 'Anon'];
      const n = names[Math.floor(Math.random() * names.length)];
      setDonations((prev) => [
        { donorName: n, amount: 10000 + Math.floor(Math.random() * 40000), amountFormatted: '', platform: 'saweria', message: 'Simulate', timestamp: Date.now() },
        ...prev,
      ].slice(0, 30));
    }, 4000);
    return () => window.clearInterval(t);
  }, [simulate]);

  // Ambil dari table donation_logs (persist) + live update
  useEffect(() => {
    if (simulate) return;
    const key = privateKey || '';
    // 1) Fetch dari Supabase table via RPC (persist)
    const fetchFromTable = async () => {
      try {
        const supabase = createClient();
        const pKey = key || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '');
        if (pKey) {
          const { data: rpc, error } = await (supabase as any).rpc('get_donations_by_private_key', { p_key: pKey, p_limit: 100 });
          if (!error && Array.isArray(rpc) && rpc.length > 0) {
            const mapped = (rpc as Record<string, unknown>[]).map((r: any) => ({
              ...r,
              donorName: r.donor_name || r.donorName,
              amount: r.amount,
              amountFormatted: r.amount_formatted || r.amountFormatted || `Rp ${Number(r.amount || 0).toLocaleString('id-ID')}`,
              platform: r.platform,
              message: r.message,
              timestamp: r.created_at ? Date.parse(r.created_at) : Date.now(),
              created_at: r.created_at,
              transactionId: r.transaction_id || r.transactionId,
              id: r.id,
              raw: r.raw,
            }));
            setDonations((prev) => {
              const seen = new Set(prev.map((d) => String((d as any).transactionId || (d as any).id || (d as any).transaction_id)));
              const add = mapped.filter((d) => !seen.has(String((d as any).transactionId || (d as any).id)));
              return [...add, ...prev].slice(0, 100);
            });
            return;
          }
        }
        // fallback: auth direct query
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data } = await supabase.from('donation_logs').select('*').order('created_at', { ascending: false }).limit(100);
          if (Array.isArray(data) && data.length > 0) {
            const mapped = (data as Record<string, unknown>[]).map((r: any) => ({
              ...r,
              donorName: r.donor_name,
              amount: r.amount,
              amountFormatted: r.amount_formatted || `Rp ${Number(r.amount || 0).toLocaleString('id-ID')}`,
              platform: r.platform,
              message: r.message,
              timestamp: r.created_at ? Date.parse(r.created_at) : Date.now(),
              created_at: r.created_at,
              transactionId: r.transaction_id,
              id: r.id,
              raw: r.raw,
            }));
            setDonations((prev) => {
              const seen = new Set(prev.map((d) => String((d as any).transactionId || (d as any).id)));
              const add = mapped.filter((d) => !seen.has(String((d as any).transactionId || (d as any).id)));
              return [...add, ...prev].slice(0, 100);
            });
          }
        }
      } catch {}
    };
    fetchFromTable();

    // 2) Socket live + history (in-memory) — akan merge dan tambah live
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', room);
      socket.emit('donation-get', { privateKey: room, key: room });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('donation-history', (payload: { donations?: unknown[] }) => {
      const list = Array.isArray(payload?.donations) ? payload.donations : [];
      setDonations((prev) => {
        const seen = new Set(prev.map((d) => String((d as any).transactionId || (d as any).id || (d as any).transaction_id)));
        const add = (list as Record<string, unknown>[]).filter((d) => !seen.has(String((d as any).transactionId || (d as any).id || (d as any).transaction_id)));
        return [...prev, ...add].slice(0, 100);
      });
    });
    socket.on('donation', (data: Record<string, unknown>) => {
      // data sudah punya timestamp, kalau dari table sudah ada created_at, socket data akan punya timestamp
      setDonations((prev) => [data, ...prev].slice(0, 100));
    });
    return () => { socket.disconnect(); };
  }, [privateKey, simulate]);

  const entries = aggregate(donations, limit, minAmount, period);
  const Theme = donationLeaderboardThemeComponents[theme] || donationLeaderboardThemeComponents.standard;

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;700;900&display=swap'); html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; }`}</style>
      <div id="leaderboard-display-root" className={`${obsMode ? 'fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-2' : 'w-full min-h-screen bg-[#0a0a0a] flex p-4'}`} style={{ ...posStyle, background: obsMode ? 'transparent' : '#0a0a0a', fontFamily: `'${font}', sans-serif` } as any}>
        {!obsMode && !connected && <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">Menghubungkan… privateKey={privateKey ? `${privateKey.slice(0, 6)}…` : 'global'}</div>}
        {!obsMode && <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">LEADERBOARD • {theme} • {simulate ? 'simulate' : connected ? 'connected' : 'offline'}</div>}
        <AutoScale defaultBase={360} baseWidth={theme === 'minimal' ? 320 : 360}>
          <Theme
            entries={entries}
            font={font}
            fontSize={fontSize}
            accent={accent}
            bg={bg}
            textColor={textColor}
            title={title}
            showAmount={showAmount}
            showPlatform={showPlatform}
            showAvatar={showAvatar}
          />
        </AutoScale>
      </div>
    </>
  );
}

export default function DonationLeaderboardDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading leaderboard…</div>}>
      <DonationLeaderboardInner />
    </Suspense>
  );
}
