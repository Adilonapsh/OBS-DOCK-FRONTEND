"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import {
  Ban,
  Check,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  Heart,
  History,
  Link2,
  ListPlus,
  Menu,
  Music,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldOff,
  Trash2,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { gooeyToast } from "goey-toast";
import Sidebar from "@/app/components/Sidebar";
import ThemeToggle from "@/app/components/ThemeToggle";
import ConfirmModal from "@/app/components/ConfirmModal";
import { useLikedSongs } from "@/app/hooks/useLikedSongs";
import { useSongBlacklist } from "@/app/hooks/useSongBlacklist";
import { useSongHistory } from "@/app/hooks/useSongHistory";
import {
  isAudioUrl,
  normalizeLikedUrl,
  parseYouTubeVideoId,
  youtubeThumbnail,
  type LikedSong,
} from "@/app/lib/likedSongs";
import type { PlayedSong } from "@/app/lib/songHistory";
import { getSocketUrl } from "@/app/widgets/_shared/utils/socket";
import { createClient } from "@/utils/supabase/client";

type SearchResult = {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
};

type KindFilter = "all" | "youtube" | "audio";

const SEARCH_DEBOUNCE_MS = 600;

function formatDate(ts: number): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function platformLabel(value: string): string {
  const v = (value || "").toLowerCase();
  if (v === "tiktok") return "TikTok";
  if (v === "twitch") return "Twitch";
  if (v === "youtube" || v === "yt") return "YouTube";
  if (v === "liked") return "Liked";
  if (v === "dock") return "Dock";
  return value || "Manual";
}

