'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Layers, Monitor, Search, Eye, EyeOff, ExternalLink, Sparkles,
  Gift, Heart, UserPlus, Zap, LayoutGrid, Filter,
  Settings2, AlertCircle, Menu, Palette, Pencil,
  Music, Cog, GripVertical, Volume2, Pin
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { createClient } from "@/utils/supabase/client";
import { Suspense } from "react";
import { themeToQuery, themeStorageKey, cssStorageKey, encodeCss } from "../overlay/components/theme";

type WidgetItem = {
  id: string;
  title: string;
  desc: string;
  category: "chat" | "alert" | "counter" | "progress" | "info" | "minimal";
  tags: string[];
  layout: string;
  params: string; // extra query
  preview: "chat" | "gift" | "pinned" | "like" | "counter" | "goal" | "ticker" | "clock" | "social" | "minimal" | "full" | "media" | "lyrics" | "poll" | "task" | "timer" | "follow" | "social-rotator" | "pin";
  recommended?: boolean;
  w: number;
  h: number;
};

const WIDGETS: WidgetItem[] = [
  {
    id: "chat",
    title: "Chat Overlay",
    desc: "Overlay chat TikTok + Streamer.bot (Twitch/YouTube/Kick) - 5 tema (Cute lavender), avatar & platform logo, animasi elegant & horizontal/inline. Sumber: server.ts tiktok-chat.",
    category: "chat",
    tags: ["Chat", "TikTok", "Streamer.bot", "Overlay"],
    layout: "chat",
    params: "theme=standard&font=Outfit&accent=%238b5cf6",
    preview: "chat",
    recommended: true,
    w: 420, h: 520,
  },
  {
    id: "event",
    title: "Event Overlay",
    desc: "Overlay event Join • Gift • Like - TikTok member/gift/like + Streamer.bot, 3 tema (Standard/Minimal/Cute), filter per event, animasi elegant. Sumber: server.ts tiktok-member/gift/like.",
    category: "alert",
    tags: ["Event", "Join", "Gift", "Like", "TikTok"],
    layout: "event",
    params: "theme=standard&font=Outfit&accent=%238b5cf6",
    preview: "gift",
    recommended: true,
    w: 420, h: 400,
  },
  {
    id: "timer",
    title: "Timer",
    desc: "Pomodoro 50:00 × 3 sesi - 4 tema (Focus/Minimal/Subathon/Glass), Glass sync dock ±5m & COUNTDOWN live + badge +5m.",
    category: "progress",
    tags: ["Timer", "Focus", "Glass", "Sync"],
    layout: "timer",
    params: "theme=glass&font=Nunito&focusMinutes=50&totalSessions=3",
    preview: "timer",
    recommended: true,
    w: 360, h: 340,
  },
  {
    id: "task",
    title: "Task List",
    desc: "Task list - 2 tema, inline/horizontal, animasi masuk/keluar. Pisah dari Timer.",
    category: "progress",
    tags: ["Task", "List", "Todo"],
    layout: "task",
    params: "theme=focus&font=Nunito",
    preview: "task",
    recommended: true,
    w: 360, h: 400,
  },
  {
    id: "follow",
    title: "Follow Overlay",
    desc: "Follow alert + suara - TikTok follow/member + Twitch/YouTube follow via Streamer.bot, 3 tema, suara MP3 kustom, animasi elegant hide fade.",
    category: "alert",
    tags: ["Follow", "Alert", "Sound", "TikTok"],
    layout: "follow",
    params: "theme=standard&font=Outfit&accent=%23ec4899",
    preview: "follow",
    recommended: true,
    w: 420, h: 300,
  },
  {
    id: "poll",
    title: "Poll Widget",
    desc: "Polling interaktif 2-6 opsi - vote via chat 1-6 dari TikTok & Streamer.bot (YT/Twitch/Kick), progress % + voter count, 4 tema.",
    category: "progress",
    tags: ["Poll", "Vote", "TikTok", "Streamer.bot"],
    layout: "poll",
    params: "theme=bar&font=Outfit",
    preview: "poll",
    recommended: true,
    w: 640, h: 320,
  },
  {
    id: "clock",
    title: "Clock Widget",
    desc: "Jam digital 3 baris - format bebas (dayjs), timezone, warna/size/opacity per baris. Transparent untuk OBS.",
    category: "info",
    tags: ["Clock", "Time", "Timezone"],
    layout: "clock",
    params: "font=Outfit&tz=Asia/Jakarta&l1=hh:mm:ss%20A&l2=ddd%20D%20MMM%20YY",
    preview: "clock",
    recommended: true,
    w: 600, h: 220,
  },
  {
    id: "media-player",
    title: "Media Player Widget",
    desc: "Now Playing SMTC - Spotify/YouTube/VLC + Vibrant palette, 11 themes, progress & marquee.",
    category: "info",
    tags: ["SMTC", "Spotify", "Vibrant", "Now Playing"],
    layout: "media",
    params: "theme=classic&font=Outfit&showProgressBar=true&showAlbumArt=true",
    preview: "media",
    recommended: true,
    w: 500, h: 140,
  },
  {
    id: "lyrics",
    title: "Lyrics Widget",
    desc: "Synced Lyrics SMTC - hanya lirik (tanpa cover/progress), karaoke highlight via LRCLIB, 11 themes sama persis seperti Media Player.",
    category: "info",
    tags: ["Lyrics", "LRCLIB", "SMTC", "Karaoke"],
    layout: "lyrics",
    params: "theme=standard&font=Outfit&lyricsFontSize=20&maxLyricsLines=3&lyricsAlign=center",
    preview: "lyrics",
    recommended: true,
    w: 560, h: 180,
  },
  {
    id: "info-slides",
    title: "Info Slides",
    desc: "Sponsor / Rules Loop - 5-10 slide auto-rotate 5-10s, 3 tema Clean/Boxed/Glass, badge + progress dots.",
    category: "info",
    tags: ["Info", "Slides", "Sponsor", "Rules"],
    layout: "info-slides",
    params: "theme=clean&font=Outfit&duration=6&autoRotate=true",
    preview: "ticker",
    recommended: true,
    w: 640, h: 160,
  },
  {
    id: "social-rotator",
    title: "Social Rotator",
    desc: "Rotasi handle sosial - Instagram/TikTok/YouTube/Twitch/Discord, 5 tema Pill/Clean/Glass/Boxed/Badge Space Mono, interval 2-20s, posisi global 9-titik.",
    category: "info",
    tags: ["Social", "Rotator", "Instagram", "TikTok", "OBS"],
    layout: "social",
    params: "theme=pill&font=Outfit&duration=4&pos=bl",
    preview: "social",
    recommended: true,
    w: 420, h: 160,
  },
  {
    id: "pinned",
    title: "Pinned Chat",
    desc: "Chat yang di-pin dari dock — sinkron realtime, lepas via unpin. 2 tema Standard/Minimal.",
    category: "chat",
    tags: ["Pin", "Chat", "Sync"],
    layout: "pinned",
    params: "theme=standard&font=Outfit",
    preview: "pinned",
    recommended: true,
    w: 400, h: 200,
  },
  {
    id: "view-counter",
    title: "View Counter",
    desc: "Total penonton gabungan TikTok + Twitch + YouTube + Kick. TikTok via backend, sisanya via Streamer.bot.",
    category: "info",
    tags: ["Viewers", "TikTok", "Streamer.bot"],
    layout: "counter",
    params: "theme=standard&font=Outfit",
    preview: "counter",
    recommended: true,
    w: 260, h: 200,
  },
  {
    id: "custom",
    title: "Custom Overlay",    desc: "StreamElements-like - canvas 1920×1080, drag-drop layers (chat {{username}}/{{message}}, timer {{timer}}, clock {{clock}}, polls {{polls}}, social {{handle}}), template {{date}} + custom CSS per layer, 1 URL obs.",
    category: "minimal",
    tags: ["Custom", "StreamElements", "DragDrop", "Template"],
    layout: "full",
    params: "custom=1",
    preview: "full",
    recommended: true,
    w: 1920, h: 1080,
  },
];

