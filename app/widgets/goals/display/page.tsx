'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import { AutoScale } from '../../_shared/components/AutoScale';
import { goalThemeComponents } from '../themes/registry';
import { createClient } from '@/utils/supabase/client';

function sumDonationRows(rows: Record<string, unknown>[]): number {
  return rows.reduce((sum, row) => {
    const amount = Number((row as { amount?: unknown }).amount) || 0;
    return sum + Math.max(0, Math.floor(amount));
  }, 0);
}

function donationTxId(row: Record<string, unknown>): string {
  const r = row as { transactionId?: unknown; transaction_id?: unknown; id?: unknown };
  return String(r.transactionId || r.transaction_id || r.id || '');
}

function isBeforeCutoff(row: Record<string, unknown>, cutoffMs: number): boolean {
  const createdAt = (row as { created_at?: unknown }).created_at;
  if (typeof createdAt === 'string') {
    const time = Date.parse(createdAt);
    if (!Number.isNaN(time)) return time < cutoffMs;
  }
  return true;
}

function GoalsInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const fontSize = getIntParam(params, 'fontSize', 16);
  const accent = getStringParam(params, 'accent', '#8b5cf6');
  const bg = getStringParam(params, 'bg', 'transparent');
  const goalType = getStringParam(params, 'goalType', 'follow') as 'follow' | 'subs' | 'like' | 'donation';
  const target = Math.max(1, getIntParam(params, 'target', 100));
  const initialCurrent = Math.max(0, getIntParam(params, 'current', 0));
  const title = getStringParam(params, 'title', goalType === 'follow' ? 'Follower Goal' : goalType === 'subs' ? 'Subscriber Goal' : goalType === 'donation' ? 'Donation Goal' : 'Like Goal');
  const completedText = getStringParam(params, 'completedText', 'COMPLETED!');
  const showLabel = getBoolParam(params, 'showLabel', true);
  const showCounts = getBoolParam(params, 'showCounts', true);
  const showBar = getBoolParam(params, 'showBar', true);
  const brutalistBg = getStringParam(params, 'brutalistBg', '#FFFFFF');
  const brutalistTextColor = getStringParam(params, 'brutalistTextColor', '#000000');
  const brutalistBadgeBg = getStringParam(params, 'brutalistBadgeBg', '#FFFFFF');
  const brutalistBorderColor = getStringParam(params, 'brutalistBorderColor', '#000000');
  const brutalistShadow = Math.max(0, Math.min(14, getIntParam(params, 'brutalistShadow', 6)));
  const brutalistHalftone = getBoolParam(params, 'brutalistHalftone', true);
  const brutalistTail = getBoolParam(params, 'brutalistTail', true);
  const brutalistItalic = getBoolParam(params, 'brutalistItalic', true);
  const brutalistUppercase = getBoolParam(params, 'brutalistUppercase', true);
  const brutalistInline = getBoolParam(params, 'brutalistInline', false);
  const pos = getStringParam(params, 'pos', 'center');
  const posStyle = getPositionStyle(pos);

  const [current, setCurrent] = useState(initialCurrent);
  const [connected, setConnected] = useState(simulate);
  const donationLiveSum = useRef(0);
  const donationLiveTx = useRef<Set<string>>(new Set());
  const donationLogsReady = useRef(false);

  useEffect(() => loadGoogleFont(font, '400;700;900', 'goals-font'), [font]);
  useEffect(() => {
    if (theme === 'passion' || theme === 'brutalist') loadGoogleFont('Passion One', '400;700;900', 'goals-passion');
    if (theme === 'neonbar') loadGoogleFont('Orbitron', '700;900', 'goals-orbitron');
  }, [theme]);

  // simulate increment
  useEffect(() => {
    if (!simulate) return;
    const t = window.setInterval(() => {
      setCurrent((c) => Math.min(target, c + Math.floor(Math.random() * 2)));
    }, 3000);
    return () => window.clearInterval(t);
  }, [simulate, target]);

  // Donation Goal: current = nominal awal + total donation logs.
  // p_before = waktu halaman dibuka, supaya donasi live yang masuk setelahnya
  // tidak dihitung dua kali (sekali dari log, sekali dari socket).
  useEffect(() => {
    if (simulate || goalType !== 'donation') return;
    let cancelled = false;
    const startedAt = new Date().toISOString();
    const cutoffMs = Date.parse(startedAt);
    donationLiveSum.current = 0;
    donationLiveTx.current = new Set();
    donationLogsReady.current = false;

    const hydrate = async () => {
      const supabase = createClient();
      const rpc = (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
      }).rpc.bind(supabase);
      let total: number | null = null;

      try {
        const key = privateKey || (typeof window !== 'undefined'
          ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '')
          : '');

        if (key) {
          const { data, error } = await rpc('get_donation_total_by_private_key', {
            p_key: key,
            p_before: startedAt,
          });
          if (!error) {
            const row = Array.isArray(data) ? data[0] : data;
            total = Math.max(0, Math.floor(Number((row as { total?: unknown } | null)?.total ?? 0) || 0));
          } else {
            // Fallback untuk DB yang belum menjalankan migration 020:
            // ambil log terbaru lalu jumlahkan (maks 50 dari RPC).
            const { data: rows, error: rowsError } = await rpc('get_donations_by_private_key', {
              p_key: key,
              p_limit: 50,
            });
            if (!rowsError && Array.isArray(rows)) {
              const filtered = (rows as Record<string, unknown>[]).filter((row) => {
                const tx = donationTxId(row);
                if (tx && donationLiveTx.current.has(tx)) return false;
                return isBeforeCutoff(row, cutoffMs);
              });
              total = sumDonationRows(filtered);
            }
          }
        }

        // Fallback: user login langsung (tanpa private key di URL).
        if (total === null) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: rows } = await supabase
              .from('donation_logs')
              .select('amount, transaction_id, created_at')
              .lt('created_at', startedAt)
              .limit(1000);
            if (Array.isArray(rows)) total = sumDonationRows(rows as Record<string, unknown>[]);
          }
        }
      } catch {
        // biarkan total null -> pakai nilai manual + live yang sudah masuk
      }

      if (cancelled) return;
      setCurrent(Math.max(0, initialCurrent + (total ?? 0) + donationLiveSum.current));
      donationLogsReady.current = true;
    };

    hydrate();
    return () => { cancelled = true; };
  }, [goalType, simulate, privateKey, initialCurrent]);

  useEffect(() => {
    if (simulate) return;
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    socket.on('connect', () => { setConnected(true); socket.emit('join-room', room); });
    socket.on('disconnect', () => setConnected(false));

    const inc = (n = 1) => setCurrent((c) => Math.min(target, c + n));

    const handleFollow = (data: Record<string, unknown>) => {
      if (goalType !== 'follow') return;
      inc(1);
    };
    const handleSubs = (data: Record<string, unknown>) => {
      if (goalType !== 'subs') return;
      const d = data as { count?: number };
      inc(Math.max(1, Number(d.count) || 1));
    };
    const handleLike = (data: Record<string, unknown>) => {
      if (goalType !== 'like') return;
      const d = data as { likeCount?: number; count?: number };
      inc(Number(d.likeCount || d.count || 1));
    };

    // TikTok
    socket.on('tiktok-follow', handleFollow);
    socket.on('tiktok-member', (data: Record<string, unknown>) => {
      // member dianggap follow jika goal follow, tapi jangan double-count jika sudah follow
      // untuk subs, member tidak hitung
      if (goalType === 'follow') handleFollow(data);
    });
    socket.on('tiktok-like', handleLike);
    socket.on('tiktok-gift', (data: Record<string, unknown>) => {
      // gift untuk subs goal: anggap gift subs jika giftName mengandung sub/member
      if (goalType === 'subs') {
        const g = String((data as any).giftName || '').toLowerCase();
        if (g.includes('sub') || g.includes('member') || g.includes('membership')) handleSubs(data);
      }
    });
    // Streamer.bot generic via bridge (twitch/youtube/kick)
    socket.on('tiktok-follow', (data: Record<string, unknown>) => {
      // already handled
    });
    // Additional generic: listen to sb events that were bridged as tiktok-follow for subs
    // For Twitch/YouTube subs, bridge emits tiktok-follow with displayType Sub etc.
    // We already handle tiktok-follow for follow, but for subs we need to filter displayType
    const handleBridgedFollowForSubs = (data: Record<string, unknown>) => {
      if (goalType !== 'subs') return;
      const d = data as { displayType?: string; label?: string };
      const t = String(d.displayType || d.label || '').toLowerCase();
      if (['sub', 'resub', 'giftpaidupgrade', 'primepaidupgrade', 'newsubscriber', 'newsponsor', 'membershipgift', 'subscription', 'resubscription'].some((k) => t.includes(k.toLowerCase()))) {
        handleSubs(data);
      }
    };
    socket.on('tiktok-follow', (data: Record<string, unknown>) => {
      if (goalType === 'subs') handleBridgedFollowForSubs(data);
    });
    // Donasi (Saweria/TipTap/Trakteer/dll)- nominal Rp langsung nambah goal donasi.
    // Total historis diambil dari donation_logs; event ini hanya untuk update live.
    socket.on('donation', (data: Record<string, unknown>) => {
      if (goalType !== 'donation') return;
      const d = data as { amount?: unknown };
      const amount = Math.max(0, Math.floor(Number(d.amount) || 0));
      if (amount <= 0) return;
      if (!donationLogsReady.current) {
        donationLiveSum.current += amount;
        const tx = donationTxId(data);
        if (tx) donationLiveTx.current.add(tx);
      }
      inc(amount);
    });

    return () => { socket.disconnect(); };
  }, [privateKey, simulate, goalType, target]);

  const percent = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
  const Theme = goalThemeComponents[theme] || goalThemeComponents.standard;

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;700;900&display=swap'); html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; }`}</style>
      <div id="goals-display-root" className={`${obsMode ? 'fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-2' : 'w-full min-h-screen bg-[#0a0a0a] flex p-4'}`} style={{ ...posStyle, background: obsMode ? 'transparent' : '#0a0a0a', fontFamily: `'${font}', sans-serif` } as any}>
        {!obsMode && !connected && <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">Menghubungkan… privateKey={privateKey ? `${privateKey.slice(0, 6)}…` : 'global'}</div>}
        {!obsMode && <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">GOALS • {theme} • {goalType} • {simulate ? 'simulate' : connected ? 'connected' : 'offline'}</div>}
        <AutoScale defaultBase={420} baseWidth={theme === 'minimal' ? 320 : 420}>
          <Theme
            title={title}
            current={current}
            target={target}
            percent={percent}
            goalType={goalType}
            font={font}
            fontSize={fontSize}
            accent={accent}
            bg={bg}
            showLabel={showLabel}
            showCounts={showCounts}
            showBar={showBar}
            brutalistBg={brutalistBg}
            brutalistTextColor={brutalistTextColor}
            brutalistBadgeBg={brutalistBadgeBg}
            brutalistBorderColor={brutalistBorderColor}
            brutalistShadow={brutalistShadow}
            brutalistHalftone={brutalistHalftone}
            brutalistTail={brutalistTail}
            brutalistItalic={brutalistItalic}
            brutalistUppercase={brutalistUppercase}
            brutalistInline={brutalistInline}
            completedText={completedText}
          />
        </AutoScale>
      </div>
    </>
  );
}

export default function GoalsDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading goals…</div>}>
      <GoalsInner />
    </Suspense>
  );
}
