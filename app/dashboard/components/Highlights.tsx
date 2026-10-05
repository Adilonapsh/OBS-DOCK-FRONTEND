'use client';
import { useEffect, useMemo, useState } from "react";
import { Clock, Calendar, Play, RefreshCw, Video, Trash2, Eye } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import ConfirmModal from "../../components/ConfirmModal";

type Platform = "tiktok" | "youtube" | "twitch" | "kick" | "facebook" | "instagram" | "other";
type Highlight = {
  id: string;
  user_id?: string;
  platform: Platform;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
  started_at: string;
  ended_at?: string | null;
  duration_seconds?: number | null;
  viewers?: number | null;
  source: "tiktok_live" | "streamerbot" | "manual";
  metadata?: any;
  created_at?: string;
};

const PLATFORM_META: Record<string, { label: string; color: string; dot: string }> = {
  tiktok: { label: "TikTok", color: "bg-[#ff0050] text-white", dot: "bg-[#ff0050]" },
  youtube: { label: "YouTube", color: "bg-red-600 text-white", dot: "bg-red-600" },
  twitch: { label: "Twitch", color: "bg-[#9146ff] text-white", dot: "bg-[#9146ff]" },
  kick: { label: "Kick", color: "bg-[#53fc18] text-black", dot: "bg-[#53fc18]" },
  facebook: { label: "Facebook", color: "bg-blue-600 text-white", dot: "bg-blue-600" },
  instagram: { label: "Instagram", color: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white", dot: "bg-pink-500" },
  other: { label: "Lainnya", color: "bg-zinc-700 text-white", dot: "bg-zinc-600" },
};

const FILTERS: (Platform | "all")[] = ["all", "tiktok", "youtube", "twitch", "kick", "other"];

const RANGES = [
  { value: 7, label: "7 Hari" },
  { value: 14, label: "14 Hari" },
  { value: 30, label: "1 Bulan" },
] as const;
type RangeDays = 7 | 14 | 30;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
function formatDuration(sec?: number | null) {
  if (!sec) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}

export default function Highlights() {
  const supabase = createClient();
  const [items, setItems] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Platform | "all">("all");
  const [range, setRange] = useState<RangeDays>(7);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchHighlights = async (days: RangeDays = range) => {
    setLoading(true);
    const bypassKey = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("key") || sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified")) : null;
    try {
      const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      let data: Highlight[] | null = null;

      if (bypassKey) {
        const { data: rpc } = await (supabase as any).rpc("get_highlights_by_private_key", { p_key: bypassKey, p_days: days });
        if (Array.isArray(rpc)) data = rpc as any;
      }
      if (!data) {
        const { data: sess } = await supabase.auth.getSession();
        if (sess.session) {
          const { data: q } = await supabase
            .from("highlights")
            .select("*")
            .gte("started_at", sinceIso)
            .order("started_at", { ascending: false })
            .limit(50);
          data = (q as any) || [];
        }
      }
      // fallback localStorage cache for guest without DB
      if (!data || data.length === 0) {
        try {
          const raw = localStorage.getItem("highlights-cache");
          if (raw) {
            const parsed = JSON.parse(raw) as Highlight[];
            const filtered = parsed.filter((h) => new Date(h.started_at).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000);
            if (filtered.length) data = filtered;
          }
        } catch {}
      }
      setItems(data || []);
    } catch (e) {
      console.error("fetch highlights", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    return;
  };
  const confirmDelete = async () => {
    const id = deleteId;
    if (!id) return;
    const bypassKey = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("key") || sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified")) : null;
    try {
      if (id.startsWith("local-") || id.startsWith("tmp-")) {
        const cur = JSON.parse(localStorage.getItem("highlights-cache") || "[]");
        localStorage.setItem("highlights-cache", JSON.stringify(cur.filter((x: any) => x.id !== id)));
        setItems((prev) => prev.filter((x) => x.id !== id));
        return;
      }
      if (bypassKey) {
        // via private key belum ada delete RPC, fallback delete via anon? coba langsung
        const { data: sess } = await supabase.auth.getSession();
        if (sess.session) {
          await supabase.from("highlights").delete().eq("id", id);
        } else {
          // tidak bisa hapus via bypass tanpa RPC, hapus lokal state saja
          setItems((prev) => prev.filter((x) => x.id !== id));
        }
      } else {
        await supabase.from("highlights").delete().eq("id", id);
      }
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHighlights(range);
  }, [range]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "other") return items.filter((i) => !["tiktok", "youtube", "twitch", "kick"].includes(i.platform));
    return items.filter((i) => i.platform === filter);
  }, [items, filter]);

  const withinRangeCount = items.length;
  const rangeLabel = range === 30 ? "1 Bulan" : `${range} Hari`;

  return (
    <>
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Hapus sorotan?"
        description="Sorotan ini akan dihapus dari database dan tidak dapat dikembalikan."
        confirmLabel="Hapus"
        variant="danger"
      />
      <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-white/[0.02] to-transparent">
        <div>
          <h3 className="text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
            <Video className="w-3.5 h-3.5 text-white" /> Sorotan {rangeLabel} Terakhir
          </h3>
          <p className="text-gray-500 text-[11px] mt-1">
            {withinRangeCount} video • Auto-log dari dock livestream
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-black/30 rounded-full p-1 border border-white/10">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value as RangeDays)}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${range === r.value ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchHighlights(range)}
            disabled={loading}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase text-gray-300 flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => {
          const isActive = filter === f;
          const label = f === "all" ? "Semua" : PLATFORM_META[f]?.label || f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border shrink-0 transition-colors ${
                isActive ? "bg-white text-black border-white" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          );
        })}
        <span className="ml-auto hidden sm:inline text-[10px] text-gray-600 font-bold whitespace-nowrap">{filtered.length} sorotan</span>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-black/30 border border-white/5 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-black/20">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 grid place-items-center mx-auto">
              <Video className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-white font-black uppercase text-[11px] mt-3">Belum ada sorotan {rangeLabel.toLowerCase()}</p>
            <p className="text-gray-500 text-[11px] mt-1">Sorotan akan muncul di sini. Ubah rentang ke 14 hari / 1 bulan untuk melihat lebih banyak.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((h) => {
              const meta = PLATFORM_META[h.platform] || PLATFORM_META.other;
              return (
                <div key={h.id} className="group bg-black/20 border border-white/10 rounded-xl overflow-hidden hover:border-white/15 hover:bg-white/[0.02] transition-colors flex flex-col">
                  <div className="relative aspect-video bg-black overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.thumbnail_url || `https://picsum.photos/seed/${h.id}/640/360`} alt={h.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 ${meta.color}`}>{meta.label}</span>
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur border border-white/10 rounded text-[9px] font-bold text-white flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} animate-pulse`} /> {h.source === "tiktok_live" ? "TikTok Live" : "StreamerBot"}
                    </span>
                    {h.duration_seconds && (
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-mono font-bold text-white">{formatDuration(h.duration_seconds)}</span>
                    )}
                    <a
                      href={h.video_url || "#"}
                      target="_blank"
                      className={`absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity ${h.video_url ? "" : "pointer-events-none"}`}
                    >
                      <span className="w-10 h-10 rounded-full bg-white/90 backdrop-blur grid place-items-center shadow-lg">
                        <Play className="w-4 h-4 text-black ml-0.5" />
                      </span>
                    </a>
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <h4 className="text-white font-bold text-[12px] leading-snug line-clamp-2">{h.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(h.started_at)}
                      </span>
                      <span className="w-1 h-1 bg-white/20 rounded-full" />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTime(h.started_at)} WIB
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-auto border-t border-white/5">
                      <span className="text-[10px] text-gray-600 font-bold flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {h.viewers ?? "-"} views
                      </span>
                      <div className="flex items-center gap-1">
                        {h.video_url && (
                          <a href={h.video_url} target="_blank" className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white">
                            <Play className="w-3 h-3" />
                          </a>
                        )}
                        <button onClick={() => handleDelete(h.id)} className="p-1.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-lg text-gray-500 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
