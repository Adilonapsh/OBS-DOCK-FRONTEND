'use client';

/**
 * Music / BGM Control - self-contained (socket sendiri), reusable di dock mana pun.
 *
 * Fitur: now playing, play/pause/prev/next, seek, add URL, search YouTube via
 * backend, sort/remove queue, dan ganti room BGM. State server-authoritative
 * (`song-*`) sehingga sinkron dengan widget request queue & dock desktop.
 */

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  ChevronDown, ChevronUp, GripVertical, Loader2, Music, Pause, Play, Plus,
  Settings, SkipBack, SkipForward, Trash2, Wifi, WifiOff,
} from 'lucide-react';
import { getSocketUrl } from '@/app/widgets/_shared/utils/socket';

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

type YtSearchItem = {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
};

export type MusicControlProps = {
  /** Room efektif untuk playback (bgmRoom || privateKey). */
  room: string;
  /** Nilai room yang tersimpan di config (untuk form settings). */
  roomId?: string;
  /** Simpan room baru ke config. Return false = gagal simpan. */
  onSaveRoom?: (nextRoom: string) => Promise<boolean> | boolean | void;
};

function formatTime(secs: number): string {
  const s = Math.max(0, Math.floor(secs || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function toWatchUrl(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^[A-Za-z0-9_-]{11}$/.test(t)) return `https://www.youtube.com/watch?v=${t}`;
  const m = t.match(/[?&]v=([A-Za-z0-9_-]{11})/) || t.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/watch?v=${m[1]}`;
  return null;
}

function localUserName(): string {
  try {
    const raw = localStorage.getItem('obs-login');
    const email = raw ? JSON.parse(raw).email : '';
    if (email) return String(email).split('@')[0].slice(0, 30);
  } catch {}
  return 'dock';
}

export default function MusicControl({ room, roomId, onSaveRoom }: MusicControlProps) {
  const [song, setSong] = useState<SongState | null>(null);
  const [connected, setConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draftRoom, setDraftRoom] = useState(roomId ?? '');
  const [savingRoom, setSavingRoom] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [newUrl, setNewUrl] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YtSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchWarning, setSearchWarning] = useState<string | null>(null);
  const [searchSource, setSearchSource] = useState('');

  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [localPos, setLocalPos] = useState(0);
  const [seekDrag, setSeekDrag] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const effectiveRoom = room.trim() || 'global';

  const currentSongId = song && song.queue.length > 0
    ? song.queue[Math.min(song.currentIndex, song.queue.length - 1)].id
    : null;

  useEffect(() => {
    if (!song?.isPlaying) return;
    const id = setInterval(() => setLocalPos((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [song?.isPlaying, currentSongId]);

  useEffect(() => {
    const s = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 900,
    });
    socketRef.current = s;

    const onUpdate = (st: SongState) => {
      if (!st || (st.room && st.room !== effectiveRoom)) return;
      setSong(st);
      setLocalPos(st.position || 0);
    };
    const onSearchResult = (res: { results?: YtSearchItem[]; source?: string; warning?: string }) => {
      setSearching(false);
      setResults(Array.isArray(res?.results) ? res.results : []);
      setSearchSource(String(res?.source || ''));
      setSearchWarning(typeof res?.warning === 'string' ? res.warning : null);
      setSearchError(!res?.results || res.results.length === 0
        ? 'Tidak ketemu — coba kata kunci lain atau paste link langsung.'
        : null);
    };
    const onConnect = () => {
      setConnected(true);
      s.emit('join-room', effectiveRoom);
      s.emit('song-get', { privateKey: effectiveRoom });
    };
    const onDisconnect = () => setConnected(false);

    s.on('song-update', onUpdate);
    s.on('song-search-result', onSearchResult);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('song-update', onUpdate);
      s.off('song-search-result', onSearchResult);
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.disconnect();
      if (socketRef.current === s) socketRef.current = null;
      setConnected(false);
    };
  }, [effectiveRoom]);

  const control = (action: string, extra: Record<string, unknown> = {}) => {
    socketRef.current?.emit('song-control', { privateKey: effectiveRoom, action, ...extra });
  };

  const moveSong = (from: number, to: number) => {
    const len = song?.queue.length ?? 0;
    if (from === to || from < 0 || to < 0 || from >= len || to >= len) return;
    control('move', { from, to });
  };

  const addUrl = (raw: string, title?: string) => {
    const url = toWatchUrl(raw);
    if (!url) return;
    socketRef.current?.emit('song-add', {
      privateKey: effectiveRoom,
      url,
      ...(title ? { title } : {}),
      requestedBy: localUserName(),
      platform: 'dock',
    });
  };

  const handleAddManual = () => {
    if (!newUrl.trim()) return;
    addUrl(newUrl);
    setNewUrl('');
  };

  const search = () => {
    const q = query.trim();
    if (!q) return;
    const s = socketRef.current;
    if (!s) {
      setSearchError('Belum terhubung — cek koneksi backend.');
      return;
    }
    setSearching(true);
    setSearchError(null);
    setSearchWarning(null);
    s.emit('song-search', { q: q.slice(0, 100), maxResults: 6 });
  };

  const saveRoom = async () => {
    if (!onSaveRoom) {
      setShowSettings(false);
      return;
    }
    setSavingRoom(true);
    setSaveError(null);
    try {
      const ok = await onSaveRoom(draftRoom.trim());
      if (ok === false) setSaveError('Gagal menyimpan room. Coba lagi.');
      else setShowSettings(false);
    } catch {
      setSaveError('Gagal menyimpan room. Coba lagi.');
    } finally {
      setSavingRoom(false);
    }
  };

  const queue = song?.queue ?? [];
  const current = queue.length > 0 ? queue[Math.min(song?.currentIndex ?? 0, queue.length - 1)] : null;
  const effPos = song?.isPlaying ? Math.max(song.position || 0, localPos) : song?.position || 0;
  const duration = song?.duration || 0;
  const sliderPos = seekDrag ?? Math.min(effPos, Math.max(duration, 1));
  const cmd = song?.settings?.command || '!song';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto mdock-scroll p-3 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Music className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-black uppercase tracking-wider">Music</span>
          <span className={`flex items-center gap-0.5 text-[8px] font-bold uppercase ${connected ? 'text-emerald-500' : 'text-red-500'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Live' : 'Off'}
          </span>
        </div>
        <button
          onClick={() => {
            setDraftRoom(roomId ?? '');
            setShowSettings((p) => !p);
          }}
          className="p-1.5 text-[var(--text-label)] hover:text-[var(--text-main)] cursor-pointer"
          title="Music settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {showSettings && (
        <div className="p-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-md space-y-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-label)]">Room BGM</label>
          <input
            value={draftRoom}
            onChange={(e) => setDraftRoom(e.target.value)}
            placeholder="Kosong = private key"
            className="w-full text-xs px-3 py-2 border border-[var(--border-color)] bg-[var(--panel-bg)] rounded-md focus:outline-none"
          />
          {saveError && <p className="text-[10px] text-red-500">{saveError}</p>}
          <div className="flex gap-2">
            <button
              onClick={saveRoom}
              disabled={savingRoom}
              className="flex-1 py-2 text-xs font-medium text-white bg-[var(--accent)] rounded-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {savingRoom && <Loader2 className="w-3 h-3 animate-spin" />} Simpan
            </button>
            <button
              onClick={() => setDraftRoom('')}
              className="flex-1 py-2 text-xs font-medium text-[var(--text-label)] bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-md cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Now playing + transport */}
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
          <span className={`text-[9px] font-bold uppercase shrink-0 ${song?.isPlaying ? 'text-emerald-500' : 'text-[var(--text-label)]'}`}>
            {song?.isPlaying ? 'Play' : 'Stop'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => control('prev')}
            className="w-8 h-8 shrink-0 grid place-items-center rounded-full bg-[var(--bg-color)] hover:opacity-80 border border-[var(--border-color)] cursor-pointer"
            title="Sebelumnya"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => control(song?.isPlaying ? 'pause' : 'play')}
            className="w-8 h-8 shrink-0 grid place-items-center rounded-full bg-[var(--text-main)] text-[var(--bg-color)] hover:opacity-85 cursor-pointer"
            title={song?.isPlaying ? 'Pause' : 'Play'}
          >
            {song?.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => control('next')}
            className="w-8 h-8 shrink-0 grid place-items-center rounded-full bg-[var(--bg-color)] hover:opacity-80 border border-[var(--border-color)] cursor-pointer"
            title="Berikutnya"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 min-w-0 mt-3">
            <input
              type="range"
              value={sliderPos}
              min={0}
              max={Math.max(duration, 1)}
              step={1}
              disabled={duration <= 0}
              onChange={(e) => setSeekDrag(parseFloat(e.target.value))}
              onPointerUp={() => {
                if (seekDrag !== null) {
                  control('seek', { seconds: seekDrag });
                  setSeekDrag(null);
                }
              }}
              className="w-full h-1 appearance-none cursor-pointer accent-[var(--accent)] bg-[var(--border-color)] rounded-full disabled:opacity-40"
              title={duration > 0 ? 'Geser untuk seek' : 'Belum ada lagu'}
            />
            <div className="flex justify-between text-[9px] font-mono text-[var(--text-label)] mt-1">
              <span>{formatTime(seekDrag ?? effPos)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddManual();
            }}
            placeholder={`Paste URL YouTube / MP3… (atau ${cmd} di chat)`}
            className="flex-1 h-9 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-3 text-[11px] focus:outline-none"
          />
          <button
            onClick={handleAddManual}
            className="shrink-0 w-9 h-9 grid place-items-center rounded-xl bg-[var(--text-main)] text-[var(--bg-color)] hover:opacity-85 cursor-pointer"
            title="Tambah ke queue"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {song?.lastError && (
          <div className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
            {song.lastError}
          </div>
        )}
      </div>

      {/* Queue */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-3 space-y-2">
        <h4 className="text-[var(--text-label)] text-[9px] font-bold uppercase flex items-center justify-between">
          Choose Song ({queue.length})
          {queue.length > 0 && (
            <button onClick={() => control('clear')} className="text-[9px] text-red-500 hover:underline cursor-pointer normal-case font-medium">
              Clear
            </button>
          )}
        </h4>
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto mdock-scroll">
          {queue.length === 0 ? (
            <div className="text-[10px] text-[var(--text-label)] italic opacity-70">
              Queue kosong. Ketik {cmd} + URL di chat.
            </div>
          ) : (
            queue.map((item, i) => (
              <div
                key={item.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom !== null) moveSong(dragFrom, i);
                  setDragFrom(null);
                  setDragOver(null);
                }}
                className={`flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer transition-colors ${
                  current && item.id === current.id
                    ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30'
                    : 'bg-[var(--bg-color)] border-[var(--border-color)]'
                } ${dragOver === i ? 'ring-1 ring-[var(--accent)] border-[var(--accent)]' : ''} ${dragFrom === i ? 'opacity-50' : ''}`}
                onClick={() => control('choose', { index: i })}
                title="Klik untuk putar • drag handle / tombol ↑↓ untuk sort"
              >
                <span
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setDragFrom(i);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    setDragFrom(null);
                    setDragOver(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 p-1 -ml-1 cursor-grab active:cursor-grabbing text-[var(--text-label)] touch-none"
                  title="Drag untuk sort"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </span>
                <span className={`text-[9px] font-mono w-4 shrink-0 ${current && item.id === current.id ? 'text-[var(--accent)]' : 'text-[var(--text-label)]'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold truncate">{item.title}</div>
                  <div className="text-[8px] text-[var(--text-label)] truncate">{item.requestedBy}</div>
                </div>
                <span className="shrink-0 flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => moveSong(i, i - 1)}
                    disabled={i === 0}
                    className="p-0.5 text-[var(--text-label)] hover:text-[var(--text-main)] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                    title="Naik"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moveSong(i, i + 1)}
                    disabled={i >= queue.length - 1}
                    className="p-0.5 text-[var(--text-label)] hover:text-[var(--text-main)] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                    title="Turun"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    control('remove', { index: i });
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

      {/* Search */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') search();
            }}
            placeholder="Cari lagu YouTube..."
            className="flex-1 text-xs px-3 py-2 border border-[var(--border-color)] bg-[var(--panel-bg)] rounded-md focus:outline-none"
          />
          <button
            onClick={search}
            disabled={searching}
            className="px-3 py-2 text-xs font-medium text-white bg-[var(--accent)] rounded-md cursor-pointer disabled:opacity-50"
          >
            {searching ? '...' : 'Cari'}
          </button>
          <span className="shrink-0 px-2 py-2 text-[9px] font-bold rounded-md border border-[var(--border-color)] text-[var(--text-label)]">
            {searching ? '…' : searchSource === 'youtube-api' ? 'API' : searchSource === 'scrape' ? 'Cad.' : 'YT'}
          </span>
        </div>
        {searchWarning && <p className="text-[10px] text-yellow-500">{searchWarning}</p>}
        {searchError && <p className="text-[10px] text-red-500">{searchError}</p>}
        {results.length > 0 && (
          <div className="space-y-1 border border-[var(--border-color)] rounded-md p-1.5 max-h-48 overflow-y-auto mdock-scroll">
            {results.map((track) => (
              <button
                key={track.videoId}
                onClick={() => {
                  addUrl(track.url, track.title);
                  setSearching(false);
                }}
                className="w-full text-left p-2 flex items-center gap-2 rounded-md hover:bg-[var(--bg-color)] cursor-pointer"
              >
                {track.thumbnail && (
                  <img src={track.thumbnail} alt="" className="w-8 h-8 rounded object-cover bg-[var(--bg-color)] shrink-0" />
                )}
                <span className="min-w-0">
                  <span className="block text-xs truncate">{track.title}</span>
                  {track.channel && <span className="block text-[10px] truncate text-[var(--text-label)]">{track.channel}</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