function PreviewThumb({ type }: { type: WidgetItem["preview"] }) {
  if (type === "social") {
    return (
      <div className="w-full h-full bg-black flex flex-col p-2 gap-1.5 justify-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-white/10 shadow w-fit mx-auto">
          <div className="w-6 h-6 rounded-full bg-black grid place-items-center text-white font-black text-[10px]">♪</div>
          <span className="text-black font-black text-[8px]">@adilonapsh</span>
          <span className="text-black/50 font-bold text-[6px] uppercase">TikTok</span>
        </div>
      </div>
    );
  }
  if (type === "ticker") {
    return (
      <div className="w-full h-full bg-black flex flex-col p-2 gap-1.5 justify-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.06] border border-white/10 rounded-xl">
          <span className="px-1.5 py-0.5 bg-white text-black rounded-full text-[6px] font-black">SPONSOR</span>
          <span className="text-white font-black text-[7px] truncate">TrueNAP - Ultra Low Latency</span>
        </div>
        <div className="flex gap-1 justify-center"><span className="w-4 h-1 bg-white rounded-full" /><span className="w-1 h-1 bg-white/30 rounded-full" /><span className="w-1 h-1 bg-white/30 rounded-full" /></div>
      </div>
    );
  }
  if (type === "follow") {
    return (
      <div className="w-full h-full bg-black flex flex-col p-2 gap-1.5 justify-center">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.06] border border-white/10 rounded-xl">
          <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center"><Heart className="w-4 h-4 text-black fill-black" /></div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-black text-[7px] leading-none">Rizky_JR</div>
            <div className="text-gray-400 text-[6px] font-bold">followed you • welcome!</div>
          </div>
          <Volume2 className="w-3 h-3 text-gray-400" />
        </div>
      </div>
    );
  }
  if (type === "timer") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2 gap-1">
        <div className="w-[132px] px-2.5 py-1.5 flex items-center justify-between gap-1 rounded-[14px] border bg-white/10 backdrop-blur shadow-sm" style={{ borderWidth: '1.5px', borderColor: 'rgba(255,255,255,0.5)' }}>
          <div className="w-4 h-4 rounded-full border-[1.5px] border-white/90 grid place-items-center shrink-0 bg-white/10">
            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5" /></svg>
          </div>
          <span className="text-white font-black text-[10px] tracking-tight">13:20:05</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/25 border border-white/70 text-white text-[5px] font-black leading-none">+5m</span>
        </div>
      </div>
    );
  }
  if (type === "task") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2">
        <div className="w-[80px] rounded-[8px] bg-white/[0.06] border border-white/10 p-2 space-y-1">
          <div className="text-white font-black text-[6px] text-center uppercase tracking-widest">TASKS</div>
          <div className="h-2 rounded-full bg-white/15" />
          <div className="h-2 rounded-full bg-white/10" />
          <div className="h-2 rounded-full bg-white/15" />
        </div>
      </div>
    );
  }
  if (type === "gift") {
    return (
      <div className="w-full h-full bg-black flex flex-col p-2 gap-1.5 justify-center">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.06] border border-white/10 rounded-xl">
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center"><Gift className="w-3 h-3 text-black" /></div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-black text-[6px] leading-none">SitiPlay • GIFT</div>
            <div className="text-white/70 text-[6px]">Rose ×5 • ♦5</div>
          </div>
          <Heart className="w-3 h-3 text-white fill-white" />
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-white/[0.06] border border-white/10 rounded-full">
          <UserPlus className="w-3 h-3 text-white" />
          <span className="text-white font-black text-[6px]">BudiSantuy joined</span>
          <span className="ml-auto text-[6px] text-gray-500">+12 likes</span>
        </div>
      </div>
    );
  }
  if (type === "chat") {
    return (
      <div className="w-full h-full bg-black flex flex-col p-2 gap-1.5 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white shrink-0" />
          <div className="flex-1 min-w-0 px-2 py-1 bg-white/[0.06] border border-white/10 rounded-xl">
            <div className="text-white font-black text-[7px] leading-none">Rizky_JR</div>
            <div className="text-white/70 text-[6px]">Gass keun bang!</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/25 border border-white/40 shrink-0" />
          <div className="flex-1 min-w-0 px-2 py-1 bg-white border border-black/10 rounded-[12px] rounded-bl-[4px]">
            <div className="text-black font-black text-[6px]">SitiPlay</div>
            <div className="text-black/70 text-[6px]">Seru banget</div>
          </div>
        </div>
      </div>
    );
  }
  if (type === "poll") {
    return (
      <div className="w-full h-full bg-black flex flex-col p-2 gap-1.5 justify-center">
        <div className="text-white font-black text-[9px] leading-tight truncate">Mana turnamen selanjutnya?</div>
        <div className="space-y-1">
          <div className="h-5 rounded-full bg-white/10 border border-white/10 relative overflow-hidden flex items-center px-2">
            <div className="absolute inset-y-0 left-0 bg-white w-[42%]" />
            <span className="relative text-white font-black text-[7px]">1. Mobile Legends - 42%</span>
          </div>
          <div className="h-5 rounded-full bg-white/10 border border-white/10 relative overflow-hidden flex items-center px-2">
            <div className="absolute inset-y-0 left-0 bg-white/40 w-[28%]" />
            <span className="relative text-white font-black text-[7px]">2. Valorant - 28%</span>
          </div>
        </div>
      </div>
    );
  }
  if (type === "clock") {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-3 gap-0">
        <div className="text-white font-black text-[18px] leading-none tracking-tight">06:40:06 PM</div>
        <div className="text-white/90 font-bold text-[10px] tracking-widest uppercase">THU 3 SEP 26</div>
      </div>
    );
  }
  if (type === "media") {
    return (
      <div className="w-full h-full bg-black flex items-center p-3 gap-3">
        <div className="w-12 h-12 rounded-xl bg-white shrink-0 flex items-center justify-center"><Music className="w-6 h-6 text-black" /></div>
        <div className="flex-1 min-w-0">
          <div className="h-2.5 w-24 bg-white rounded mb-1" />
          <div className="h-2 w-16 bg-white/60 rounded" />
          <div className="mt-1.5 h-1 w-full bg-white/20 rounded-full overflow-hidden"><div className="h-full w-[42%] bg-white rounded-full" /></div>
        </div>
      </div>
    );
  }
  if (type === "lyrics") {
    return (
      <div className="w-full h-full bg-black flex flex-col justify-center p-3 gap-2">
        <div className="bg-white/5 border border-white/10 rounded-xl p-2 space-y-1">
          <div className="h-2 w-full bg-white/20 rounded opacity-40" />
          <div className="h-2.5 w-3/4 bg-white rounded" />
          <div className="h-2 w-1/2 bg-white/20 rounded opacity-40" />
        </div>
      </div>
    );
  }
  if (type === "pinned") {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-2">
        <div className="w-[160px] rounded-xl overflow-hidden border border-white/10 bg-black/70">
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-white/10 bg-white/5">
            <div className="w-5 h-5 rounded-full bg-white shrink-0" />
            <div className="text-white font-black text-[6px] truncate">Rizky_JR</div>
            <span className="ml-auto px-1 py-px rounded-full bg-white text-black text-[5px] font-black">PIN</span>
          </div>
          <div className="px-2 py-1.5 text-white text-[6px] font-bold">Gass keun bang!</div>
        </div>
      </div>
    );
  }
  if (type === "counter") {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-2">
        <div className="w-[120px] rounded-xl overflow-hidden border border-white/10 bg-black/70">
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-white/10 bg-white/5">
            <Eye className="w-3 h-3 text-white" />
            <span className="text-white font-black text-[6px] uppercase tracking-widest">Watching</span>
          </div>
          <div className="px-2 py-1.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FE2C55]" />
              <span className="text-white/70 text-[6px] font-bold">TikTok</span>
              <span className="ml-auto text-white text-[6px] font-black">1.3K</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
              <span className="text-white/70 text-[6px] font-bold">Twitch</span>
              <span className="ml-auto text-white text-[6px] font-black">342</span>
            </div>
          </div>
          <div className="px-2 pb-1.5 text-white font-black text-[12px]">2.1K</div>
        </div>
      </div>
    );
  }
  // full
  return (    <div className="w-full h-full bg-black relative p-2 overflow-hidden">
      <div className="absolute top-2 left-2 flex gap-1">
        <div className="px-1.5 py-0.5 bg-white rounded-full w-8 h-1.5" />
        <div className="px-1.5 py-0.5 bg-white/40 rounded-full w-10 h-1.5" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 px-3 py-2 bg-[#0f0f0f] border border-white/20 rounded-2xl scale-75">
        <div className="w-7 h-7 rounded-lg bg-white/20" />
        <div className="h-2 w-16 bg-white rounded mt-1" />
      </div>
      <div className="absolute bottom-2 left-2 flex flex-col gap-1">
        <div className="px-2 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-xl w-28 h-6" />
        <div className="px-2 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-xl w-24 h-6" />
      </div>
    </div>
  );
}

