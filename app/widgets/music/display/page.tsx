'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import { AutoScale } from '../../_shared/components/AutoScale';
import {
  ClassicTheme,
  MatteTheme,
  MatteDarkTheme,
  CompactTheme,
  CompactInvertedTheme,
  SimpleTheme,
  CardTheme,
  VinylTheme,
} from '../../media-player/themes';

type SongKind = 'youtube' | 'audio';

function ytThumb(videoId?: string): string | null {
  if (!videoId) return null;
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

function QueueRotator({ queue, currentIndex, accent, showQueue, maxQueue, className }: {
  queue: Song[];
  currentIndex: number;
  accent: string;
  showQueue: boolean;
  maxQueue: number;
  className?: string;
}) {
  // Urutan putar: semua kecuali yang sedang main, mulai dari setelah current.
  const upcoming = (() => {
    if (queue.length <= 1) return [];
    const after = queue.slice(currentIndex + 1);
    const before = queue.slice(0, currentIndex);
    // current sendiri dilewati; kalau currentIndex di tengah, before = lagu yang sudah lewat → taruh belakang
    const ordered = [...after, ...before].filter((s) => s.id !== queue[Math.min(currentIndex, queue.length - 1)]?.id);
    return ordered.slice(0, Math.max(1, maxQueue));
  })();

  const [rotIdx, setRotIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);
  // Crossfade BG: simpan thumb sebelumnya sebagai overlay yang fade-out
  // di atas BG baru, jadi pergantian album terasa smooth.
  const [bgPrev, setBgPrev] = useState<string | null>(null);
  const prevThumbRef = useRef<string | null>(null);

  // Reset bila queue berubah (lagu habis / reorder) agar tidak out-of-bounds.
  useEffect(() => {
    setRotIdx(0);
    setLeaving(false);
  }, [queue.map((s) => s.id).join(','), currentIndex]);

  // Siklus: tampil (fade up) → tahan → fade down → next.
  useEffect(() => {
    if (upcoming.length <= 1) return;
    const HOLD_MS = 2600;
    const OUT_MS = 450;
    const hold = setTimeout(() => setLeaving(true), HOLD_MS);
    const next = setTimeout(() => {
      setRotIdx((i) => (i + 1) % upcoming.length);
      setLeaving(false);
    }, HOLD_MS + OUT_MS);
    return () => {
      clearTimeout(hold);
      clearTimeout(next);
    };
  }, [rotIdx, upcoming.length, queue.map((s) => s.id).join(','), currentIndex]);

  const item = upcoming[Math.min(rotIdx, upcoming.length - 1)];
  // Nomor antrian asli (1-based) biar konsisten dengan dock.
  const origIdx = item ? queue.findIndex((s) => s.id === item.id) : -1;
  const thumb = item ? ytThumb(item.videoId) : null;

  // BG crossfade: tiap thumb berubah, overlay BG lama di-fade-out di atas BG baru.
  useEffect(() => {
    const t = thumb ?? null;
    const p = prevThumbRef.current;
    if (p === t) return;
    prevThumbRef.current = t;
    if (p) {
      setBgPrev(p);
      const timer = setTimeout(() => setBgPrev(null), 650);
      return () => clearTimeout(timer);
    }
    setBgPrev(null);
  }, [thumb]);

  if (!showQueue || upcoming.length === 0 || !item) return null;

  const bgOf = (th: string | null) =>
    th
      ? { background: `linear-gradient(0deg, rgba(0,0,0,0.82), rgba(0,0,0,0.82)), url('${th}') center/cover` }
      : { background: 'rgba(0,0,0,0.7)' };

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border-0 px-3 py-2 ${className || ''}`}
      style={{ ...bgOf(thumb), boxShadow: 'none', filter: 'none' }}
    >
      {bgPrev && bgPrev !== thumb && (
        <div key={bgPrev} className="absolute inset-0 queue-bg-fadeout" style={{ ...bgOf(bgPrev), boxShadow: 'none' }} />
      )}
      <div className="relative">
      <div className="text-[8px] font-black uppercase tracking-widest text-white/40">
        Up Next ({queue.length - 1})
      </div>
      <div
        key={item.id}
        className={`flex items-center gap-2 min-w-0 mt-1 pointer-events-none select-none ${leaving ? 'queue-fade-down' : 'queue-fade-up'}`}
      >
        <span className="text-[10px] font-mono shrink-0 tabular-nums" style={{ color: accent }}>
          {origIdx >= 0 ? String(origIdx + 1).padStart(2, '0') : '•'}
        </span>
        {thumb ? (
          <img src={thumb} alt="" className="w-8 h-[18px] rounded object-cover shrink-0" loading="lazy" />
        ) : null}
        <span className="text-[12px] truncate flex-1 text-white font-black">{item.title}</span>
        {item.requestedBy && <span className="text-white/35 text-[10px] truncate shrink-0 max-w-[100px]">{item.requestedBy}</span>}
      </div>
      </div>
    </div>
  );
}

type Song = {
  id: string;
  url: string;
  videoId?: string;
  kind: SongKind;
  title: string;
  requestedBy?: string;
  platform?: string;
  addedAt?: number;
};

type SongUpdate = {
  room: string;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  reporterId?: string | null;
  // Nomor urut perintah lompat posisi dari server. Display HANYA seek
  // saat angka ini berubah; laporan progres rutin (tiap detik) diabaikan
  // agar lagu tidak restart/mundur sendiri.
  seekSeq?: number;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          width?: string | number;
          height?: string | number;
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
            onError?: () => void;
          };
        },
      ) => YTPlayer;
      PlayerState?: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayer = {
  loadVideoById: (id: string, startSeconds?: number) => void;
  cueVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (s: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  mute: () => void;
  unMute: () => void;
  setVolume: (v: number) => void;
  destroy?: () => void;
};

const YT_SCRIPT = 'https://www.youtube.com/iframe_api';
let ytScriptLoading: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytScriptLoading) return ytScriptLoading;
  ytScriptLoading = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    // Fallback kalau callback tidak terpanggil — polling YT.Player
    const poll = setInterval(() => {
      if (window.YT?.Player) {
        clearInterval(poll);
        resolve();
      }
    }, 300);
    setTimeout(() => {
      clearInterval(poll);
      resolve();
    }, 15000);
    if (!document.querySelector(`script[src="${YT_SCRIPT}"]`)) {
      const tag = document.createElement('script');
      tag.src = YT_SCRIPT;
      document.head.appendChild(tag);
    }
  });
  return ytScriptLoading;
}

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function MusicInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', getStringParam(params, 'room', '')));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const fontSize = getIntParam(params, 'fontSize', 16);
  const accent = getStringParam(params, 'accent', '#22c55e');
  const showQueue = getBoolParam(params, 'showQueue', true);
  const maxQueue = Math.max(1, Math.min(10, getIntParam(params, 'maxQueue', 5)));
  const showProgress = getBoolParam(params, 'showProgress', true);
  const queuePos: string = getStringParam(params, 'queuePos', 'bottom');
  // Param shell ala media-player (biar tema port tampil persis)
  const maxWidth = getIntParam(params, 'maxWidth', 500);
  const verticalAlignment = getStringParam(params, 'verticalAlignment', 'align-to-center');
  const textAlignment = getStringParam(params, 'textAlignment', 'left');
  const useCustomColors = getBoolParam(params, 'useCustomColors', false);
  const color1 = getStringParam(params, 'color1', '#ffffff');
  const color2 = getStringParam(params, 'color2', '#1d1d1d');
  const autoHide = getBoolParam(params, 'autoHide', false);
  const showWhilePaused = getBoolParam(params, 'showWhilePaused', true);
  const swapArtistTrack = getBoolParam(params, 'swapArtistTrack', false);
  const showPrimary = getBoolParam(params, 'showPrimary', true);
  const showSecondary = getBoolParam(params, 'showSecondary', true);
  const displayDuration = getIntParam(params, 'displayDuration', 5);
  const showAnimation = getStringParam(params, 'showAnimation', 'slide-in-from-bottom');
  const hideAnimation = getStringParam(params, 'hideAnimation', 'slide-out-bottom');
  // ?muted=1 → tab ini bisu permanen dan TIDAK pernah jadi reporter.
  // Pakai untuk preview browser agar tidak rebutan posisi dengan OBS.
  const forceMuted = getBoolParam(params, 'muted', false) || getBoolParam(params, 'mute', false);
  const qpRow = queuePos === 'left' || queuePos === 'right';
  const qpFirst = queuePos === 'top' || queuePos === 'left';
  const qpLast = queuePos === 'bottom' || queuePos === 'right';
  const qpNarrow = queuePos === 'left' || queuePos === 'right' ? 'w-[240px]' : undefined;
  const pos = getStringParam(params, 'pos', 'bl');
  const posStyle = getPositionStyle(pos);

  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [connected, setConnected] = useState(false);
  const [visible, setVisible] = useState(true);
  const [animClass, setAnimClass] = useState<string>(showAnimation);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Identitas tab ini — server hanya menerima laporan progres dari SATU reporter
  // agar banyak tab/OBS source tidak saling menimpa posisi. Semua tab tetap
  // memutar audio masing-masing (biar kedengaran di tiap tempat), dan semua
  // tab mengikuti seek dari dock.
  const [clientId] = useState(() => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
  const clientIdRef = useRef(clientId);
  const [reporterId, setReporterId] = useState<string | null>(null);
  const isLeader = !reporterId || reporterId === clientId;
  // Cermin untuk dibaca dari callback/interval (tanpa akses ref saat render).
  const leaderRef = useRef(true);
  useEffect(() => { leaderRef.current = isLeader; }, [isLeader]);

  // Deteksi audio diblokir browser (autoplay policy) — tampilkan tombol suara.
  const [audioBlocked, setAudioBlocked] = useState(false);
  const blockedRef = useRef(false);
  const lastAdvanceRef = useRef({ pos: -1, at: 0 });
  const markBlocked = () => {
    if (!blockedRef.current) {
      blockedRef.current = true;
      setAudioBlocked(true);
    }
  };

  // Gesture pengguna membuka suara permanen (per load halaman).
  // Sebelum ada gesture: tab browser memutar BISU (diizinkan policy) agar
  // progres tetap jalan & sync; OBS (obs=1) langsung coba bersuara.
  const [unblocked, setUnblocked] = useState(false);
  const unblockedRef = useRef(false);

  // Late-joiner (pindah scene / buka tab belakangan): kejar posisi server
  // saat lagu dimuat, agar semua tema/scene langsung sync.
  const pendingSeekRef = useRef(0);
  // Perintah seek terakhir dari server yang sudah diikuti.
  // Laporan progres rutin tanpa seekSeq baru WAJIB diabaikan.
  const lastSeekSeqRef = useRef<number | null>(null);
  // URL audio yang sudah dimuat — bandingkan via ref, bukan a.src
  // (a.src ternormalisasi browser sehingga perbandingan string gagal).
  // Disimpan per lagu (id+url) agar request URL yang sama 2x tetap restart.
  const lastAudioUrlRef = useRef('');
  const lastAudioIdRef = useRef('');

  // visibility ala media-player: autoHide setelah displayDuration
  const setVisibility = (v: boolean) => {
    if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null; }
    if (v) {
      setAnimClass(showAnimation);
      setVisible(true);
      if (autoHide) {
        hideTimeoutRef.current = setTimeout(() => setVisibility(false), displayDuration * 1000);
      }
    } else {
      setAnimClass(hideAnimation);
      setTimeout(() => setVisible(false), 500);
    }
  };

  useEffect(() => () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  }, []);

  const socketRef = useRef<Socket | null>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const ytReadyRef = useRef(false);
  const lastVideoRef = useRef('');
  const ytHostRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const liveRef = useRef({ isPlaying: false, currentId: '', position: 0, duration: 0 });
  liveRef.current.isPlaying = isPlaying;

  useEffect(() => loadGoogleFont(font, '400;700;900', 'music-font'), [font]);

  // --- Mode simulate: data demo lokal, progress jalan tanpa socket ---
  useEffect(() => {
    if (!simulate) return;
    const demo: Song[] = [
      { id: 'demo1', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', videoId: 'dQw4w9WgXcQ', kind: 'youtube', title: 'Demo Song — Never Gonna Give You Up', requestedBy: 'Penonton_A', platform: 'tiktok', addedAt: Date.now() },
      { id: 'demo2', url: 'https://example.com/demo.mp3', kind: 'audio', title: 'Demo Track Berikutnya (MP3)', requestedBy: 'Penonton_B', platform: 'youtube', addedAt: Date.now() },
    ];
    setQueue(demo);
    setCurrentIndex(0);
    setIsPlaying(true);
    setPosition(0);
    setDuration(214);
    const id = setInterval(() => {
      setPosition((p) => {
        if (p + 1 >= 214) {
          setCurrentIndex((ci) => (ci + 1) % demo.length);
          return 0;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [simulate]);

  // --- Socket: terima song-update ---
  useEffect(() => {
    if (simulate) return;
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    const room = privateKey || 'global';
    const auth = { key: privateKey, privateKey, room };
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', room);
      socket.emit('song-get', auth);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('song-update', (data: SongUpdate & { room?: string }) => {
      // Backend broadcast global — hanya terima update milik room sendiri
      // agar queue tidak tertukar antar streamer / tidak kosong karena room lain.
      if (data && data.room && data.room !== room) return;
      if (typeof data.reporterId === 'string' || data.reporterId === null || data.reporterId === undefined) {
        setReporterId(data.reporterId ?? null);
      }
      const q = Array.isArray(data.queue) ? data.queue : [];
      setQueue(q);
      const idx = Math.max(0, Math.min(typeof data.currentIndex === 'number' ? data.currentIndex : 0, Math.max(0, q.length - 1)));
      setCurrentIndex(q.length ? idx : 0);
      setIsPlaying(!!data.isPlaying);
      const cur = q[idx];
      const prevId = liveRef.current.currentId;
      const incomingSeq = typeof (data as SongUpdate).seekSeq === 'number' ? (data as SongUpdate).seekSeq as number : null;
      if (cur && cur.id !== prevId) {
        liveRef.current.currentId = cur.id;
        setPosition(typeof data.position === 'number' ? data.position : 0);
        // Ingat posisi server — player yang baru dimuat langsung kejar ke sini
        // (penting saat pindah scene / tab dibuka belakangan).
        pendingSeekRef.current = typeof data.position === 'number' && data.position > 2 ? data.position : 0;
        if (incomingSeq !== null) lastSeekSeqRef.current = incomingSeq;
        setVisibility(true);
      } else if (incomingSeq !== null && lastSeekSeqRef.current !== null && incomingSeq !== lastSeekSeqRef.current) {
        // PERINTAH SEEK eksplisit dari dock (seek/choose/next/prev) — semua tab wajib ikut.
        lastSeekSeqRef.current = incomingSeq;
        const target = typeof data.position === 'number' ? data.position : 0;
        const a = audioRef.current;
        if (cur?.kind === 'audio' && a) {
          try {
            if (lastAudioIdRef.current !== cur.id || lastAudioUrlRef.current !== (cur.url || '')) {
              lastAudioIdRef.current = cur.id;
              lastAudioUrlRef.current = cur.url || '';
              a.src = cur.url || '';
            }
            a.currentTime = target;
          } catch { /* abaikan */ }
        }
        const yt = ytPlayerRef.current;
        if (cur?.kind === 'youtube' && yt && ytReadyRef.current) {
          try { yt.seekTo(target, true); } catch { /* abaikan */ }
        } else if (cur?.kind === 'youtube') {
          pendingSeekRef.current = target;
        }
        setPosition(target);
      } else if (incomingSeq !== null && lastSeekSeqRef.current === null) {
        // Sinkronisasi awal (tab baru join, lagu sama): catat seq tanpa seek
        // agar tidak lompat; posisi lokal dari player yang berjalan.
        lastSeekSeqRef.current = incomingSeq;
      }
      // Catatan: laporan progres rutin (tiap detik dari reporter) SENGAJA tidak
      // menggeser posisi player. Dulu kode seek saat selisih >3 detik → lagu
      // mental balik/restart sendiri tiap ada request baru atau saat dua tab
      // (OBS + preview) rebutan reporter. Sync = lagu yang sama, bukan ms sama.
      if (typeof data.duration === 'number' && data.duration > 0) setDuration(data.duration);
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [privateKey, simulate]);

  // Display murni penampil: satu-satunya kontrol yang dikirim adalah 'next'
  // otomatis saat lagu selesai (disertai songId agar server bisa dedup bila
  // banyak tab melapor bersamaan). Kontrol lain (seek/play/pause) hanya dari dock.
  const emitEnded = () => {
    const s = socketRef.current;
    if (!s || simulate) return;
    const room = privateKey || 'global';
    s.emit('song-control', {
      key: privateKey,
      privateKey,
      room,
      clientId: clientIdRef.current,
      action: 'next',
      songId: liveRef.current.currentId,
    });
  };

  const current: Song | null = queue.length ? queue[Math.min(currentIndex, queue.length - 1)] : null;
  const curId = current?.id || '';
  const curKind = current?.kind || 'youtube';
  const curVideoId = current?.videoId || '';
  const curUrl = current?.url || '';

  // --- YT IFrame API: load sekali ---
  useEffect(() => {
    if (simulate) return;
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !window.YT?.Player || !ytHostRef.current || ytPlayerRef.current) return;
      try {
        ytPlayerRef.current = new window.YT.Player(ytHostRef.current, {
          width: 2,
          height: 2,
          playerVars: { autoplay: 0, controls: 0 },
          events: {
            onReady: () => { ytReadyRef.current = true; },
            onStateChange: (e) => {
              const ended = window.YT?.PlayerState?.ENDED ?? 0;
              if (e.data === ended) emitEnded();
            },
            onError: () => { markBlocked(); },
          },
        });
      } catch { /* player gagal dibuat — audio tetap jalan */ }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulate]);

  // --- Sinkron player mengikuti current + isPlaying (semua tab bunyi) ---
  useEffect(() => {
    if (simulate || !current) return;
    if (curKind === 'youtube') {
      let cancelled = false;
      loadYouTubeAPI().then(() => {
        if (cancelled || !window.YT?.Player) return;
        // Buat player susulan kalau efek init belum sempat (race)
        if (!ytPlayerRef.current && ytHostRef.current) {
          try {
            ytPlayerRef.current = new window.YT.Player(ytHostRef.current, {
              width: 2,
              height: 2,
              playerVars: { autoplay: 1, controls: 0 },
              events: {
                onReady: () => { ytReadyRef.current = true; },
                onStateChange: (e) => {
                  const ended = window.YT?.PlayerState?.ENDED ?? 0;
                  if (e.data === ended) emitEnded();
                },
                onError: () => { markBlocked(); },
              },
            });
          } catch { return; }
        }
        const yt = ytPlayerRef.current;
        if (!yt) return;
        const apply = () => {
          if (cancelled) return;
          try {
            // Suara diizinkan: OBS langsung, tab browser setelah ada gesture.
            // Sebelum itu putar bisu (diizinkan policy) agar progres tetap jalan & sync.
            // ?muted=1 selalu bisu (preview pendamping OBS).
            const allowSound = !forceMuted && (obsMode || unblockedRef.current);
            // Muat ulang HANYA bila lagu berganti (id beda, bukan videoId —
            // request URL/video yang sama 2x tetap reload dari awal).
            // Resume / play-pause cukup play/pause tanpa reload.
            if (lastVideoRef.current !== curId) {
              lastVideoRef.current = curId || '';
              if (curVideoId) yt.loadVideoById(curVideoId);
              // Kejar posisi server (pindah scene / tab dibuka belakangan)
              const ps = pendingSeekRef.current;
              if (ps > 0) {
                try { yt.seekTo(ps, true); } catch { /* poll akan retry */ }
              }
            }
            if (!allowSound) { try { yt.mute(); } catch { /* abaikan */ } }
            else { try { yt.unMute(); yt.setVolume(100); } catch { /* abaikan */ } }
            if (liveRef.current.isPlaying) yt.playVideo();
            else yt.pauseVideo();
          } catch { /* coba lagi tick berikut */ }
        };
        if (ytReadyRef.current) apply();
        else {
          const t = setTimeout(apply, 800);
          return () => clearTimeout(t);
        }
      });
      return () => { cancelled = true; };
    } else {
      const a = audioRef.current;
      if (!a) return;
      // Reload bila GANTI LAGU (id beda) walaupun URL-nya sama (request duplikat),
      // atau URL-nya memang beda. Bandingkan via ref — a.src ternormalisasi
      // browser (absolute URL) sehingga `a.src !== curUrl` selalu true dan
      // lagu restart dari 0 setiap render.
      if (lastAudioIdRef.current !== curId || lastAudioUrlRef.current !== curUrl) {
        lastAudioIdRef.current = curId;
        lastAudioUrlRef.current = curUrl;
        a.src = curUrl;
      }
      a.volume = 1;
      a.muted = forceMuted ? true : !(obsMode || unblockedRef.current);
      if (liveRef.current.isPlaying) {
        a.play().catch((err) => {
          // Browser memblokir autoplay tanpa gesture — putar bisu dulu
          // agar progres tetap sync, suara dibuka saat ada klik.
          if (err?.name === 'NotAllowedError') {
            markBlocked();
            try { a.muted = true; a.play().catch(() => {}); } catch { /* abaikan */ }
          }
        });
      } else a.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curId, curKind, curVideoId, curUrl, isPlaying, simulate, forceMuted]);

  // --- Poll posisi media (UI) + deteksi audio macet/diblokir ---
  useEffect(() => {
    if (simulate) return;
    const id = setInterval(() => {
      const cur = liveRef.current;
      // Deteksi macet: seharusnya jalan tapi posisi tidak maju >6 detik
      // (autoplay diblokir / stream gagal) → tampilkan tombol suara.
      if (cur.isPlaying) {
        if (Math.abs(cur.position - lastAdvanceRef.current.pos) > 0.01) {
          lastAdvanceRef.current = { pos: cur.position, at: Date.now() };
          if (blockedRef.current) {
            blockedRef.current = false;
            setAudioBlocked(false);
          }
        } else if (Date.now() - lastAdvanceRef.current.at > 6000) {
          markBlocked();
          // Kemungkinan autoplay diblokir — putar bisu dulu agar progres
          // tetap jalan & sync antar scene, suara dibuka saat ada klik.
          if (!unblockedRef.current) {
            try {
              const song = queue[Math.min(currentIndex, queue.length - 1)];
              if (song?.kind === 'youtube' && ytReadyRef.current && ytPlayerRef.current) {
                ytPlayerRef.current.mute();
                ytPlayerRef.current.playVideo();
              } else if (song?.kind === 'audio' && audioRef.current) {
                audioRef.current.muted = true;
                audioRef.current.play().catch(() => {});
              }
            } catch { /* abaikan */ }
          }
        }
      } else {
        lastAdvanceRef.current = { pos: cur.position, at: Date.now() };
      }
      if (!cur.isPlaying) return;
      const song = queue[Math.min(currentIndex, queue.length - 1)];
      if (!song) return;
      // Retry kejar posisi server bila apply() sebelumnya belum siap
      if (pendingSeekRef.current > 0) {
        const ps = pendingSeekRef.current;
        try {
          if (song.kind === 'audio' && audioRef.current && isFinite(audioRef.current.duration)) {
            audioRef.current.currentTime = ps;
            pendingSeekRef.current = 0;
          } else if (song.kind === 'youtube' && ytPlayerRef.current && ytReadyRef.current) {
            ytPlayerRef.current.seekTo(ps, true);
            pendingSeekRef.current = 0;
          }
        } catch { /* coba lagi tick berikut */ }
      }
      if (song.kind === 'audio' && audioRef.current) {
        const a = audioRef.current;
        if (isFinite(a.currentTime)) {
          setPosition(a.currentTime);
          liveRef.current.position = a.currentTime;
        }
        if (isFinite(a.duration) && a.duration > 0) {
          setDuration(a.duration);
          liveRef.current.duration = a.duration;
        }
      } else if (song.kind === 'youtube' && ytPlayerRef.current && ytReadyRef.current) {
        try {
          const t = ytPlayerRef.current.getCurrentTime();
          const d = ytPlayerRef.current.getDuration();
          if (isFinite(t)) {
            setPosition(t);
            liveRef.current.position = t;
          }
          if (isFinite(d) && d > 0) {
            setDuration(d);
            liveRef.current.duration = d;
          }
        } catch { /* player belum siap */ }
      }
    }, 500);
    return () => clearInterval(id);
  }, [simulate, queue, currentIndex]);

  // --- Lapor progress ke server tiap 1 detik (hanya reporter) ---
  useEffect(() => {
    if (simulate || forceMuted) return;
    const id = setInterval(() => {
      const s = socketRef.current;
      if (!s || !liveRef.current.isPlaying) return;
      if (!leaderRef.current) return;
      const room = privateKey || 'global';
      s.emit('song-progress', {
        key: privateKey,
        privateKey,
        room,
        clientId: clientIdRef.current,
        position: liveRef.current.position,
        duration: liveRef.current.duration,
        isPlaying: true,
      });
    }, 1000);
    return () => clearInterval(id);
  }, [privateKey, simulate, reporterId, forceMuted]);

  const fontFamily = `'${font}', sans-serif`;  const pct = duration > 0 ? Math.max(0, Math.min(100, (position / duration) * 100)) : 0;

  const msToTime = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  // Adapter: state lagu → props tema media-player (dipakai ulang langsung)
  const curThumb = ytThumb(current?.videoId);
  const alignmentCls = verticalAlignment === 'align-to-top' ? 'items-start' : verticalAlignment === 'align-to-bottom' ? 'items-end' : 'items-center';
  const textAlignCls = textAlignment === 'center' ? 'text-center' : textAlignment === 'right' ? 'text-right' : 'text-left';
  const resolvedBg = useCustomColors ? color2 : '#000000';
  const resolvedAccent = useCustomColors ? color1 : accent;
  const resolvedText = useCustomColors ? color1 : '#ffffff';
  const primaryText = swapArtistTrack ? (current?.requestedBy || '') : (current?.title || '');
  const secondaryText = swapArtistTrack ? (current?.title || '') : (current?.requestedBy || '');
  const mediaProps = {
    track: primaryText,
    artist: secondaryText,
    art: curThumb || '',
    bgArt: curThumb || '',
    palette: {
      Vibrant: resolvedAccent,
      Muted: resolvedAccent,
      DarkVibrant: resolvedAccent,
      DarkMuted: resolvedBg,
      LightVibrant: resolvedAccent,
      LightMuted: resolvedAccent,
    },
    accent: resolvedAccent,
    bgColor: resolvedBg,
    textColor: resolvedText,
    progressPercent: pct,
    currentPos: Math.round(position * 1000),
    timeline: duration > 0
      ? {
          Position: Math.round(position * 1000),
          EndTime: Math.round(duration * 1000),
          LastUpdatedTime: new Date().toISOString(),
        }
      : null,
    showAlbumArt: !!curThumb,
    showProgressBar: showProgress,
    showPrimary,
    showSecondary,
    isPausedOverlay: !isPlaying,
    playbackStatus: isPlaying ? 4 : 5,
    textAlignCls,
    msToTime,
    error: null,
    smtcBridgeAddress: '',
    smtcBridgePort: '',
    obsMode,
  };

  const wrapperVisible = visible || !autoHide || showWhilePaused;
  const themeWrapper = `theme-${theme}`;

  // Klik/sentuhan pengguna = gesture yang membuka blokir autoplay browser.
  // Dipanggil dari tombol suara maupun listener global (klik di mana saja).
  const unblockAudio = () => {
    if (forceMuted) return; // preview muted permanen — jangan pernah buka suara
    unblockedRef.current = true;
    setUnblocked(true);
    blockedRef.current = false;
    setAudioBlocked(false);
    lastAdvanceRef.current = { pos: liveRef.current.position, at: Date.now() };
    pendingSeekRef.current = 0;
    let ytDone = false;
    const tryPlay = () => {
      try {
        const a = audioRef.current;
        if (a && current?.kind === 'audio') {
          if (lastAudioIdRef.current !== curId || lastAudioUrlRef.current !== curUrl) {
            lastAudioIdRef.current = curId;
            lastAudioUrlRef.current = curUrl;
            a.src = curUrl;
          }
          a.muted = false;
          a.volume = 1;
          a.play().catch(() => { /* tetap diblokir — tombol muncul lagi */ });
        }
      } catch { /* abaikan */ }
      try {
        if (current?.kind === 'youtube' && ytReadyRef.current && ytPlayerRef.current) {
          if (lastVideoRef.current !== curId && curVideoId) {
            lastVideoRef.current = curId;
            ytPlayerRef.current.loadVideoById(curVideoId);
          }
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(100);
          ytPlayerRef.current.playVideo();
          ytDone = true;
        }
      } catch { /* abaikan */ }
    };
    tryPlay();
    // Player YouTube kadang belum siap saat diklik — coba lagi sampai siap (maks 10 detik).
    if (current?.kind === 'youtube' && !ytDone) {
      const t = setInterval(() => {
        tryPlay();
        if (ytDone) clearInterval(t);
      }, 500);
      setTimeout(() => clearInterval(t), 10000);
    }
  };

  // Cermin stabil untuk listener global (daftar sekali, selalu panggil versi terbaru).
  const unblockRef = useRef(unblockAudio);
  useEffect(() => { unblockRef.current = unblockAudio; });

  // Gesture pertama di mana saja langsung buka suara — ala widget donasi.
  useEffect(() => {
    if (simulate) return;
    const h = () => {
      if (!unblockedRef.current) unblockRef.current();
    };
    window.addEventListener('pointerdown', h);
    window.addEventListener('keydown', h);
    window.addEventListener('touchstart', h);
    return () => {
      window.removeEventListener('pointerdown', h);
      window.removeEventListener('keydown', h);
      window.removeEventListener('touchstart', h);
    };
  }, [simulate]);

  // Force html/body transparent saat obs=1 (seperti media-player)
  useEffect(() => {
    if (!obsMode) return;
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    return () => { document.documentElement.style.background = ''; document.body.style.background = ''; };
  }, [obsMode]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent" style={{ fontFamily }}>
      {obsMode && <style>{`html,body{background:transparent !important;--background:transparent !important}`}</style>}
      <style>{`.music-eq { display: inline-flex; align-items: flex-end; gap: 2px; height: 14px; }
        .music-eq span { width: 3px; border-radius: 1px; animation: musicEq 0.9s ease-in-out infinite; }
        .music-eq span:nth-child(2) { animation-delay: 0.2s; }
        .music-eq span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes musicEq { 0%, 100% { height: 4px; opacity: 0.6; } 50% { height: 14px; opacity: 1; } }
        #music-player-root { --accent: ${resolvedAccent}; --bg: ${resolvedBg}; --text: ${resolvedText}; }
        .marquee-track { display:block; overflow:hidden; white-space:nowrap; position:relative; }
        .marquee-content { display:inline-block; padding-right: 24px; animation: marquee 10s linear infinite; }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes fade-out { from{opacity:1} to{opacity:0} }
        @keyframes slide-in-from-top { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slide-in-from-bottom { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slide-in-from-left { from{transform:translateX(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slide-in-from-right { from{transform:translateX(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slide-out-top { to{transform:translateY(-20px);opacity:0} }
        @keyframes slide-out-bottom { to{transform:translateY(20px);opacity:0} }
        @keyframes slide-out-left { to{transform:translateX(-20px);opacity:0} }
        @keyframes slide-out-right { to{transform:translateX(20px);opacity:0} }
        @keyframes queue-fade-up { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes queue-fade-down { from{transform:translateY(0);opacity:1} to{transform:translateY(12px);opacity:0} }
        @keyframes queue-bg-fadeout { from{opacity:1} to{opacity:0} }
        .queue-fade-up { animation: queue-fade-up 0.5s ease forwards }
        .queue-fade-down { animation: queue-fade-down 0.45s ease forwards }
        .queue-bg-fadeout { animation: queue-bg-fadeout 0.6s ease forwards }
        .anim-fade-in { animation: fade-in 0.5s ease forwards }
        .anim-fade-out { animation: fade-out 0.5s ease forwards }
        .anim-slide-in-from-top { animation: slide-in-from-top 0.5s ease forwards }
        .anim-slide-in-from-bottom { animation: slide-in-from-bottom 0.5s ease forwards }
        .anim-slide-in-from-left { animation: slide-in-from-left 0.5s ease forwards }
        .anim-slide-in-from-right { animation: slide-in-from-right 0.5s ease forwards }
        .anim-slide-out-top { animation: slide-out-top 0.5s ease forwards }
        .anim-slide-out-bottom { animation: slide-out-bottom 0.5s ease forwards }
        .anim-slide-out-left { animation: slide-out-left 0.5s ease forwards }
        .anim-slide-out-right { animation: slide-out-right 0.5s ease forwards }`}</style>
      {/* Player tersembunyi 2x2px (YouTube) + audio */}
      <div ref={ytHostRef} style={{ width: 2, height: 2, position: 'absolute', bottom: 0, right: 0, opacity: 0, pointerEvents: 'none' }} />
      <audio
        ref={audioRef}
        onEnded={() => emitEnded()}
        onError={() => { markBlocked(); }}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (isFinite(d) && d > 0) {
            setDuration(d);
            liveRef.current.duration = d;
          }
          // Langsung kejar posisi server (pindah scene / tab telat dibuka)
          if (pendingSeekRef.current > 0) {
            try { e.currentTarget.currentTime = pendingSeekRef.current; } catch { /* abaikan */ }
            pendingSeekRef.current = 0;
          }
        }}
      />
      {/* Browser memblokir suara autoplay — klik untuk membuka.
          Disembunyikan di mode OBS agar tidak bocor ke stream. */}
      {!simulate && !obsMode && current && (audioBlocked || (isPlaying && !unblocked)) && (
        <button
          onClick={unblockAudio}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-yellow-400 text-black text-[11px] font-black uppercase tracking-widest rounded-full shadow-2xl hover:bg-yellow-300 cursor-pointer"
        >
          🔊 Klik untuk mengaktifkan suara
        </button>
      )}
      <div id="music-player-root" className={`w-full h-full flex p-4 ${alignmentCls} ${themeWrapper}`} style={{ ...posStyle, background: obsMode ? 'transparent' : undefined } as React.CSSProperties}>
        {current ? (
          <AutoScale defaultBase={500} baseWidth={maxWidth > 0 ? maxWidth : theme === 'minimal' ? 420 : 340}>
          <div className={`${qpRow ? 'flex flex-row items-start gap-2' : 'flex flex-col gap-2'} relative w-full overflow-hidden ${wrapperVisible ? '' : 'opacity-0 pointer-events-none'} ${'anim-' + animClass} theme-${theme}`}>
          {qpFirst && (
            <QueueRotator queue={queue} currentIndex={currentIndex} accent={accent} showQueue={showQueue && theme !== 'minimal'} maxQueue={maxQueue} className={qpNarrow} />
          )}
          {theme === 'minimal' ? (
            <div className="max-w-[420px]">
              <div className="flex items-center gap-2">
                {isPlaying && (
                  <span className="music-eq shrink-0">
                    <span style={{ background: accent }} />
                    <span style={{ background: accent }} />
                    <span style={{ background: accent }} />
                  </span>
                )}
                <div className="text-white font-black truncate leading-tight" style={{ fontSize }}>
                  {current.title}
                </div>
              </div>
              {current.requestedBy && (
                <div className="text-white/50 text-[11px] font-bold truncate mt-0.5">req. {current.requestedBy}</div>
              )}
              {showProgress && (
                <div className="mt-1.5 h-[3px] rounded-full bg-white/15 overflow-hidden w-48 max-w-full">
                  <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: accent }} />
                </div>
              )}
            </div>
          ) : theme === 'classic' ? (
            <ClassicTheme {...mediaProps} />
          ) : theme === 'matte' ? (
            <MatteTheme {...mediaProps} />
          ) : theme === 'mattedark' ? (
            <MatteDarkTheme {...mediaProps} />
          ) : theme === 'compact' ? (
            <CompactTheme {...mediaProps} />
          ) : theme === 'compactinverted' ? (
            <CompactInvertedTheme {...mediaProps} />
          ) : theme === 'simple' ? (
            <SimpleTheme {...mediaProps} />
          ) : theme === 'card' ? (
            <CardTheme {...mediaProps} />
          ) : theme === 'vinyl' ? (
            <VinylTheme {...mediaProps} />
          ) : (
            <div className="w-full rounded-2xl overflow-hidden border border-white/10 backdrop-blur-md shadow-2xl" style={{ background: 'rgba(0,0,0,0.7)' }}>
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                {ytThumb(current.videoId) ? (
                  <img src={ytThumb(current.videoId) as string} alt="" className="w-14 h-8 rounded-lg object-cover shrink-0" loading="lazy" />
                ) : (
                  <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: `${accent}26` }}>
                    {isPlaying ? (
                      <span className="music-eq">
                        <span style={{ background: accent }} />
                        <span style={{ background: accent }} />
                        <span style={{ background: accent }} />
                      </span>
                    ) : (
                      <span className="text-[13px] font-black" style={{ color: accent }}>♪</span>
                    )}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-black truncate leading-tight" style={{ fontSize }}>{current.title}</div>
                  <div className="text-white/50 text-[11px] font-bold truncate">
                    {current.requestedBy ? `req. ${current.requestedBy}` : current.kind === 'youtube' ? 'YouTube' : 'Audio'}
                    {duration > 0 ? ` • ${fmt(position)} / ${fmt(duration)}` : ''}
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full text-black shrink-0" style={{ background: accent }}>
                  {isPlaying ? 'Play' : 'Pause'}
                </span>
              </div>
              {showProgress && (
                <div className="h-0.5 bg-white/10">
                  <div className="h-full transition-[width]" style={{ width: `${pct}%`, background: accent }} />
                </div>
              )}
            </div>
          )}
          {qpLast && (
            <QueueRotator queue={queue} currentIndex={currentIndex} accent={accent} showQueue={showQueue && theme !== 'minimal'} maxQueue={maxQueue} className={qpNarrow} />
          )}
          </div>
          </AutoScale>
        ) : (
          !obsMode && (
            <div className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">
              {simulate ? 'SIMULATE' : connected ? 'Menunggu request lagu… !song <url>' : 'Menghubungkan…'}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function MusicDisplayPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-transparent" />}>
      <MusicInner />
    </Suspense>
  );
}
