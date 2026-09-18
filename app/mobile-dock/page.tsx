'use client';

/**
 * Mobile Dock — halaman kontrol streamer (Deck / Control / Chat+BGM).
 *
 * - Realtime BGM pakai Socket.IO backend (event `song-*`), BUKAN Pusher.
 * - TIDAK ada kredensial hardcoded. Semua kredensial + URL tiap panel
 *   disimpan di Supabase (`mobile_dock_configs`, per user / private key).
 *   localStorage hanya mirror cache per-perangkat.
 * - Akses halaman dikunci private key (?key=, session bypass, atau login).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  Maximize2, Minimize2, Sun, Moon, Settings,
  Play, Pause, SkipForward, SkipBack, Plus,
  Trash2, Radio, Sliders, ExternalLink, MessageSquare,
  Tv, AlertCircle, Eye, EyeOff, Loader2, KeyRound, Music, Minus, RotateCcw,
  LayoutGrid,
} from 'lucide-react';
import DockableLayout, {
  createDefaultDockLayout,
  sanitizeDockLayout,
  restoreDockPanel,
  removeDockPanel,
  dockVisiblePanels,
  DOCK_LAYOUT_LS,
  type DockLayoutState,
  type DockNode,
} from './components/DockableLayout';
import { getSocketUrl } from '../widgets/_shared/utils/socket';
import { createClient } from '@/utils/supabase/client';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';
import './mobile-dock.css';

// ---------------------------------------------------------------- types

type SongItem = {
  id: string;
  url: string;
  videoId: string | null;
  kind: 'youtube' | 'audio';
  title: string;
  requestedBy: string;
  platform: string;
  addedAt: number;
};

type SongState = {
  room: string;
  queue: SongItem[];
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  updatedAt: number;
  settings?: { command?: string };
  lastError?: string | null;
};

type StreamInfo = {
  url: string;
  videoId: string;
  title: string;
  thumbnail: string;
  isLive: boolean;
};

type YtSearchItem = {
  id?: { videoId?: string };
  snippet?: { title?: string; channelTitle?: string; thumbnails?: { default?: { url?: string } } };
};

type PanelUrls = {
  deckUrl: string;
  controlUrl: string;
  alertUrl: string;
  monitorUrl: string;
  chatUrl: string;
};

type PanelZoomKey = 'deck' | 'control' | 'alert' | 'monitor' | 'chat';

type DockConfig = {
  discordUserId: string;
  deckId: string;
  tiptapKey: string;
  tiptapWidget: string;
  manualVideoId: string;
  bgmRoomId: string;
  urls: PanelUrls;
  customPanels: CustomPanel[];
};

// Panel buatan user: dock baru dengan URL sendiri (tambah/hapus via Settings)
type CustomPanel = {
  id: string;
  title: string;
  url: string;
};

// ------------------------------------------------------------ constants

const LS = {
  discordUserId: 'mobile-dock:discord-user-id',
  deckId: 'mobile-dock:deck-id',
  tiptapKey: 'mobile-dock:tiptap-key',
  tiptapWidget: 'mobile-dock:tiptap-widget',
  manualVideoId: 'mobile-dock:manual-video-id',
  bgmRoom: 'mobile-dock:bgm-room',
  bgmEnabled: 'mobile-dock:bgm-enabled',
  panelUrls: 'mobile-dock:panel-urls',
  zooms: 'mobile-dock:zooms',
  theme: 'mobile-dock:theme',
  customPanels: 'mobile-dock:custom-panels',
};

// Panel yang bisa di-dock (urutan = urutan default tab & nav mobile)
const KNOWN_DOCK_PANELS = ['deck', 'control', 'alert', 'monitor', 'chat', 'bgm'] as const;
type DockPanelId = (typeof KNOWN_DOCK_PANELS)[number];

const DOCK_TITLES: Record<DockPanelId, string> = {
  deck: 'Deck',
  control: 'Control',
  alert: 'Alert',
  monitor: 'Monitor',
  chat: 'Chat',
  bgm: 'BGM',
};

/** Bersihkan list panel kustom (buang entri rusak/duplikat, batasi 20). */
function sanitizeCustomPanels(raw: unknown): CustomPanel[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: CustomPanel[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const id = String(r.id ?? '').trim().slice(0, 40);
    const title = String(r.title ?? '').trim().slice(0, 40) || 'Custom';
    const url = String(r.url ?? '').trim().slice(0, 2000);
    if (!id || !url || seen.has(id)) continue;
    if (!/^[A-Za-z0-9_-]+$/.test(id)) continue;
    seen.add(id);
    out.push({ id, title, url });
    if (out.length >= 20) break;
  }
  return out;
}

function loadCustomPanelsLS(): CustomPanel[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(LS.customPanels);
    if (!raw) return [];
    return sanitizeCustomPanels(JSON.parse(raw));
  } catch {
    return [];
  }
}

function loadDockLayout(knownPanels?: string[]): DockLayoutState {
  const known = knownPanels ?? [...KNOWN_DOCK_PANELS];
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DOCK_LAYOUT_LS) : null;
    if (raw) return sanitizeDockLayout(JSON.parse(raw), known);
  } catch {}
  return createDefaultDockLayout();
}

// ID video publik untuk fallback saat offline & belum ada video manual.
// Bukan kredensial — hanya placeholder tampilan.
const FALLBACK_VIDEO_ID = 'jfKfPfyJRdk';

const EMPTY_URLS: PanelUrls = { deckUrl: '', controlUrl: '', alertUrl: '', monitorUrl: '', chatUrl: '' };

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

