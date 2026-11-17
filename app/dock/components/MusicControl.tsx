'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Play, Pause, SkipForward, SkipBack, Trash2, Plus, Music, GripVertical, ChevronUp, ChevronDown, Heart, ExternalLink, Loader2, Ban, Search, X, History } from 'lucide-react';
import { getSocketUrl } from '../../widgets/_shared/utils/socket';
import { useLikedSongs } from '@/app/hooks/useLikedSongs';
import { useSongBlacklist } from '@/app/hooks/useSongBlacklist';
import { useSongHistory } from '@/app/hooks/useSongHistory';
import { parseYouTubeVideoId, type LikedSong } from '@/app/lib/likedSongs';

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
  const lastSearchedRef = useRef('');
  const SEARCH_DEBOUNCE_MS = 600;
  // Filter daftar Liked Songs (judul / channel / catatan).
  const [likedQuery, setLikedQuery] = useState('');
  // Filter riwayat lagu yang sudah diputar.
  const [historyQuery, setHistoryQuery] = useState('');
  const [lyrics, setLyrics] = useState<{ synced: LyricLine[]; plain: string }>({ synced: [], plain: '' });
  const [lyricsFor, setLyricsFor] = useState('');
  // Posisi drag slider (seek) - dikirim ke server saat dilepas agar tidak spam.
  const [seekDrag, setSeekDrag] = useState<number | null>(null);
  // Sort queue via drag handle / tombol up-down - dikirim ke server (song-control move).
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

  // Koneksi socket sendiri (jangan nebeng socket dock) - dijamin ada
  // sehingga refresh dock tidak pernah kehilangan queue.
  // Filter by room: backend broadcast global, jadi abaikan update milik room lain.
  const room = getRoom();
  // Liked Songs per private key (RPC) atau per akun login (RLS).
  const {
    songs: likedSongs,
    loading: likedLoading,
    saving: likedSaving,
    error: likedError,
    addLiked,
    removeLiked,
    findLiked,
  } = useLikedSongs(room);
  const {
    saving: blacklistSaving,
    error: blacklistError,
    addBlacklisted,
    removeBlacklisted,
    findBlacklisted,
    isBlacklisted,
  } = useSongBlacklist(room);
  const {
    items: history,
    loading: historyLoading,
    saving: historySaving,
    error: historyError,
    refresh: refreshHistory,
    removeEntry: removeHistoryEntry,
    clearHistory,
  } = useSongHistory(room);
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
      if (res?.q) {
        lastSearchedRef.current = String(res.q).trim();
      }
      setSearchResults(Array.isArray(res?.results) ? res.results : []);
      setSearchSource(String(res?.source || ''));
      setSearchWarning(typeof res?.warning === 'string' ? res.warning : null);
    };
    s.on('song-search-result', onSearchResult);
    s.on('connect', () => {
      s.emit('join-room', room);
      s.emit('song-get', { privateKey: room });
    });
    // room bisa berubah setelah privateKey terverifikasi - sinkron ulang
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
  const currentLiked = current ? findLiked(current.url) : undefined;
  const currentBlocked = current ? findBlacklisted(current.url, current.videoId) : undefined;
  // Filter Liked Songs tanpa mengubah urutan asli.
  const filteredLikedSongs = useMemo(() => {
    const q = likedQuery.trim().toLowerCase();
    if (!q) return likedSongs;
    return likedSongs.filter((item) =>
      `${item.title} ${item.channel} ${item.note}`.toLowerCase().includes(q),
    );
  }, [likedSongs, likedQuery]);
  // Filter riwayat lagu.
  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter((item) =>
      `${item.title} ${item.channel} ${item.requestedBy}`.toLowerCase().includes(q),
    );
  }, [history, historyQuery]);

  // Server mencatat riwayat saat lagu berganti - tarik ulang tanpa spinner.
  // Delay kecil supaya RPC pencatatan di backend selesai dulu.
  useEffect(() => {
    const timer = setTimeout(() => void refreshHistory({ silent: true }), 1200);
    return () => clearTimeout(timer);
  }, [songId, refreshHistory]);

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
    const next = v;
    setSearchQuery(next);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const cleaned = next.trim();
    if (!cleaned) {
      lastSearchedRef.current = '';
      setSearchResults([]);
      setSearchWarning(null);
      setSearching(false);
      return;
    }
    if (cleaned === lastSearchedRef.current) {
      setSearching(true);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      const q = cleaned;
      if (!q || q === lastSearchedRef.current) return;
      lastSearchedRef.current = q;
      getSocket()?.emit('song-search', { q, maxResults: 6 });
    }, SEARCH_DEBOUNCE_MS);
  };

  const handlePickResult = (r: { videoId: string; title: string; channel: string; thumbnail: string; url: string }) => {
    const s = getSocket();
    if (!s) return;
    s.emit('song-add', { privateKey: getRoom(), url: r.url, title: r.title, requestedBy: dockWho(), platform: 'dock' });
    // Jangan reset query pencarian setelah user pilih hasil; biarkan opsi tetap terlihat
    // agar tidak perlu mengetik ulang untuk mencari lagu berikutnya.
    setSearching(false);
  };

  // Like / unlike satu lagu (dipakai now-playing + list Choose Song + History).
  const toggleSongLike = async (item: Pick<SongItem, 'url' | 'videoId' | 'kind' | 'title' | 'requestedBy' | 'platform'>) => {
    if (likedSaving) return;
    const liked = findLiked(item.url);
    if (liked) {
      await removeLiked(liked.id);
      return;
    }
    try {
      await addLiked({
        url: item.url,
        videoId: item.videoId || parseYouTubeVideoId(item.url),
        kind: item.kind,
        title: item.title,
        requestedBy: item.requestedBy,
        platform: item.platform,
      });
    } catch {
      // Pesan error sudah disimpan di likedError oleh hook.
    }
  };

  const toggleCurrentLike = async () => {
    if (!current) return;
    await toggleSongLike(current);
  };

  // Blacklist / unblacklist lagu yang sedang diputar.
  const toggleCurrentBlock = async () => {
    if (!current || blacklistSaving) return;
    if (currentBlocked) {
      await removeBlacklisted(currentBlocked.id);
      return;
    }
    try {
      await addBlacklisted({
        url: current.url,
        videoId: current.videoId || parseYouTubeVideoId(current.url),
        title: current.title,
        reason: 'Diblokir dari dock',
      });
    } catch {
      // Pesan error sudah disimpan di blacklistError oleh hook.
    }
  };

  // Masukkan lagu ke queue room aktif.
  const queueLikedSong = (liked: Pick<LikedSong, 'url' | 'videoId' | 'title'>) => {
    if (isBlacklisted(liked.url, liked.videoId)) return;
    const s = getSocket();
    if (!s) return;
    s.emit('song-add', {
      privateKey: getRoom(),
      url: liked.url,
      title: liked.title,
      requestedBy: dockWho(),
      platform: 'liked',
    });
  };

  const openLikedPage = (tab?: 'history') => {
    const key = getRoom();
    const base = key && key !== 'global' ? `/songs?key=${encodeURIComponent(key)}` : '/songs';
    const href = tab ? `${base}${base.includes('?') ? '&' : '?'}tab=${tab}` : base;
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleClearHistory = async () => {
    if (historySaving) return;
    if (!window.confirm('Hapus semua riwayat lagu? Tindakan ini tidak bisa dibatalkan.')) return;
    await clearHistory();
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
          {current && (
            <button
              onClick={toggleCurrentLike}
              disabled={likedSaving}
              className={`shrink-0 h-7 w-7 grid place-items-center rounded-full border transition-colors ${
                currentLiked
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-white/5 border-white/10 text-gray-500 hover:text-rose-400 hover:border-rose-500/30'
              } disabled:opacity-50`}
              title={currentLiked ? 'Hapus dari Liked Songs' : 'Simpan ke Liked Songs'}
            >
              {likedSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Heart className={`w-3.5 h-3.5 ${currentLiked ? 'fill-rose-500' : ''}`} />
              )}
            </button>
          )}
          {current && (
            <button
              onClick={toggleCurrentBlock}
              disabled={blacklistSaving}
              className={`shrink-0 h-7 w-7 grid place-items-center rounded-full border transition-colors ${
                currentBlocked
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                  : 'bg-white/5 border-white/10 text-gray-500 hover:text-orange-400 hover:border-orange-500/30'
              } disabled:opacity-50`}
              title={currentBlocked ? 'Hapus dari blacklist' : 'Blacklist lagu ini'}
            >
              {blacklistSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Ban className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <span className={`text-[9px] font-black uppercase ${song?.isPlaying ? 'text-green-400' : 'text-gray-500'}`}>
            {song?.isPlaying ? 'Play' : 'Stop'}
          </span>
        </div>
        {/* prev / play-pause / next inline + progress */}
        <div className="flex items-center gap-1.5">
          <button
 onClick={() => control('prev')}
 className="w-8 h-8 shrink-0 grid place-items-center rounded-full btn-secondary border "
 title="Sebelumnya"
 >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
 onClick={() => control(song?.isPlaying ? 'pause' : 'play')}
 className="w-8 h-8 shrink-0 grid place-items-center rounded-full btn-primary "
 title={song?.isPlaying ? 'Pause' : 'Play'}
 >
            {song?.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
 onClick={() => control('next')}
 className="w-8 h-8 shrink-0 grid place-items-center rounded-full btn-secondary border "
 title="Berikutnya"
 >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 min-w-0 mt-3">
            {/* Slider seek - kontrol progress hanya dari dock (desktop/mobile).
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
          <button onClick={handleAdd} className="shrink-0 w-9 h-9 grid place-items-center rounded-xl btn-primary " title="Tambah ke queue">
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
          {searching && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/5 px-2.5 py-1.5">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300/90">Mencari lagu…</span>
            </div>
          )}
          {searchWarning && (
            <div className="text-[9px] font-bold text-yellow-300/90">{searchWarning}</div>
          )}
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-[180px] overflow-y-auto custom-scrollbar">
              {searchResults.map((r) => (
                <button
 key={r.videoId}
 onClick={() => handlePickResult(r)}
 className="w-full flex items-center gap-2 p-1.5 rounded-lg border btn-secondary text-left"
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
                  {(() => {
                    const isLiked = !!findLiked(q.url);
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleSongLike(q);
                        }}
                        disabled={likedSaving}
                        className={`shrink-0 p-1 transition-colors disabled:opacity-40 ${
                          isLiked ? 'text-rose-400 hover:text-rose-300' : 'text-gray-600 hover:text-rose-400'
                        }`}
                        title={isLiked ? 'Hapus dari Liked Songs' : 'Masukkan ke Liked Songs'}
                      >
                        <Heart className={`w-3 h-3 ${isLiked ? 'fill-rose-500' : ''}`} />
                      </button>
                    );
                  })()}
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

      {/* Liked Songs - simpan ke Supabase, bisa langsung masuk queue. */}
      <div className="stat-card space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-gray-500 text-[9px] font-black uppercase flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-rose-400" /> Liked Songs ({likedSongs.length})
          </h4>
          <button
            onClick={() => openLikedPage()}
            className="flex items-center gap-1 text-[9px] font-black uppercase text-green-400 hover:text-green-300"
            title="Buka halaman Liked Songs"
          >
            Buka page <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        {likedError && (
          <div className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
            {likedError}
          </div>
        )}
        {blacklistError && (
          <div className="text-[9px] font-bold text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1.5">
            {blacklistError}
          </div>
        )}
        {likedSongs.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
            <input
              value={likedQuery}
              onChange={(e) => setLikedQuery(e.target.value)}
              placeholder="Cari liked songs…"
              className="w-full h-8 pl-8 pr-7 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
            />
            {likedQuery && (
              <button
                onClick={() => setLikedQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white"
                title="Bersihkan pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        {likedLoading && likedSongs.length === 0 ? (
          <div className="text-[10px] text-gray-600 italic">Memuat liked songs…</div>
        ) : likedSongs.length === 0 ? (
          <div className="text-[10px] text-gray-600 italic">
            Belum ada lagu. Tekan hati pada lagu yang sedang diputar untuk menyimpannya.
          </div>
        ) : filteredLikedSongs.length === 0 ? (
          <div className="text-[10px] text-gray-600 italic">
            Tidak ada liked song yang cocok dengan “{likedQuery.trim()}”.
          </div>
        ) : (
          <div className="space-y-1 max-h-[190px] overflow-y-auto custom-scrollbar">
            {filteredLikedSongs.map((liked) => {
              const isNowPlaying = !!currentLiked && currentLiked.id === liked.id;
              const blocked = isBlacklisted(liked.url, liked.videoId);
              return (
                <div
                  key={liked.id}
                  className={`flex items-center gap-2 p-1.5 rounded-lg border ${
                    isNowPlaying
                      ? 'bg-rose-500/10 border-rose-500/25'
                      : blocked
                        ? 'bg-orange-500/5 border-orange-500/15'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {liked.thumbnail ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={liked.thumbnail} alt="" className="w-9 h-9 rounded object-cover shrink-0" loading="lazy" />
                  ) : (
                    <span className="w-9 h-9 rounded bg-white/5 grid place-items-center shrink-0">
                      <Music className="w-3.5 h-3.5 text-gray-500" />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-white truncate">{liked.title}</div>
                    <div className={`text-[8px] truncate ${blocked ? 'text-orange-300/80' : 'text-gray-500'}`}>
                      {blocked ? 'Diblokir — unblock dulu' : liked.channel || (liked.kind === 'audio' ? 'Audio' : 'YouTube')}
                    </div>
                  </div>
                  <button
                    onClick={() => queueLikedSong(liked)}
                    disabled={blocked}
                    className="shrink-0 p-1 text-gray-500 hover:text-green-400 disabled:opacity-30 disabled:hover:text-gray-500"
                    title={blocked ? 'Lagu ada di blacklist' : 'Tambah ke queue'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeLiked(liked.id)}
                    disabled={likedSaving}
                    className="shrink-0 p-1 text-rose-400 hover:text-rose-300 disabled:opacity-40"
                    title="Hapus dari Liked Songs"
                  >
                    <Heart className="w-3 h-3 fill-rose-500" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History - lagu yang sudah diputar. Satu URL = satu baris (tidak dobel). */}
      <div className="stat-card space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-gray-500 text-[9px] font-black uppercase flex items-center gap-1.5">
            <History className="w-3 h-3 text-cyan-400" /> History ({history.length})
          </h4>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => void handleClearHistory()}
                disabled={historySaving}
                className="text-[8px] font-black uppercase text-gray-500 hover:text-red-400 disabled:opacity-40"
                title="Hapus semua riwayat"
              >
                Hapus
              </button>
            )}
            <button
              onClick={() => openLikedPage('history')}
              className="flex items-center gap-1 text-[9px] font-black uppercase text-green-400 hover:text-green-300"
              title="Buka halaman riwayat lagu"
            >
              Buka page <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
        {historyError && (
          <div className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
            {historyError}
          </div>
        )}
        {history.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
            <input
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
              placeholder="Cari history lagu…"
              className="w-full h-8 pl-8 pr-7 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
            />
            {historyQuery && (
              <button
                onClick={() => setHistoryQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white"
                title="Bersihkan pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        {historyLoading && history.length === 0 ? (
          <div className="text-[10px] text-gray-600 italic">Memuat riwayat lagu…</div>
        ) : history.length === 0 ? (
          <div className="text-[10px] text-gray-600 italic">
            Belum ada lagu yang diputar. Riwayat terisi otomatis saat lagu mulai main.
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-[10px] text-gray-600 italic">
            Tidak ada riwayat yang cocok dengan “{historyQuery.trim()}”.
          </div>
        ) : (
          <div className="space-y-1 max-h-[190px] overflow-y-auto custom-scrollbar">
            {filteredHistory.map((item) => {
              const blocked = isBlacklisted(item.url, item.videoId);
              const isLiked = !!findLiked(item.url);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 p-1.5 rounded-lg border ${
                    blocked ? 'bg-orange-500/5 border-orange-500/15' : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                  title={new Date(item.playedAt).toLocaleString('id-ID')}
                >
                  {item.thumbnail ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.thumbnail} alt="" className="w-9 h-9 rounded object-cover shrink-0" loading="lazy" />
                  ) : (
                    <span className="w-9 h-9 rounded bg-white/5 grid place-items-center shrink-0">
                      <Music className="w-3.5 h-3.5 text-gray-500" />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-white truncate">{item.title || item.url}</div>
                    <div className={`text-[8px] truncate ${blocked ? 'text-orange-300/80' : 'text-gray-500'}`}>
                      {blocked
                        ? 'Diblokir — unblock dulu'
                        : `${item.playCount || 1}× diputar${item.channel ? ` • ${item.channel}` : ''}`}
                    </div>
                  </div>
                  <button
                    onClick={() => queueLikedSong(item)}
                    disabled={blocked}
                    className="shrink-0 p-1 text-gray-500 hover:text-green-400 disabled:opacity-30 disabled:hover:text-gray-500"
                    title={blocked ? 'Lagu ada di blacklist' : 'Tambah ke queue'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => void toggleSongLike(item)}
                    disabled={likedSaving}
                    className={`shrink-0 p-1 disabled:opacity-40 ${
                      isLiked ? 'text-rose-400 hover:text-rose-300' : 'text-gray-500 hover:text-rose-400'
                    }`}
                    title={isLiked ? 'Hapus dari Liked Songs' : 'Like lagu ini'}
                  >
                    <Heart className={`w-3 h-3 ${isLiked ? 'fill-rose-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => void removeHistoryEntry(item.id)}
                    disabled={historySaving}
                    className="shrink-0 p-1 text-gray-600 hover:text-red-400 disabled:opacity-40"
                    title="Hapus dari riwayat"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
