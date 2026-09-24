'use client';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Play, Pause, SkipForward, SkipBack, Trash2, Plus, Music, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { getSocketUrl } from '../../widgets/_shared/utils/socket';

export type SongItem = {
  id: string;
  url: string;
  videoId: string | null;
  kind: 'youtube' | 'audio';
  title: string;
  requestedBy: string;
  platform: string;
  addedAt: number;
};

export type SongState = {
  room: string;
  queue: SongItem[];
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  updatedAt: number;
};

type LyricLine = { timeMs: number; text: string };

function parseLRC(lrc: string): LyricLine[] {
  if (!lrc) return [];
  const result: LyricLine[] = [];
  const timeRe = /\[(\d+):(\d+)(?:\.(\d+))?\]/g;
  for (const line of lrc.split('\n')) {
    const times: number[] = [];
    let m: RegExpExecArray | null;
    timeRe.lastIndex = 0;
    while ((m = timeRe.exec(line)) !== null) {
      const msPart = m[3] ? m[3].padEnd(3, '0').slice(0, 3) : '0';
      times.push(parseInt(m[1], 10) * 60000 + parseInt(m[2], 10) * 1000 + parseInt(msPart, 10));
    }
    const text = line.replace(/\[.*?\]/g, '').trim();
    if (times.length === 0) continue;
    for (const t of times) result.push({ timeMs: t, text });
  }
  result.sort((a, b) => a.timeMs - b.timeMs);
  return result;
}