function readLS(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function loadCachedConfig(): DockConfig {
  if (typeof window === 'undefined') {
    return { discordUserId: '', deckId: '', tiptapKey: '', tiptapWidget: '', manualVideoId: '', bgmRoomId: '', urls: { ...EMPTY_URLS }, customPanels: [] };
  }
  const urls = (() => {
    try {
      const raw = localStorage.getItem(LS.panelUrls);
      if (!raw) return { ...EMPTY_URLS };
      const p = JSON.parse(raw);
      return {
        deckUrl: String(p.deckUrl ?? ''),
        controlUrl: String(p.controlUrl ?? ''),
        alertUrl: String(p.alertUrl ?? ''),
        monitorUrl: String(p.monitorUrl ?? ''),
        chatUrl: String(p.chatUrl ?? ''),
      };
    } catch {
      return { ...EMPTY_URLS };
    }
  })();
  return {
    discordUserId: readLS(LS.discordUserId, ''),
    deckId: readLS(LS.deckId, ''),
    tiptapKey: readLS(LS.tiptapKey, ''),
    tiptapWidget: readLS(LS.tiptapWidget, ''),
    manualVideoId: readLS(LS.manualVideoId, ''),
    bgmRoomId: readLS(LS.bgmRoom, ''),
    urls,
    customPanels: loadCustomPanelsLS(),
  };
}

function buildDefaultUrls(deckId: string, tiptapKey: string, widgetId: string): PanelUrls {
  const deckUrl = !deckId
    ? ''
    : deckId.startsWith('http')
      ? deckId
      : `https://streamer.bot/decks/${deckId}`;
  if (!tiptapKey && !widgetId) {
    return { deckUrl, controlUrl: '', alertUrl: '', monitorUrl: '', chatUrl: '' };
  }
  return {
    deckUrl,
    controlUrl: `https://tiptap.gg/control?privateKey=${tiptapKey}&type=alert%2Cleaderboard`,
    alertUrl: `https://tiptap.gg/widget/alert/${widgetId}?privateKey=${tiptapKey}&layer-width=800&layer-height=600&layer-name=TipTap%20Alert%20%7C%20Moon`,
    monitorUrl: '', // '' = otomatis embed YouTube sesuai status live
    chatUrl: '', // '' = otomatis live_chat YouTube sesuai status live
  };
}

/** Ganti placeholder {videoId} bila user memakai URL custom. */
function applyPlaceholders(url: string, videoId: string): string {
  return url.split('{videoId}').join(videoId);
}

/** Cari tabs node pertama (untuk menaruh panel kustom baru). */
function findFirstTabs(node: DockNode): Extract<DockNode, { type: 'tabs' }> | null {
  if (node.type === 'tabs') return node;
  for (const c of node.children) {
    const f = findFirstTabs(c);
    if (f) return f;
  }
  return null;
}

function formatTime(secs: number): string {
  const s = Math.max(0, Math.floor(secs || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function toWatchUrl(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  // youtube id mentah (11 char) -> watch url
  if (/^[A-Za-z0-9_-]{11}$/.test(t)) return `https://www.youtube.com/watch?v=${t}`;
  const m = t.match(/[?&]v=([A-Za-z0-9_-]{11})/) || t.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/watch?v=${m[1]}`;
  return null;
}

function parseColorToRgb(color: string): [number, number, number] | null {
  const c = color.trim().toLowerCase();
  if (!c || c === 'transparent') return null;
  const hex = c.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((ch) => ch + ch).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return [r, g, b];
  }
  const rgb = c.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgb) {
    const r = Number(rgb[1]);
    const g = Number(rgb[2]);
    const b = Number(rgb[3]);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return [r, g, b];
  }
  return null;
}

/** Brightness 0–100 (persepsi: 0.299R + 0.587G + 0.114B). null = tidak bisa diparse. */
function bgBrightness(color: string): number | null {
  const rgb = parseColorToRgb(color);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) * 100;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const DEFAULT_ZOOMS: Record<PanelZoomKey, number> = { deck: 1, control: 1, alert: 1, monitor: 1, chat: 1 };

function loadZooms(): Record<PanelZoomKey, number> {
  if (typeof window === 'undefined') return { ...DEFAULT_ZOOMS };
  try {
    const raw = localStorage.getItem(LS.zooms);
    if (!raw) return { ...DEFAULT_ZOOMS };
    const p = JSON.parse(raw);
    const out = { ...DEFAULT_ZOOMS };
    (Object.keys(DEFAULT_ZOOMS) as PanelZoomKey[]).forEach((k) => {
      const v = Number(p[k]);
      if (Number.isFinite(v)) out[k] = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));
    });
    return out;
  } catch {
    return { ...DEFAULT_ZOOMS };
  }
}

// Iframe yang bisa di-zoom per panel (transform scale + kompensasi ukuran,
// jadi layout panel tidak berubah dan tidak reload).
function ZoomableFrame({ src, title, zoom, allow, frameStyle, frameClass }: {
  src: string;
  title: string;
  zoom: number;
  allow?: string;
  frameStyle?: React.CSSProperties;
  frameClass?: string;
}) {
  return (
    <div className="w-full h-full overflow-hidden relative">
      <iframe
        src={src}
        title={title}
        allow={allow}
        className={frameClass}
        style={{
          width: `${100 / zoom}%`,
          height: `${100 / zoom}%`,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          border: 'none',
          ...frameStyle,
        }}
      />
    </div>
  );
}

// Kontrol zoom kompak untuk header tiap panel.
// Klik angka % untuk membuka slider, klik 2x untuk reset 100%.
function ZoomControls({ value, onChange, label }: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(value * 100);
  const step = (d: number) => {
    const v = Math.round((value + d) * 100) / 100;
    onChange(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v)));
  };
  const btn = 'grid place-items-center w-5 h-5 rounded-full text-[var(--text-label)] hover:text-[var(--text-main)] hover:bg-[var(--panel-bg)] active:scale-90 transition cursor-pointer';
  return (
    <span className="relative flex items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-color)]/80 backdrop-blur px-0.5 py-0.5 shadow-sm select-none" title={label}>
      <button onClick={() => step(-0.1)} className={btn} title="Zoom out">
        <Minus className="w-3 h-3" />
      </button>
      <button
        onClick={() => setOpen((o) => !o)}
        onDoubleClick={() => { onChange(1); setOpen(false); }}
        className="min-w-9 px-1 text-center text-[9px] font-mono font-bold text-[var(--text-main)] hover:text-[var(--accent)] active:scale-95 transition cursor-pointer tabular-nums"
        title="Slider zoom (double-click = reset 100%)"
      >
        {pct}%
      </button>
      <button onClick={() => step(0.1)} className={btn} title="Zoom in">
        <Plus className="w-3 h-3" />
      </button>
      {open && (
        <>
          <button aria-hidden tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-0 z-[199] cursor-default bg-transparent border-none p-0" />
          <span className="absolute top-full mt-1.5 right-0 z-[200] flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-2.5 py-2 shadow-lg mdock-animate-fade-in">
            <button
              onClick={() => onChange(1)}
              className="grid place-items-center w-6 h-6 rounded-full text-[var(--text-label)] hover:text-[var(--accent)] hover:bg-[var(--bg-color)] active:scale-90 transition cursor-pointer"
              title="Reset 100%"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <input
              type="range"
              min={Math.round(ZOOM_MIN * 100)}
              max={Math.round(ZOOM_MAX * 100)}
              step={5}
              value={pct}
              onChange={(e) => onChange(Number(e.target.value) / 100)}
              className="w-28 accent-[var(--accent)] cursor-pointer"
            />
            <span className="text-[9px] font-mono font-bold text-[var(--text-main)] tabular-nums w-9 text-right">{pct}%</span>
          </span>
        </>
      )}
    </span>
  );
}

// ------------------------------------------------------------------ page

export default function MobileDockPage() {
  const supabase = createClient();

  // ---- private-key gate
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [keyVerified, setKeyVerified] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keyLoading, setKeyLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);

  // ---- config (dari Supabase; LS hanya cache — dipakai sebagai nilai awal instan)
  const [initialCache] = useState<DockConfig>(() => loadCachedConfig());
  const [discordUserId, setDiscordUserId] = useState(initialCache.discordUserId);
  const [deckId, setDeckId] = useState(initialCache.deckId);
  const [tiptapPrivateKey, setTiptapPrivateKey] = useState(initialCache.tiptapKey);
  const [tiptapAlertWidgetId, setTiptapAlertWidgetId] = useState(initialCache.tiptapWidget);
  const [manualVideoId, setManualVideoId] = useState(initialCache.manualVideoId);
  const [bgmRoomId, setBgmRoomId] = useState(initialCache.bgmRoomId);
  const [panelUrls, setPanelUrls] = useState<PanelUrls>({ ...initialCache.urls });
  const [customPanels, setCustomPanels] = useState<CustomPanel[]>(() => [...initialCache.customPanels]);

  const [showSettings, setShowSettings] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // buffer edit di modal
  const [tmpCreds, setTmpCreds] = useState({ discordUserId: '', deckId: '', tiptapKey: '', tiptapWidget: '', manualVideoId: '', bgmRoomId: '' });
  const [tmpUrls, setTmpUrls] = useState<PanelUrls>({ ...EMPTY_URLS });
  const [tmpCustom, setTmpCustom] = useState<CustomPanel[]>([]);
  const [mask, setMask] = useState({ deck: true, key: true, widget: true });

  // ---- theme / fullscreen / layout
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (readLS(LS.theme, 'dark') === 'light' ? 'light' : 'dark'));
  // Invert iframe deck mengikuti brightness background aktual (>50% = invert)
  const [invertDeck, setInvertDeck] = useState(() => readLS(LS.theme, 'dark') === 'light');
  // Zoom per iframe (preferensi tampilan per perangkat; key = id panel, termasuk kustom)
  const [zooms, setZooms] = useState<Record<string, number>>(() => loadZooms());
  const setZoom = (key: string, v: number) => {
    setZooms((prev) => {
      const next = { ...prev, [key]: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v)) };
      try { localStorage.setItem(LS.zooms, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Resizable & Dockable layout: posisi/ukuran/susunan semua panel (persist Supabase + LS)
  const [dockLayout, setDockLayout] = useState<DockLayoutState>(() => loadDockLayout([...KNOWN_DOCK_PANELS, ...initialCache.customPanels.map((c) => c.id)]));
  const dockLayoutRef = useRef<DockLayoutState | null>(null);
  dockLayoutRef.current = dockLayout;
  const [mobilePanel, setMobilePanel] = useState<string>('deck');
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [isDockResizing, setIsDockResizing] = useState(false);

  // Daftar panel dikenal (bawaan + kustom) & judulnya — dipakai sanitize, tab, nav.
  const knownPanels = useMemo(
    () => [...KNOWN_DOCK_PANELS.map(String), ...customPanels.map((c) => c.id)],
    [customPanels]
  );
  const dockTitles = useMemo<Record<string, string>>(
    () => ({ ...DOCK_TITLES, ...Object.fromEntries(customPanels.map((c) => [c.id, c.title])) }),
    [customPanels]
  );

  // ---- tabs
  const [isMobile, setIsMobile] = useState(false);

  // ---- stream status (Lanyard)
  const [streamInfo, setStreamInfo] = useState<StreamInfo>({
    url: `https://www.youtube.com/watch?v=${FALLBACK_VIDEO_ID}`,
    videoId: FALLBACK_VIDEO_ID,
    title: 'Memuat status stream...',
    thumbnail: `https://i3.ytimg.com/vi/${FALLBACK_VIDEO_ID}/mqdefault.jpg`,
    isLive: false,
  });
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [manualInput, setManualInput] = useState(initialCache.manualVideoId);

  // ---- BGM via Socket.IO (state server-authoritative `song-*`)
  const [bgmEnabled, setBgmEnabled] = useState(() => readLS(LS.bgmEnabled, 'true') === 'true');
  const [song, setSong] = useState<SongState | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showBgmSettings, setShowBgmSettings] = useState(false);
  const [newBgmUrl, setNewBgmUrl] = useState('');
  const [bgmSearchQuery, setBgmSearchQuery] = useState('');
  const [bgmSearchResults, setBgmSearchResults] = useState<YtSearchItem[]>([]);
  const [bgmIsSearching, setBgmIsSearching] = useState(false);
  const [bgmSearchError, setBgmSearchError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  // Room socket: custom dari config, fallback ke privateKey (isolasi per akun)
  const room = bgmRoomId.trim().toLowerCase() || (privateKey ?? 'global');

  // posisi lokal agar progress bar jalan walau display player tertutup
  const [localPos, setLocalPos] = useState(0);
  const currentSongId = song && song.queue.length > 0
    ? song.queue[Math.min(song.currentIndex, song.queue.length - 1)].id
    : null;

  const queue = song?.queue ?? [];
  const currentIdx = song ? Math.min(song.currentIndex, Math.max(0, queue.length - 1)) : 0;
  const current = queue.length > 0 ? queue[currentIdx] : null;

  // ------------------------------------------------- private key resolve

  useEffect(() => {
    const resolveKey = async () => {
      // 1) ?key= di URL
      const keyFromUrl = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('key')?.trim()
        : null;
      if (keyFromUrl) {
        try {
          const { data: valid } = await (supabase as unknown as {
            rpc: (fn: string, args: Record<string, string>) => Promise<{ data: boolean }>;
          }).rpc('verify_private_key', { p_key: keyFromUrl });
          if (valid) {
            setPrivateKey(keyFromUrl);
            setKeyVerified(true);
            sessionStorage.setItem('bypass_private_key', keyFromUrl);
            sessionStorage.setItem('dock_private_verified', keyFromUrl);
            window.history.replaceState(null, '', window.location.pathname);
            setKeyLoading(false);
            return;
          }
          setKeyError('Private key di URL tidak valid.');
        } catch {
          setKeyError('Gagal verifikasi private key.');
        }
        setKeyLoading(false);
        return;
      }

      // 2) session bypass (sudah verifikasi sebelumnya)
      const bypass = typeof window !== 'undefined'
        ? (sessionStorage.getItem('bypass_private_key') || sessionStorage.getItem('dock_private_verified'))
        : null;
      if (bypass) {
        try {
          const { data: valid } = await (supabase as unknown as {
            rpc: (fn: string, args: Record<string, string>) => Promise<{ data: boolean }>;
          }).rpc('verify_private_key', { p_key: bypass });
          if (valid) {
            setPrivateKey(bypass);
            setKeyVerified(true);
            setKeyLoading(false);
            return;
          }
          sessionStorage.removeItem('bypass_private_key');
          sessionStorage.removeItem('dock_private_verified');
        } catch {
          // offline / RPC gagal — pakai cache apa adanya
          setPrivateKey(bypass);
          setKeyVerified(true);
          setKeyLoading(false);
          return;
        }
      }

      // 3) login Supabase → private key dari profil
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          let key: string | null = null;
          try {
            const { data: profile } = await supabase.from('profiles').select('private_key').eq('id', session.user.id).single();
            key = (profile as { private_key?: string } | null)?.private_key || null;
          } catch {}
          if (!key) {
            try {
              const { data: sec } = await supabase.from('user_private_keys').select('private_key').eq('user_id', session.user.id).single();
              key = (sec as { private_key?: string } | null)?.private_key || null;
            } catch {}
          }
          if (key) {
            setPrivateKey(key);
            setKeyVerified(true);
            sessionStorage.setItem('dock_private_verified', key);
            setKeyLoading(false);
            return;
          }
        }
      } catch {}
      setKeyLoading(false);
    };
    resolveKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyKey = async () => {
    const input = keyInput.trim();
    if (!input) {
      setKeyError('Masukkan private key.');
      return;
    }
    setKeyLoading(true);
    setKeyError('');
    try {
      const { data: valid } = await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, string>) => Promise<{ data: boolean }>;
      }).rpc('verify_private_key', { p_key: input });
      if (valid) {
        setPrivateKey(input);
        setKeyVerified(true);
        sessionStorage.setItem('bypass_private_key', input);
        sessionStorage.setItem('dock_private_verified', input);
      } else {
        setKeyError('Private key tidak valid. Cek di Dashboard → Private Key.');
      }
    } catch {
      setKeyError('Gagal verifikasi. Periksa koneksi lalu coba lagi.');
    } finally {
      setKeyLoading(false);
    }
  };

  // ------------------------------------------------- load config Supabase

  const applyConfig = (cfg: DockConfig) => {
    setDiscordUserId(cfg.discordUserId);
    setDeckId(cfg.deckId);
    setTiptapPrivateKey(cfg.tiptapKey);
    setTiptapAlertWidgetId(cfg.tiptapWidget);
    setManualVideoId(cfg.manualVideoId);
    setManualInput(cfg.manualVideoId);
    setBgmRoomId(cfg.bgmRoomId);
    setPanelUrls({ ...cfg.urls });
    setCustomPanels([...cfg.customPanels]);
  };

  useEffect(() => {
    if (!privateKey) return;
    const load = async () => {
      setConfigLoading(true);
      try {
        const { data: all } = await (supabase as unknown as {
          rpc: (fn: string, args: Record<string, string>) => Promise<{ data: Record<string, unknown> }>;
        }).rpc('get_all_by_private_key', { p_key: privateKey });
        const row = (all as { mobile_dock_config?: Record<string, unknown> } | null)?.mobile_dock_config;
        if (row) {
          const rawKey = String(row.tiptap_private_key ?? '');
          const decKey = rawKey && isEncrypted(rawKey)
            ? await decrypt(rawKey, privateKey).catch(() => '')
            : rawKey;
          const cfg: DockConfig = {
            discordUserId: String(row.discord_user_id ?? ''),
            deckId: String(row.deck_id ?? ''),
            tiptapKey: decKey,
            tiptapWidget: String(row.tiptap_alert_widget_id ?? ''),
            manualVideoId: String(row.manual_video_id ?? ''),
            bgmRoomId: String(row.bgm_room ?? ''),
            urls: {
              deckUrl: String(row.deck_url ?? ''),
              controlUrl: String(row.control_url ?? ''),
              alertUrl: String(row.alert_url ?? ''),
              monitorUrl: String(row.monitor_url ?? ''),
              chatUrl: String(row.chat_url ?? ''),
            },
            // custom_panels: array dari Supabase menang; null (kolom lama) = pakai cache LS
            customPanels: Array.isArray(row.custom_panels)
              ? sanitizeCustomPanels(row.custom_panels)
              : loadCustomPanelsLS(),
          };
          applyConfig(cfg);
          mirrorLS(cfg);
          // layout dockable: sanitize ulang dengan daftar panel final (bawaan + kustom)
          const known = [...KNOWN_DOCK_PANELS.map(String), ...cfg.customPanels.map((c) => c.id)];
          const savedLayout = row.layout_json;
          const base = savedLayout && typeof savedLayout === 'object'
            ? savedLayout
            : (() => { try { const raw = localStorage.getItem(DOCK_LAYOUT_LS); return raw ? JSON.parse(raw) : null; } catch { return null; } })();
          const clean = sanitizeDockLayout(base, known);
          setDockLayout(clean);
          try { localStorage.setItem(DOCK_LAYOUT_LS, JSON.stringify(clean)); } catch {}
        }
      } catch (e) {
        console.error('Gagal memuat config Supabase:', e);
      } finally {
        setConfigLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privateKey]);

  // ------------------------------------------------- persist (Supabase + LS)

  function mirrorLS(cfg: DockConfig) {
    try {
      localStorage.setItem(LS.discordUserId, cfg.discordUserId);
      localStorage.setItem(LS.deckId, cfg.deckId);
      localStorage.setItem(LS.tiptapKey, cfg.tiptapKey);
      localStorage.setItem(LS.tiptapWidget, cfg.tiptapWidget);
      localStorage.setItem(LS.manualVideoId, cfg.manualVideoId);
      localStorage.setItem(LS.bgmRoom, cfg.bgmRoomId);
      localStorage.setItem(LS.panelUrls, JSON.stringify(cfg.urls));
      localStorage.setItem(LS.customPanels, JSON.stringify(cfg.customPanels));
    } catch (e) {
      console.error('Gagal mirror localStorage:', e);
    }
  }

  /** Simpan config ke Supabase (session upsert / RPC bypass) + mirror LS + state. */
  async function persistConfig(cfg: DockConfig, layout?: DockLayoutState): Promise<boolean> {
    if (!privateKey) return false;
    const encTiptap = cfg.tiptapKey ? await encrypt(cfg.tiptapKey, privateKey) : '';
    const layoutJson = layout ?? dockLayoutRef.current;
    const payload = {
      discord_user_id: cfg.discordUserId,
      deck_id: cfg.deckId,
      tiptap_private_key: encTiptap,
      tiptap_alert_widget_id: cfg.tiptapWidget,
      manual_video_id: cfg.manualVideoId,
      bgm_room: cfg.bgmRoomId,
      deck_url: cfg.urls.deckUrl,
      control_url: cfg.urls.controlUrl,
      alert_url: cfg.urls.alertUrl,
      monitor_url: cfg.urls.monitorUrl,
      chat_url: cfg.urls.chatUrl,
      custom_panels: cfg.customPanels,
    };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase
          .from('mobile_dock_configs')
          .upsert({ user_id: session.user.id, ...payload, layout_json: layoutJson } as never, { onConflict: 'user_id' });
        if (error) throw error;
      } else {
        const { error } = await (supabase as unknown as {
          rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
        }).rpc('upsert_mobile_dock_config_by_private_key', {
          p_key: privateKey,
          p_discord: payload.discord_user_id,
          p_deck: payload.deck_id,
          p_tiptap_key: payload.tiptap_private_key,
          p_widget: payload.tiptap_alert_widget_id,
          p_manual: payload.manual_video_id,
          p_room: payload.bgm_room,
          p_deck_url: payload.deck_url,
          p_control_url: payload.control_url,
          p_alert_url: payload.alert_url,
          p_monitor_url: payload.monitor_url,
          p_chat_url: payload.chat_url,
          p_layout_json: layoutJson,
          p_custom_panels: payload.custom_panels,
        });
        if (error) throw new Error(error.message);
      }
    } catch (e) {
      console.error('Gagal simpan ke Supabase:', e);
      return false;
    }
    mirrorLS(cfg);
    applyConfig(cfg);
    return true;
  }

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveError(null);
    // panel kustom: pastikan id unik & valid
    const seen = new Set<string>();
    const customs: CustomPanel[] = [];
    for (const c of tmpCustom) {
      const title = c.title.trim().slice(0, 40) || 'Custom';
      const url = c.url.trim();
      let id = c.id.trim();
      if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) id = `custom_${Date.now().toString(36)}${customs.length}`;
      if (seen.has(id) || !url) continue;
      seen.add(id);
      customs.push({ id, title, url: url.slice(0, 2000) });
      if (customs.length >= 20) break;
    }
    const cfg: DockConfig = {
      discordUserId: tmpCreds.discordUserId.trim(),
      deckId: tmpCreds.deckId.trim(),
      tiptapKey: tmpCreds.tiptapKey.trim(),
      tiptapWidget: tmpCreds.tiptapWidget.trim(),
      manualVideoId: tmpCreds.manualVideoId.trim(),
      bgmRoomId: tmpCreds.bgmRoomId.trim(),
      urls: { ...tmpUrls },
      customPanels: customs,
    };
    // rekonsiliasi layout: panel kustom baru → tambahkan ke tabs pertama;
    // yang dihapus → buang dari layout.
    const prevIds = new Set(customPanels.map((c) => c.id));
    const nextIds = new Set(customs.map((c) => c.id));
    let nextLayout = dockLayoutRef.current ?? dockLayout;
    let layoutTouched = false;
    for (const id of nextIds) {
      if (!prevIds.has(id)) {
        const cloned = JSON.parse(JSON.stringify(nextLayout)) as DockLayoutState;
        const first = findFirstTabs(cloned.root);
        if (first) {
          first.panels.push(id);
          first.active = id;
          nextLayout = { version: 1, root: cloned.root, hidden: cloned.hidden };
          layoutTouched = true;
        }
      }
    }
    for (const id of prevIds) {
      if (!nextIds.has(id)) {
        nextLayout = removeDockPanel(nextLayout, id);
        layoutTouched = true;
      }
    }
    // Pengaman: jangan sampai tidak ada panel terlihat sama sekali
    if (dockVisiblePanels(nextLayout.root).length === 0) {
      nextLayout = createDefaultDockLayout();
      layoutTouched = true;
    }
    if (layoutTouched) {
      setDockLayout(nextLayout);
      try { localStorage.setItem(DOCK_LAYOUT_LS, JSON.stringify(nextLayout)); } catch {}
    }
    const ok = await persistConfig(cfg, layoutTouched ? nextLayout : undefined);
    if (ok) {
      setShowSettings(false);
    } else {
      setSaveError('Gagal Menyimpan Data. Perubahan batal.');
    }
    setIsSaving(false);
  };

  const saveManualVideoId = async () => {
    const cfg: DockConfig = {
      discordUserId, deckId, tiptapKey: tiptapPrivateKey, tiptapWidget: tiptapAlertWidgetId,
      manualVideoId: manualInput.trim(), bgmRoomId, urls: { ...panelUrls }, customPanels,
    };
    const ok = await persistConfig(cfg);
    if (ok) setShowChatSettings(false);
    else alert('Gagal Menyimpan Data.');
  };

  const saveBgmRoom = async (nextRoom: string, nextEnabled: boolean) => {
    try { localStorage.setItem(LS.bgmEnabled, nextEnabled ? 'true' : 'false'); } catch {}
    setBgmEnabled(nextEnabled);
    const cfg: DockConfig = {
      discordUserId, deckId, tiptapKey: tiptapPrivateKey, tiptapWidget: tiptapAlertWidgetId,
      manualVideoId, bgmRoomId: nextRoom.trim(), urls: { ...panelUrls }, customPanels,
    };
    const ok = await persistConfig(cfg);
    if (ok) setShowBgmSettings(false);
    else alert('Gagal Menyimpan Data.');
  };

  // ------------------------------------------------------------ effects

  useEffect(() => {
    try { localStorage.setItem(LS.theme, theme); } catch {}
    // Baca background aktual dari CSS var, bukan dari nama tema:
    // brightness > 50% -> invert, <= 50% -> hapus invert.
    let bgVar = '';
    try {
      const el = containerRef.current;
      if (el) bgVar = getComputedStyle(el).getPropertyValue('--panel-bg').trim();
    } catch {}
    const b = bgVar ? bgBrightness(bgVar) : null;
    setInvertDeck(b === null ? theme === 'light' : b > 50);
  }, [theme]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Lanyard -> status live YouTube
  useEffect(() => {
    if (!keyVerified || !discordUserId) return;
    const fallbackId = manualVideoId || FALLBACK_VIDEO_ID;
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${discordUserId}`);
        const result = await res.json();
        const streaming = result?.success
          ? (result.data?.activities ?? []).find((a: { type?: number }) => a.type === 1)
          : null;
        if (cancelled) return;
        if (streaming?.url) {
          const urlStr: string = streaming.url;
          const v = urlStr.split('v=')[1]?.split('&')[0] || fallbackId;
          const assetId: string | undefined = streaming.assets?.large_image?.split(':')[1];
          setStreamInfo({
            url: urlStr,
            videoId: v,
            title: streaming.details || 'Live Broadcasting',
            thumbnail: `https://i3.ytimg.com/vi/${assetId || v}/mqdefault.jpg`,
            isLive: true,
          });
        } else {
          setStreamInfo({
            url: `https://www.youtube.com/watch?v=${fallbackId}`,
            videoId: fallbackId,
            title: 'Stream Offline (Manual Mode)',
            thumbnail: `https://i3.ytimg.com/vi/${fallbackId}/mqdefault.jpg`,
            isLive: false,
          });
        }
      } catch (e) {
        if (cancelled) return;
        console.error('Lanyard API error:', e);
        setStreamInfo({
          url: `https://www.youtube.com/watch?v=${fallbackId}`,
          videoId: fallbackId,
          title: 'Offline / Gagal Hubungi API Lanyard',
          thumbnail: `https://i3.ytimg.com/vi/${fallbackId}/mqdefault.jpg`,
          isLive: false,
        });
      }
    };
    fetchStatus();
    const t = setInterval(fetchStatus, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [manualVideoId, discordUserId, keyVerified]);

  // Socket.IO BGM — ganti total Pusher private-room
  useEffect(() => {
    if (!keyVerified) return;
    if (!bgmEnabled) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
      return;
    }
    const s = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    socketRef.current = s;

    const onUpdate = (st: SongState) => {
      // backend broadcast global -> filter room sendiri
      if (!st || st.room !== room) return;
      setSong(st);
    };
    s.on('song-update', onUpdate);
    s.on('connect', () => {
      setSocketConnected(true);
      s.emit('join-room', room);
      s.emit('song-get', { privateKey: room });
    });
    s.on('disconnect', () => setSocketConnected(false));
    return () => {
      s.off('song-update', onUpdate);
      s.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [bgmEnabled, room, keyVerified]);

  // sinkron posisi lokal dari server
  useEffect(() => { setLocalPos(song?.position || 0); }, [song?.position, currentSongId]);
  useEffect(() => {
    if (!song?.isPlaying) return;
    const id = setInterval(() => setLocalPos((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [song?.isPlaying, currentSongId]);

  // dock layout: simpan ke LS tiap berubah (debounce), Supabase ikut persistConfig
  const layoutSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleDockLayoutChange = (next: DockLayoutState) => {
    setDockLayout(next);
    try { localStorage.setItem(DOCK_LAYOUT_LS, JSON.stringify(next)); } catch {}
    // persist ke Supabase (debounce 1.5s agar drag/resize tidak spam)
    if (layoutSaveTimer.current) clearTimeout(layoutSaveTimer.current);
    layoutSaveTimer.current = setTimeout(() => {
      const cfg: DockConfig = {
        discordUserId, deckId, tiptapKey: tiptapPrivateKey, tiptapWidget: tiptapAlertWidgetId,
        manualVideoId, bgmRoomId, urls: { ...panelUrls }, customPanels,
      };
      void persistConfig(cfg, next);
    }, 1500);
  };
  useEffect(() => () => { if (layoutSaveTimer.current) clearTimeout(layoutSaveTimer.current); }, []);

  const resetDockLayout = () => {
    const fresh = createDefaultDockLayout();
    setDockLayout(fresh);
    try { localStorage.setItem(DOCK_LAYOUT_LS, JSON.stringify(fresh)); } catch {}
    const cfg: DockConfig = {
      discordUserId, deckId, tiptapKey: tiptapPrivateKey, tiptapWidget: tiptapAlertWidgetId,
      manualVideoId, bgmRoomId, urls: { ...panelUrls }, customPanels,
    };
    void persistConfig(cfg, fresh);
    setShowLayoutMenu(false);
  };

  // ------------------------------------------------------------ helpers

  // Tampilan stream: bila Discord ID belum diisi, paksa mode offline
  // (tanpa setState di effect).
  const viewStream: StreamInfo = !discordUserId
    ? {
        url: `https://www.youtube.com/watch?v=${manualVideoId || FALLBACK_VIDEO_ID}`,
        videoId: manualVideoId || FALLBACK_VIDEO_ID,
        title: 'Discord User ID belum diisi (buka Settings)',
        thumbnail: `https://i3.ytimg.com/vi/${manualVideoId || FALLBACK_VIDEO_ID}/mqdefault.jpg`,
        isLive: false,
      }
    : streamInfo;

  const defaults = buildDefaultUrls(deckId, tiptapPrivateKey, tiptapAlertWidgetId);
  const deckSrc = (panelUrls.deckUrl.trim() || defaults.deckUrl).trim();
  const controlSrc = (panelUrls.controlUrl.trim() || defaults.controlUrl).trim();
  const alertSrc = (panelUrls.alertUrl.trim() || defaults.alertUrl).trim();
  const monitorSrc = panelUrls.monitorUrl.trim()
    ? applyPlaceholders(panelUrls.monitorUrl.trim(), viewStream.videoId)
    : `https://www.youtube.com/embed/${viewStream.videoId}?autoplay=1&mute=1`;
  const embedDomain = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
  const chatSrc = panelUrls.chatUrl.trim()
    ? applyPlaceholders(panelUrls.chatUrl.trim(), viewStream.videoId)
    : `https://www.youtube.com/live_chat?v=${viewStream.videoId}&embed_domain=${embedDomain}`;

  const songControl = (action: string, extra: Record<string, unknown> = {}) => {
    socketRef.current?.emit('song-control', { privateKey: room, action, ...extra });
  };

  const effPos = song?.isPlaying ? Math.max(song.position || 0, localPos) : (song?.position || 0);
  const effDur = song?.duration || 0;
  const cmd = song?.settings?.command || '!song';

  const addBgmUrl = (rawUrl: string, title?: string) => {
    const url = toWatchUrl(rawUrl);
    if (!url) return;
    let who = 'dock';
    try {
      const raw = localStorage.getItem('obs-login');
      const email = raw ? JSON.parse(raw).email : '';
      if (email) who = String(email).split('@')[0];
    } catch {}
    socketRef.current?.emit('song-add', {
      privateKey: room,
      url,
      title: (title || '').trim().slice(0, 160) || undefined,
      requestedBy: who,
      platform: 'dock',
    });
  };

  const handleAddManual = () => {
    if (!newBgmUrl.trim()) return;
    // judul di-resolve server via oEmbed — sama seperti widget request queue
    addBgmUrl(newBgmUrl);
    setNewBgmUrl('');
  };

  const searchBgm = async () => {
    const q = bgmSearchQuery.trim();
    if (!q) return;
    if (!YOUTUBE_API_KEY) {
      setBgmSearchError('NEXT_PUBLIC_YOUTUBE_API_KEY belum di-set di .env');
      return;
    }
    setBgmIsSearching(true);
    setBgmSearchError(null);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`,
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'YouTube API error');
      setBgmSearchResults(data.items || []);
    } catch (e) {
      console.error('YouTube search error:', e);
      setBgmSearchError('Gagal mencari video.');
    } finally {
      setBgmIsSearching(false);
    }
  };

  const openSettings = () => {
    setTmpCreds({ discordUserId, deckId, tiptapKey: tiptapPrivateKey, tiptapWidget: tiptapAlertWidgetId, manualVideoId, bgmRoomId });
    setTmpUrls({ ...panelUrls });
    setTmpCustom(customPanels.map((c) => ({ ...c })));
    setSaveError(null);
    setShowSettings(true);
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
          .catch(() => alert('Fullscreen diblokir / tidak diizinkan.'));
      } else {
        document.exitFullscreen();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const urlFields: Array<{ key: keyof PanelUrls; label: string; hint: string }> = [
    { key: 'deckUrl', label: 'Panel Deck — URL', hint: 'Streamer.bot deck atau URL embed apapun.' },
    { key: 'controlUrl', label: 'Panel Control — URL', hint: 'Konsol kontrol (bawaan: TipTap control).' },
    { key: 'alertUrl', label: 'Panel Alert — URL', hint: 'Widget alert (bawaan: TipTap alert).' },
    { key: 'monitorUrl', label: 'Panel Monitor — URL (opsional)', hint: 'Kosong = otomatis embed YouTube live. Bisa pakai {videoId}.' },
    { key: 'chatUrl', label: 'Panel Chat — URL (opsional)', hint: 'Kosong = otomatis YouTube live_chat. Bisa pakai {videoId}.' },
  ];

  const emptyPanel = (label: string) => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
      <div className="p-3 bg-[var(--bg-color)] rounded-full">
        <Settings className="w-6 h-6 text-[var(--text-label)]" />
      </div>
      <p className="text-xs font-medium">{label} belum dikonfigurasi</p>
      <button onClick={openSettings} className="text-xs text-[var(--accent)] hover:underline cursor-pointer">
        Buka Settings
      </button>
    </div>
  );

  // ------------------------------------------------------------ gate render

  const themeClass = theme === 'dark' ? 'mdock-dark' : 'mdock-light';

  if (keyLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${themeClass} bg-[var(--bg-color)] text-[var(--text-main)]`}>
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="mt-4 text-[10px] font-bold tracking-widest uppercase">Memuat Mobile Dock...</p>
      </div>
    );
  }

  if (!keyVerified) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${themeClass} bg-[var(--bg-color)] text-[var(--text-main)]`}>
        <div className="max-w-sm w-full border border-[var(--border-color)] bg-[var(--panel-bg)] p-8 flex flex-col items-center rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-[var(--bg-color)] flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-[var(--text-label)]" />
          </div>
          <h2 className="text-lg font-bold mb-1">Mobile Dock terkunci</h2>
          <p className="text-xs text-[var(--text-label)] text-center mb-6">
            Masukkan private key. Lihat di Dashboard → Private Key.
          </p>
          {keyError && (
            <div className="w-full p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{keyError}</span>
            </div>
          )}
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyKey(); }}
            placeholder="Private key"
            className="w-full text-xs font-mono px-3 py-3 border border-[var(--border-color)] bg-[var(--bg-color)] rounded-lg focus:outline-none mb-3"
          />
          <button
            onClick={handleVerifyKey}
            className="w-full py-3 text-sm font-bold text-white bg-[var(--accent)] rounded-lg cursor-pointer"
          >
            Buka Dock
          </button>
        </div>
      </div>
    );
  }

  if (configLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${themeClass} bg-[var(--bg-color)] text-[var(--text-main)]`}>
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="mt-4 text-[10px] font-bold tracking-widest uppercase">Memuat konfigurasi...</p>
      </div>
    );
  }

  // ------------------------------------------------- dock panels (isi tiap panel dockable)
  // Judul panel tampil di tab-bar DockableLayout; di sini hanya toolbar + isi.
  const noPointer = isDockResizing ? 'pointer-events-none' : undefined;

  const panelToolbar = (zoomKey: string, label: string, src?: string) => (
    <div className="px-2 py-1 border-b border-[var(--border-color)] bg-[var(--bg-color)] flex items-center justify-end gap-1 shrink-0">
      {src ? <ZoomControls value={zooms[zoomKey] ?? 1} onChange={(v) => setZoom(zoomKey, v)} label={label} /> : null}
      {src ? (
        <a href={src} target="_blank" rel="noreferrer" className="p-1 text-[var(--text-label)] hover:text-[var(--text-main)]" title="Buka di tab baru">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : null}
    </div>
  );

  const renderDockPanel = (id: string) => {
    if (id === 'deck') {
      return (
        <div className="flex-1 min-h-0 flex flex-col">
          {panelToolbar('deck', 'Zoom panel Deck', deckSrc || undefined)}
          <div className="flex-1 min-h-0 bg-[var(--bg-color)] relative">
            {deckSrc ? (
              <ZoomableFrame
                src={deckSrc}
                title="Deck"
                zoom={zooms.deck}
                frameClass={noPointer}
                frameStyle={{ filter: invertDeck ? 'invert(1) hue-rotate(180deg)' : 'none' }}
              />
            ) : emptyPanel('Deck')}
          </div>
        </div>
      );
    }
    if (id === 'control') {
      return (
        <div className="flex-1 min-h-0 flex flex-col">
          {panelToolbar('control', 'Zoom panel Control', controlSrc || undefined)}
          <div className="flex-1 min-h-0">
            {controlSrc ? (
              <ZoomableFrame src={controlSrc} title="Control Console" zoom={zooms.control} frameClass={noPointer} />
            ) : emptyPanel('Control')}
          </div>
        </div>
      );
    }
    if (id === 'alert') {
      return (
        <div className="flex-1 min-h-0 flex flex-col">
          {panelToolbar('alert', 'Zoom panel Alert', alertSrc || undefined)}
          <div className="flex-1 min-h-0 relative">
            {alertSrc ? (
              <ZoomableFrame src={alertSrc} title="Alert Display" zoom={zooms.alert} frameClass={noPointer} />
            ) : emptyPanel('Alert')}
          </div>
        </div>
      );
    }
    if (id === 'monitor') {
      return (
        <div className="flex-1 min-h-0 flex flex-col">
          {panelToolbar('monitor', 'Zoom panel Monitor', monitorSrc || undefined)}
          <div className="flex-1 min-h-0 relative">
            {!viewStream.isLive && !panelUrls.monitorUrl.trim() ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
                <div className="p-4 bg-[var(--bg-color)] rounded-full">
                  <Tv className="w-10 h-10 text-[var(--text-label)]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium">Stream Offline</h3>
                  <p className="text-xs text-[var(--text-label)]">{viewStream.title}</p>
                </div>
              </div>
            ) : (
              <ZoomableFrame src={monitorSrc} title="Monitor" zoom={zooms.monitor} allow="autoplay; encrypted-media" frameClass={noPointer} />
            )}
          </div>
        </div>
      );
    }
    if (id === 'chat') {
      return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="p-3 bg-[var(--bg-color)] border-b border-[var(--border-color)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <img src={viewStream.thumbnail} alt="Preview" className="w-12 h-8 rounded object-cover bg-[var(--bg-color)] shrink-0" />
              <div className="flex flex-col overflow-hidden leading-tight">
                <p className="text-xs font-medium truncate">{viewStream.title}</p>
                <span className="flex items-center gap-2">
                  <a href={viewStream.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Watch
                  </a>
                  <a href={chatSrc} target="_blank" rel="noreferrer" className="text-xs text-[var(--text-label)] hover:underline flex items-center gap-1" title="Buka URL chat di tab baru">
                    <ExternalLink className="w-3 h-3" /> Popout
                  </a>
                </span>
              </div>
            </div>
            <span className="flex items-center gap-1 shrink-0">
              <ZoomControls value={zooms.chat} onChange={(v) => setZoom('chat', v)} label="Zoom panel Chat" />
              <button onClick={() => setShowChatSettings((p) => !p)} className="p-2 text-[var(--text-label)] hover:text-[var(--text-main)] cursor-pointer rounded-md" title="Chat settings">
                <Settings className="w-4 h-4" />
              </button>
            </span>
          </div>
          {showChatSettings && (
            <div className="p-3 bg-[var(--bg-color)] border-b border-[var(--border-color)] flex flex-col gap-2">
              <label className="text-xs font-medium text-[var(--text-label)]">Default Video ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Video ID"
                  className="flex-1 text-xs px-3 py-2 border border-[var(--border-color)] bg-[var(--panel-bg)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <button onClick={saveManualVideoId} className="px-4 py-2 text-xs font-medium text-white bg-[var(--accent)] rounded-md cursor-pointer">
                  Save
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0 relative">
            <ZoomableFrame src={chatSrc} title="Live Chat" zoom={zooms.chat} frameClass={noPointer} />
          </div>
          <span className="absolute bottom-2 right-3 text-[8px] tracking-widest font-bold uppercase text-[var(--text-label)] opacity-40 pointer-events-none">
            LIVE CHAT
          </span>
        </div>
      );
    }
    if (id === 'bgm') {
      return (
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto mdock-scroll p-3 gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"></div>
            <button onClick={() => setShowBgmSettings((p) => !p)} className="p-1.5 text-[var(--text-label)] hover:text-[var(--text-main)] cursor-pointer" title="BGM settings">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {showBgmSettings && (
            <div className="p-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-md space-y-3">
              <input
                type="text"
                value={bgmRoomId}
                onChange={(e) => setBgmRoomId(e.target.value)}
                placeholder={`Room ID (kosong = private key)`}
                className="w-full text-xs px-3 py-2 border border-[var(--border-color)] bg-[var(--panel-bg)] rounded-md"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => saveBgmRoom(bgmRoomId, true)}
                  className="flex-1 py-2 text-xs font-medium text-white bg-[var(--accent)] rounded-md cursor-pointer"
                >
                  Connect
                </button>
                <button
                  onClick={() => saveBgmRoom(bgmRoomId, false)}
                  className="flex-1 py-2 text-xs font-medium text-red-500 bg-red-500/10 rounded-md cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}

          {/* Now playing + kontrol — sama seperti widget request queue */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4 space-y-3">
            <div className="flex items-center gap-2 min-w-0">
              <Music className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[12px] truncate">{current ? current.title : 'Belum ada lagu'}</div>
                {current && (
                  <div className="text-[var(--text-label)] text-[9px] truncate">
                    req by {current.requestedBy} • {current.platform}
                  </div>
                )}
              </div>
              <span className={`text-[9px] font-bold uppercase ${song?.isPlaying ? 'text-emerald-500' : 'text-[var(--text-label)]'}`}>
                {song?.isPlaying ? 'Play' : 'Stop'}
              </span>
            </div>
            {/* prev / play-pause / next inline + progress */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => songControl('prev')}
                className="w-8 h-8 shrink-0 grid place-items-center rounded-full bg-[var(--bg-color)] hover:opacity-80 border border-[var(--border-color)] text-[var(--text-main)] cursor-pointer"
                title="Sebelumnya"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => songControl(song?.isPlaying ? 'pause' : 'play')}
                className="w-8 h-8 shrink-0 grid place-items-center rounded-full bg-[var(--text-main)] text-[var(--bg-color)] hover:opacity-85 cursor-pointer"
                title={song?.isPlaying ? 'Pause' : 'Play'}
              >
                {song?.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={() => songControl('next')}
                className="w-8 h-8 shrink-0 grid place-items-center rounded-full bg-[var(--bg-color)] hover:opacity-80 border border-[var(--border-color)] text-[var(--text-main)] cursor-pointer"
                title="Berikutnya"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 min-w-0 mt-3">
                <input
                  type="range"
                  value={Math.min(effPos, Math.max(effDur, 1))}
                  min={0}
                  max={Math.max(effDur, 1)}
                  onChange={(e) => songControl('seek', { seconds: parseFloat(e.target.value) })}
                  className="w-full h-1 appearance-none cursor-pointer accent-[var(--accent)] bg-[var(--border-color)] rounded-full"
                />
                <div className="flex justify-between text-[9px] font-mono text-[var(--text-label)] mt-1">
                  <span>{formatTime(effPos)}</span>
                  <span>{formatTime(effDur)}</span>
                </div>
              </div>
            </div>
            {/* tambah manual */}
            <div className="flex gap-2">
              <input
                value={newBgmUrl}
                onChange={(e) => setNewBgmUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddManual(); }}
                placeholder={`Paste URL YouTube / MP3… (atau ${cmd} di chat)`}
                className="flex-1 h-9 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-3 text-[11px] text-[var(--text-main)] placeholder:text-[var(--text-label)] focus:outline-none"
              />
              <button onClick={handleAddManual} className="shrink-0 w-9 h-9 grid place-items-center rounded-xl bg-[var(--text-main)] text-[var(--bg-color)] hover:opacity-85 cursor-pointer" title="Tambah ke queue">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {song?.lastError && (
              <div className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
                {song.lastError}
              </div>
            )}
          </div>

          {/* Choose song — sama seperti widget request queue */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-3 space-y-2">
            <h4 className="text-[var(--text-label)] text-[9px] font-bold uppercase flex items-center justify-between">
              Choose Song ({queue.length})
              {queue.length > 0 && (
                <button onClick={() => songControl('clear')} className="text-[9px] text-red-500 hover:underline cursor-pointer normal-case font-medium">Clear</button>
              )}
            </h4>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto mdock-scroll">
              {!song || queue.length === 0 ? (
                <div className="text-[10px] text-[var(--text-label)] italic opacity-70">Queue kosong. Ketik {cmd} + URL di chat.</div>
              ) : (
                queue.map((q, i) => (
                  <div
                    key={q.id}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-colors ${
                      current && q.id === current.id
                        ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30'
                        : 'bg-[var(--bg-color)] border-[var(--border-color)]'
                    }`}
                    onClick={() => songControl('choose', { index: i })}
                    title="Klik untuk putar"
                  >
                    <span className={`text-[9px] font-mono w-4 shrink-0 ${current && q.id === current.id ? 'text-[var(--accent)]' : 'text-[var(--text-label)]'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-[var(--text-main)] truncate">{q.title}</div>
                      <div className="text-[8px] text-[var(--text-label)] truncate">{q.requestedBy}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        songControl('remove', { index: i });
                      }}
                      className="shrink-0 p-1 text-[var(--text-label)] hover:text-red-400 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cari YouTube (tambahan mobile-dock) */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={bgmSearchQuery}
                onChange={(e) => setBgmSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchBgm(); }}
                placeholder="Cari lagu YouTube..."
                className="flex-1 text-xs px-3 py-2 border border-[var(--border-color)] bg-[var(--panel-bg)] rounded-md"
              />
              <button onClick={searchBgm} disabled={bgmIsSearching} className="px-3 py-2 text-xs font-medium text-white bg-[var(--accent)] rounded-md cursor-pointer disabled:opacity-50">
                {bgmIsSearching ? '...' : 'Cari'}
              </button>
            </div>
            {bgmSearchError && <p className="text-[10px] text-red-500">{bgmSearchError}</p>}
            {bgmSearchResults.length > 0 && (
              <div className="space-y-1 border border-[var(--border-color)] rounded-md p-1.5 max-h-48 overflow-y-auto mdock-scroll">
                {bgmSearchResults.map((track: YtSearchItem) => (
                  <div
                    key={track.id?.videoId}
                    onClick={() => addBgmUrl(`https://www.youtube.com/watch?v=${track.id?.videoId}`, track.snippet?.title)}
                    className="p-2 cursor-pointer flex items-center gap-2 rounded-md hover:bg-[var(--bg-color)]"
                  >
                    {track.snippet?.thumbnails?.default?.url && (
                      <img src={track.snippet.thumbnails.default.url} alt="" className="w-8 h-8 rounded object-cover bg-[var(--bg-color)] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs truncate">{track.snippet?.title}</p>
                      <p className="text-[10px] truncate text-[var(--text-label)]">{track.snippet?.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    // Panel kustom (tambah via Settings — URL bebas, mendukung {videoId})
    const custom = customPanels.find((c) => c.id === id);
    if (custom) {
      const rawSrc = custom.url.trim();
      const src = rawSrc ? applyPlaceholders(rawSrc, viewStream.videoId) : '';
      return (
        <div className="flex-1 min-h-0 flex flex-col">
          {panelToolbar(custom.id, `Zoom panel ${custom.title}`, src || undefined)}
          <div className="flex-1 min-h-0 relative">
            {src ? (
              <ZoomableFrame src={src} title={custom.title} zoom={zooms[custom.id] ?? 1} frameClass={noPointer} />
            ) : emptyPanel(custom.title)}
          </div>
        </div>
      );
    }
    return null;
  };

  // ---------------------------------------------------------------- render

  return (
    <div className={`min-h-screen overflow-hidden flex flex-col ${themeClass} bg-[var(--bg-color)] text-[var(--text-main)]`}>
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 h-12 border-b border-[var(--border-color)] bg-[var(--panel-bg)] flex justify-between items-center px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[var(--accent)] text-white rounded-md">
            <Radio className="w-3 h-3 animate-pulse" />
          </div>
          <h1 className="text-sm font-bold flex items-center gap-1">
            Mobile Dock
            <span className={`text-[8px] mt-1 px-1 py-0.5 rounded ${viewStream.isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-[var(--bg-color)]'}`}>
              {viewStream.isLive ? 'LIVE' : 'OFFLINE'}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button onClick={() => setShowLayoutMenu((p) => !p)} className="p-1.5 hover:bg-[var(--bg-color)] rounded transition-colors cursor-pointer" title="Layout — atur & kembalikan panel">
              <LayoutGrid className="w-4 h-4" />
            </button>
            {showLayoutMenu && (
              <>
                <button aria-hidden tabIndex={-1} onClick={() => setShowLayoutMenu(false)} className="fixed inset-0 z-[199] cursor-default bg-transparent border-none p-0" />
                <div className="absolute top-full mt-1.5 right-0 z-[200] w-56 rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-2 shadow-lg mdock-animate-fade-in">
                  <p className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--text-label)]">Layout Panel</p>
                  <p className="px-2 pb-2 text-[10px] text-[var(--text-label)]">Drag tab panel ke atas / bawah / kiri / kanan / tengah untuk dock. Hover tab → ✕ untuk sembunyikan.</p>
                  {dockLayout.hidden.length > 0 && (
                    <div className="space-y-1 border-t border-[var(--border-color)] pt-2">
                      <p className="px-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-label)]">Tersembunyi</p>
                      {dockLayout.hidden.map((id) => (
                        <button
                          key={id}
                          onClick={() => handleDockLayoutChange(restoreDockPanel(dockLayout, id))}
                          className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-[var(--bg-color)] text-[var(--text-main)] cursor-pointer"
                        >
                          + {dockTitles[id] ?? id}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="border-t border-[var(--border-color)] mt-2 pt-2">
                    <button onClick={resetDockLayout} className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold text-[var(--text-label)] hover:text-[var(--text-main)] rounded-md cursor-pointer">
                      <RotateCcw className="w-3.5 h-3.5" /> Reset layout bawaan
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <button onClick={openSettings} className="p-1.5 hover:bg-[var(--bg-color)] rounded transition-colors cursor-pointer" title="Settings — kredensial & URL tiap panel">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 hover:bg-[var(--bg-color)] rounded transition-colors cursor-pointer" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => setTheme((p) => (p === 'dark' ? 'light' : 'dark'))} className="p-1.5 hover:bg-[var(--bg-color)] rounded transition-colors cursor-pointer" title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* DOCKABLE LAYOUT — drag tab panel ke atas/bawah/kiri/kanan/tengah (tab stacking), resize via handle */}
      <div ref={containerRef} className="flex-grow pt-12 pb-16 md:pb-0 flex h-screen select-none relative gap-0.5 px-0.5">
        <DockableLayout
          layout={dockLayout}
          onChange={handleDockLayoutChange}
          panels={knownPanels}
          renderTitle={(id) => dockTitles[id] ?? id}
          renderBody={renderDockPanel}
          isMobile={isMobile}
          mobilePanel={mobilePanel}
          onMobilePanelChange={setMobilePanel}
          onResizeActive={setIsDockResizing}
        />
      </div>

      {/* MOBILE DOCK — nav mengikuti panel yang terlihat di layout */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t-2 border-[var(--border-color)] bg-[var(--dock-bg)] backdrop-blur-md flex items-center justify-around px-2 z-50 overflow-x-auto">
        {dockVisiblePanels(dockLayout.root).map((id) => {
          const customTitle = dockTitles[id] ?? id;
          const meta = {
            deck: { label: 'Deck', Icon: Tv },
            control: { label: 'Control', Icon: Sliders },
            alert: { label: 'Alert', Icon: AlertCircle },
            monitor: { label: 'Monitor', Icon: Eye },
            chat: { label: 'Chat', Icon: MessageSquare },
            bgm: { label: 'BGM', Icon: Music },
          }[id] ?? { label: customTitle, Icon: Tv };
          const { label, Icon } = meta;
          return (
            <button
              key={id}
              onClick={() => setMobilePanel(id)}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-colors shrink-0 px-2 ${mobilePanel === id ? 'text-[var(--text-main)]' : 'text-[var(--text-label)]'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-[var(--panel-bg)] border-2 border-[var(--border-color)] max-w-md w-full max-h-[90vh] overflow-y-auto mdock-scroll p-5 space-y-4 mdock-animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b-2 border-[var(--border-color)]">
              <h3 className="text-sm font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Settings className="w-4 h-4" /> Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-[var(--text-label)] hover:text-[var(--text-main)] text-sm font-bold cursor-pointer">
                ✕
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-label)]">Tersimpan di Supabase (terikat private key ini). TipTap key dienkripsi.</p>

            {/* Kredensial */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-label)]">Kredensial</p>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider block">Discord User ID (Lanyard)</label>
                <input
                  type="text"
                  value={tmpCreds.discordUserId}
                  onChange={(e) => setTmpCreds((p) => ({ ...p, discordUserId: e.target.value }))}
                  placeholder="Contoh: 606142918885113886"
                  className="w-full text-xs font-mono px-3 py-2 border-2 border-[var(--border-color)] bg-[var(--bg-color)] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider block">Streamer.bot Deck ID / URL</label>
                <div className="relative flex items-center">
                  <input
                    type={mask.deck ? 'password' : 'text'}
                    value={tmpCreds.deckId}
                    onChange={(e) => setTmpCreds((p) => ({ ...p, deckId: e.target.value }))}
                    placeholder="ID deck atau URL embed"
                    className="w-full text-xs font-mono pl-3 pr-10 py-2 border-2 border-[var(--border-color)] bg-[var(--bg-color)] focus:outline-none"
                  />
                  <button type="button" onClick={() => setMask((p) => ({ ...p, deck: !p.deck }))} className="absolute right-2.5 p-1 text-[var(--text-label)] hover:text-[var(--text-main)] cursor-pointer">
                    {mask.deck ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider block">TipTap Private Key</label>
                <div className="relative flex items-center">
                  <input
                    type={mask.key ? 'password' : 'text'}
                    value={tmpCreds.tiptapKey}
                    onChange={(e) => setTmpCreds((p) => ({ ...p, tiptapKey: e.target.value }))}
                    placeholder="Private token TipTap"
                    className="w-full text-xs font-mono pl-3 pr-10 py-2 border-2 border-[var(--border-color)] bg-[var(--bg-color)] focus:outline-none"
                  />
                  <button type="button" onClick={() => setMask((p) => ({ ...p, key: !p.key }))} className="absolute right-2.5 p-1 text-[var(--text-label)] hover:text-[var(--text-main)] cursor-pointer">
                    {mask.key ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider block">TipTap Alert Widget ID</label>
                <div className="relative flex items-center">
                  <input
                    type={mask.widget ? 'password' : 'text'}
                    value={tmpCreds.tiptapWidget}
                    onChange={(e) => setTmpCreds((p) => ({ ...p, tiptapWidget: e.target.value }))}
                    placeholder="ID widget alert"
                    className="w-full text-xs font-mono pl-3 pr-10 py-2 border-2 border-[var(--border-color)] bg-[var(--bg-color)] focus:outline-none"
                  />
                  <button type="button" onClick={() => setMask((p) => ({ ...p, widget: !p.widget }))} className="absolute right-2.5 p-1 text-[var(--text-label)] hover:text-[var(--text-main)] cursor-pointer">
                    {mask.widget ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider block">Default Video ID (offline)</label>
                <input
                  type="text"
                  value={tmpCreds.manualVideoId}
                  onChange={(e) => setTmpCreds((p) => ({ ...p, manualVideoId: e.target.value }))}
                  placeholder="Video ID YouTube"
                  className="w-full text-xs font-mono px-3 py-2 border-2 border-[var(--border-color)] bg-[var(--bg-color)] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider block">BGM Room ID</label>
                <input
                  type="text"
                  value={tmpCreds.bgmRoomId}
                  onChange={(e) => setTmpCreds((p) => ({ ...p, bgmRoomId: e.target.value }))}
                  placeholder="Kosong = private key"
                  className="w-full text-xs font-mono px-3 py-2 border-2 border-[var(--border-color)] bg-[var(--bg-color)] focus:outline-none"
                />
              </div>
            </div>

            {/* URL tiap panel */}
            <div className="space-y-3 pt-2 border-t-2 border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-label)]">URL tiap panel</p>
                <button
                  onClick={() => setTmpUrls(buildDefaultUrls(tmpCreds.deckId, tmpCreds.tiptapKey, tmpCreds.tiptapWidget))}
                  className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] hover:underline cursor-pointer"
                >
                  Reset bawaan
                </button>
              </div>
              {urlFields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider block">{f.label}</label>
                  <input
                    type="text"
                    value={tmpUrls[f.key]}
                    onChange={(e) => setTmpUrls((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder="Kosong = URL bawaan"
                    className="w-full text-xs font-mono px-3 py-2 border-2 border-[var(--border-color)] bg-[var(--bg-color)] focus:outline-none"
                  />
                  <p className="text-[9px] text-[var(--text-label)] opacity-85">{f.hint}</p>
                </div>
              ))}
            </div>

            {/* Panel kustom — tambah dock baru dengan URL sendiri */}
            <div className="space-y-3 pt-2 border-t-2 border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-label)]">Panel kustom ({tmpCustom.length}/20)</p>
                <button
                  onClick={() => setTmpCustom((p) => (p.length >= 20 ? p : [...p, { id: `custom_${Date.now().toString(36)}`, title: `Custom ${p.length + 1}`, url: '' }]))}
                  className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] hover:underline cursor-pointer"
                >
                  + Tambah panel
                </button>
              </div>
              <p className="text-[9px] text-[var(--text-label)] opacity-85">Dock baru dengan URL apapun (bisa pakai {'{videoId}'}). Setelah disimpan, panel muncul di layout dan bisa di-drag seperti panel lain.</p>
              {tmpCustom.map((c, i) => (
                <div key={c.id} className="space-y-1 border border-[var(--border-color)] p-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c.title}
                      onChange={(e) => setTmpCustom((p) => p.map((x, xi) => (xi === i ? { ...x, title: e.target.value } : x)))}
                      placeholder="Nama panel"
                      className="flex-1 min-w-0 text-xs font-bold px-3 py-2 border-2 border-[var(--border-color)] bg-[var(--bg-color)] focus:outline-none"
                    />
                    <button
                      onClick={() => setTmpCustom((p) => p.filter((_, xi) => xi !== i))}
                      className="shrink-0 p-2 text-[var(--text-label)] hover:text-red-400 cursor-pointer"
                      title="Hapus panel ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={c.url}
                    onChange={(e) => setTmpCustom((p) => p.map((x, xi) => (xi === i ? { ...x, url: e.target.value } : x)))}
                    placeholder="https://… (URL embed)"
                    className="w-full text-xs font-mono px-3 py-2 border-2 border-[var(--border-color)] bg-[var(--bg-color)] focus:outline-none"
                  />
                </div>
              ))}
              {tmpCustom.length === 0 && (
                <p className="text-[10px] text-[var(--text-label)] italic">Belum ada panel kustom.</p>
              )}
            </div>

            {saveError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t-2 border-[var(--border-color)] justify-end">
              <button onClick={() => setShowSettings(false)} disabled={isSaving} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-label)] hover:bg-[var(--bg-color)] cursor-pointer disabled:opacity-50">
                Batal
              </button>
              <button
                disabled={isSaving}
                onClick={saveSettings}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-[var(--text-main)] text-[var(--bg-color)] border-2 border-[var(--border-color)] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
