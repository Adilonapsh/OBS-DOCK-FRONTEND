'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Layers, Monitor, Search, Copy, Check, Eye, ExternalLink, Sparkles,
  MessageSquare, Gift, Heart, UserPlus, Pin, Zap, LayoutGrid, Filter,
  Settings2, Activity, AlertCircle, Menu, Plus, Palette, Pencil
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { createClient } from "@/utils/supabase/client";
import { Suspense } from "react";
import { themeToQuery, themeStorageKey, cssStorageKey, encodeCss } from "./components/theme";

type OverlayItem = {
  id: string;
  title: string;
  desc: string;
  category: "chat" | "alert" | "full" | "minimal" | "info";
  tags: string[];
  layout: string;
  params: string; // extra query
  preview: "chat" | "gift" | "full" | "pinned" | "minimal" | "like" | "horizontal" | "counter" | "cyber";
  recommended?: boolean;
  w: number;
  h: number;
};

const OVERLAYS: OverlayItem[] = [
  {
    id: "full",
    title: "Full Combined",
    desc: "Chat + Gift + Like + Member + Pinned dalam 1 canvas. Rekomendasi untuk stream utama.",
    category: "full",
    tags: ["1920×1080", "Transparent", "Realtime"],
    layout: "full",
    params: "layout=full&pos=bl",
    preview: "full",
    recommended: true,
    w: 1920, h: 1080,
  },
  {
    id: "chat",
    title: "Chat Overlay",
    desc: "Stack chat TikTok minimalis bottom-left, auto-slide & glassmorphism.",
    category: "chat",
    tags: ["Chat", "Bottom-Left", "6 max"],
    layout: "chat",
    params: "layout=chat&pos=bl&chat=1&gift=0&like=0&member=0&pin=0",
    preview: "chat",
    w: 1920, h: 1080,
  },
  {
    id: "gift",
    title: "Gift Alert",
    desc: "Alert gift tengah layar epic - gift name × count + diamond, animasi pop.",
    category: "alert",
    tags: ["Gift", "Center", "FE2C55"],
    layout: "gift",
    params: "layout=alerts&chat=0&gift=1&like=0&member=0&pin=0",
    preview: "gift",
    w: 1920, h: 1080,
  },
  {
    id: "pinned",
    title: "Pinned Chat",
    desc: "Pinned chat besar tengah dengan border cyan, untuk highlight pesan penting.",
    category: "info",
    tags: ["Pinned", "Center", "Cyan"],
    layout: "pinned",
    params: "chat=0&gift=0&like=0&member=0&pin=1",
    preview: "pinned",
    w: 1920, h: 1080,
  },
  {
    id: "like-member",
    title: "Like & Member",
    desc: "Burst like + member join toasts. Cocok untuk interaksi TikTok live.",
    category: "alert",
    tags: ["Like", "Member", "Toasts"],
    layout: "like",
    params: "chat=0&gift=0&like=1&member=1&pin=0",
    preview: "like",
    w: 1920, h: 1080,
  },
  {
    id: "minimal",
    title: "Minimal Clean",
    desc: "Hanya alerts tanpa chat stack - bersih untuk layout game fullscreen.",
    category: "minimal",
    tags: ["Minimal", "Alerts Only"],
    layout: "minimal",
    params: "layout=minimal&chat=0&gift=1&like=0&member=0&pin=0",
    preview: "minimal",
    w: 1920, h: 1080,
  },
  // {
  //   id: "chat-right",
  //   title: "Chat Right",
  //   desc: "Varian chat di kanan bawah (BR) untuk layout kamera kiri.",
  //   category: "chat",
  //   tags: ["Chat", "Bottom-Right"],
  //   layout: "chat",
  //   params: "layout=chat&pos=br&chat=1&gift=0&like=0&member=0&pin=0",
  //   preview: "chat",
  //   w: 1920, h: 1080,
  // },
  // {
  //   id: "vertical",
  //   title: "Vertical Chat",
  //   desc: "Stack chat center-bottom, style TikTok vertical live - upcoming.",
  //   category: "chat",
  //   tags: ["Center", "Coming Soon"],
  //   layout: "chat",
  //   params: "layout=chat&pos=center&chat=1&gift=0&like=0&member=0&pin=0",
  //   preview: "chat",
  //   w: 1080, h: 1920,
  // },
  {
    id: "horizontal-chat",
    title: "Horizontal Chat",
    desc: "Chat ticker horizontal di bawah layar - jalan menyamping, cocok untuk lower third OBS.",
    category: "chat",
    tags: ["Horizontal", "Ticker", "Lower Third"],
    layout: "horizontal",
    params: "layout=horizontal&pos=bottom&chat=1&gift=0&like=0&member=0&pin=0",
    preview: "horizontal",
    recommended: false,
    w: 1920, h: 1080,
  },
  {
    id: "view-counter",
    title: "View Counter",
    desc: "Realtime viewer count - angka penonton live TikTok update otomatis, style pill/card compact.",
    category: "info",
    tags: ["Realtime", "Viewers", "Counter", "Eye"],
    layout: "counter",
    params: "layout=counter&counter=1&chat=0&gift=0&like=0&member=0&pin=0",
    preview: "counter",
    recommended: true,
    w: 1920, h: 1080,
  },
  // {
  //   id: "cyber-terminal",
  //   title: "Cyber Terminal",
  //   desc: "Tema full hacker terminal - neon panel JetBrains Mono, user-tag, avatar visualizer & dot-pulse. Dari HTML kamu.",
  //   category: "full",
  //   tags: ["Cyber", "Neon", "Terminal", "JetBrains"],
  //   layout: "cyber",
  //   params: "layout=cyber&pos=center&chat=1&gift=1&pin=1",
  //   preview: "cyber",
  //   recommended: true,
  //   w: 1920, h: 1080,
  // },
];