async function fetchLyrics(title: string): Promise<{ synced: LyricLine[]; plain: string }> {
  // Judul format "Artis - Lagu" (dari oEmbed YouTube)
  const parts = title.split(' - ');
  const artist = parts.length > 1 ? parts[0].trim() : '';
  const track = parts.length > 1 ? parts.slice(1).join(' - ').trim() : title.trim();
  if (!track) return { synced: [], plain: '' };
  try {
    const qs = new URLSearchParams({ artist_name: artist, track_name: track });
    const res = await fetch(`https://lrclib.net/api/get?${qs.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.syncedLyrics || data.plainLyrics)) {
        return { synced: parseLRC(data.syncedLyrics || ''), plain: data.plainLyrics || '' };
      }
    }
  } catch {}
  try {
    const qs2 = new URLSearchParams({ track_name: track, artist_name: artist });
    const res2 = await fetch(`https://lrclib.net/api/search?${qs2.toString()}`);
    if (res2.ok) {
      const arr = await res2.json();
      if (Array.isArray(arr) && arr.length > 0) {
        return { synced: parseLRC(arr[0].syncedLyrics || ''), plain: arr[0].plainLyrics || '' };
      }
    }
  } catch {}
  return { synced: [], plain: '' };
}

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function MusicControl({
  getRoom,
}: {
  getRoom: () => string;
}) {
  const [song, setSong] = useState<SongState | null>(null);
  const [addUrl, setAddUrl] = useState('');
  // Search lagu via backend (YouTube Data API resmi, fallback scrape bila key/quota habis).
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ videoId: string; title: string; channel: string; thumbnail: string; url: string }>>([]);
  const [searchSource, setSearchSource] = useState('');
  const [searchWarning, setSearchWarning] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lyrics, setLyrics] = useState<{ synced: LyricLine[]; plain: string }>({ synced: [], plain: '' });
  const [lyricsFor, setLyricsFor] = useState('');
  // Posisi drag slider (seek) — dikirim ke server saat dilepas agar tidak spam.
  const [seekDrag, setSeekDrag] = useState<number | null>(null);
  // Sort queue via drag handle / tombol up-down — dikirim ke server (song-control move).
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  // Posisi lokal: server hanya update bila display player terbuka,
  // jadi dock menghitung sendiri agar highlight lirik tetap jalan.
  const [localPos, setLocalPos] = useState(0);
  const songId = song && song.queue.length > 0 ? song.queue[Math.min(song.currentIndex, song.queue.length - 1)].id : null;

  useEffect(() => {
    setLocalPos(song?.position || 0);
  }, [song?.position, songId]);

  useEffect(() => {
    if (!song?.isPlaying) return;
    const id = setInterval(() => setLocalPos((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [song?.isPlaying, songId]);

  const effPos = song?.isPlaying ? Math.max(song.position || 0, localPos) : song?.position || 0;
  const socketRef = useRef<Socket | null>(null);

  // Koneksi socket sendiri (jangan nebeng socket dock) — dijamin ada
  // sehingga refresh dock tidak pernah kehilangan queue.
  // Filter by room: backend broadcast global, jadi abaikan update milik room lain.
  const room = getRoom();
  useEffect(() => {
    const s = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    socketRef.current = s;
    const onUpdate = (st: SongState & { room?: string }) => {
      if (st && st.room && st.room !== room) return;
      setSong(st);
    };
    s.on('song-update', onUpdate);
    const onSearchResult = (res: { q?: string; results?: Array<{ videoId: string; title: string; channel: string; thumbnail: string; url: string }>; source?: string; warning?: string }) => {
      setSearching(false);
      setSearchResults(Array.isArray(res?.results) ? res.results : []);
      setSearchSource(String(res?.source || ''));
      setSearchWarning(typeof res?.warning === 'string' ? res.warning : null);
    };
    s.on('song-search-result', onSearchResult);
    s.on('connect', () => {
      s.emit('join-room', room);
      s.emit('song-get', { privateKey: room });
    });
    // room bisa berubah setelah privateKey terverifikasi — sinkron ulang
    if (s.connected) {
      s.emit('join-room', room);
      s.emit('song-get', { privateKey: room });
    }
    return () => {
      s.off('song-update', onUpdate);
      s.off('song-search-result', onSearchResult);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      s.disconnect();
      socketRef.current = null;
    };
  }, [room]);

  const getSocket = () => socketRef.current;

  const current = song && song.queue.length > 0 ? song.queue[Math.min(song.currentIndex, song.queue.length - 1)] : null;

  useEffect(() => {
    if (!current || lyricsFor === current.id) return;
    setLyricsFor(current.id);
    setLyrics({ synced: [], plain: '' });
    fetchLyrics(current.title).then(setLyrics);
  }, [current, lyricsFor]);

  const control = (action: string, extra: Record<string, unknown> = {}) => {
    const s = getSocket();
    if (!s) return;
    s.emit('song-control', { privateKey: getRoom(), action, ...extra });
  };

  // Pindah posisi queue (sort). Server menyesuaikan currentIndex by id.
  const moveSong = (from: number, to: number) => {
    const len = song?.queue.length || 0;
    if (from === to || from < 0 || to < 0 || from >= len || to >= len) return;
    control('move', { from, to });
  };

  const handleAdd = () => {
    const url = addUrl.trim();
    if (!url) return;
    const s = getSocket();
    if (!s) return;
    let who = 'dock';
    try {
      const raw = localStorage.getItem('obs-login');
      const email = raw ? JSON.parse(raw).email : '';
      if (email) who = String(email).split('@')[0];
    } catch {}
    s.emit('song-add', { privateKey: getRoom(), url, requestedBy: who });
    setAddUrl('');
  };

  const dockWho = () => {
    try {
      const raw = localStorage.getItem('obs-login');
      const email = raw ? JSON.parse(raw).email : '';
      if (email) return String(email).split('@')[0];
    } catch {}
    return 'dock';
  };

  // Search debounce 500ms ke backend (pakai YouTube API resmi bila YOUTUBE_API_KEY di-set).
  const handleSearchChange = (v: string) => {
    setSearchQuery(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!v.trim()) {
      setSearchResults([]);
      setSearchWarning(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      getSocket()?.emit('song-search', { q: v.trim(), maxResults: 6 });
    }, 500);
  };

  const handlePickResult = (r: { videoId: string; title: string; channel: string; thumbnail: string; url: string }) => {
    const s = getSocket();
    if (!s) return;
    s.emit('song-add', { privateKey: getRoom(), url: r.url, title: r.title, requestedBy: dockWho(), platform: 'dock' });
    setSearchQuery('');
    setSearchResults([]);
    setSearchWarning(null);
  };

  const dur = song?.duration || 0;
  // Nilai slider: saat di-drag tampilkan posisi drag, selain itu ikuti server.
  const sliderPos = seekDrag ?? Math.min(effPos, Math.max(dur, 0));
  const commitSeek = () => {
    if (seekDrag === null) return;
    control('seek', { seconds: seekDrag });
    setSeekDrag(null);
  };
  const cmd = (song as (SongState & { settings?: { command?: string } }) | null)?.settings?.command || '!song';
  const lastError = (song as (SongState & { lastError?: string | null }) | null)?.lastError || null;
  const activeLyric =
    lyrics.synced.length > 0 && song
      ? [...lyrics.synced].reverse().find((l) => l.timeMs <= effPos * 1000)
      : null;

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 min-h-0">
      {/* Now playing + kontrol */}
      <div className="stat-card space-y-3">
        <div className="flex items-center gap-2 min-w-0">
          <Music className="w-4 h-4 text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-white font-black text-[12px] truncate">{current ? current.title : 'Belum ada lagu'}</div>
            {current && (
              <div className="text-gray-500 text-[9px] truncate">
                req by {current.requestedBy} • {current.platform}
              </div>
            )}
          </div>
          <span className={`text-[9px] font-black uppercase ${song?.isPlaying ? 'text-green-400' : 'text-gray-500'}`}>
            {song?.isPlaying ? 'Play' : 'Stop'}
          </span>
        </div>
        {/* prev / play-pause / next inline + progress */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => control('prev')}
            className="w-8 h-8 shrink-0 grid place-items-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300"
            title="Sebelumnya"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => control(song?.isPlaying ? 'pause' : 'play')}
            className="w-8 h-8 shrink-0 grid place-items-center rounded-full bg-white text-black hover:bg-zinc-200"
            title={song?.isPlaying ? 'Pause' : 'Play'}
          >
            {song?.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => control('next')}
            className="w-8 h-8 shrink-0 grid place-items-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300"
            title="Berikutnya"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 min-w-0 mt-3">
            {/* Slider seek — kontrol progress hanya dari dock (desktop/mobile).
                Widget display murni penampil, tidak bisa seek. */}
            <input
              type="range"
              value={sliderPos}
              min={0}
              max={Math.max(dur, 1)}
              step={1}
              disabled={dur <= 0}
              onChange={(e) => setSeekDrag(parseFloat(e.target.value))}
              onPointerUp={commitSeek}
              onKeyUp={commitSeek}
              onBlur={commitSeek}
              className="w-full h-1 appearance-none cursor-pointer accent-green-500 bg-white/10 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
              title={dur > 0 ? 'Geser untuk seek' : 'Belum ada lagu'}
            />
            <div className="flex justify-between text-[9px] font-mono text-gray-500 mt-1">
              <span>{fmtTime(seekDrag ?? effPos)}</span>
              <span>{fmtTime(dur)}</span>
            </div>
          </div>
        </div>
        {/* tambah manual */}
        <div className="flex gap-2">
          <input
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={`Paste URL YouTube / MP3… (atau ${cmd} di chat)`}
            className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
          />
          <button onClick={handleAdd} className="shrink-0 w-9 h-9 grid place-items-center rounded-xl bg-white text-black hover:bg-zinc-200" title="Tambah ke queue">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {/* search via YouTube API resmi (backend) */}
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari judul di YouTube… (resmi API)"
              className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
            />
            <span className="shrink-0 h-9 px-2 grid place-items-center rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase text-gray-400">
              {searching ? '…' : searchSource === 'youtube-api' ? 'API' : searchSource === 'scrape' ? 'Cad.' : 'YT'}
            </span>
          </div>
          {searchWarning && (
            <div className="text-[9px] font-bold text-yellow-300/90">{searchWarning}</div>
          )}
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-[180px] overflow-y-auto custom-scrollbar">
              {searchResults.map((r) => (
                <button
                  key={r.videoId}
                  onClick={() => handlePickResult(r)}
                  className="w-full flex items-center gap-2 p-1.5 rounded-lg border bg-white/5 border-white/5 hover:bg-white/10 text-left"
                  title="Klik untuk tambah ke queue"
                >
                  {r.thumbnail ? (
                    <img src={r.thumbnail} alt="" className="w-10 h-[22px] rounded object-cover shrink-0" loading="lazy" />
                  ) : null}
                  <span className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold text-white truncate">{r.title}</span>
                    {r.channel && <span className="block text-[8px] text-gray-500 truncate">{r.channel}</span>}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-green-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
        {lastError && (
          <div className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
            {lastError}
          </div>
        )}
      </div>

      {/* grid 2: lirik + choose song */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card space-y-2 min-h-[180px]">
          <h4 className="text-gray-500 text-[9px] font-black uppercase flex items-center justify-between">
            Lirik
            {current && (lyrics.synced.length > 0 || lyrics.plain) && (
              <span className={`text-[8px] font-mono ${lyrics.synced.length > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                {lyrics.synced.length > 0 ? 'SYNCED' : 'PLAIN'}
              </span>
            )}
          </h4>
          <div className="min-h-[48px] flex items-center">
            {lyrics.synced.length > 0 ? (
              <div className="text-[13px] font-black text-white leading-relaxed">
                {activeLyric ? activeLyric.text || '•' : '…'}
              </div>
            ) : lyrics.plain ? (
              <div className="text-[10px] text-gray-400 whitespace-pre-wrap leading-relaxed">{lyrics.plain.slice(0, 800)}</div>
            ) : (
              <div className="text-[10px] text-gray-600 italic">{current ? 'Lirik tidak ditemukan.' : 'Putar lagu untuk lihat lirik.'}</div>
            )}
          </div>
        </div>
        <div className="stat-card space-y-2 min-h-[180px]">
          <h4 className="text-gray-500 text-[9px] font-black uppercase">Choose Song ({song?.queue.length || 0})</h4>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
            {!song || song.queue.length === 0 ? (
              <div className="text-[10px] text-gray-600 italic">Queue kosong. Ketik !song + URL di chat.</div>
            ) : (
              song.queue.map((q, i) => (
                <div
                  key={q.id}
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
                    current && q.id === current.id
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  } ${dragOver === i ? 'ring-1 ring-green-400 border-green-400' : ''} ${
                    dragFrom === i ? 'opacity-50' : ''
                  }`}
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
                    className="shrink-0 p-1 -ml-1 cursor-grab active:cursor-grabbing text-gray-600 hover:text-white touch-none"
                    title="Drag untuk sort"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </span>
                  <span className={`text-[9px] font-mono w-4 shrink-0 ${current && q.id === current.id ? 'text-green-400' : 'text-gray-600'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-white truncate">{q.title}</div>
                    <div className="text-[8px] text-gray-500 truncate">{q.requestedBy}</div>
                  </div>
                  <span className="shrink-0 flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => moveSong(i, i - 1)}
                      disabled={i === 0}
                      className="p-0.5 text-gray-600 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Naik"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveSong(i, i + 1)}
                      disabled={song !== null && i >= song.queue.length - 1}
                      className="p-0.5 text-gray-600 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
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
                    className="shrink-0 p-1 text-gray-600 hover:text-red-400"
                    title="Hapus"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
