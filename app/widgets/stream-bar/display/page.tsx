'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense, type CSSProperties } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import { AutoScale } from '../../_shared/components/AutoScale';
import { streamBarThemeComponents } from '../themes/registry';
import { parseStreamBarGoals, parseStreamBarRules, STREAM_BAR_ACTIVITY_PRESETS } from '../config';
import type { StreamBarAlert, StreamBarAlertState, StreamBarGoal } from '../themes/types';
import { createClient } from '@/utils/supabase/client';

type SongState = {
  active: boolean;
  title: string;
  artist: string;
  art: string;
  elapsed: number;
  total: number;
};

// Album art lagu antrian: pakai thumbnail eksplisit bila ada, kalau tidak
// turunkan dari videoId YouTube (sama seperti widget Music).
function songArtFrom(item?: { videoId?: unknown; thumbnail?: unknown }): string {
  if (!item) return '';
  const thumb = String(item.thumbnail || '').trim();
  if (/^https?:\/\//i.test(thumb)) return thumb;
  const videoId = String(item.videoId || '').trim();
  // hqdefault (4:3) lebih pas untuk kotak cover hampir persegi.
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
}

// Cover contoh untuk mode demo supaya slot album art ikut terlihat.
const DEMO_SONG_ART = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">' +
  '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34536a"/><stop offset=".45" stop-color="#8a6a58"/><stop offset=".56" stop-color="#e08a3a"/><stop offset=".57" stop-color="#1f6f78"/><stop offset="1" stop-color="#16506a"/></linearGradient></defs>' +
  '<rect width="320" height="320" fill="url(#s)"/>' +
  '<circle cx="230" cy="98" r="34" fill="#ffd08a"/>' +
  '<path d="M0 196 L54 156 L98 190 L150 148 L206 188 L260 160 L320 194 L320 320 L0 320 Z" fill="#1c4a52" opacity=".92"/>' +
  '<path d="M0 232 L64 204 L120 226 L190 198 L252 224 L320 206 L320 320 L0 320 Z" fill="#153d46" opacity=".9"/>' +
  '</svg>',
)}`;

const SUB_TYPES = new Set([
  'sub',
  'subscription',
  'newsubscriber',
  'resub',
  'resubscription',
  'membermilestone',
  'newsponsor',
  'membershipgift',
  'giftmembershipreceived',
  'giftpaidupgrade',
  'primepaidupgrade',
]);

function isSubType(value: string): boolean {
  return SUB_TYPES.has(value.toLowerCase());
}

function isRaidType(value: string): boolean {
  return value.toLowerCase().includes('raid');
}

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

function normPlatform(p?: unknown): string {
  const v = String(p || '').toLowerCase();
  if (v.includes('twitch')) return 'twitch';
  if (v.includes('youtube') || v === 'yt') return 'youtube';
  if (v.includes('kick')) return 'kick';
  return 'tiktok';
}

function StreamBarInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const accent = getStringParam(params, 'accent', '#3fe0c8');
  const pos = getStringParam(params, 'pos', 'center');
  const posStyle = getPositionStyle(pos);

  const welcomeLabel = getStringParam(params, 'welcomeLabel', 'Welcome');
  const welcomeTitle = getStringParam(params, 'welcomeTitle', 'Welcome in!');
  const welcomeSub = getStringParam(params, 'welcomeSub', 'Grab a drink and make yourself at home');
  const rulesRaw = searchParams.get('rules');
  const rules = useMemo(() => parseStreamBarRules(rulesRaw), [rulesRaw]);

  const activityParam = getStringParam(params, 'activity', 'chatting');
  const activityTitle = getStringParam(params, 'activityTitle', '');
  const activitySub = getStringParam(params, 'activitySub', '');
  const activityImage = getStringParam(params, 'activityImage', '');

  const gameActiveParam = getBoolParam(params, 'gameActive', false);
  const gameName = getStringParam(params, 'gameName', 'Valorant');
  const gameGenre = getStringParam(params, 'gameGenre', 'Tactical shooter');
  const gameCover = getStringParam(params, 'gameCover', '');

  const startParam = getStringParam(params, 'start', '');
  const initialViewers = Math.max(0, getIntParam(params, 'viewers', 0));

  const goalStyleRaw = getStringParam(params, 'goalStyle', getStringParam(params, 'goalstyle', 'radial'));
  const goalStyle = goalStyleRaw === 'bar' ? 'bar' : 'radial';
  const goalRotateMs = Math.max(2000, getIntParam(params, 'goalRotateMs', 6000));
  const alertMs = Math.max(2000, getIntParam(params, 'alertMs', 7000));
  const demoParam = params.get('demo');
  const demo = demoParam === '0' ? false : simulate || demoParam === '1';

  const goalsRaw = searchParams.get('goals');
  const initialGoals = useMemo(() => parseStreamBarGoals(goalsRaw), [goalsRaw]);

  // Durasi live. Kalau dock mengirim `stream-time` (dari OBS outputTimecode),
  // nilai itu yang dipakai supaya sama persis dengan yang tampil di dock.
  const [openedAt] = useState(() => Date.now());
  const [dockStartedAt, setDockStartedAt] = useState<number | null>(null);
  const startMs = startParam ? Date.parse(startParam) : NaN;
  const fallbackStartedAt = Number.isFinite(startMs)
    ? startMs
    // Demo pakai durasi contoh dari referensi; mode real menghitung dari
    // saat overlay dibuka sampai dock mengirim durasi sebenarnya.
    : demo
      ? openedAt - (1 * 3600 + 42 * 60 + 10) * 1000
      : openedAt;
  const streamStartedAt = dockStartedAt ?? fallbackStartedAt;

  const songTitleParam = getStringParam(params, 'songTitle', 'Lantern Light');
  const songArtistParam = getStringParam(params, 'songArtist', 'Night Harbor');
  const songArtParam = getStringParam(params, 'songArt', '');
  const songElapsedParam = Math.max(0, getIntParam(params, 'songElapsed', 0));
  const songTotalParam = Math.max(0, getIntParam(params, 'songTotal', 0));

  const [activityPreset, setActivityPreset] = useState(activityParam);
  const [gameActive, setGameActive] = useState(gameActiveParam);
  // Penonton real per platform (TikTok + Streamer.bot Twitch/YouTube/Kick),
  // digabung seperti widget View Counter. Mode demo memakai bucket "demo".
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>(() => {
    const seed: Record<string, number> = {};
    if (demo || simulate) seed.demo = initialViewers || 214;
    return seed;
  });
  const realViewerTotal = Object.values(viewerCounts).reduce((a, b) => a + b, 0);
  const viewers = demo || simulate || realViewerTotal > 0 ? realViewerTotal : initialViewers;
  const [song, setSong] = useState<SongState>({
    active: false,
    title: songTitleParam,
    artist: songArtistParam,
    art: songArtParam,
    elapsed: songElapsedParam,
    total: songTotalParam,
  });
  const [connected, setConnected] = useState(simulate);

  // ---- Alert queue (satu per satu, dengan wipe keluar) ----
  const [alertState, setAlertState] = useState<StreamBarAlertState>(null);
  const alertMsRef = useRef(alertMs);
  const queueRef = useRef<StreamBarAlert[]>([]);
  const busyRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const pumpRef = useRef<() => void>(() => {});
  useEffect(() => {
    alertMsRef.current = alertMs;
  }, [alertMs]);

  const pump = useCallback(() => {
    if (busyRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    busyRef.current = true;
    setAlertState({ item: next, closing: false });
    const dur = Math.max(1500, next.duration || alertMsRef.current);
    const t1 = window.setTimeout(() => {
      setAlertState((cur) => (cur && cur.item.id === next.id ? { ...cur, closing: true } : cur));
      const t2 = window.setTimeout(() => {
        setAlertState((cur) => (cur && cur.item.id === next.id ? null : cur));
        busyRef.current = false;
        pumpRef.current();
      }, 900);
      timersRef.current.push(t2);
    }, dur);
    timersRef.current.push(t1);
  }, []);
  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const enqueueAlert = useCallback((alert: Omit<StreamBarAlert, 'id'> & { id?: string }) => {
    const item: StreamBarAlert = {
      ...alert,
      id: alert.id || `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    queueRef.current.push(item);
    pumpRef.current();
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  // ---- Goals (live increment) ----
  // Demo memakai angka contoh supaya preview tidak kosong; mode real mulai
  // dari nilai setting (default 0) lalu ditambah event live.
  const demoGoals = useMemo(
    () => initialGoals.map((goal) => ({
      ...goal,
      current: Math.max(goal.current, Math.round(goal.target * (goal.kind === 'donation' ? 0.72 : 0.62))),
    })),
    [initialGoals],
  );
  const startingGoals = demo ? demoGoals : initialGoals;
  const goalsRef = useRef<StreamBarGoal[]>(startingGoals);
  const [goals, setGoals] = useState<StreamBarGoal[]>(startingGoals);

  const bumpGoals = useCallback((kind: StreamBarGoal['kind'], amount: number) => {
    const delta = Math.max(0, Math.floor(Number(amount) || 0));
    if (delta <= 0) return;
    const reached: string[] = [];
    const next = goalsRef.current.map((goal) => {
      if (goal.kind !== kind) return goal;
      const current = goal.current + delta;
      if (goal.current < goal.target && current >= goal.target) reached.push(goal.label);
      return { ...goal, current };
    });
    goalsRef.current = next;
    setGoals(next);
    reached.forEach((name) => enqueueAlert({ type: 'goal', name }));
  }, [enqueueAlert]);

  // ---- Goal donasi: ambil total real dari donation_logs (private key) ----
  // Event live yang masuk sebelum history selesai dimuat disimpan dulu supaya
  // tidak dobel hitung saat total historis diterapkan.
  const donationLiveSum = useRef(0);
  const donationLiveTx = useRef<Set<string>>(new Set());
  const donationLogsReady = useRef(false);
  const noteDonationLive = useCallback((data: Record<string, unknown>, amount: number) => {
    if (amount <= 0 || donationLogsReady.current) return;
    donationLiveSum.current += amount;
    const tx = donationTxId(data);
    if (tx) donationLiveTx.current.add(tx);
  }, []);

  useEffect(() => {
    if (simulate || demo) return;
    if (!initialGoals.some((goal) => goal.kind === 'donation')) return;

    let cancelled = false;
    const startedAt = new Date().toISOString();
    const cutoffMs = Date.parse(startedAt);
    donationLiveSum.current = 0;
    donationLiveTx.current = new Set();
    donationLogsReady.current = false;

    const applyTotal = (total: number) => {
      if (cancelled) return;
      const real = Math.max(0, Math.floor(total || 0));
      const live = donationLiveSum.current;
      const baselines = new Map(
        initialGoals.filter((goal) => goal.kind === 'donation').map((goal) => [goal.label, goal.current] as const),
      );
      const next = goalsRef.current.map((goal) => {
        if (goal.kind !== 'donation') return goal;
        const base = baselines.get(goal.label) ?? 0;
        return { ...goal, current: Math.max(0, base + real + live) };
      });
      goalsRef.current = next;
      setGoals(next);
      donationLogsReady.current = true;
    };

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
            // Fallback DB lama: jumlahkan log terbaru (maks 50).
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
        // biarkan total null -> pakai nilai awal + donasi live saja
      }

      applyTotal(total ?? 0);
    };

    hydrate();
    return () => { cancelled = true; };
  }, [simulate, demo, privateKey, initialGoals]);

  useEffect(() => loadGoogleFont(font, '400;500;600;700', 'stream-bar-font'), [font]);

  // ---- Socket ----
  useEffect(() => {
    if (simulate || demo) return;
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    const auth = { key: privateKey, privateKey, room };

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', room);
      socket.emit('song-get', auth);
      // Minta durasi live sekali saat connect; setelah itu overlay menghitung
      // sendiri dan hanya di-resync berkala oleh dock.
      socket.emit('stream-time-get', auth);
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('tiktok-roomUser', (data: Record<string, unknown>) => {
      const d = data as { viewerCount?: unknown; totalUser?: unknown; room?: string };
      if (d.room && d.room !== room) return;
      const n = Number(d.viewerCount ?? d.totalUser);
      if (Number.isFinite(n)) {
        setViewerCounts((prev) => ({ ...prev, tiktok: Math.max(0, Math.floor(n)) }));
      }
    });
    socket.on('sb-viewers', (data: Record<string, unknown>) => {
      const d = data as { viewers?: unknown; platform?: unknown; room?: string };
      if (d.room && d.room !== room) return;
      const n = Number(d.viewers);
      if (Number.isFinite(n)) {
        setViewerCounts((prev) => ({ ...prev, [normPlatform(d.platform)]: Math.max(0, Math.floor(n)) }));
      }
    });

    // Durasi live dari dock (GetStreamStatus OBS) → samakan jam overlay.
    socket.on('stream-time', (data: Record<string, unknown>) => {
      const d = data as { room?: string; privateKey?: string; active?: unknown; seconds?: unknown };
      if (d.room && d.room !== room) return;
      const active = d.active !== false && d.active !== 0 && d.active !== '0';
      const seconds = Math.max(0, Math.floor(Number(d.seconds) || 0));
      setDockStartedAt(active ? Date.now() - seconds * 1000 : Date.now());
    });

    socket.on('tiktok-follow', (data: Record<string, unknown>) => {
      const d = data as { nickname?: string; uniqueId?: string; displayType?: string; months?: number; count?: number; viewerCount?: number };
      const name = d.nickname || d.uniqueId || 'Someone';
      const type = String(d.displayType || '').toLowerCase();
      if (isRaidType(type)) {
        enqueueAlert({ type: 'raid', name, viewers: Math.max(0, Number(d.viewerCount || d.count) || 0) });
        return;
      }
      if (isSubType(type)) {
        const months = Math.max(0, Number(d.months) || 0);
        enqueueAlert({ type: 'sub', name, months });
        bumpGoals('subs', Math.max(1, Number(d.count) || 1));
        return;
      }
      enqueueAlert({ type: 'follow', name });
      bumpGoals('follow', 1);
    });

    socket.on('tiktok-gift', (data: Record<string, unknown>) => {
      const d = data as {
        nickname?: string;
        uniqueId?: string;
        displayType?: string;
        giftName?: string;
        repeatCount?: number;
        diamondCount?: number;
        amount?: number;
      };
      const name = d.nickname || d.uniqueId || 'Someone';
      const type = String(d.displayType || '').toLowerCase();
      const giftName = String(d.giftName || 'Gift');
      const count = Math.max(1, Number(d.repeatCount) || 1);

      if (isRaidType(type) || isRaidType(giftName)) {
        enqueueAlert({ type: 'raid', name, viewers: Math.max(0, Number(d.diamondCount) || count) });
        return;
      }
      if (['cheer', 'superchat', 'supersticker', 'tip', 'donation'].some((k) => type.includes(k))) {
        const amount = Math.max(0, Math.floor(Number(d.amount ?? d.diamondCount ?? 0)));
        enqueueAlert({ type: 'donation', name, amount });
        noteDonationLive(data, amount);
        bumpGoals('donation', amount);
        return;
      }
      enqueueAlert({ type: 'gift', name, giftName, count });
    });

    socket.on('donation', (data: Record<string, unknown>) => {
      const d = data as { donorName?: string; nickname?: string; amount?: unknown };
      const amount = Math.max(0, Math.floor(Number(d.amount) || 0));
      enqueueAlert({ type: 'donation', name: d.donorName || d.nickname || 'Donatur', amount });
      noteDonationLive(data, amount);
      bumpGoals('donation', amount);
    });

    socket.on('tiktok-like', (data: Record<string, unknown>) => {
      const d = data as { likeCount?: unknown; count?: unknown };
      bumpGoals('likes', Math.max(1, Number(d.likeCount || d.count) || 1));
    });

    socket.on('song-update', (data: Record<string, unknown>) => {
      const d = data as {
        room?: string;
        queue?: { title?: string; requestedBy?: string; platform?: string; videoId?: string; thumbnail?: string }[];
        currentIndex?: number;
        isPlaying?: boolean;
        position?: number;
        duration?: number;
      };
      if (d.room && d.room !== room) return;
      const queue = Array.isArray(d.queue) ? d.queue : [];
      const index = Math.max(0, Math.min(Number(d.currentIndex) || 0, Math.max(0, queue.length - 1)));
      const current = queue[index];
      if (!current || !d.isPlaying) {
        setSong((prev) => (prev.active ? { ...prev, active: false } : prev));
        return;
      }
      const rawTitle = String(current.title || 'Untitled');
      const split = rawTitle.match(/^(.+?)\s+[-–—]\s+(.+)$/);
      setSong({
        active: true,
        title: split ? split[2].trim() : rawTitle,
        artist: split ? split[1].trim() : current.requestedBy ? `Request by ${current.requestedBy}` : String(current.platform || 'Now playing').toUpperCase(),
        art: songArtFrom(current),
        elapsed: Math.max(0, Number(d.position) || 0),
        total: Math.max(0, Number(d.duration) || 0),
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [privateKey, simulate, demo, enqueueAlert, bumpGoals, noteDonationLive]);

  // ---- Demo / simulate ----
  useEffect(() => {
    if (!demo) return;
    const keys: string[] = STREAM_BAR_ACTIVITY_PRESETS.map((p) => p.value);
    let ai = Math.max(0, keys.indexOf(activityPreset));
    let phase = 0;
    let timer = 0;
    const phases: { ms: number; run: () => void }[] = [
      {
        ms: 8000,
        run: () => {
          setSong((prev) => ({ ...prev, active: false }));
          setGameActive(false);
          setActivityPreset(keys[ai++ % keys.length]);
        },
      },
      {
        ms: 10000,
        run: () => {
          setSong({ active: true, title: 'Lantern Light', artist: 'Night Harbor', art: DEMO_SONG_ART, elapsed: 83, total: 214 });
        },
      },
      {
        ms: 10000,
        run: () => {
          setSong((prev) => ({ ...prev, active: false }));
          setGameActive(true);
        },
      },
    ];
    const run = () => {
      const phaseDef = phases[phase++ % phases.length];
      phaseDef.run();
      timer = window.setTimeout(run, phaseDef.ms);
    };
    run();
    return () => window.clearTimeout(timer);
    // activityPreset sengaja hanya dipakai sebagai nilai awal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  useEffect(() => {
    if (!demo) return;
    const t = window.setInterval(() => {
      setSong((prev) => {
        if (!prev.active || prev.total <= 0) return prev;
        return { ...prev, elapsed: (prev.elapsed + 1) % (prev.total + 1) };
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [demo]);

  useEffect(() => {
    if (!demo) return;
    const samples: (Omit<StreamBarAlert, 'id'>)[] = [
      { type: 'raid', name: 'CozyCorner', viewers: 42 },
      { type: 'follow', name: 'MoonlitFox' },
      { type: 'sub', name: 'PixelPanda', months: 3 },
      { type: 'donation', name: 'KopiHangat', amount: 50000 },
      { type: 'gift', name: 'BintangSenja', giftName: 'Rose', count: 5 },
      { type: 'goal', name: 'Follower goal' },
    ];
    let i = 0;
    let interval = 0;
    const emitSample = () => {
      const sample = samples[i++ % samples.length];
      enqueueAlert(sample);
      if (sample.type === 'follow') bumpGoals('follow', 1);
      else if (sample.type === 'sub') bumpGoals('subs', 1);
      else if (sample.type === 'donation') bumpGoals('donation', sample.amount || 50000);
    };
    const first = window.setTimeout(() => {
      emitSample();
      interval = window.setInterval(emitSample, 25000);
    }, 6000);
    return () => {
      window.clearTimeout(first);
      if (interval) window.clearInterval(interval);
    };
  }, [demo, enqueueAlert, bumpGoals]);

  // Demo: likes nambah terus supaya goal like terlihat hidup.
  useEffect(() => {
    if (!demo) return;
    const t = window.setInterval(() => bumpGoals('likes', 1 + Math.floor(Math.random() * 4)), 3500);
    return () => window.clearInterval(t);
  }, [demo, bumpGoals]);

  useEffect(() => {
    if (!demo) return;
    const t = window.setInterval(() => {
      setViewerCounts((prev) => {
        const base = prev.demo ?? 214;
        return { ...prev, demo: Math.max(25, base + Math.floor(Math.random() * 9) - 4) };
      });
    }, 4000);
    return () => window.clearInterval(t);
  }, [demo]);

  const Theme = streamBarThemeComponents[theme] || streamBarThemeComponents.standard;

  return (
    <>
      {obsMode && (
        <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />
      )}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap'); html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; }`}</style>
      <div
        id="stream-bar-display-root"
        className={obsMode ? 'fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex' : 'w-full min-h-screen bg-[#0a0a0a] flex p-4'}
        style={{ ...posStyle, background: obsMode ? 'transparent' : '#0a0a0a', fontFamily: `'${font}', sans-serif` } as CSSProperties}
      >
        {!obsMode && (
          <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">
            STREAM BAR • {theme} • {demo ? 'demo' : simulate ? 'simulate' : connected ? 'connected' : 'offline'} • {viewers} viewers
          </div>
        )}
        <AutoScale defaultBase={2576} baseWidth={2576}>
          <Theme
            font={font}
            accent={accent}
            streamStartedAt={streamStartedAt}
            viewers={viewers}
            activityPreset={activityPreset}
            activityTitle={activityTitle}
            activitySub={activitySub}
            activityImage={activityImage}
            songActive={song.active}
            songTitle={song.title}
            songArtist={song.artist}
            songArt={song.art}
            songElapsed={song.elapsed}
            songTotal={song.total}
            gameActive={gameActive}
            gameName={gameName}
            gameGenre={gameGenre}
            gameCover={gameCover}
            welcomeLabel={welcomeLabel}
            welcomeTitle={welcomeTitle}
            welcomeSub={welcomeSub}
            rules={rules}
            alert={alertState}
            alertMs={alertMs}
            goals={goals}
            goalStyle={goalStyle}
            goalRotateMs={goalRotateMs}
          />
        </AutoScale>
      </div>
    </>
  );
}

export default function StreamBarDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading stream bar…</div>}>
      <StreamBarInner />
    </Suspense>
  );
}