function PreviewThumb({ type }: { type: OverlayItem["preview"] }) {
  if (type === "chat") {
    return (
      <div className="w-full h-full bg-black p-3 flex flex-col justify-end gap-1.5">
        <div className="flex gap-2 px-2.5 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl w-[72%]">
          <div className="w-6 h-6 rounded-lg bg-white/10 shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-2 w-16 bg-white rounded" />
            <div className="h-1.5 w-full bg-white/60 rounded" />
          </div>
        </div>
        <div className="flex gap-2 px-2.5 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl w-[68%]">
          <div className="w-6 h-6 rounded-lg bg-[#FE2C55]/30 shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-2 w-12 bg-white rounded" />
            <div className="h-1.5 w-full bg-white/60 rounded" />
          </div>
        </div>
      </div>
    );
  }
  if (type === "gift") {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center p-3">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-br from-[#1a0a0f] to-black border border-[#FE2C55]/30 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-[#FE2C55]/40 border border-[#FE2C55]" />
          <div>
            <div className="h-1.5 w-10 bg-[#FE2C55] rounded mb-1" />
            <div className="h-2.5 w-20 bg-white rounded" />
          </div>
        </div>
      </div>
    );
  }
  if (type === "pinned") {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center p-3">
        <div className="w-[85%] px-3 py-3 bg-[#0f0f0f] border border-cyan-500/30 rounded-2xl flex gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/30 border border-cyan-500 shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-2 w-14 bg-white rounded" />
            <div className="h-1.5 w-full bg-white/70 rounded" />
            <div className="h-1.5 w-3/4 bg-white/50 rounded" />
          </div>
        </div>
      </div>
    );
  }
  if (type === "like") {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-2 p-3">
        <div className="px-3 py-1.5 bg-pink-500/20 border border-pink-500/30 rounded-full flex items-center gap-1.5">
          <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
          <div className="h-2 w-16 bg-white rounded" />
        </div>
        <div className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full flex items-center gap-1.5">
          <UserPlus className="w-3 h-3 text-green-400" />
          <div className="h-2 w-12 bg-white rounded" />
        </div>
      </div>
    );
  }
  if (type === "minimal") {
    return (
      <div className="w-full h-full bg-black grid place-items-center p-3">
        <div className="text-[8px] font-black uppercase tracking-widest text-gray-600 border border-white/10 rounded-full px-2 py-1 bg-white/5">Alerts Only • Clean</div>
      </div>
    );
  }
  if (type === "horizontal") {
    return (
      <div className="w-full h-full bg-black flex items-end justify-center p-3">
        <div className="flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-[#1a1a1a] via-[#141414] to-black border border-white/10 rounded-xl w-[85%] overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-500/30 shrink-0 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-3 whitespace-nowrap overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-green-400 shrink-0" />
              <span className="text-white font-black text-[11px]">Rizky_JR</span>
              <span className="text-gray-500 text-[10px]">Lagi main apa nih? 🔥</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-pink-400 shrink-0" />
              <span className="text-white font-black text-[11px]">SitiPlay</span>
              <span className="text-gray-500 text-[10px]">Gass keun bang!</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-purple-400 shrink-0" />
              <span className="text-white font-black text-[11px]">TestUser</span>
              <span className="text-gray-500 text-[10px]">Halo overlay! 👋</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (type === "counter") {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center p-3">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] border border-white/10 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <Eye className="w-4 h-4 text-white" />
          <span className="text-white font-black text-[13px] tracking-tight">1,234</span>
          <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Viewers</span>
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[7px] font-black uppercase"><Activity className="w-2.5 h-2.5" /> LIVE</span>
        </div>
      </div>
    );
  }
  if (type === "cyber") {
    return (
      <div className="w-full h-full bg-black p-2 flex flex-col gap-1.5 justify-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <div className="bg-[#050505] border-2 border-[#970020] rounded-xl p-2 shadow-[0_0_10px_rgba(151,0,32,0.4)]">
          <div className="inline-block px-1.5 py-0.5 bg-[#970020] text-white text-[6px] font-black uppercase rounded">User</div>
          <div className="text-white font-bold text-[7px] leading-tight mt-1">Inisialisasi sistem...</div>
        </div>
        <div className="flex gap-1.5">
          <div className="w-10 h-10 bg-[#050505] border-2 border-[#970020] rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-[#970020]/30" />
          </div>
          <div className="flex-1 bg-[#050505] border-2 border-[#970020] rounded-xl p-2 flex items-center">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#970020] animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#970020] animate-pulse" style={{ animationDelay: "0.2s" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#970020] animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }
  // full
  return (
    <div className="w-full h-full bg-black relative p-2 overflow-hidden">
      <div className="absolute top-2 left-2 flex gap-1">
        <div className="px-1.5 py-0.5 bg-red-500 rounded-full w-8 h-1.5" />
        <div className="px-1.5 py-0.5 bg-[#FE2C55] rounded-full w-10 h-1.5" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 px-3 py-2 bg-[#0f0f0f] border border-cyan-500/20 rounded-2xl scale-75">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/30" />
        <div className="h-2 w-16 bg-white rounded mt-1" />
      </div>
      <div className="absolute bottom-2 left-2 flex flex-col gap-1">
        <div className="px-2 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-xl w-28 h-6" />
        <div className="px-2 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-xl w-24 h-6" />
      </div>
    </div>
  );
}

function OverlayListing() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [privateKey, setPrivateKey] = useState<string>(searchParams.get("key") || "");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | OverlayItem["category"]>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingKey, setLoadingKey] = useState(true);

  useEffect(() => {
    const init = async () => {
      const keyFromUrl = searchParams.get("key")?.trim();
      if (keyFromUrl) {
        setPrivateKey(keyFromUrl);
        setLoadingKey(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        try {
          const { data: p } = await supabase.from("profiles").select("private_key").eq("id", session.user.id).single();
          const k = (p as any)?.private_key;
          if (k) { setPrivateKey(k); setLoadingKey(false); return; }
        } catch {}
        try {
          const { data: s } = await supabase.from("user_private_keys").select("private_key").eq("user_id", session.user.id).single();
          const k = (s as any)?.private_key;
          if (k) { setPrivateKey(k); setLoadingKey(false); return; }
        } catch {}
        // fallback sessionStorage
        const stored = sessionStorage.getItem("dock_private_verified") || sessionStorage.getItem("bypass_private_key");
        if (stored) setPrivateKey(stored);
      } else {
        const stored = typeof window !== "undefined" ? (sessionStorage.getItem("dock_private_verified") || sessionStorage.getItem("bypass_private_key") || "") : "";
        if (stored) setPrivateKey(stored);
      }
      setLoadingKey(false);
    };
    init();
  }, []);

  const filtered = OVERLAYS.filter(o => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.desc.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || o.category === filter;
    return matchSearch && matchFilter;
  });

  const getOverlayUrl = (item: OverlayItem, transparent = true) => {
    if (typeof window === "undefined") return "";
    let themeQ = "";
    let cssQ = "";
    try {
      const raw = localStorage.getItem(themeStorageKey(item.id));
      if (raw) {
        const t = JSON.parse(raw);
        themeQ = "&" + themeToQuery(t);
      }
      const rawCss = localStorage.getItem(cssStorageKey(item.id));
      if (rawCss) cssQ = "&css=" + encodeCss(rawCss);
    } catch {}
    const base = `${window.location.origin}/overlay/display?key=${privateKey || "YOUR_PRIVATE_KEY"}&${item.params}${themeQ}${cssQ}`;
    return transparent ? `${base}&obs=1` : base;
  };

  const handleCopy = async (id: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="overlay" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-black rounded-full text-[10px] font-black tracking-widest uppercase"><Layers className="w-3 h-3" /> OVERLAY</span>
            <span className="hidden md:inline text-[11px] text-gray-500 font-bold">{filtered.length} template • {privateKey ? `${privateKey.slice(0, 8)}…` : "butuh private key"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={privateKey ? `/overlay/display?key=${privateKey}` : "/overlay/display"} target="_blank" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl text-[10px] font-black uppercase text-white">
              <Eye className="w-3 h-3" /> Preview Full
            </Link>
            <Link href={privateKey ? `/dock?key=${privateKey}` : "/dock"} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">
              <Monitor className="w-3 h-3" /> Dock
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto space-y-5">
          {/* Hero */}
          <div className="bg-gradient-to-br from-blue-900/20 via-[#161616] to-cyan-900/10 border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-white font-black text-[18px] md:text-[20px] tracking-tight flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-400" /> Daftar Overlay</h1>
              <p className="text-gray-400 text-[11px] md:text-[12px] mt-1 max-w-[640px] leading-relaxed">
                Pilih template overlay untuk OBS Browser Source. Semua overlay transparan, 1920×1080, realtime via private key isolasi. Copy URL & paste di OBS.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                <span className="px-2 py-1 bg-white text-black rounded-full flex items-center gap-1"><Monitor className="w-3 h-3" /> Browser Source</span>
                <span className="px-2 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-full">Transparent</span>
                <span className="px-2 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-full">60 FPS</span>
                <span className="px-2 py-1 bg-[#FE2C55]/20 border border-[#FE2C55]/20 text-[#FE2C55] rounded-full">TikTok Live</span>
              </div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 w-full lg:w-[360px] shrink-0">
              <div className="text-gray-500 font-black uppercase text-[9px] tracking-widest flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Private Key (untuk URL)</div>
              {loadingKey ? (
                <div className="mt-2 h-9 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    value={privateKey}
                    onChange={e => setPrivateKey(e.target.value)}
                    placeholder="paste private key / kosong = YOUR_PRIVATE_KEY"
                    className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 placeholder:text-gray-600"
                  />
                  <Link href="/dashboard" className="shrink-0 h-9 px-3 bg-white text-black rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Dashboard
                  </Link>
                </div>
              )}
              <p className="text-gray-600 text-[10px] mt-1.5 leading-relaxed">URL otomatis pakai key ini. Ganti key untuk isolasi room lain.</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="relative flex-1 max-w-[420px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari overlay… (chat, gift, pinned)"
                className="w-full h-9 pl-9 pr-3 bg-[#161616] border border-white/10 rounded-xl text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="hidden sm:inline-flex items-center gap-1 text-gray-500 text-[10px] font-black uppercase tracking-widest"><Filter className="w-3 h-3" /> Filter</span>
              {(["all", "full", "chat", "alert", "info", "minimal"] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`shrink-0 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-colors ${filter === cat ? "bg-white text-black border-white" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"}`}
                >
                  {cat === "all" ? <span className="flex items-center gap-1"><LayoutGrid className="w-3 h-3" /> Semua</span> : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(item => {
              const urlObs = getOverlayUrl(item, true);
              const urlPreview = getOverlayUrl(item, false);
              return (
                <div key={item.id} className="group bg-[#161616] border border-white/10 rounded-2xl overflow-hidden hover:border-white/15 hover:bg-[#1a1a1a] transition-colors flex flex-col">
                  {/* thumb */}
                  <div className="aspect-video bg-black relative overflow-hidden border-b border-white/5">
                    <PreviewThumb type={item.preview} />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${item.recommended ? "bg-cyan-500 text-black border-cyan-400" : "bg-black/60 backdrop-blur text-white border-white/10"}`}>
                        {item.category}
                      </span>
                      {item.recommended && <span className="px-1.5 py-0.5 bg-yellow-500 text-black rounded-full text-[8px] font-black uppercase flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Recommended</span>}
                    </div>
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur border border-white/10 rounded-full text-[8px] font-mono text-gray-400">
                      {item.w}×{item.h}
                    </div>
                    <div className="absolute bottom-2 right-2 hidden group-hover:flex items-center gap-1">
                      <Link href={urlPreview} target="_blank" className="w-7 h-7 bg-white text-black rounded-full grid place-items-center hover:bg-gray-100 shadow-lg">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => handleCopy(item.id, urlObs)} className="w-7 h-7 bg-cyan-500 text-black rounded-full grid place-items-center hover:bg-cyan-400 shadow-lg">
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-white font-black text-[12px] uppercase tracking-wide leading-none">{item.title}</h3>
                    <p className="text-gray-500 text-[11px] leading-relaxed mt-1.5 line-clamp-2">{item.desc}</p>
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {item.tags.map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[8px] font-bold uppercase tracking-wide text-gray-400">{t}</span>
                      ))}
                    </div>

                    <div className="mt-3 bg-black/40 border border-white/10 rounded-xl p-2 flex items-center gap-2">
                      <code className="flex-1 text-[9px] font-mono text-cyan-300 truncate">{urlObs}</code>
                      <button onClick={() => handleCopy(item.id, urlObs)} className="shrink-0 w-7 h-7 bg-white text-black rounded-lg grid place-items-center hover:bg-gray-100">
                        {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      <Link href={urlPreview} target="_blank" className="h-8 flex items-center justify-center gap-1 bg-white text-black rounded-xl text-[9px] font-black uppercase hover:bg-gray-100">
                        <Eye className="w-3 h-3" /> Preview
                      </Link>
                      <Link href={`/overlay/editor?id=${item.id}&key=${privateKey || ""}`} className="h-8 flex items-center justify-center gap-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-[9px] font-black uppercase">
                        <Palette className="w-3 h-3" /> Edit Tema
                      </Link>
                      <button onClick={() => handleCopy(item.id, urlObs)} className="h-8 flex items-center justify-center gap-1 bg-[#FE2C55] hover:bg-[#E62254] text-white rounded-xl text-[9px] font-black uppercase">
                        <Copy className="w-3 h-3" /> OBS
                      </button>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-wide">
                      <span className="text-gray-600 flex items-center gap-1"><Activity className="w-3 h-3" /> {item.layout}</span>
                      <Link href={urlPreview} target="_blank" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">Buka <ExternalLink className="w-3 h-3" /></Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-10 text-center">
              <AlertCircle className="w-8 h-8 text-gray-600 mx-auto" />
              <div className="text-white font-black uppercase text-[12px] mt-2">Tidak ada overlay</div>
              <div className="text-gray-500 text-[11px] mt-1">Coba ganti filter atau kata kunci pencarian.</div>
            </div>
          )}

          {/* How to */}
          <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 md:p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-white font-black uppercase text-[11px] flex items-center gap-2"><Monitor className="w-4 h-4 text-blue-400" /> Cara Pakai di OBS</div>
              <ol className="mt-2 space-y-1.5 text-[11px] text-gray-400 leading-relaxed list-decimal list-inside">
                <li>Copy <span className="text-white font-bold">Copy OBS</span> URL (sudah ada <code className="bg-white/10 px-1 rounded text-cyan-300">?obs=1</code>)</li>
                <li>OBS → Add Source → <span className="text-white font-bold">Browser Source</span> → Paste URL</li>
                <li>Set <b className="text-white">Width 1920</b> Height <b className="text-white">1080</b> FPS 60 → ☑ Shutdown when not visible</li>
                <li>Atur posisi & scale - background otomatis transparan</li>
              </ol>
            </div>
            <div>
              <div className="text-white font-black uppercase text-[11px] flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Tips</div>
              <ul className="mt-2 space-y-1.5 text-[11px] text-gray-400 leading-relaxed list-disc list-inside">
                <li>Pakai <span className="text-white font-bold">Full Combined</span> untuk setup cepat 1 source</li>
                <li>Pisah source jika mau kontrol posisi chat & alert terpisah</li>
                <li>Ganti <code className="bg-white/10 px-1 rounded">?pos=br</code> untuk chat kanan, <code className="bg-white/10 px-1 rounded">?scale=1.2</code> untuk zoom</li>
              </ul>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-xl p-3 flex flex-col">
              <div className="text-white font-black uppercase text-[11px] flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" /> Edit Tema Dulu</div>
              <p className="text-gray-500 text-[11px] mt-1 leading-relaxed">Klik <span className="text-white font-bold">Edit Tema</span> di card overlay sebelum masuk OBS - atur warna, radius, blur, font & posisi dengan live preview.</p>
              <Link href={privateKey ? `/overlay/editor?id=full&key=${privateKey}` : "/overlay/editor?id=full"} className="mt-3 h-8 flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase">
                <Pencil className="w-3 h-3" /> Buka Editor Tema
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function OverlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500 text-sm">Memuat…</div>}>
      <OverlayListing />
    </Suspense>
  );
}