function WidgetsListing() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [privateKey, setPrivateKey] = useState<string>(searchParams.get("key") || "");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | WidgetItem["category"]>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingKey, setLoadingKey] = useState(true);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showUrls, setShowUrls] = useState(false);
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);
  const [showUrlConfirm, setShowUrlConfirm] = useState(false);
  const maskUrl = (url: string) => url.replace(/key=[^&]+/, 'key=••••••••••••••••');
  const toggleShowKey = () => {
    if (!showPrivateKey && privateKey) { setShowKeyConfirm(true); return; }
    setShowPrivateKey(v => !v);
  };
  const toggleShowUrls = () => {
    if (!showUrls && privateKey) { setShowUrlConfirm(true); return; }
    setShowUrls(v => !v);
  };

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
        } catch { }
        try {
          const { data: s } = await supabase.from("user_private_keys").select("private_key").eq("user_id", session.user.id).single();
          const k = (s as any)?.private_key;
          if (k) { setPrivateKey(k); setLoadingKey(false); return; }
        } catch { }
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

  const filtered = WIDGETS.filter(o => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.desc.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || o.category === filter;
    return matchSearch && matchFilter;
  });

  const getWidgetUrl = (item: WidgetItem, transparent = true) => {
    if (typeof window === "undefined") return "";
    if (item.id === 'follow') {
      const base = `${window.location.origin}/widgets/follow/display?${item.params}${privateKey ? `&key=${privateKey}` : ''}`;
      return transparent ? `${base}&obs=1` : base;
    }
    if (item.id === 'task') {
      const base = `${window.location.origin}/widgets/task/display?${item.params}${privateKey ? `&key=${privateKey}` : ''}`;
      return transparent ? `${base}&obs=1` : base;
    }
    if (item.id === 'event') {
      const base = `${window.location.origin}/widgets/event/display?${item.params}${privateKey ? `&key=${privateKey}` : ''}`;
      return transparent ? `${base}&obs=1` : base;
    }
    if (item.id === 'chat') {
      const base = `${window.location.origin}/widgets/chat/display?${item.params}${privateKey ? `&key=${privateKey}` : ''}`;
      return transparent ? `${base}&obs=1` : base;
    }
    if (item.id === 'poll') {
      const base = `${window.location.origin}/widgets/poll/display?${item.params}${privateKey ? `&key=${privateKey}` : ''}`;
      return transparent ? `${base}&obs=1` : base;
    }
    if (item.id === 'pinned') {
      const base = `${window.location.origin}/widgets/pinned/display?${item.params}${privateKey ? `&key=${privateKey}` : ''}`;
      return transparent ? `${base}&obs=1` : base;
    }
    if (item.id === 'view-counter') {
      const base = `${window.location.origin}/widgets/view-counter/display?${item.params}${privateKey ? `&key=${privateKey}` : ''}`;
      return transparent ? `${base}&obs=1` : base;
    }
    if (item.id === 'clock') {
      const base = `${window.location.origin}/widgets/clock/display?${item.params}${privateKey ? `&key=${privateKey}` : ''}`;
      return transparent ? `${base}&obs=1` : base;
    }
    if (item.id === 'media-player') {
      const base = `${window.location.origin}/widgets/media-player/display?${item.params}${privateKey ? `&key=${privateKey}` : ''}`;
      return transparent ? `${base}&obs=1` : base;
    }
    if (item.id === 'lyrics') {
      const base = `${window.location.origin}/widgets/lyrics/display?${item.params}${privateKey ? `&key=${privateKey}` : ''}`;
      return transparent ? `${base}&obs=1` : base;
    }
    if (item.id === 'info-slides') {
      const base = `${window.location.origin}/widgets/info-slides/display?${item.params}${privateKey ? `&key=${privateKey}` : ''}`;
      return transparent ? `${base}&obs=1` : base;
    }
    if (item.id === 'social-rotator') {
      const base = `${window.location.origin}/widgets/social-rotator/display?${item.params}${privateKey ? `&key=${privateKey}` : ''}`;
      return transparent ? `${base}&obs=1` : base;
    }
    if (item.id === 'custom') {
      try {
        const raw = localStorage.getItem('custom-overlay-layers');
        const layers = raw ? encodeURIComponent(raw) : '';
        const base = `${window.location.origin}/widgets/custom/display?layers=${layers}${privateKey ? `&key=${privateKey}` : ''}`;
        return transparent ? `${base}&obs=1` : base;
      } catch {
        const base = `${window.location.origin}/widgets/custom/display?${privateKey ? `key=${privateKey}` : ''}`;
        return transparent ? `${base}&obs=1` : base;
      }
    }
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
    } catch { }
    const base = `${window.location.origin}/widgets/display?key=${privateKey || "YOUR_PRIVATE_KEY"}&${item.params}${themeQ}${cssQ}`;
    return transparent ? `${base}&obs=1` : base;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="widgets" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-black rounded-full text-[10px] font-black tracking-widest uppercase"><Layers className="w-3 h-3" /> WIDGETS</span>
            <span className="hidden md:inline text-[11px] text-gray-500 font-bold">{filtered.length} widget • {privateKey ? `${showPrivateKey ? privateKey.slice(0, 8) : '••••••••'}…` : "butuh private key"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={privateKey ? `/widgets/display?key=${privateKey}&widget=full` : "/widgets/display"} target="_blank" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase border border-white">
              <Eye className="w-3 h-3" /> Preview Full
            </Link>
            <Link href={privateKey ? `/dock?key=${privateKey}` : "/dock"} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">
              <Monitor className="w-3 h-3" /> Dock
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto space-y-5">
          {/* Hero */}
          <div className="bg-[#161616] border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-white font-black text-[18px] md:text-[20px] tracking-tight flex items-center gap-2"><Sparkles className="w-5 h-5 text-white" /> Daftar Widgets</h1>
              <p className="text-gray-400 text-[11px] md:text-[12px] mt-1 max-w-[640px] leading-relaxed">
                Widget satuan untuk OBS Browser Source lebih kecil & fokus dari Overlay Full. Cocok untuk layout modular: 1 widget = 1 Browser Source.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                <span className="px-2 py-1 bg-white text-black rounded-full flex items-center gap-1"><Monitor className="w-3 h-3" /> Browser Source</span>
                <span className="px-2 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-full">Transparent</span>
                <span className="px-2 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-full">Modular</span>
                <span className="px-2 py-1 bg-white/10 border border-white/10 text-white rounded-full">Widget</span>
              </div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 w-full lg:w-[360px] shrink-0">
              <div className="text-gray-500 font-black uppercase text-[9px] tracking-widest flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Private Key (untuk URL)</div>
              {loadingKey ? (
                <div className="mt-2 h-9 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
              ) : (
                <div className="mt-2 flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showPrivateKey ? "text" : "password"}
                      value={privateKey}
                      onChange={e => setPrivateKey(e.target.value)}
                      placeholder="paste private key / kosong = YOUR_PRIVATE_KEY"
                      className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 pr-9 text-[11px] font-mono text-white focus:outline-none focus:border-white/20 placeholder:text-gray-600"
                    />
                    <button type="button" onClick={toggleShowKey} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white" title={showPrivateKey ? "Sembunyikan" : "Tampilkan (konfirmasi)"}>
                      {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <Link href="/dashboard" className="shrink-0 h-9 px-3 bg-white text-black rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Dashboard
                  </Link>
                </div>
              )}
              <p className="text-gray-600 text-[10px] mt-1.5 leading-relaxed">URL otomatis pakai key ini. Satu widget = satu Browser Source di OBS.</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="relative flex-1 max-w-[420px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari widget… (chat, goal, counter)"
                className="w-full h-9 pl-9 pr-3 bg-[#161616] border border-white/10 rounded-xl text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="hidden sm:inline-flex items-center gap-1 text-gray-500 text-[10px] font-black uppercase tracking-widest"><Filter className="w-3 h-3" /> Filter</span>
              {(["all", "chat", "alert", "counter", "progress", "info", "minimal"] as const).map(cat => (
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
              const urlObs = getWidgetUrl(item, true);
              const urlPreview = getWidgetUrl(item, false);
              return (
                <div key={item.id} className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden hover:border-white/15 hover:bg-[#1a1a1a] transition-colors flex flex-col">
                  {/* thumb */}
                  <div className="aspect-video bg-black relative overflow-hidden border-b border-white/5">
                    <PreviewThumb type={item.preview} />
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-white font-black text-[12px] uppercase tracking-wide leading-none">{item.title}</h3>
                    <p className="text-gray-500 text-[11px] leading-relaxed mt-1.5 line-clamp-2">{item.desc}</p>

                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      <Link href={urlPreview} target="_blank" className="h-8 flex items-center justify-center gap-1 bg-white text-black rounded-xl text-[9px] font-black uppercase hover:bg-gray-100">
                        <Eye className="w-3 h-3" /> Preview
                      </Link>
                      {item.id === 'timer' ? (
                        <Link href={`/widgets/timer${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'task' ? (
                        <Link href={`/widgets/task${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'follow' ? (
                        <Link href={`/widgets/follow${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'event' ? (
                        <Link href={`/widgets/event${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'chat' ? (
                        <Link href={`/widgets/chat${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'poll' ? (
                        <Link href={`/widgets/poll${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'pinned' ? (
                        <Link href={`/widgets/pinned${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'view-counter' ? (
                        <Link href={`/widgets/view-counter${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'clock' ? (
                        <Link href={`/widgets/clock${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'media-player' ? (
                        <Link href={`/widgets/media-player${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'lyrics' ? (
                        <Link href={`/widgets/lyrics${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'info-slides' ? (
                        <Link href={`/widgets/info-slides${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'social-rotator' ? (
                        <Link href={`/widgets/social-rotator${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : item.id === 'custom' ? (
                        <Link href={`/widgets/editor${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Layers className="w-3 h-3" /> Open Editor
                        </Link>
                      ) : item.id === 'task' ? (
                        <Link href={`/widgets/task${privateKey ? `?key=${privateKey}` : ''}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      ) : (
                        <Link href={`/widgets/editor?&key=${privateKey || ""}`} className="h-8 flex items-center justify-center gap-1 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase">
                          <Cog className="w-3 h-3" /> Settings
                        </Link>
                      )}
                    </div>
                    {(item.id === 'media-player' || item.id === 'lyrics' || item.id === 'clock' || item.id === 'poll' || item.id === 'pinned' || item.id === 'view-counter' || item.id === 'chat' || item.id === 'event' || item.id === 'task' || item.id === 'timer' || item.id === 'follow' || item.id === 'info-slides' || item.id === 'social-rotator' || item.id === 'custom') && (
                      <a
                        href={urlObs}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', urlObs); e.dataTransfer.setData('text/uri-list', urlObs); e.dataTransfer.effectAllowed = 'copy'; }}
                        title="Tahan & drag langsung ke OBS Sources"
                        className="mt-1.5 h-8 flex items-center justify-center gap-1.5 bg-white text-black border border-dashed border-zinc-300 hover:border-white rounded-xl text-[9px] font-black uppercase cursor-grab active:cursor-grabbing select-none"
                      >
                        <GripVertical className="w-3 h-3" /> Drag ke OBS
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Private key reveal modals */}
          {showKeyConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowKeyConfirm(false)}>
              <div onClick={e => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[380px] space-y-4 text-center">
                <h2 className="text-white font-black">Tampilkan Private Key?</h2>
                <p className="text-[11px] text-gray-400 leading-relaxed">Private key bersifat <span className="text-white font-bold">rahasia</span>. Jangan bagikan ke orang lain. Yakin ingin menampilkan?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowKeyConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Batal</button>
                  <button onClick={() => { setShowPrivateKey(true); setShowKeyConfirm(false); }} className="flex-1 h-9 bg-white text-black border border-white rounded-xl text-sm font-black">Tampilkan</button>
                </div>
              </div>
            </div>
          )}
          {showUrlConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowUrlConfirm(false)}>
              <div onClick={e => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[380px] space-y-4 text-center">
                <h2 className="text-white font-black">Tampilkan URL dengan Private Key?</h2>
                <p className="text-[11px] text-gray-400 leading-relaxed">URL mengandung <span className="text-white font-bold">private key</span> rahasia. Yakin ingin menampilkan semua URL?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowUrlConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Batal</button>
                  <button onClick={() => { setShowUrls(true); setShowUrlConfirm(false); }} className="flex-1 h-9 bg-white text-black border border-white rounded-xl text-sm font-black">Tampilkan</button>
                </div>
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-10 text-center">
              <AlertCircle className="w-8 h-8 text-gray-600 mx-auto" />
              <div className="text-white font-black uppercase text-[12px] mt-2">Tidak ada widget</div>
              <div className="text-gray-500 text-[11px] mt-1">Coba ganti filter atau kata kunci pencarian.</div>
            </div>
          )}

          {/* How to */}
          <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 md:p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-white font-black uppercase text-[11px] flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Cara Pakai di OBS</div>
              <ol className="mt-2 space-y-1.5 text-[11px] text-gray-400 leading-relaxed list-decimal list-inside">
                <li>Copy <span className="text-white font-bold">Copy OBS</span> URL (sudah ada <code className="bg-white/10 px-1 rounded text-white">?obs=1</code>)</li>
                <li>OBS → Add Source → <span className="text-white font-bold">Browser Source</span> → Paste URL</li>
                <li>Set <b className="text-white">Width/Height</b> sesuai badge di card (mis. 600×160 untuk Goal Bar)</li>
                <li>☑ Shutdown when not visible • Background transparan otomatis</li>
              </ol>
            </div>
            <div>
              <div className="text-white font-black uppercase text-[11px] flex items-center gap-2"><Zap className="w-4 h-4 text-white" /> Bedanya dengan Overlay</div>
              <ul className="mt-2 space-y-1.5 text-[11px] text-gray-400 leading-relaxed list-disc list-inside">
                <li><span className="text-white font-bold">Overlay</span> = canvas full 1920×1080 gabungan</li>
                <li><span className="text-white font-bold">Widget</span> = satuan kecil modular, 1 source = 1 fungsi</li>
                <li>Cocok untuk layout campur: chat kiri, counter kanan atas, goal bar bawah</li>
              </ul>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-xl p-3 flex flex-col">
              <div className="text-white font-black uppercase text-[11px] flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Edit Tema Dulu</div>
              <p className="text-gray-500 text-[11px] mt-1 leading-relaxed">Klik <span className="text-white font-bold">Edit Tema</span> di card widget sebelum masuk OBS - atur warna, radius, blur, font & posisi.</p>
              <Link href={privateKey ? `/widgets/editor?id=chat-box&key=${privateKey}` : "/widgets/editor?id=chat-box"} className="mt-3 h-8 flex items-center justify-center gap-1.5 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl text-[10px] font-black uppercase">
                <Pencil className="w-3 h-3" /> Buka Editor Tema
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function WidgetsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500 text-sm">Memuat…</div>}>
      <WidgetsListing />
    </Suspense>
  );
}
