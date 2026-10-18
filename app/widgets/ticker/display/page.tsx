'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import { parseBrutalistParams } from '../../_shared/constants/brutalist';
import { tickerThemeComponents } from '../themes/registry';
import StandardTheme from '../themes/Standard';
import { parseTickerItems, DEMO_TICKER_ITEMS, TICKER_KEYFRAMES_CSS } from '../config';
import { createClient } from '@/utils/supabase/client';

function getDonationTime(d: Record<string, unknown>): number {
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
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;
  if (period === 'today') return timeMs >= startOfToday && timeMs < startOfTomorrow;
  if (period === 'yesterday') {
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    return timeMs >= startOfYesterday && timeMs < startOfToday;
  }
  if (period === 'week') {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const startOfWeek = startOfToday - diffToMonday * 24 * 60 * 60 * 1000;
    return timeMs >= startOfWeek;
  }
  if (period === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return timeMs >= startOfMonth;
  }
  return true;
}

function TickerInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const fontSize = Math.max(10, Math.min(40, getIntParam(params, 'fontSize', 16)));
  const accent = getStringParam(params, 'accent', '#22d3ee');
  const bg = getStringParam(params, 'bg', 'transparent');
  const textColor = getStringParam(params, 'textColor', '');
  const separator = getStringParam(params, 'separator', '•');
  const speed = Math.max(3, Math.min(120, getIntParam(params, 'speed', 20)));
  const direction = (getStringParam(params, 'direction', 'left') === 'right' ? 'right' : 'left') as 'left' | 'right';
  const showBadge = getBoolParam(params, 'showBadge', true);
  const badgeText = getStringParam(params, 'badgeText', 'INFO');
  const pos = getStringParam(params, 'pos', 'b');
  const posStyle = getPositionStyle(pos);
  const brutalist = parseBrutalistParams((k) => params.get(k));

  const source = getStringParam(params, 'source', 'manual') as 'manual' | 'donation' | 'mixed';
  const donationLimit = Math.max(1, Math.min(20, getIntParam(params, 'donationLimit', 10)));
  const donationShowMessage = getBoolParam(params, 'donationShowMessage', true);
  const donationMinAmount = Math.max(0, getIntParam(params, 'donationMinAmount', 0));
  const donationPeriod = getStringParam(params, 'donationPeriod', 'all') as 'today' | 'yesterday' | 'week' | 'month' | 'all';
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));

  const rawItems = simulate ? '' : getStringParam(params, 'items', '');
  const parsedManual = parseTickerItems(rawItems);
  const manualItems = parsedManual.length > 0 ? parsedManual : [...DEMO_TICKER_ITEMS];

  const [rawDonations, setRawDonations] = useState<Record<string, unknown>[]>([]);

  const formatDonation = (d: Record<string, unknown>) => {
    const donor = String((d as any).donorName || (d as any).donor_name || 'Donatur');
    const amount = String((d as any).amountFormatted || (d as any).amount_formatted || `Rp ${Number((d as any).amount || 0).toLocaleString('id-ID')}`);
    const msg = String((d as any).message || '').trim();
    const base = `${donor} — ${amount}`;
    if (donationShowMessage && msg) return `${base} : ${msg.slice(0, 80)}`;
    return base;
  };

  const donationItems = (() => {
    const filtered = rawDonations
      .filter((d) => Number((d as any).amount || 0) >= donationMinAmount)
      .filter((d) => isInPeriod(getDonationTime(d), donationPeriod));
    // format setelah filter period & limit
    return filtered.slice(0, donationLimit).map(formatDonation);
  })();

  useEffect(() => loadGoogleFont(font, '400;700;900', 'ticker-font'), [font]);

  // Donation: ambil dari table donation_logs + live update
  useEffect(() => {
    if (source === 'manual') return;
    if (simulate) {
      const now = Date.now();
      const demo: Record<string, unknown>[] = [
        { donorName: 'BudiSantuy', donor_name: 'BudiSantuy', amount: 25000, amountFormatted: 'Rp 25.000', amount_formatted: 'Rp 25.000', message: 'Semangat stream!', timestamp: now, created_at: new Date(now).toISOString(), platform: 'saweria' },
        { donorName: 'SitiPlay', donor_name: 'SitiPlay', amount: 50000, amountFormatted: 'Rp 50.000', amount_formatted: 'Rp 50.000', message: 'Keren bang!', timestamp: now - 3600000, created_at: new Date(now - 3600000).toISOString(), platform: 'trakteer' },
        { donorName: 'Rizky_JR', donor_name: 'Rizky_JR', amount: 10000, amountFormatted: 'Rp 10.000', amount_formatted: 'Rp 10.000', message: '', timestamp: now - 7200000, created_at: new Date(now - 7200000).toISOString(), platform: 'tiptap' },
      ];
      setRawDonations(demo);
      return;
    }
    const key = privateKey || '';
    // 1) Fetch dari Supabase table
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
            setRawDonations((prev) => {
              const seen = new Set(prev.map((d) => String((d as any).transactionId || (d as any).id || (d as any).transaction_id)));
              const add = mapped.filter((d) => !seen.has(String((d as any).transactionId || (d as any).id)));
              return [...add, ...prev].slice(0, 100);
            });
            return;
          }
        }
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
            setRawDonations((prev) => {
              const seen = new Set(prev.map((d) => String((d as any).transactionId || (d as any).id)));
              const add = mapped.filter((d) => !seen.has(String((d as any).transactionId || (d as any).id)));
              return [...add, ...prev].slice(0, 100);
            });
          }
        }
      } catch {}
    };
    fetchFromTable();

    // 2) Socket live
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    socket.on('connect', () => {
      socket.emit('join-room', room);
      socket.emit('donation-get', { privateKey: room, key: room });
    });
    socket.on('donation-history', (payload: { donations?: unknown[] }) => {
      const list = Array.isArray(payload?.donations) ? payload.donations : [];
      setRawDonations((prev) => {
        const seen = new Set(prev.map((d) => String((d as any).transactionId || (d as any).id || (d as any).transaction_id)));
        const add = (list as Record<string, unknown>[]).filter((d) => !seen.has(String((d as any).transactionId || (d as any).id || (d as any).transaction_id)));
        return [...prev, ...add].slice(0, 100);
      });
    });
    socket.on('donation', (data: Record<string, unknown>) => {
      setRawDonations((prev) => [data, ...prev].slice(0, 100));
    });
    return () => { socket.disconnect(); };
  }, [source, privateKey, simulate]);

  const items = (() => {
    if (source === 'donation') return donationItems.length > 0 ? donationItems : manualItems;
    if (source === 'mixed') {
      if (donationItems.length === 0) return manualItems;
      if (manualItems.length === 0) return donationItems;
      // interleave: donasi + manual
      const out: string[] = [];
      const max = Math.max(manualItems.length, donationItems.length);
      for (let i = 0; i < max; i++) {
        if (i < donationItems.length) out.push(donationItems[i]);
        if (i < manualItems.length) out.push(manualItems[i]);
      }
      return out;
    }
    return manualItems;
  })();

  const themeProps = {
    items,
    font,
    fontSize,
    accent,
    bg,
    textColor,
    separator,
    speed,
    direction,
    showBadge,
    badgeText,
    ...brutalist,
  };

  // auto-register: theme baru di themes/*.tsx langsung kepakai tanpa tambah case
  const Theme = tickerThemeComponents[theme] ?? StandardTheme;

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`${TICKER_KEYFRAMES_CSS} @import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;700;900&display=swap'); html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; scrollbar-width:none;-ms-overflow-style:none; } html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;width:0;height:0}`}</style>
      <div
        id="ticker-display-root"
        className={`${obsMode ? `fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-2` : `w-full min-h-screen bg-[#0a0a0a] flex p-4`}`}
        style={{ ...posStyle, background: obsMode ? 'transparent' : '#0a0a0a', fontFamily: `'${font}', sans-serif` } as any}
      >
        {!obsMode && <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">TICKER • {theme} • {items.length} items</div>}
        <div className="w-full">
          <Theme {...themeProps} />
        </div>
      </div>
    </>
  );
}

export default function TickerDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <TickerInner />
    </Suspense>
  );
}