function SongsInner() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<Pick<User, "id" | "email" | "user_metadata"> | null>(null);
  const [privateKey, setPrivateKey] = useState(() => searchParams.get("key")?.trim() || "");
  const [keyResolved, setKeyResolved] = useState(false);

  const {
    songs,
    loading,
    saving,
    error,
    refresh,
    addLiked,
    removeLiked,
    updateLiked,
  } = useLikedSongs(privateKey);

  const {
    items: blacklist,
    loading: blacklistLoading,
    saving: blacklistSaving,
    error: blacklistError,
    refresh: refreshBlacklist,
    addBlacklisted,
    removeBlacklisted,
    isBlacklisted,
  } = useSongBlacklist(privateKey);

  const {
    items: history,
    loading: historyLoading,
    saving: historySaving,
    error: historyError,
    refresh: refreshHistory,
    removeEntry: removeHistoryEntry,
    clearHistory,
  } = useSongHistory(privateKey);

  const initialTab = searchParams.get("tab");
  const [view, setView] = useState<"liked" | "blacklist" | "history">(
    initialTab === "blacklist" ? "blacklist" : initialTab === "history" ? "history" : "liked",
  );
  const [historyQuery, setHistoryQuery] = useState("");
  const [clearingHistory, setClearingHistory] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [blockUrl, setBlockUrl] = useState("");
  const [blockTitle, setBlockTitle] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [blockQuery, setBlockQuery] = useState("");
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [addingManual, setAddingManual] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchSource, setSearchSource] = useState("");
  const [searchWarning, setSearchWarning] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [addingResultId, setAddingResultId] = useState<string | null>(null);

  const [filter, setFilter] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");
  const [queueingId, setQueueingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; title: string; note: string } | null>(null);
  const [deleting, setDeleting] = useState<LikedSong | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchedRef = useRef("");

  // Resolve user + private key (URL key > storage > profiles.private_key).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const urlKey = searchParams.get("key")?.trim() || "";
      let stored = "";
      try {
        stored =
          sessionStorage.getItem("dock_private_verified") ||
          sessionStorage.getItem("bypass_private_key") ||
          localStorage.getItem("dock_private_key") ||
          "";
      } catch {}

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          user_metadata: currentUser.user_metadata,
        });
      }

      let key = urlKey || stored;
      if (!key && currentUser) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("private_key")
            .eq("id", currentUser.id)
            .single();
          key = String((data as { private_key?: string } | null)?.private_key || "");
        } catch {}
      }

      if (!cancelled) {
        setPrivateKey(key);
        setKeyResolved(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, supabase]);

  // Socket untuk cari lagu + masukkan ke queue lagu.
  useEffect(() => {
    const room = privateKey || "global";
    const socket = io(getSocketUrl(), { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    const onSearchResult = (res: {
      q?: string;
      results?: SearchResult[];
      source?: string;
      warning?: string;
    }) => {
      setSearching(false);
      if (res?.q) lastSearchedRef.current = String(res.q).trim();
      setSearchResults(Array.isArray(res?.results) ? res.results : []);
      setSearchSource(String(res?.source || ""));
      setSearchWarning(typeof res?.warning === "string" ? res.warning : null);
    };

    socket.on("song-search-result", onSearchResult);
    // Riwayat dicatat backend tiap lagu berganti - tarik ulang setelah jeda
    // kecil agar RPC pencatatan selesai dulu.
    let historyTimer: ReturnType<typeof setTimeout> | null = null;
    const onSongUpdate = () => {
      if (historyTimer) clearTimeout(historyTimer);
      historyTimer = setTimeout(() => void refreshHistory({ silent: true }), 1500);
    };
    socket.on("song-update", onSongUpdate);
    socket.on("connect", () => socket.emit("join-room", room));
    if (socket.connected) socket.emit("join-room", room);

    return () => {
      socket.off("song-search-result", onSearchResult);
      socket.off("song-update", onSongUpdate);
      if (historyTimer) clearTimeout(historyTimer);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [privateKey, refreshHistory]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const cleaned = value.trim();

    if (!cleaned) {
      lastSearchedRef.current = "";
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
      if (!cleaned || cleaned === lastSearchedRef.current) return;
      lastSearchedRef.current = cleaned;
      socketRef.current?.emit("song-search", { q: cleaned, maxResults: 8 });
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleAddManual = async () => {
    const rawUrl = manualUrl.trim();
    if (!rawUrl) {
      gooeyToast.error("Tempel URL YouTube / MP3 dulu.");
      return;
    }
    setAddingManual(true);
    try {
      const normalized = normalizeLikedUrl(rawUrl);
      const videoId = parseYouTubeVideoId(normalized);
      await addLiked({
        url: normalized,
        videoId,
        kind: videoId ? "youtube" : isAudioUrl(normalized) ? "audio" : "youtube",
        title: manualTitle.trim() || undefined,
        thumbnail: youtubeThumbnail(videoId),
        note: manualNote.trim(),
        platform: "manual",
      });
      setManualUrl("");
      setManualTitle("");
      setManualNote("");
      gooeyToast.success("Lagu masuk Liked Songs.");
    } catch (err) {
      gooeyToast.error(err instanceof Error ? err.message : "Gagal menyimpan lagu.");
    } finally {
      setAddingManual(false);
    }
  };

  const handlePickResult = async (result: SearchResult) => {
    setAddingResultId(result.videoId);
    try {
      await addLiked({
        url: result.url,
        videoId: result.videoId,
        kind: "youtube",
        title: result.title,
        channel: result.channel,
        thumbnail: result.thumbnail,
        platform: "youtube",
      });
      gooeyToast.success(`"${result.title}" disimpan ke Liked Songs.`);
    } catch (err) {
      gooeyToast.error(err instanceof Error ? err.message : "Gagal menyimpan lagu.");
    } finally {
      setAddingResultId(null);
    }
  };

  const handleQueue = (song: Pick<LikedSong, "id" | "url" | "videoId" | "kind" | "title">) => {
    if (isBlacklisted(song.url, song.videoId)) {
      gooeyToast.error("Lagu ini ada di blacklist. Hapus dari blacklist dulu untuk memutar.");
      return;
    }
    const socket = socketRef.current;
    if (!socket) {
      gooeyToast.error("Socket belum terhubung. Coba lagi sebentar.");
      return;
    }
    setQueueingId(song.id);
    socket.emit("song-add", {
      privateKey: privateKey || "global",
      url: song.url,
      videoId: song.videoId,
      kind: song.kind,
      title: song.title || song.url,
      requestedBy: user?.user_metadata?.username || user?.email?.split("@")[0] || "liked",
      platform: "liked",
    });
    setTimeout(() => setQueueingId(null), 700);
    gooeyToast.success("Ditambahkan ke queue lagu.");
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      gooeyToast.success("URL disalin.");
    } catch {
      gooeyToast.error("Gagal menyalin URL.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const ok = await updateLiked(editing.id, { title: editing.title, note: editing.note });
    if (ok) {
      setEditing(null);
      gooeyToast.success("Lagu diperbarui.");
    } else {
      gooeyToast.error("Gagal memperbarui lagu.");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const ok = await removeLiked(deleting.id);
    if (ok) gooeyToast.success("Lagu dihapus dari Liked Songs.");
    else gooeyToast.error("Gagal menghapus lagu.");
    setDeleting(null);
  };

  const handleBlockManual = async () => {
    const rawUrl = blockUrl.trim();
    if (!rawUrl) {
      gooeyToast.error("Tempel URL lagu yang mau diblacklist.");
      return;
    }
    setBlocking(true);
    try {
      const normalized = normalizeLikedUrl(rawUrl);
      const videoId = parseYouTubeVideoId(normalized);
      await addBlacklisted({
        url: normalized,
        videoId,
        title: blockTitle.trim() || undefined,
        thumbnail: youtubeThumbnail(videoId),
        reason: blockReason.trim(),
      });
      setBlockUrl("");
      setBlockTitle("");
      setBlockReason("");
      gooeyToast.success("Lagu masuk blacklist. Request lagu ini akan ditolak.");
    } catch (err) {
      gooeyToast.error(err instanceof Error ? err.message : "Gagal menyimpan blacklist.");
    } finally {
      setBlocking(false);
    }
  };

  const handleBlockSong = async (song: LikedSong) => {
    try {
      await addBlacklisted({
        url: song.url,
        videoId: song.videoId,
        title: song.title,
        channel: song.channel,
        thumbnail: song.thumbnail,
        reason: "Diblokir dari Liked Songs",
      });
      gooeyToast.success(`"${song.title || song.url}" diblokir dari queue.`);
    } catch (err) {
      gooeyToast.error(err instanceof Error ? err.message : "Gagal memblokir lagu.");
    }
  };

  const handleUnblock = async (id: string) => {
    setUnblockingId(id);
    const ok = await removeBlacklisted(id);
    if (ok) gooeyToast.success("Lagu dihapus dari blacklist.");
    else gooeyToast.error("Gagal menghapus dari blacklist.");
    setUnblockingId(null);
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return songs.filter((song) => {
      if (filter !== "all" && song.kind !== filter) return false;
      if (!needle) return true;
      return `${song.title} ${song.channel} ${song.note} ${song.url} ${song.requestedBy}`
        .toLowerCase()
        .includes(needle);
    });
  }, [songs, filter, query]);

  const filteredBlacklist = useMemo(() => {
    const needle = blockQuery.trim().toLowerCase();
    if (!needle) return blacklist;
    return blacklist.filter((item) =>
      `${item.title} ${item.channel} ${item.reason} ${item.url}`.toLowerCase().includes(needle),
    );
  }, [blacklist, blockQuery]);

  const filteredHistory = useMemo(() => {
    const needle = historyQuery.trim().toLowerCase();
    if (!needle) return history;
    return history.filter((item) =>
      `${item.title} ${item.channel} ${item.requestedBy} ${item.url}`.toLowerCase().includes(needle),
    );
  }, [history, historyQuery]);

  const refreshAll = () => {
    void refresh();
    void refreshBlacklist();
    void refreshHistory();
  };

  const handleClearHistory = async () => {
    if (historySaving || history.length === 0) return;
    setConfirmClearHistory(false);
    setClearingHistory(true);
    const ok = await clearHistory();
    if (ok) gooeyToast.success("Riwayat lagu dibersihkan.");
    else gooeyToast.error("Gagal membersihkan riwayat lagu.");
    setClearingHistory(false);
  };

  const handleRemoveHistory = async (id: string) => {
    const ok = await removeHistoryEntry(id);
    if (ok) gooeyToast.success("Lagu dihapus dari riwayat.");
    else gooeyToast.error("Gagal menghapus dari riwayat.");
  };

  const handleToggleHistoryLike = async (item: PlayedSong) => {
    const existing = songs.find((song) => song.url === item.url);
    try {
      if (existing) {
        const ok = await removeLiked(existing.id);
        if (ok) gooeyToast.success("Lagu dihapus dari Liked Songs.");
        else gooeyToast.error("Gagal menghapus dari Liked Songs.");
        return;
      }
      await addLiked({
        url: item.url,
        videoId: item.videoId,
        kind: item.kind,
        title: item.title,
        channel: item.channel,
        thumbnail: item.thumbnail,
        requestedBy: item.requestedBy,
        platform: item.platform,
      });
      gooeyToast.success("Lagu disimpan ke Liked Songs.");
    } catch (err) {
      gooeyToast.error(err instanceof Error ? err.message : "Gagal menyimpan lagu.");
    }
  };

  const youtubeCount = songs.filter((song) => song.kind === "youtube").length;
  const audioCount = songs.filter((song) => song.kind === "audio").length;
  const latest = songs[0];
  const manualPreviewId = manualUrl.trim() ? parseYouTubeVideoId(normalizeLikedUrl(manualUrl)) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="songs" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500 text-white rounded-full text-[10px] font-black tracking-widest uppercase">
              <Heart className="w-3 h-3 fill-current" /> Song Request
            </span>
            <span className="hidden md:inline text-[10px] text-gray-500 font-bold">
              {songs.length} liked • {blacklist.length} blocked • {history.length} history •{" "}
              {privateKey ? `${privateKey.slice(0, 6)}…` : "akun"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshAll}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 btn-secondary border rounded-xl text-[10px] font-black uppercase"
            >
              <RefreshCw className={`w-3 h-3 ${loading || blacklistLoading || historyLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link
              href="/widgets/music"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 btn-secondary border rounded-xl text-[10px] font-black uppercase"
            >
              <Music className="w-3 h-3" /> Widget Music
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Total Liked
              </div>
              <div className="text-white font-black text-[20px] mt-1">{songs.length}</div>
              <div className="text-gray-500 text-[11px]">lagu tersimpan</div>
            </div>
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                <Music className="w-3.5 h-3.5 text-red-400" /> YouTube
              </div>
              <div className="text-white font-black text-[20px] mt-1">{youtubeCount}</div>
              <div className="text-gray-500 text-[11px]">video / musik</div>
            </div>
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                <Link2 className="w-3.5 h-3.5 text-cyan-400" /> Audio URL
              </div>
              <div className="text-white font-black text-[20px] mt-1">{audioCount}</div>
              <div className="text-gray-500 text-[11px]">mp3 / stream</div>
            </div>
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Terbaru
              </div>
              <div className="text-white font-black text-[12px] mt-1 truncate">
                {latest?.title || "-"}
              </div>
              <div className="text-gray-500 text-[11px]">{latest ? formatDate(latest.likedAt) : "belum ada"}</div>
            </div>
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                <Ban className="w-3.5 h-3.5 text-orange-400" /> Blacklist
              </div>
              <div className="text-white font-black text-[20px] mt-1">{blacklist.length}</div>
              <div className="text-gray-500 text-[11px]">lagu diblokir</div>
            </div>
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                <History className="w-3.5 h-3.5 text-cyan-400" /> History
              </div>
              <div className="text-white font-black text-[20px] mt-1">{history.length}</div>
              <div className="text-gray-500 text-[11px]">lagu diputar</div>
            </div>
          </div>

          {/* Tab: Liked / Blacklist */}
          <div className="flex items-center gap-1.5 p-1 bg-[#161616] border border-white/10 rounded-2xl w-fit">
            <button
              onClick={() => setView("liked")}
              className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${
                view === "liked" ? "bg-rose-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Heart className="w-3.5 h-3.5" /> Liked Songs
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${view === "liked" ? "bg-black/20" : "bg-white/10"}`}>
                {songs.length}
              </span>
            </button>
            <button
              onClick={() => setView("blacklist")}
              className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${
                view === "blacklist" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Ban className="w-3.5 h-3.5" /> Blacklist Song
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${view === "blacklist" ? "bg-black/20" : "bg-white/10"}`}>
                {blacklist.length}
              </span>
            </button>
            <button
              onClick={() => setView("history")}
              className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${
                view === "history" ? "bg-cyan-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" /> History
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${view === "history" ? "bg-black/20" : "bg-white/10"}`}>
                {history.length}
              </span>
            </button>
          </div>

          {(error || blacklistError || historyError) && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] font-bold px-4 py-3 rounded-2xl space-y-1">
              {error && <div>{error}</div>}
              {blacklistError && <div>{blacklistError}</div>}
              {historyError && <div>{historyError}</div>}
            </div>
          )}

          {/* Add song */}
          {view === "liked" && (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 grid place-items-center">
                  <Plus className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-white font-black uppercase text-[11px] tracking-widest">Tambah dari URL</h2>
                  <p className="text-gray-500 text-[10px]">YouTube, youtu.be, atau link MP3 langsung.</p>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleAddManual();
                  }}
                  placeholder="https://youtu.be/... atau https://.../lagu.mp3"
                  className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:border-rose-400/50"
                />
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Judul (opsional)"
                    className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                  />
                  <input
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    placeholder="Catatan (opsional)"
                    className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {manualPreviewId ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={youtubeThumbnail(manualPreviewId)}
                      alt=""
                      className="w-12 h-7 rounded object-cover border border-white/10"
                    />
                  ) : null}
                  <span className="text-[10px] text-gray-500 truncate">
                    {manualPreviewId ? `Video ID: ${manualPreviewId}` : "Metadata diambil otomatis bila terbaca."}
                  </span>
                </div>
                <button
                  onClick={() => void handleAddManual()}
                  disabled={addingManual || saving || !manualUrl.trim()}
                  className="shrink-0 h-9 px-4 btn-primary rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Heart className="w-3 h-3" /> {addingManual ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </div>

            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 grid place-items-center">
                    <Search className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-white font-black uppercase text-[11px] tracking-widest">Cari di YouTube</h2>
                    <p className="text-gray-500 text-[10px]">Simpan langsung dengan judul, channel, dan thumbnail.</p>
                  </div>
                </div>
                <span className="shrink-0 h-7 px-2 grid place-items-center rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase text-gray-400">
                  {searching ? "…" : searchSource === "youtube-api" ? "API" : searchSource === "scrape" ? "Cad." : "YT"}
                </span>
              </div>

              <input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari judul lagu…"
                className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-400/50"
              />

              {searchWarning && <div className="text-[10px] font-bold text-yellow-300/90">{searchWarning}</div>}

              <div className="space-y-1.5 max-h-[210px] overflow-y-auto custom-scrollbar">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <button
                      key={result.videoId}
                      onClick={() => void handlePickResult(result)}
                      disabled={addingResultId === result.videoId || saving}
                      className="w-full flex items-center gap-2 p-1.5 rounded-xl border btn-secondary text-left disabled:opacity-60"
                      title="Simpan ke Liked Songs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={result.thumbnail}
                        alt=""
                        className="w-14 h-8 rounded object-cover shrink-0 border border-white/10"
                        loading="lazy"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[10px] font-bold text-white truncate">{result.title}</span>
                        <span className="block text-[8px] text-gray-500 truncate">{result.channel || result.url}</span>
                      </span>
                      <Heart
                        className={`w-3.5 h-3.5 shrink-0 ${
                          addingResultId === result.videoId ? "animate-pulse text-rose-300" : "text-rose-400"
                        }`}
                      />
                    </button>
                  ))
                ) : (
                  <div className="h-[92px] grid place-items-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-[10px] text-gray-600 italic">
                    {searching ? "Mencari lagu…" : "Hasil pencarian muncul di sini."}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Filter + list */}
          {view === "liked" && (
          <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400 fill-current" />
                <h2 className="text-white font-black uppercase text-[11px] tracking-widest">Liked Songs</h2>
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[9px] font-black text-gray-300">
                  {filtered.length}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari judul / channel / catatan…"
                    className="h-9 w-full sm:w-[280px] pl-9 pr-8 bg-black/40 border border-white/10 rounded-xl text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white"
                      aria-label="Bersihkan pencarian"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {(["all", "youtube", "audio"] as KindFilter[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => setFilter(option)}
                      className={`h-8 px-3 rounded-lg text-[9px] font-black uppercase border transition-colors ${
                        filter === option ? "btn-primary" : "btn-secondary"
                      }`}
                    >
                      {option === "all" ? "Semua" : option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 md:p-4 space-y-2">
              {loading && songs.length === 0 ? (
                <div className="py-12 text-center text-[11px] text-gray-500">Memuat liked songs…</div>
              ) : filtered.length === 0 ? (
                <div className="py-12 px-4 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                  <Heart className="w-7 h-7 text-gray-600 mx-auto mb-2" />
                  <div className="text-[12px] font-bold text-gray-400">
                    {songs.length === 0 ? "Belum ada lagu yang di-like" : "Tidak ada hasil yang cocok"}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1">
                    Like lagu dari dock Music, atau tambahkan dari URL / pencarian di atas.
                  </div>
                </div>
              ) : (
                filtered.map((song) => {
                  const isEditing = editing?.id === song.id;
                  const thumb = song.thumbnail || youtubeThumbnail(song.videoId);
                  return (
                    <div
                      key={song.id}
                      className="group flex flex-col sm:flex-row gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.03] hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-[104px] h-[58px] rounded-xl overflow-hidden bg-black/50 border border-white/10 shrink-0 grid place-items-center">
                          {thumb ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <Music className="w-5 h-5 text-gray-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-1.5">
                              <input
                                value={editing.title}
                                onChange={(e) => setEditing((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                                className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[11px] text-white focus:outline-none focus:border-white/20"
                                placeholder="Judul lagu"
                              />
                              <input
                                value={editing.note}
                                onChange={(e) => setEditing((prev) => (prev ? { ...prev, note: e.target.value } : prev))}
                                className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[10px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                                placeholder="Catatan / alasan like"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-white font-black text-[12px] truncate">{song.title || song.url}</span>
                                <span
                                  className={`shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                    song.kind === "audio"
                                      ? "bg-cyan-500/15 text-cyan-300"
                                      : "bg-red-500/15 text-red-300"
                                  }`}
                                >
                                  {song.kind}
                                </span>
                                {isBlacklisted(song.url, song.videoId) && (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-orange-500/15 text-orange-300 flex items-center gap-1">
                                    <Ban className="w-2.5 h-2.5" /> Blocked
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-500 text-[10px] truncate">
                                {song.channel || "—"} • {platformLabel(song.platform)}
                                {song.requestedBy ? ` • req by ${song.requestedBy}` : ""}
                              </div>
                              <div className="text-gray-600 text-[9px] truncate">{song.url}</div>
                              {song.note && (
                                <div className="text-gray-400 text-[10px] mt-1 line-clamp-2 italic">“{song.note}”</div>
                              )}
                            </>
                          )}
                          <div className="text-gray-600 text-[9px] mt-1 flex items-center gap-2">
                            <Clock className="w-2.5 h-2.5" /> {formatDate(song.likedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:self-center shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => void handleSaveEdit()}
                              disabled={saving}
                              className="h-8 px-3 btn-primary rounded-lg text-[9px] font-black uppercase flex items-center gap-1 disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" /> Simpan
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="h-8 px-3 btn-secondary border rounded-lg text-[9px] font-black uppercase"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleQueue(song)}
                              disabled={queueingId === song.id || isBlacklisted(song.url, song.videoId)}
                              className="h-8 px-3 btn-primary rounded-lg text-[9px] font-black uppercase flex items-center gap-1 disabled:opacity-50"
                              title={
                                isBlacklisted(song.url, song.videoId)
                                  ? "Lagu ada di blacklist — unblock dulu"
                                  : "Tambahkan ke queue lagu"
                              }
                            >
                              <Play className="w-3 h-3" /> Queue
                            </button>
                            <button
                              onClick={() => setEditing({ id: song.id, title: song.title, note: song.note })}
                              className="w-8 h-8 grid place-items-center btn-secondary border rounded-lg"
                              title="Edit judul / catatan"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => void handleCopy(song.url)}
                              className="w-8 h-8 grid place-items-center btn-secondary border rounded-lg"
                              title="Copy URL"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={song.url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 grid place-items-center btn-secondary border rounded-lg"
                              title="Buka lagu"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => void handleBlockSong(song)}
                              disabled={blacklistSaving}
                              className={`w-8 h-8 grid place-items-center rounded-lg border disabled:opacity-50 ${
                                isBlacklisted(song.url, song.videoId)
                                  ? "bg-orange-500/20 border-orange-500/30 text-orange-300"
                                  : "bg-white/5 hover:bg-orange-500/10 border-white/10 hover:border-orange-500/30 text-gray-400 hover:text-orange-300"
                              }`}
                              title={
                                isBlacklisted(song.url, song.videoId)
                                  ? "Sudah diblacklist (klik untuk tetap menyimpan)"
                                  : "Blacklist lagu ini"
                              }
                            >
                              <Ban className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeleting(song)}
                              className="w-8 h-8 grid place-items-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400"
                              title="Hapus dari liked"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          )}

          {/* Blacklist song */}
          {view === "blacklist" && (
            <div className="space-y-4">
              <div className="bg-[#161616] border border-orange-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 grid place-items-center">
                    <Ban className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-white font-black uppercase text-[11px] tracking-widest">Blacklist lagu</h2>
                    <p className="text-gray-500 text-[10px]">
                      Lagu yang diblokir tidak bisa masuk queue — dari chat, halaman ini, maupun dock.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    value={blockUrl}
                    onChange={(e) => setBlockUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleBlockManual();
                    }}
                    placeholder="https://youtu.be/... atau https://.../lagu.mp3"
                    className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-400/50"
                  />
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      value={blockTitle}
                      onChange={(e) => setBlockTitle(e.target.value)}
                      placeholder="Judul (opsional)"
                      className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                    />
                    <input
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Alasan (opsional)"
                      className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={() => void handleBlockManual()}
                    disabled={blocking || blacklistSaving || !blockUrl.trim()}
                    className="h-9 px-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Ban className="w-3 h-3" /> {blocking ? "Menyimpan…" : "Blacklist lagu"}
                  </button>
                </div>
              </div>

              <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-orange-400" />
                    <h2 className="text-white font-black uppercase text-[11px] tracking-widest">Lagu diblokir</h2>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[9px] font-black text-gray-300">
                      {filteredBlacklist.length}
                    </span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      value={blockQuery}
                      onChange={(e) => setBlockQuery(e.target.value)}
                      placeholder="Cari judul / alasan…"
                      className="h-9 w-full sm:w-[260px] pl-9 pr-3 bg-black/40 border border-white/10 rounded-xl text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                <div className="p-3 md:p-4 space-y-2">
                  {blacklistLoading && blacklist.length === 0 ? (
                    <div className="py-12 text-center text-[11px] text-gray-500">Memuat blacklist…</div>
                  ) : filteredBlacklist.length === 0 ? (
                    <div className="py-12 px-4 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                      <Ban className="w-7 h-7 text-gray-600 mx-auto mb-2" />
                      <div className="text-[12px] font-bold text-gray-400">
                        {blacklist.length === 0 ? "Belum ada lagu yang diblacklist" : "Tidak ada hasil yang cocok"}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-1">
                        Tambahkan dari URL di atas, atau tekan tombol blokir pada lagu di tab Liked Songs.
                      </div>
                    </div>
                  ) : (
                    filteredBlacklist.map((item) => {
                      const thumb = item.thumbnail || youtubeThumbnail(item.videoId);
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.03] hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-[104px] h-[58px] rounded-xl overflow-hidden bg-black/50 border border-white/10 shrink-0 grid place-items-center">
                              {thumb ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <Ban className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-black text-[12px] truncate">{item.title || item.url}</div>
                              <div className="text-gray-500 text-[10px] truncate">
                                {item.channel || "—"} • diblokir {formatDate(item.createdAt)}
                              </div>
                              <div className="text-gray-600 text-[9px] truncate">{item.url}</div>
                              {item.reason && (
                                <div className="text-orange-300/80 text-[10px] mt-1 line-clamp-2 italic">“{item.reason}”</div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 sm:self-center shrink-0">
                            <button
                              onClick={() => void handleUnblock(item.id)}
                              disabled={unblockingId === item.id || blacklistSaving}
                              className="h-8 px-3 btn-primary rounded-lg text-[9px] font-black uppercase flex items-center gap-1 disabled:opacity-50"
                              title="Hapus dari blacklist"
                            >
                              <ShieldOff className="w-3 h-3" /> Unblock
                            </button>
                            <button
                              onClick={() => void handleCopy(item.url)}
                              className="w-8 h-8 grid place-items-center btn-secondary border rounded-lg"
                              title="Copy URL"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 grid place-items-center btn-secondary border rounded-lg"
                              title="Buka lagu"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History - lagu yang sudah diputar (satu URL = satu baris). */}
          {view === "history" && (
            <div className="space-y-4">
              <div className="bg-[#161616] border border-cyan-500/20 rounded-2xl p-4 space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 grid place-items-center">
                      <History className="w-4 h-4" />
                    </span>
                    <div>
                      <h2 className="text-white font-black uppercase text-[11px] tracking-widest">History lagu</h2>
                      <p className="text-gray-500 text-[10px]">
                        Lagu yang sudah diputar otomatis tercatat. URL yang sama tidak dimasukkan dua kali — hanya
                        menambah jumlah putar.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        value={historyQuery}
                        onChange={(e) => setHistoryQuery(e.target.value)}
                        placeholder="Cari judul / channel…"
                        className="h-9 w-full sm:w-[240px] pl-9 pr-8 bg-black/40 border border-white/10 rounded-xl text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                      />
                      {historyQuery && (
                        <button
                          onClick={() => setHistoryQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white"
                          aria-label="Bersihkan pencarian"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setConfirmClearHistory(true)}
                      disabled={clearingHistory || historySaving || history.length === 0}
                      className="h-9 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 disabled:opacity-40"
                      title="Hapus semua riwayat"
                    >
                      <Trash2 className="w-3 h-3" /> {clearingHistory ? "Menghapus…" : "Hapus semua"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-white font-black uppercase text-[11px] tracking-widest">Lagu diputar</h2>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[9px] font-black text-gray-300">
                    {filteredHistory.length}
                  </span>
                </div>

                <div className="p-3 md:p-4 space-y-2">
                  {historyLoading && history.length === 0 ? (
                    <div className="py-12 text-center text-[11px] text-gray-500">Memuat riwayat lagu…</div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="py-12 px-4 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                      <History className="w-7 h-7 text-gray-600 mx-auto mb-2" />
                      <div className="text-[12px] font-bold text-gray-400">
                        {history.length === 0 ? "Belum ada lagu yang diputar" : "Tidak ada hasil yang cocok"}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-1">
                        Riwayat terisi otomatis saat lagu mulai diputar dari chat, donation, atau dock.
                      </div>
                    </div>
                  ) : (
                    filteredHistory.map((item) => {
                      const thumb = item.thumbnail || youtubeThumbnail(item.videoId);
                      const blocked = isBlacklisted(item.url, item.videoId);
                      const liked = songs.find((song) => song.url === item.url);
                      return (
                        <div
                          key={item.id}
                          className="group flex flex-col sm:flex-row gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.03] hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-[104px] h-[58px] rounded-xl overflow-hidden bg-black/50 border border-white/10 shrink-0 grid place-items-center">
                              {thumb ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <History className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-white font-black text-[12px] truncate">
                                  {item.title || item.url}
                                </span>
                                <span
                                  className={`shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                    item.kind === "audio"
                                      ? "bg-cyan-500/15 text-cyan-300"
                                      : "bg-red-500/15 text-red-300"
                                  }`}
                                >
                                  {item.kind}
                                </span>
                                <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-white/10 text-gray-300">
                                  {item.playCount || 1}× putar
                                </span>
                                {liked && (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-rose-500/15 text-rose-300 flex items-center gap-1">
                                    <Heart className="w-2.5 h-2.5 fill-current" /> Liked
                                  </span>
                                )}
                                {blocked && (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-orange-500/15 text-orange-300 flex items-center gap-1">
                                    <Ban className="w-2.5 h-2.5" /> Blocked
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-500 text-[10px] truncate">
                                {item.channel || "—"} • {platformLabel(item.platform)}
                                {item.requestedBy ? ` • req by ${item.requestedBy}` : ""}
                              </div>
                              <div className="text-gray-600 text-[9px] truncate">{item.url}</div>
                              <div className="text-gray-600 text-[9px] mt-1 flex items-center gap-2">
                                <Clock className="w-2.5 h-2.5" /> diputar {formatDate(item.playedAt)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 sm:self-center shrink-0">
                            <button
                              onClick={() => handleQueue(item)}
                              disabled={queueingId === item.id || blocked}
                              className="h-8 px-3 btn-primary rounded-lg text-[9px] font-black uppercase flex items-center gap-1 disabled:opacity-50"
                              title={blocked ? "Lagu ada di blacklist — unblock dulu" : "Tambahkan lagi ke queue"}
                            >
                              <Play className="w-3 h-3" /> Queue
                            </button>
                            <button
                              onClick={() => void handleToggleHistoryLike(item)}
                              disabled={saving}
                              className={`w-8 h-8 grid place-items-center rounded-lg border disabled:opacity-40 ${
                                liked
                                  ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                                  : "bg-white/5 hover:bg-rose-500/10 border-white/10 hover:border-rose-500/30 text-gray-400 hover:text-rose-300"
                              }`}
                              title={liked ? "Hapus dari Liked Songs" : "Simpan ke Liked Songs"}
                            >
                              <Heart className={`w-3 h-3 ${liked ? "fill-current" : ""}`} />
                            </button>
                            <button
                              onClick={() => void handleCopy(item.url)}
                              className="w-8 h-8 grid place-items-center btn-secondary border rounded-lg"
                              title="Copy URL"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 grid place-items-center btn-secondary border rounded-lg"
                              title="Buka lagu"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => void handleRemoveHistory(item.id)}
                              disabled={historySaving}
                              className="w-8 h-8 grid place-items-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 disabled:opacity-40"
                              title="Hapus dari riwayat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {!keyResolved && (
            <div className="text-[10px] text-gray-600 text-center">Menyiapkan data akun…</div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-[10px] text-gray-600 pb-4">
            <span className="flex items-center gap-2">
              <ListPlus className="w-3 h-3" /> Lagu liked bisa langsung dimasukkan ke queue dari halaman ini atau dari tab Music di dock.
            </span>
            <span className="flex items-center gap-2">
              <Ban className="w-3 h-3" /> Lagu blacklist ditolak otomatis dari chat, donation, dock, dan halaman ini.
            </span>
            <span className="flex items-center gap-2">
              <History className="w-3 h-3" /> Riwayat lagu tercatat otomatis, tanpa duplikat untuk URL yang sama.
            </span>
          </div>
        </main>
      </div>

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        title="Hapus lagu dari Liked Songs?"
        description={deleting ? `"${deleting.title || deleting.url}" akan dihapus dari daftar favorit.` : ""}
        confirmLabel="Hapus"
        variant="danger"
      />

      <ConfirmModal
        open={confirmClearHistory}
        onClose={() => setConfirmClearHistory(false)}
        onConfirm={() => void handleClearHistory()}
        title="Hapus semua riwayat lagu?"
        description="Riwayat lagu yang sudah diputar akan dibersihkan. Lagu yang masih ada di Liked atau Blacklist tetap tersimpan."
        confirmLabel="Hapus riwayat"
        variant="danger"
      />
    </div>
  );
}

export default function SongsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500 text-[11px]">
          Loading…
        </div>
      }
    >
      <SongsInner />
    </Suspense>
  );
}
