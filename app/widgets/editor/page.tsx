'use client';
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Copy, Check, Eye, ExternalLink, Sparkles, Palette, Type, LayoutGrid,
  Monitor, Save, RotateCcw, Settings2, MessageSquare, Gift, Pin, Heart, UserPlus,
  SlidersHorizontal, EyeOff, Image as ImageIcon, Zap, Menu, Code2, Brush, Trash2, Activity, Clock
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "../../components/Sidebar";
import { OverlayTheme, defaultTheme, themePresets, themeToQuery, queryToTheme, themeStorageKey, cssStorageKey, cssSnippets, encodeCss, decodeCss, googleFonts, googleFontUrl } from "../../overlay/components/theme";
import dynamic from "next/dynamic";
const CssEditor = dynamic(() => import("./CssEditor"), { ssr: false });

const WIDGET_OPTIONS = [
  { id: "chat-box", label: "Chat Box Widget", params: "widget=chat&layout=chat&pos=bl&chat=1&gift=0&like=0&member=0&pin=0" },
  { id: "gift-alert", label: "Gift Alert Widget", params: "widget=gift&layout=alerts&chat=0&gift=1&like=0&member=0&pin=0" },
  { id: "view-counter", label: "View Counter Widget", params: "widget=counter&layout=counter&counter=1&chat=0&gift=0&like=0&member=0&pin=0" },
  { id: "goal-bar", label: "Goal Bar Widget", params: "widget=goal&cur=320&target=500&label=FOLLOWER%20GOAL&chat=0&gift=0&like=0&member=0&pin=0" },
  { id: "ticker-chat", label: "Ticker Chat Widget", params: "widget=ticker&layout=horizontal&pos=bottom&chat=1&gift=0&like=0&member=0&pin=0" },
  { id: "pinned-chat", label: "Pinned Chat Widget", params: "widget=pinned&chat=0&gift=0&like=0&member=0&pin=1" },
  { id: "like-burst", label: "Like Burst Widget", params: "widget=like&chat=0&gift=0&like=1&member=1&pin=0" },
  { id: "clock-widget", label: "Clock Widget", params: "widget=clock&layout=counter&counterMode=clock&chat=0&gift=0&like=0&member=0&pin=0" },
  { id: "social-bar", label: "Social Bar Widget", params: "widget=social&handle=namachannel&chat=0&gift=0&like=0&member=0&pin=0" },
  { id: "minimal-alert", label: "Minimal Alert Widget", params: "widget=minimal&layout=minimal&chat=0&gift=1&like=0&member=0&pin=0" },
  { id: "full-combined", label: "Full Combined Widget", params: "widget=full&layout=full&pos=bl" },
];
const OVERLAY_OPTIONS = WIDGET_OPTIONS;
function platformLogo(p?: string) {
  const v = (p || "tiktok").toLowerCase();
  if (v.includes("tiktok")) return "/assets/logo/tik-tok.png";
  if (v.includes("youtube") || v === "yt") return "/assets/logo/youtube.png";
  if (v.includes("twitch")) return "/assets/logo/twitch.png";
  if (v.includes("kick")) return "/assets/logo/sbot.png";
  return "/assets/logo/tik-tok.png";
}

const CHAT_ANIM_MAP: Record<string, string> = {
  slideUp: "slideUp 0.45s cubic-bezier(0.16,1,0.3,1)",
  slideDown: "slideDown 0.45s cubic-bezier(0.16,1,0.3,1)",
  slideLeft: "slideLeft 0.45s cubic-bezier(0.16,1,0.3,1)",
  slideRight: "slideRight 0.45s cubic-bezier(0.16,1,0.3,1)",
  pop: "popIn 0.45s cubic-bezier(0.34,1.56,0.64,1)",
  swivel: "swivel 0.55s cubic-bezier(0.22,1,0.36,1)",
  bounce: "bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1)",
  flip: "flipIn 0.55s cubic-bezier(0.22,1,0.36,1)",
  zoom: "zoomIn 0.4s ease",
};

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const initialId = searchParams.get("id") || searchParams.get("overlay") || "full";
  // task & new widgets jangan ke /editor — pakai halaman dedicated /widgets/task|chat|poll|event|follow
  useEffect(() => {
    const dedicated = ['task','chat','poll','event','follow','clock','media-player','lyrics'];
    if (dedicated.includes(initialId)) {
      const key = searchParams.get('key') || '';
      router.replace(`/widgets/${initialId}${key ? `?key=${key}` : ''}`);
    }
  }, [initialId, searchParams, router]);
  const [overlayId, setOverlayId] = useState(initialId);
  const [privateKey, setPrivateKey] = useState(searchParams.get("key") || "");
  const [theme, setTheme] = useState<OverlayTheme>(defaultTheme);
  const [pos, setPos] = useState(searchParams.get("pos") || "bl");
  const [scale, setScale] = useState(parseFloat(searchParams.get("scale") || "1"));
  const [layout, setLayout] = useState(searchParams.get("layout") || "full");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"warna" | "bubble" | "elemen" | "layout" | "css">("warna");
  const [customCss, setCustomCss] = useState("");
  const [cssEnabled, setCssEnabled] = useState(true);
  const [hMode, setHMode] = useState<"smooth" | "steps" | "pop" | "slide">(
    (searchParams.get("hMode") as any) || (searchParams.get("snappy") === "1" ? "pop" : "smooth")
  );
  const [tickerSpeed, setTickerSpeed] = useState(
    parseInt(searchParams.get("speed") || searchParams.get("tickerSpeed") || "30", 10)
  );
  const [hDir, setHDir] = useState<"left" | "right">(
    (searchParams.get("hDir") as any) || (searchParams.get("dir") as any) || "right"
  );

  // preview demo state - sama seperti display untuk live preview
  type DemoChat = { id: string; n: string; c: string; platform?: string; ts: number; avatar?: string };
  type DemoGift = { id: string; nickname: string; giftName: string; repeatCount: number } | null;
  const [demoChats, setDemoChats] = useState<DemoChat[]>([
    { id: "d1", n: "Rizky_JR", c: "Lagi main apa nih? 🔥", platform: "tiktok", ts: Date.now() - 5000 },
    { id: "d2", n: "SitiPlay", c: "Gass keun bang!", platform: "tiktok", ts: Date.now() - 3000 },
    { id: "d3", n: "TestUser", c: "Halo overlay! Ini tes chat 👋", platform: "tiktok", ts: Date.now() - 1000 },
  ]);
  const [demoPinned, setDemoPinned] = useState<{ nickname: string; comment: string } | null>({
    nickname: "Moderator",
    comment: "📌 Jangan lupa follow & share live ini ya guys!",
  });
  const [displayedDemoPinned, setDisplayedDemoPinned] = useState<{ nickname: string; comment: string } | null>({
    nickname: "Moderator",
    comment: "📌 Jangan lupa follow & share live ini ya guys!",
  });
  const [pinnedExiting, setPinnedExiting] = useState(false);
  const [demoGift, setDemoGift] = useState<DemoGift>(null);
  const [demoLike, setDemoLike] = useState<{ nickname: string; count: number } | null>(null);
  const [demoMembers, setDemoMembers] = useState<{ id: string; n: string }[]>([]);
  const [demoViewers, setDemoViewers] = useState<number>(1248);
  const [counterMode, setCounterMode] = useState<"counter" | "clock" | "both">(
    (searchParams.get("counterMode") as any) || (searchParams.get("viewMode") as any) || "counter"
  );
  const [demoTime, setDemoTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
  const [chatAnim, setChatAnim] = useState<string>(searchParams.get("chatAnim") || "slideUp");

  const isHorizontal = layout === "horizontal" || overlayId === "horizontal-chat";
  const isViewCounter = overlayId === "view-counter";
  const isCyber = layout === "cyber" || overlayId === "cyber-terminal";
  const counterPosClass = (() => {
    switch (pos) {
      case "bl": return "bottom-6 left-6";
      case "br": return "bottom-6 right-6";
      case "tl": return "top-6 left-6";
      case "tr": return "top-6 right-6";
      case "center": return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      case "bottom": return "bottom-6 left-1/2 -translate-x-1/2";
      default: return "top-6 left-1/2 -translate-x-1/2";
    }
  })();
  const overlayPosClass = (() => {
    switch (pos) {
      case "bl": return "bottom-6 left-6 items-start";
      case "br": return "bottom-6 right-6 items-end";
      case "tl": return "top-6 left-6 items-start";
      case "tr": return "top-6 right-6 items-end";
      case "center": return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      case "bottom": return "bottom-6 left-1/2 -translate-x-1/2";
      default: return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    }
  })();

  // load privateKey & theme
  useEffect(() => {
    const init = async () => {
      if (privateKey) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        try {
          const { data: p } = await supabase.from("profiles").select("private_key").eq("id", session.user.id).single();
          if ((p as any)?.private_key) { setPrivateKey((p as any).private_key); return; }
        } catch {}
        const stored = sessionStorage.getItem("dock_private_verified") || sessionStorage.getItem("bypass_private_key");
        if (stored) setPrivateKey(stored);
      }
    };
    init();
  }, []);

  // load theme from URL or localStorage
  useEffect(() => {
    // if URL has theme params, use them
    const hasTheme = searchParams.get("accent") || searchParams.get("chatBg");
    if (hasTheme) {
      setTheme(queryToTheme(searchParams as any));
      return;
    }
    // else try localStorage
    try {
      const raw = localStorage.getItem(themeStorageKey(overlayId));
      if (raw) setTheme({ ...defaultTheme, ...JSON.parse(raw) });
      else setTheme(defaultTheme);
    } catch { setTheme(defaultTheme); }
  }, [overlayId]);

  // when overlayId changes, reload theme
  useEffect(() => {
    try {
      const raw = localStorage.getItem(themeStorageKey(overlayId));
      if (raw) {
        const t = { ...defaultTheme, ...JSON.parse(raw) };
        // only if no URL theme override
        if (!searchParams.get("accent")) setTheme(t);
      }
    } catch {}
  }, [overlayId]);

  // load custom CSS
  useEffect(() => {
    const cssFromUrl = searchParams.get("css") || searchParams.get("customCss");
    if (cssFromUrl) {
      try { setCustomCss(decodeCss(cssFromUrl)); setCssEnabled(true); return; } catch {}
      try { setCustomCss(decodeURIComponent(cssFromUrl)); setCssEnabled(true); return; } catch {}
    }
    try {
      const raw = localStorage.getItem(cssStorageKey(overlayId));
      if (raw !== null) setCustomCss(raw);
      else setCustomCss("");
    } catch { setCustomCss(""); }
  }, [overlayId]);

  // preload Google Fonts for picker preview
  useEffect(() => {
    googleFonts.forEach(f => {
      const href = googleFontUrl(f.value);
      const sel = `link[data-google-font="${f.value}"]`;
      if (!document.querySelector(sel)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        (link as any).dataset.googleFont = f.value;
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }, []);

  // ensure selected font loaded
  useEffect(() => {
    const href = googleFontUrl(theme.fontFamily);
    const sel = `link[data-google-font="${theme.fontFamily}"]`;
    let link = document.querySelector(sel) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      (link as any).dataset.googleFont = theme.fontFamily;
      link.href = href;
      document.head.appendChild(link);
    } else if (link.href !== href) {
      link.href = href;
    }
  }, [theme.fontFamily]);

  // jam realtime untuk view counter preview
  useEffect(() => {
    if (!isViewCounter || (counterMode !== "clock" && counterMode !== "both")) return;
    const t = setInterval(() => setDemoTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })), 1000);
    return () => clearInterval(t);
  }, [isViewCounter, counterMode]);

  // pinned in/out untuk preview editor - smooth ganti
  useEffect(() => {
    if (demoPinned) {
      if (displayedDemoPinned && displayedDemoPinned.comment !== demoPinned.comment) {
        setPinnedExiting(true);
        const t = setTimeout(() => {
          setDisplayedDemoPinned(demoPinned);
          setPinnedExiting(false);
        }, 380);
        return () => clearTimeout(t);
      } else {
        setDisplayedDemoPinned(demoPinned);
        setPinnedExiting(false);
      }
    } else {
      if (displayedDemoPinned) {
        setPinnedExiting(true);
        const t = setTimeout(() => {
          setDisplayedDemoPinned(null);
          setPinnedExiting(false);
        }, 380);
        return () => clearTimeout(t);
      }
    }
  }, [demoPinned, displayedDemoPinned]);

  const currentParams = OVERLAY_OPTIONS.find(o => o.id === overlayId)?.params || `layout=${layout}&pos=${pos}`;
  const themeQuery = themeToQuery(theme);
  const cssQuery = customCss && cssEnabled ? `&css=${encodeCss(customCss)}` : "";
  const isPopOrSlide = hMode === "pop" || hMode === "slide";
  const hQuery = isHorizontal ? `&hMode=${hMode}&speed=${tickerSpeed}${isPopOrSlide ? `&hDir=${hDir}` : ""}` : "";
  const counterQuery = isViewCounter ? `&counterMode=${counterMode}` : "";
  const chatAnimQuery = !isHorizontal && !isViewCounter ? `&chatAnim=${chatAnim}` : "";
  const obsUrl = typeof window !== "undefined"
    ? `${window.location.origin}/widgets/display?key=${privateKey || "YOUR_PRIVATE_KEY"}&${currentParams}&scale=${scale}&${themeQuery}${cssQuery}${hQuery}${counterQuery}${chatAnimQuery}&obs=1`
    : "";
  const previewUrl = obsUrl.replace("&obs=1", "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(obsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(themeStorageKey(overlayId), JSON.stringify(theme));
      localStorage.setItem(cssStorageKey(overlayId), customCss);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {}
  };

  const handleReset = () => setTheme(defaultTheme);

  const applyPreset = (key: string) => {
    const preset = themePresets[key];
    if (preset) {
      setTheme(preset.theme);
      const css = (preset as any).css as string | undefined;
      if (css) {
        setCustomCss(css);
        setCssEnabled(true);
      }
    }
  };

  const update = (patch: Partial<OverlayTheme>) => setTheme(prev => ({ ...prev, ...patch }));

  // test handlers - sesuai overlay yang dipilih
  const handleTestChat = () => {
    const names = ["Rizky_JR", "SitiPlay", "TestUser", "Budi_Gaming", "Siska_Live"];
    const msgs = ["Wkwk seru bang!", "Gass terus!", "Halo overlay! 👋🔥", "Mantap bos!", "Keren banget! 😍"];
    const n = names[Math.floor(Math.random() * names.length)];
    const c = msgs[Math.floor(Math.random() * msgs.length)];
    setDemoChats(prev => [...prev, { id: `t_${Date.now()}`, n, c, platform: "tiktok", ts: Date.now() }].slice(-6));
  };
  const handleTestGift = () => {
    setDemoGift({ id: `g_${Date.now()}`, nickname: "DonaturKece", giftName: "Rose", repeatCount: Math.floor(Math.random() * 9) + 1 });
    setTimeout(() => setDemoGift(null), 3800);
  };
  const handleTestPin = () => {
    setDemoPinned({ nickname: "Moderator", comment: `📌 Test pinned ${new Date().toLocaleTimeString()} - jangan lupa follow!` });
    setTimeout(() => setDemoPinned({ nickname: "Moderator", comment: "📌 Jangan lupa follow & share live ini ya guys!" }), 4500);
  };
  const handleTestLike = () => {
    setDemoLike({ nickname: ["SitiPlay", "Rizky_JR", "Budi_Gaming"][Math.floor(Math.random() * 3)], count: Math.floor(Math.random() * 20) + 5 });
    setTimeout(() => setDemoLike(null), 2600);
  };
  const handleTestMember = () => {
    const n = ["Budi_Gaming", "ViewerBaru", "Joiner01"][Math.floor(Math.random() * 3)];
    const id = `m_${Date.now()}`;
    setDemoMembers(prev => [...prev, { id, n }].slice(-2));
    setTimeout(() => setDemoMembers(prev => prev.filter(x => x.id !== id)), 3800);
  };
  const handleTestViewers = () => {
    const delta = Math.floor(Math.random() * 80) - 20;
    setDemoViewers(v => Math.max(0, v + delta));
  };
  const handleClearTests = () => {
    setDemoChats([
      { id: "d1", n: "Rizky_JR", c: "Lagi main apa nih? 🔥", platform: "tiktok", ts: Date.now() - 5000 },
      { id: "d2", n: "SitiPlay", c: "Gass keun bang!", platform: "tiktok", ts: Date.now() - 3000 },
      { id: "d3", n: "TestUser", c: "Halo overlay! Ini tes chat 👋", platform: "tiktok", ts: Date.now() - 1000 },
    ]);
    setDemoGift(null); setDemoLike(null); setDemoMembers([]);
    setDemoPinned({ nickname: "Moderator", comment: "📌 Jangan lupa follow & share live ini ya guys!" });
    setDemoViewers(1248);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="widgets" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        {/* header */}
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <Link href="/widgets" className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-4 h-4 text-violet-400" /> Edit Tema Widget
                <span className="hidden sm:inline px-2 py-0.5 bg-white text-black rounded-full text-[9px]">{overlayId}</span>
              </div>
              <div className="hidden sm:block text-gray-500 text-[10px]">Sebelum masuk OBS - atur warna, radius, font & posisi widget</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={previewUrl} target="_blank" className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">
              <Eye className="w-3 h-3" /> Preview
            </Link>
            <button onClick={handleSave} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${saved ? "bg-green-500 text-white border-green-500" : "bg-white text-black border-white hover:bg-gray-100"}`}>
              {saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />} {saved ? "Tersimpan" : "Simpan"}
            </button>
            <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-[10px] font-black uppercase text-white">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy OBS
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full max-w-full overflow-hidden min-w-0">
          {/* controls */}
          <div className="w-full lg:w-[380px] shrink-0 bg-[#121212] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col max-h-[45vh] lg:max-h-none lg:h-[calc(100vh-56px)] overflow-hidden">
            {/* template switch */}
            <div className="p-4 border-b border-white/5 space-y-3 shrink-0">
              <label className="text-gray-500 font-black uppercase text-[9px] tracking-widest">Template Widget</label>
              <select value={overlayId} onChange={e => setOverlayId(e.target.value)} className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-[12px] text-white focus:outline-none focus:border-white/20">
                {OVERLAY_OPTIONS.map(o => <option key={o.id} value={o.id} className="bg-[#121212]">{o.label}</option>)}
              </select>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-gray-600 font-bold uppercase text-[8px]">Posisi</label>
                  <select value={pos} onChange={e => setPos(e.target.value)} className="w-full h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-[11px] text-white mt-1">
                    <option value="bl" className="bg-[#121212]">Bottom Left</option>
                    <option value="br" className="bg-[#121212]">Bottom Right</option>
                    <option value="tl" className="bg-[#121212]">Top Left</option>
                    <option value="tr" className="bg-[#121212]">Top Right</option>
                    <option value="center" className="bg-[#121212]">Center Bottom</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-gray-600 font-bold uppercase text-[8px]">Scale</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input type="range" min={0.7} max={1.4} step={0.1} value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="flex-1 accent-white" />
                    <span className="text-white font-mono text-[11px] w-8">{scale.toFixed(1)}x</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-gray-600 font-bold uppercase text-[8px]">Private Key</label>
                <input value={privateKey} onChange={e => setPrivateKey(e.target.value)} placeholder="YOUR_PRIVATE_KEY" className="w-full h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-[11px] font-mono text-cyan-300 mt-1 focus:outline-none focus:border-cyan-500" />
              </div>
            </div>

            {/* Test Preview - tombol sesuai overlay terpilih */}
            <div className="p-3 border-b border-white/5 bg-white/[0.02] space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-black uppercase text-[9px] tracking-widest flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Test Preview</span>
                <button onClick={handleClearTests} className="text-[9px] font-bold uppercase text-gray-500 hover:text-white">Reset</button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(overlayId === "full" || ["chat", "chat-right", "vertical", "horizontal-chat"].includes(overlayId)) && (
                  <button onClick={handleTestChat} className="h-8 bg-white text-black rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 hover:bg-gray-100">
                    <MessageSquare className="w-3 h-3" /> Chat
                  </button>
                )}
                {(overlayId === "full" || ["gift", "minimal"].includes(overlayId)) && (
                  <button onClick={handleTestGift} className="h-8 bg-[#FE2C55]/20 hover:bg-[#FE2C55]/30 border border-[#FE2C55]/20 rounded-xl text-[10px] font-black uppercase text-[#FE2C55] flex items-center justify-center gap-1">
                    <Gift className="w-3 h-3" /> Gift
                  </button>
                )}
                {(overlayId === "full" || overlayId === "pinned") && (
                  <button onClick={handleTestPin} className="h-8 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/20 rounded-xl text-[10px] font-black uppercase text-cyan-400 flex items-center justify-center gap-1">
                    <Pin className="w-3 h-3" /> Pin
                  </button>
                )}
                {(overlayId === "full" || overlayId === "like-member") && (
                  <>
                    <button onClick={handleTestLike} className="h-8 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/20 rounded-xl text-[10px] font-black uppercase text-pink-400 flex items-center justify-center gap-1">
                      <Heart className="w-3 h-3" /> Like
                    </button>
                    <button onClick={handleTestMember} className="h-8 bg-green-500/20 hover:bg-green-500/30 border border-green-500/20 rounded-xl text-[10px] font-black uppercase text-green-400 flex items-center justify-center gap-1 col-span-2">
                      <UserPlus className="w-3 h-3" /> Member Join
                    </button>
                  </>
                )}
                {(overlayId === "view-counter") && (
                  <button onClick={handleTestViewers} className="h-8 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase text-blue-400 flex items-center justify-center gap-1 col-span-2">
                    <Eye className="w-3 h-3" /> + Viewers
                  </button>
                )}
                {overlayId === "full" && (
                  <span className="col-span-2 text-center text-[9px] font-bold uppercase text-gray-600">Full = semua tombol aktif</span>
                )}
              </div>
              <div className="text-gray-600 text-[10px] leading-tight">Klik untuk trigger preview kanan - warna/radius/blur mengikuti tema yang kamu ubah.</div>
            </div>

            {isViewCounter && (
              <div className="p-3 border-b border-white/5 bg-blue-500/5 space-y-2 shrink-0">
                <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Eye className="w-3 h-3 text-blue-400" /> View Counter Mode</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "counter", label: "Counter", desc: "Viewers" },
                    { id: "clock", label: "Jam", desc: "Clock" },
                    { id: "both", label: "Keduanya", desc: "View + Jam" },
                  ].map(o => (
                    <button key={o.id} onClick={() => setCounterMode(o.id as any)} className={`p-2.5 rounded-xl border text-center transition-colors ${counterMode === o.id ? "bg-white text-black border-white" : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"}`}>
                      <div className="text-[11px] font-black uppercase">{o.label}</div>
                      <div className="text-[9px] opacity-60">{o.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="text-gray-500 text-[10px] leading-relaxed">Counter = angka viewers animasi (seperti odometer), Jam = jam realtime WIB, Keduanya = viewers + jam</div>
              </div>
            )}

            {/* tabs */}
            <div className="flex gap-1 p-2 border-b border-white/5 shrink-0 overflow-x-auto custom-scrollbar">
              {[
                { id: "warna", label: "Warna", icon: Palette },
                { id: "bubble", label: "Bubble", icon: SlidersHorizontal },
                { id: "elemen", label: "Elemen", icon: LayoutGrid },
                { id: "layout", label: "Layout", icon: Monitor },
                { id: "css", label: "CSS", icon: Code2 },
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 min-w-[70px] h-7 flex items-center justify-center gap-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${activeTab === t.id ? "bg-white text-black border-white" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"}`}>
                  <t.icon className="w-3 h-3" /> {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {activeTab === "warna" && (
                <>
                  <div className="space-y-2">
                    <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3 text-yellow-400" /> Preset</div>
                    <select
                      onChange={e => { const v = e.target.value; if (v) applyPreset(v); e.target.value = ""; }}
                      defaultValue=""
                      className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-[11px] text-white focus:outline-none focus:border-white/20"
                    >
                      <option value="" className="bg-[#121212]">- Pilih Preset -</option>
                      {Object.entries(themePresets).map(([k, p]) => (
                        <option key={k} value={k} className="bg-[#121212]">{p.icon} {p.name} - {p.theme.fontFamily}</option>
                      ))}
                    </select>
                    <div className="text-gray-600 text-[10px] leading-relaxed">Pilih preset untuk apply warna + font Google Fonts sekaligus. Bisa di-fine tune di bawah.</div>
                  </div>

                  <div className="space-y-3">
                    <ColorRow label="Accent (Gift/Like)" value={theme.accent} onChange={v => update({ accent: v })} />
                    <ColorRow label="Accent 2 (Pinned)" value={theme.accent2} onChange={v => update({ accent2: v })} />
                    <ColorRow label="Chat BG" value={theme.chatBg} onChange={v => update({ chatBg: v })} allowAlpha />
                    <ColorRow label="Chat Text" value={theme.chatText} onChange={v => update({ chatText: v })} />
                    <ColorRow label="Chat Border" value={theme.chatBorder} onChange={v => update({ chatBorder: v })} allowAlpha />
                    <ColorRow label="Pinned BG" value={theme.pinnedBg} onChange={v => update({ pinnedBg: v })} allowAlpha />
                    <ColorRow label="Pinned Border" value={theme.pinnedBorder} onChange={v => update({ pinnedBorder: v })} allowAlpha />
                    <ColorRow label="Gift BG" value={theme.giftBg} onChange={v => update({ giftBg: v })} allowAlpha />
                    <ColorRow label="Gift Border" value={theme.giftBorder} onChange={v => update({ giftBorder: v })} allowAlpha />
                  </div>
                </>
              )}

              {activeTab === "bubble" && (
                <div className="space-y-4">
                  <SliderRow label="Radius Bubble" value={theme.chatRadius} min={8} max={24} step={1} unit="px" onChange={v => update({ chatRadius: v })} />
                  <SliderRow label="Opacity" value={theme.chatOpacity} min={50} max={100} step={5} unit="%" onChange={v => update({ chatOpacity: v })} />
                  <SliderRow label="Blur" value={theme.chatBlur} min={0} max={20} step={2} unit="px" onChange={v => update({ chatBlur: v })} />
                  <SliderRow label="Font Scale" value={theme.fontScale} min={0.8} max={1.4} step={0.05} unit="x" onChange={v => update({ fontScale: v })} />
                  <label className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl cursor-pointer">
                    <span className="text-white font-bold text-[11px] flex items-center gap-2"><Zap className="w-3 h-3 text-yellow-400" /> Shadow</span>
                    <input type="checkbox" checked={theme.shadow} onChange={e => update({ shadow: e.target.checked })} className="w-4 h-4 accent-white" />
                  </label>

                  {isHorizontal && (
                    <div className="space-y-3 p-3 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-xl">
                      <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <Zap className="w-3 h-3 text-violet-400" /> Horizontal Mode
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: "smooth", label: "Smooth", desc: "Ticker linear" },
                          { id: "steps", label: "Snappy", desc: "Ticker steps" },
                          { id: "pop", label: "Pop", desc: "Pop per bubble" },
                          { id: "slide", label: "Geser", desc: "Slide seperti vertical" },
                        ].map(o => (
                          <button
                            key={o.id}
                            onClick={() => setHMode(o.id as any)}
                            className={`p-2.5 rounded-xl border text-center transition-colors ${hMode === o.id ? "bg-white text-black border-white" : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"}`}
                          >
                            <div className="text-[11px] font-black uppercase">{o.label}</div>
                            <div className="text-[9px] opacity-60">{o.desc}</div>
                          </button>
                        ))}
                      </div>
                      {hMode !== "pop" && hMode !== "slide" && (
                        <SliderRow label="Kecepatan Ticker" value={tickerSpeed} min={10} max={60} step={5} unit="s" onChange={v => setTickerSpeed(v)} />
                      )}
                      {(hMode === "pop" || hMode === "slide") && (
                        <div className="space-y-2 p-2.5 bg-black/30 border border-white/10 rounded-xl">
                          <div className="text-white font-bold text-[10px] uppercase tracking-widest">Arah Geser</div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => setHDir("right")}
                              className={`h-8 rounded-lg border text-[10px] font-black uppercase flex items-center justify-center gap-1 ${hDir === "right" ? "bg-white text-black border-white" : "bg-white/5 text-gray-400 border-white/10"}`}
                            >
                              → Kanan
                            </button>
                            <button
                              onClick={() => setHDir("left")}
                              className={`h-8 rounded-lg border text-[10px] font-black uppercase flex items-center justify-center gap-1 ${hDir === "left" ? "bg-white text-black border-white" : "bg-white/5 text-gray-400 border-white/10"}`}
                            >
                              ← Kiri
                            </button>
                          </div>
                          <div className="text-gray-500 text-[10px]">{hDir === "right" ? "Chat baru masuk dari kanan, geser ke kiri" : "Chat baru masuk dari kiri, geser ke kanan"}</div>
                        </div>
                      )}
                      <div className="text-gray-500 text-[10px] leading-relaxed">
                        {hMode === "smooth" && "Ticker jalan mulus linear - cocok untuk chat ramai."}
                        {hMode === "steps" && "Ticker snappy pakai steps(30) - gerakan patah-patah gaming."}
                        {hMode === "pop" && "Tiap chat muncul pop dari arah terpilih - tanpa ticker."}
                        {hMode === "slide" && "Seperti vertical: chat baru langsung geser masuk horizontal dari arah terpilih, stack geser."}
                      </div>
                    </div>
                  )}
                  {!isHorizontal && !isViewCounter && (
                    <div className="space-y-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3 text-cyan-400" /> Animasi Chat - Interaktif</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: "slideUp", label: "Slide Up", desc: "Fade Up" },
                          { id: "slideDown", label: "Slide Down", desc: "Fade Down" },
                          { id: "slideLeft", label: "Slide Left", desc: "Kiri" },
                          { id: "slideRight", label: "Slide Right", desc: "Kanan" },
                          { id: "pop", label: "Pop", desc: "Scale" },
                          { id: "swivel", label: "Swivel", desc: "Rotate Y" },
                          { id: "bounce", label: "Bounce", desc: "Bounce" },
                          { id: "flip", label: "Flip", desc: "Flip X" },
                          { id: "zoom", label: "Zoom", desc: "Zoom In" },
                        ].map(o => (
                          <button key={o.id} onClick={() => setChatAnim(o.id)} className={`p-2 rounded-xl border text-center transition-colors ${chatAnim === o.id ? "bg-white text-black border-white" : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"}`}>
                            <div className="text-[10px] font-black uppercase">{o.label}</div>
                            <div className="text-[8px] opacity-60">{o.desc}</div>
                          </button>
                        ))}
                      </div>
                      <div className="text-gray-500 text-[10px] leading-relaxed">Pilih animasi chat - preview langsung. Semua animasi interaktif (hover scale) juga aktif.</div>
                    </div>
                  )}
                  <div className="space-y-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><LayoutGrid className="w-3 h-3 text-amber-400" /> Spacing - Padding & Gap</div>
                    <SliderRow label="Padding Bubble" value={theme.chatPadding} min={8} max={24} step={1} unit="px" onChange={v => update({ chatPadding: v })} />
                    <SliderRow label="Gap Antar Bubble" value={theme.chatGap} min={4} max={20} step={1} unit="px" onChange={v => update({ chatGap: v })} />
                    <SliderRow label="Margin Bubble" value={theme.chatMargin} min={0} max={16} step={1} unit="px" onChange={v => update({ chatMargin: v })} />
                  </div>
                </div>
              )}

              {activeTab === "elemen" && (
                <div className="space-y-4">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                    <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-1.5"><LayoutGrid className="w-3 h-3 text-amber-400" /> Layout Chat Compact</div>
                    <label className="flex items-center justify-between p-2.5 bg-black/30 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5">
                      <div>
                        <div className="text-white font-bold text-[11px] flex items-center gap-1.5"><Type className="w-3 h-3 text-cyan-400" /> Username & Pesan Sejajar</div>
                        <div className="text-gray-500 text-[10px]">Inline - hemat vertical space (compact)</div>
                      </div>
                      <input type="checkbox" checked={theme.inlineChat} onChange={e => update({ inlineChat: e.target.checked })} className="w-4 h-4 accent-white" />
                    </label>
                    <div className="text-gray-500 text-[10px] leading-relaxed">Aktifkan untuk chat compact: <code className="bg-white/10 px-1 rounded">Rizky_JR: Lagi main apa nih? 🔥</code> - nonaktif = stacked.</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Type className="w-3 h-3 text-violet-400" /> Google Fonts - Semua Overlay & Text</div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {googleFonts.map(f => (
                        <button key={f.value} onClick={() => update({ fontFamily: f.value })} className={`p-2.5 rounded-xl border text-left transition-colors ${theme.fontFamily === f.value ? "bg-white text-black border-white" : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"}`}>
                          <div className="text-[11px] font-bold leading-none truncate" style={{ fontFamily: `'${f.value}', sans-serif` }}>{f.label}</div>
                          <div className="text-[9px] opacity-60">{f.category} • {f.value === theme.fontFamily ? "Aktif" : "Tap pakai"}</div>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-xl">
                      <span className="text-gray-400 text-[10px] font-bold">Aktif:</span>
                      <span className="text-white font-black text-[11px] flex-1 truncate" style={{ fontFamily: `'${theme.fontFamily || defaultTheme.fontFamily}', sans-serif` }}>{theme.fontFamily || defaultTheme.fontFamily}</span>
                      <span className="text-[10px] px-2 py-1 bg-white/10 rounded-full" style={{ fontFamily: `'${theme.fontFamily || defaultTheme.fontFamily}', sans-serif` }}>Aa</span>
                    </div>
                    <div className="text-gray-500 text-[10px] leading-relaxed">Font dari Google Fonts otomatis ke preview & OBS (<code className="bg-white/10 px-1 rounded">?font=</code>). Bisa override via Custom CSS.</div>
                  </div>
                  <div className="h-px bg-white/5" />
                  <ToggleRow label="Avatar" desc="Tampilkan foto profil" checked={theme.showAvatar} onChange={v => update({ showAvatar: v })} icon={ImageIcon} />
                  <ToggleRow label="Platform Badge" desc="TIKTOK / YOUTUBE badge" checked={theme.showPlatform} onChange={v => update({ showPlatform: v })} icon={Monitor} />
                  <ToggleRow label="Timestamp" desc="Jam chat" checked={theme.showTimestamp} onChange={v => update({ showTimestamp: v })} icon={Settings2} />
                </div>
              )}

              {activeTab === "layout" && (
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="text-white font-black uppercase text-[10px]">URL OBS (siap copy)</div>
                    <code className="block mt-2 p-2 bg-black/40 border border-white/10 rounded-lg text-[9px] font-mono text-cyan-300 break-all leading-relaxed">{obsUrl}</code>
                    <div className="mt-2 flex gap-2">
                      <button onClick={handleCopy} className="flex-1 h-8 bg-white text-black rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1">
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "Copied" : "Copy"}
                      </button>
                      <Link href={previewUrl} target="_blank" className="flex-1 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 text-white">
                        <ExternalLink className="w-3 h-3" /> Buka
                      </Link>
                    </div>
                  </div>
                  <div className="space-y-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="text-white font-black uppercase text-[10px] tracking-widest">Spacing Overlay</div>
                    <SliderRow label="Padding Overlay" value={theme.overlayPadding} min={8} max={32} step={1} unit="px" onChange={v => update({ overlayPadding: v })} />
                    <SliderRow label="Gap Antar Elemen" value={theme.overlayGap} min={8} max={32} step={1} unit="px" onChange={v => update({ overlayGap: v })} />
                    <div className="text-gray-500 text-[10px] leading-relaxed">Padding = jarak tepi canvas, Gap = jarak antar elemen (gift/pinned).</div>
                  </div>
                  <button onClick={handleReset} className="w-full h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] font-black uppercase text-red-400 flex items-center justify-center gap-1.5">
                    <RotateCcw className="w-3 h-3" /> Reset ke Default
                  </button>
                </div>
              )}

              {activeTab === "css" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl">
                    <div>
                      <div className="text-white font-black uppercase text-[10px] flex items-center gap-1.5"><Code2 className="w-3 h-3 text-violet-400" /> Custom CSS</div>
                      <div className="text-gray-500 text-[10px]">Aktifkan untuk styling bebas</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={cssEnabled} onChange={e => setCssEnabled(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Snippet Cepat - klik untuk tambah</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(cssSnippets).map(([k, s]) => (
                        <button
                          key={k}
                          onClick={() => setCustomCss(prev => prev ? `${prev.trim()}\n\n${s.css}` : s.css)}
                          className="text-left p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 rounded-xl transition-colors"
                        >
                          <div className="text-white font-bold text-[11px]">{s.name}</div>
                          <div className="text-gray-500 text-[10px] leading-tight">{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Editor CSS - VSCode Autocomplete</span>
                      <span className="text-gray-600 text-[9px] font-mono">{customCss.length} chars • Ctrl+Space</span>
                    </div>
                    <CssEditor value={customCss} onChange={setCustomCss} />
                    <div className="text-gray-600 text-[9px] leading-relaxed">Ketik <code className="bg-white/10 px-1 rounded">.</code> untuk class overlay, <code className="bg-white/10 px-1 rounded">var(--</code> untuk variable. Autocomplete seperti VS Code.</div>
                    <div className="flex gap-2">
                      <button onClick={() => { setCustomCss(""); localStorage.removeItem(cssStorageKey(overlayId)); }} className="flex-1 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-400 flex items-center justify-center gap-1">
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(customCss); }} className="flex-1 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white flex items-center justify-center gap-1">
                        <Copy className="w-3 h-3" /> Copy CSS
                      </button>
                    </div>
                  </div>

                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 space-y-3">
                    <div className="text-violet-300 font-black uppercase text-[9px] tracking-widest flex items-center gap-1"><Brush className="w-3 h-3" /> Dokumentasi - Class & Variabel</div>

                    <div className="space-y-1.5">
                      <div className="text-white font-bold text-[10px]">🎨 Variabel CSS (dari Tema)</div>
                      <code className="block text-[10px] font-mono leading-relaxed text-violet-200/80 bg-black/30 border border-white/5 rounded-lg p-2">
                        :root &#123;<br />
                        &nbsp;&nbsp;--accent: #FE2C55; <span className="text-gray-500">/* gift/like, primary */</span><br />
                        &nbsp;&nbsp;--accent2: #06b6d4; <span className="text-gray-500">/* pinned, secondary */</span><br />
                        &nbsp;&nbsp;--main-color: var(--accent); <span className="text-gray-500">/* cyber neon */</span><br />
                        &nbsp;&nbsp;--main-glow: rgba(151,0,32,0.4);<br />
                        &nbsp;&nbsp;--bg-black: #050505;<br />
                        &nbsp;&nbsp;--text-color: #e2e2e2;<br />
                        &nbsp;&nbsp;--chat-bg: rgba(22,22,22,0.9);<br />
                        &nbsp;&nbsp;--chat-text: #f1f1f1;<br />
                        &nbsp;&#125;
                      </code>
                      <div className="text-gray-400 text-[9px]">Pakai via <code className="bg-white/10 px-1 rounded">var(--accent)</code> atau <code className="bg-white/10 px-1 rounded">var(--main-color)</code>. Ketik <code className="bg-white/10 px-1 rounded">var(--</code> untuk autocomplete.</div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-white font-bold text-[10px]">📦 Class Overlay</div>
                      <code className="block text-[10px] font-mono leading-relaxed text-violet-200/80 bg-black/30 border border-white/5 rounded-lg p-2">
                        <span className="text-cyan-300">.overlay-chat-bubble</span> <span className="text-gray-500">/* bubble chat */</span><br />
                        <span className="text-cyan-300">.overlay-chat-avatar</span> <span className="text-gray-500">/* foto profil */</span><br />
                        <span className="text-cyan-300">.overlay-chat-text</span> <span className="text-gray-500">/* isi pesan */</span><br />
                        <span className="text-cyan-300">.overlay-chat-nickname</span> <span className="text-gray-500">/* username */</span><br />
                        <span className="text-cyan-300">.overlay-pinned</span> <span className="text-gray-500">/* pinned chat */</span><br />
                        <span className="text-cyan-300">.overlay-pinned-avatar</span><br />
                        <span className="text-cyan-300">.overlay-gift</span> <span className="text-gray-500">/* gift alert */</span><br />
                        <span className="text-cyan-300">.overlay-gift-avatar</span><br />
                        <span className="text-cyan-300">.overlay-like</span> <span className="text-gray-500">/* like burst */</span><br />
                        <span className="text-cyan-300">.overlay-member</span> <span className="text-gray-500">/* member join */</span><br />
                        <span className="text-cyan-300">.neon-panel</span> <span className="text-gray-500">/* cyber panel */</span><br />
                        <span className="text-cyan-300">.user-tag</span> <span className="text-gray-500">/* tag username */</span><br />
                        <span className="text-cyan-300">#avatarContainer</span> <span className="text-gray-500">/* avatar cyber */</span>
                      </code>
                      <div className="text-gray-400 text-[9px]">Ketik <code className="bg-white/10 px-1 rounded">.</code> untuk autocomplete class.</div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-white font-bold text-[10px]">💡 Contoh</div>
                      <code className="block text-[10px] font-mono leading-relaxed text-violet-200/80 bg-black/30 border border-white/5 rounded-lg p-2">
                        .overlay-chat-bubble &#123;<br />
                        &nbsp;&nbsp;border-radius: 20px !important;<br />
                        &nbsp;&nbsp;box-shadow: 0 0 20px var(--accent) !important;<br />
                        &#125;
                      </code>
                    </div>

                    <div className="text-gray-500 text-[10px] leading-relaxed">Gunakan <code className="bg-white/10 px-1 rounded">!important</code> untuk override. CSS otomatis ter-inject ke preview & OBS. Semua overlay & text bisa pakai font Google Fonts via <code className="bg-white/10 px-1 rounded">font-family</code>.</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* preview */}
          <div className="flex-1 bg-[#0a0a0a] p-4 md:p-6 flex flex-col min-h-[400px] lg:min-h-0 w-full max-w-full min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Eye className="w-4 h-4 text-cyan-400" /> Live Preview • 1920×1080</div>
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase">
                  <Copy className="w-3 h-3" /> OBS URL
                </button>
                <Link href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white">
                  <ExternalLink className="w-3 h-3" /> Fullscreen
                </Link>
              </div>
            </div>
            {/* tombol test cepat di preview - sesuai overlay, hasil langsung 1:1 dengan OBS */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3 p-2 bg-white/[0.03] border border-white/10 rounded-xl">
              <span className="text-gray-500 font-black uppercase text-[8px] tracking-widest px-1">Test:</span>
              {(overlayId === "full" || ["chat", "chat-right", "vertical", "horizontal-chat"].includes(overlayId)) && (
                <button onClick={handleTestChat} className="h-7 px-2.5 bg-white text-black rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:bg-gray-100">
                  <MessageSquare className="w-3 h-3" /> Chat
                </button>
              )}
              {(overlayId === "full" || ["gift", "minimal"].includes(overlayId)) && (
                <button onClick={handleTestGift} className="h-7 px-2.5 bg-[#FE2C55] text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                  <Gift className="w-3 h-3" /> Gift
                </button>
              )}
              {(overlayId === "full" || overlayId === "pinned") && (
                <button onClick={handleTestPin} className="h-7 px-2.5 bg-cyan-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                  <Pin className="w-3 h-3" /> Pin
                </button>
              )}
              {(overlayId === "full" || overlayId === "like-member") && (
                <>
                  <button onClick={handleTestLike} className="h-7 px-2.5 bg-pink-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Like
                  </button>
                  <button onClick={handleTestMember} className="h-7 px-2.5 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Member
                  </button>
                </>
              )}
              {(overlayId === "view-counter") && (
                <button onClick={handleTestViewers} className="h-7 px-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Viewers
                </button>
              )}
              <span className="ml-auto text-gray-600 text-[9px] font-medium hidden sm:inline">klik → preview kanan update realtime sesuai tema & CSS</span>
            </div>

            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.6)] w-full max-w-full min-w-0">
              {/* canvas 16:9 - dibatasi max 100% parent, bukan 100vw */}
              <div className="relative w-full max-w-full mx-auto aspect-video bg-black overflow-hidden shrink-0" style={{ transform: `scale(${scale})`, transformOrigin: "top center", maxWidth: "100%", fontFamily: `'${theme.fontFamily || defaultTheme.fontFamily}', sans-serif` }}>
                {/* grid */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <style dangerouslySetInnerHTML={{ __html: `:root{--accent:${theme.accent};--accent2:${theme.accent2}} @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}} @keyframes popIn{0%{opacity:0;transform:scale(0.85) translateY(8px)}60%{transform:scale(1.04) translateY(-2px)}100%{opacity:1;transform:scale(1) translateY(0)}} @keyframes slideIn{from{opacity:0;transform:translateY(10px) translateX(-6px) scale(0.98)}to{opacity:1;transform:translateY(0) translateX(0) scale(1)}} @keyframes slideUp{from{opacity:0;transform:translateY(16px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}} @keyframes slideDown{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}} @keyframes slideLeft{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}} @keyframes slideRight{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes swivel{from{opacity:0;transform:perspective(600px) rotateY(28deg)}to{opacity:1;transform:perspective(600px) rotateY(0)}} @keyframes bounceIn{0%{opacity:0;transform:scale(0.72) translateY(10px)}50%{transform:scale(1.06)}100%{opacity:1;transform:scale(1) translateY(0)}} @keyframes flipIn{from{opacity:0;transform:perspective(600px) rotateX(-28deg)}to{opacity:1;transform:perspective(600px) rotateX(0)}} @keyframes zoomIn{from{opacity:0;transform:scale(0.82)}to{opacity:1;transform:scale(1)}} @keyframes slideInHRight{from{transform:translateX(110%)}to{transform:translateX(0)}} @keyframes slideInHLeft{from{transform:translateX(-110%)}to{transform:translateX(0)}} @keyframes shiftTrack{from{transform:translateX(24px)}to{transform:translateX(0)}} @keyframes pinnedOut{from{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}to{opacity:0;transform:translateY(-10px) scale(0.96);filter:blur(6px)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0}} @keyframes pulse{0%,100%{transform:scale(0.5);opacity:0.3}50%{transform:scale(1.2);opacity:1}}` }} />
                {cssEnabled && customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

                {/* simulated overlay content - HANYA overlay yang dipilih (isolasi), kecuali full - live preview sesuai tema & test state */}
                {(overlayId === "full" || overlayId === "pinned") && displayedDemoPinned && (
                  <div className="overlay-pinned absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none" style={{ fontSize: `${theme.fontScale}em` }}>
                    <div className="w-full max-w-[520px]">
                      <div className={`rounded-[20px] p-[1px] ${pinnedExiting ? "animate-[pinnedOut_0.38s_ease_forwards]" : "animate-[slideUp_0.45s_cubic-bezier(0.16,1,0.3,1)]"}`} style={{ background: theme.pinnedBorder, boxShadow: theme.shadow ? `0 0 40px ${theme.accent2}30` : "none" }}>
                        <div className="rounded-[19px] flex gap-3" style={{ background: theme.pinnedBg, padding: theme.overlayPadding }}>
                          {theme.showAvatar && <div className="overlay-pinned-avatar w-10 h-10 rounded-2xl shrink-0 border-2" style={{ background: theme.accent2, borderColor: theme.accent2 }} />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[13px]" style={{ color: theme.pinnedText }}>{displayedDemoPinned.nickname}</span>
                              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase text-white flex items-center gap-1" style={{ background: theme.accent2 }}><Pin className="w-2.5 h-2.5" /> PINNED</span>
                              {theme.showPlatform && <span className="text-[10px] font-bold" style={{ color: theme.pinnedText, opacity: 0.5 }}>TIKTOK</span>}
                            </div>
                            <div className="font-semibold text-[14px] mt-1 break-words" style={{ color: theme.pinnedText }}>{displayedDemoPinned.comment}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {overlayId === "full" && (
                      demoGift ? (
                        <div key={demoGift.id} className="overlay-gift flex items-center gap-3 rounded-[24px] animate-[popIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)]" style={{ background: theme.giftBg, border: `1px solid ${theme.giftBorder}`, boxShadow: theme.shadow ? `0 10px 30px ${theme.accent}30` : "none", padding: theme.overlayPadding, marginTop: theme.overlayGap }}>
                          {theme.showAvatar && <div className="overlay-gift-avatar w-12 h-12 rounded-2xl border-2" style={{ background: theme.accent, borderColor: theme.accent }} />}
                          <div>
                            <div className="font-black text-[10px] uppercase tracking-widest" style={{ color: theme.accent }}><Sparkles className="w-3 h-3 inline" /> GIFT ALERT</div>
                            <div className="font-black text-[16px]" style={{ color: theme.giftText }}>{demoGift.nickname} <span className="font-bold text-[12px]" style={{ opacity: 0.6 }}>mengirim</span> <span style={{ color: theme.accent }}>{demoGift.giftName} ×{demoGift.repeatCount}</span></div>
                          </div>
                        </div>
                      ) : (
                        <div className="overlay-gift flex items-center gap-3 rounded-[24px] opacity-60" style={{ background: theme.giftBg, border: `1px solid ${theme.giftBorder}`, padding: theme.overlayPadding, marginTop: theme.overlayGap }}>
                          {theme.showAvatar && <div className="overlay-gift-avatar w-12 h-12 rounded-2xl border-2" style={{ background: theme.accent, borderColor: theme.accent }} />}
                          <div>
                            <div className="font-black text-[10px] uppercase tracking-widest" style={{ color: theme.accent }}><Sparkles className="w-3 h-3 inline" /> GIFT ALERT (preview)</div>
                            <div className="font-black text-[16px]" style={{ color: theme.giftText }}>DonaturKece <span className="font-bold text-[12px]" style={{ opacity: 0.6 }}>mengirim</span> <span style={{ color: theme.accent }}>Rose ×10</span></div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {(overlayId === "gift" || overlayId === "minimal") && (
                  <div className="overlay-gift absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none" style={{ fontSize: `${theme.fontScale}em` }}>
                    {demoGift ? (
                      <div key={demoGift.id} className="flex items-center gap-3 rounded-[24px] animate-[popIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)]" style={{ background: theme.giftBg, border: `1px solid ${theme.giftBorder}`, boxShadow: theme.shadow ? `0 10px 30px ${theme.accent}30` : "none", padding: theme.overlayPadding }}>
                        {theme.showAvatar && <div className="overlay-gift-avatar w-12 h-12 rounded-2xl border-2" style={{ background: theme.accent, borderColor: theme.accent }} />}
                        <div>
                          <div className="font-black text-[10px] uppercase tracking-widest" style={{ color: theme.accent }}><Sparkles className="w-3 h-3 inline" /> GIFT ALERT</div>
                          <div className="font-black text-[16px]" style={{ color: theme.giftText }}>{demoGift.nickname} <span className="font-bold text-[12px]" style={{ opacity: 0.6 }}>mengirim</span> <span style={{ color: theme.accent }}>{demoGift.giftName} ×{demoGift.repeatCount}</span></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-[24px]" style={{ background: theme.giftBg, border: `1px solid ${theme.giftBorder}`, boxShadow: theme.shadow ? `0 10px 30px ${theme.accent}30` : "none", padding: theme.overlayPadding }}>
                        {theme.showAvatar && <div className="overlay-gift-avatar w-12 h-12 rounded-2xl border-2" style={{ background: theme.accent, borderColor: theme.accent }} />}
                        <div>
                          <div className="font-black text-[10px] uppercase tracking-widest" style={{ color: theme.accent }}><Sparkles className="w-3 h-3 inline" /> GIFT ALERT (tap Test)</div>
                          <div className="font-black text-[16px]" style={{ color: theme.giftText }}>DonaturKece <span className="font-bold text-[12px]" style={{ opacity: 0.6 }}>mengirim</span> <span style={{ color: theme.accent }}>Rose ×10</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(overlayId === "like-member") && (
                  <div className="overlay-like absolute inset-0 flex flex-col items-center justify-center p-6 gap-3 pointer-events-none" style={{ fontSize: `${theme.fontScale}em` }}>
                    {demoLike ? (
                      <div key={demoLike.nickname + demoLike.count} className="flex items-center gap-2 px-4 py-2 rounded-full animate-[popIn_0.4s_ease]" style={{ background: `${theme.accent}20`, border: `1px solid ${theme.accent}30` }}>
                        <Heart className="w-4 h-4" style={{ color: theme.accent, fill: theme.accent }} />
                        <span className="font-black text-[12px]" style={{ color: theme.giftText }}>{demoLike.nickname}</span>
                        <span className="font-bold text-[11px]" style={{ color: theme.giftText, opacity: 0.8 }}>+{demoLike.count} likes</span>
                        <span>💗</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full opacity-70" style={{ background: `${theme.accent}20`, border: `1px solid ${theme.accent}30` }}>
                        <Heart className="w-4 h-4" style={{ color: theme.accent, fill: theme.accent }} />
                        <span className="font-black text-[12px]" style={{ color: theme.giftText }}>SitiPlay</span>
                        <span className="font-bold text-[11px]" style={{ color: theme.giftText, opacity: 0.8 }}>+12 likes (tap Test)</span>
                        <span>💗</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-2">
                      {(demoMembers.length > 0 ? demoMembers : [{ id: "m0", n: "Budi_Gaming" }]).map(m => (
                        <div key={m.id} className="overlay-member flex items-center gap-2 px-3 py-1.5 rounded-full animate-[slideIn_0.4s_ease]" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                          <div className="w-6 h-6 rounded-full border border-white/20" style={{ background: theme.accent2 }} />
                          <span className="font-bold text-[11px]" style={{ color: theme.giftText }}>{m.n}</span>
                          <span className="text-[10px] flex items-center gap-1" style={{ color: theme.giftText, opacity: 0.7 }}><UserPlus className="w-3 h-3" style={{ color: "#22c55e" }} /> joined</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(overlayId === "view-counter") && (
                  <div className={`absolute ${counterPosClass} pointer-events-none z-20`} style={{ fontSize: `${theme.fontScale}em` }}>
                    <div className="flex items-center gap-3 rounded-full backdrop-blur-2xl border shadow-[0_12px_40px_rgba(0,0,0,0.5)]" style={{ background: theme.chatBg, borderColor: theme.chatBorder, padding: theme.overlayPadding }}>
                      {counterMode !== "clock" && (
                        <>
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                          <Eye className="w-5 h-5" style={{ color: theme.chatText }} />
                          <span key={demoViewers} className="font-black text-[22px] tracking-tight animate-[popIn_0.4s_ease]" style={{ color: theme.chatText }}>{demoViewers.toLocaleString()}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.chatText, opacity: 0.6 }}>Viewers</span>
                        </>
                      )}
                      {counterMode === "both" && <span className="w-px h-6 bg-white/10" />}
                      {(counterMode === "clock" || counterMode === "both") && (
                        <>
                          <Clock className="w-4 h-4" style={{ color: theme.chatText, opacity: 0.9 }} />
                          <span className="font-black text-[18px] tracking-tight tabular-nums" style={{ color: theme.chatText }}>{demoTime}</span>
                          <span className="text-[9px] font-bold uppercase" style={{ color: theme.chatText, opacity: 0.5 }}>WIB</span>
                        </>
                      )}
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-full text-[8px] font-black uppercase"><Activity className="w-3 h-3" /> LIVE</span>
                    </div>
                  </div>
                )}

                {(isCyber) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-3 pointer-events-none" style={{ fontFamily: `'${theme.fontFamily || "JetBrains Mono"}', monospace`, fontSize: `${theme.fontScale}em` }}>
                    <div className="w-full max-w-[620px] neon-panel" style={{ background: "rgba(5,5,5,1)", border: `3px solid ${theme.accent}`, boxShadow: `0 0 15px ${theme.accent}66, inset 0 0 5px ${theme.accent}66`, borderRadius: "16px", padding: theme.overlayPadding }}>
                      <div className="user-tag" style={{ background: theme.accent, boxShadow: `0 0 10px ${theme.accent}80` }}>{demoChats[0]?.n || "User"}</div>
                      <p className="text-[12px] font-bold leading-relaxed tracking-tight mt-1" style={{ color: theme.chatText }}>{demoChats[0]?.c || "Inisialisasi sistem..."}</p>
                    </div>
                    <div className="w-full max-w-[620px] flex gap-3">
                      <div id="avatarContainer" className="w-20 h-20 neon-panel overflow-hidden shrink-0 grid place-items-center" style={{ background: "#050505", border: `3px solid ${theme.accent}` }}>
                        <div className="w-10 h-10 rounded-full" style={{ background: theme.accent, opacity: 0.25 }} />
                      </div>
                      <div className="neon-panel flex-1 p-4 min-h-[90px] flex flex-col justify-center" style={{ background: "rgba(5,5,5,1)", border: `3px solid ${theme.accent}`, boxShadow: `0 0 15px ${theme.accent}66` }}>
                        <div className="dot-pulse flex gap-2 mb-1">
                          <span style={{ background: theme.accent }}></span><span style={{ background: theme.accent, animationDelay: "0.2s" }}></span><span style={{ background: theme.accent, animationDelay: "0.4s" }}></span>
                        </div>
                        <div className="text-[11px] font-bold leading-tight" style={{ color: theme.chatText }}>{demoPinned?.comment || "Menunggu respon AI..."}</div>
                      </div>
                    </div>
                  </div>
                )}

                {(overlayId === "full" || overlayId === "chat" || overlayId === "chat-right" || overlayId === "vertical" || overlayId === "horizontal-chat") && (
                  <>
                    {!isHorizontal && (
                    <div className={`absolute flex flex-col max-w-[360px] w-[90%] ${pos === "br" ? "bottom-6 right-6 items-end" : pos === "tl" ? "top-16 left-6 items-start" : pos === "tr" ? "top-16 right-6 items-end" : pos === "center" ? "bottom-20 left-1/2 -translate-x-1/2 items-center" : "bottom-6 left-6 items-start"}`} style={{ gap: theme.chatGap, margin: theme.chatMargin }}>
                      {demoChats.map((chat, i) => (
                        <div key={chat.id} className="overlay-chat-bubble flex gap-2.5 backdrop-blur will-change-transform hover:scale-[1.02] hover:shadow-xl transition-all duration-200 cursor-pointer" style={{
                          background: theme.chatBg,
                          border: `1px solid ${theme.chatBorder}`,
                          borderRadius: `${theme.chatRadius}px`,
                          opacity: theme.chatOpacity / 100,
                          backdropFilter: theme.chatBlur ? `blur(${theme.chatBlur}px)` : undefined,
                          boxShadow: theme.shadow ? "0 8px 32px rgba(0,0,0,0.5)" : "none",
                          fontSize: `${theme.fontScale}em`,
                          padding: theme.chatPadding,
                          animation: `${CHAT_ANIM_MAP[chatAnim] || CHAT_ANIM_MAP.slideUp} both`,
                          animationDelay: `${i * 70}ms`,
                        }}>
                          {theme.showAvatar && <div className="overlay-chat-avatar w-8 h-8 rounded-xl shrink-0 border border-white/10" style={{ background: i === 0 ? "#3b82f6" : i === 1 ? theme.accent : "#8b5cf6", borderRadius: `${Math.max(8, theme.chatRadius - 6)}px` }} />}
                          {theme.inlineChat ? (
                            <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                              <span className="overlay-chat-nickname font-black text-[12px] whitespace-nowrap flex items-center gap-1" style={{ color: theme.chatText }}>{theme.showPlatform && <img src={platformLogo(chat.platform)} alt={chat.platform || "tiktok"} title={chat.platform || "tiktok"} className="w-3.5 h-3.5 rounded-full object-contain bg-white p-0.5 shrink-0" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none'; }} />}{chat.n}:</span>
                              <span className="overlay-chat-text text-[13px] font-medium break-words flex-1" style={{ color: theme.chatText }}>{chat.c}</span>
                              {theme.showTimestamp && <span className="text-[9px] font-mono shrink-0" style={{ color: theme.chatText, opacity: 0.5 }}>{new Date(chat.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="overlay-chat-nickname font-black text-[12px] flex items-center gap-1" style={{ color: theme.chatText }}>{theme.showPlatform && <img src={platformLogo(chat.platform)} alt={chat.platform || "tiktok"} title={chat.platform || "tiktok"} className="w-3.5 h-3.5 rounded-full object-contain bg-white p-0.5 shrink-0" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none'; }} />}{chat.n}</span>
                                {theme.showTimestamp && <span className="text-[9px] font-mono" style={{ color: theme.chatText, opacity: 0.5 }}>{new Date(chat.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                              </div>
                              <div className="overlay-chat-text text-[13px] font-medium mt-0.5 break-words" style={{ color: theme.chatText }}>{chat.c}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isHorizontal && (
                    <>
                      {(hMode === "smooth" || hMode === "steps") ? (
                        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                          <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent py-3 px-4 overflow-hidden">
                            <div
                              className="flex items-center whitespace-nowrap will-change-transform"
                              style={{
                                fontSize: `${theme.fontScale}em`,
                                gap: theme.chatGap,
                                animation: `ticker ${tickerSpeed}s ${hMode === "steps" ? "steps(30)" : "linear"} infinite`,
                              }}
                            >
                              {demoChats.slice(-6).map((chat, i) => (
                                <div
                                  key={chat.id}
                                  className="overlay-chat-bubble flex items-center gap-2.5 backdrop-blur-2xl shrink-0"
                                  style={{
                                    background: theme.chatBg,
                                    border: `1px solid ${theme.chatBorder}`,
                                    borderRadius: `${theme.chatRadius}px`,
                                    opacity: theme.chatOpacity / 100,
                                    backdropFilter: theme.chatBlur ? `blur(${theme.chatBlur}px)` : undefined,
                                    boxShadow: theme.shadow ? "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
                                    fontSize: `${theme.fontScale}em`,
                                    padding: theme.chatPadding,
                                  }}
                                >
                                  {theme.showAvatar && (
                                    <div
                                      className="overlay-chat-avatar w-7 h-7 rounded-lg shrink-0 border border-white/10 flex items-center justify-center overflow-hidden"
                                      style={{ background: i % 3 === 0 ? "#3b82f6" : i % 3 === 1 ? theme.accent : "#8b5cf6" }}
                                    >
                                      <span className="text-white font-black text-[11px]">{(chat.n || "U")[0].toUpperCase()}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="overlay-chat-nickname font-black text-[12px] leading-none" style={{ color: theme.chatText }}>{chat.n}</span>
                                    <span className="text-gray-400 text-[11px]">:</span>
                                    <span className="overlay-chat-text text-[13px] leading-none" style={{ color: theme.chatText }}>{chat.c}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                          <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent py-3 px-4 overflow-hidden">
                            <div
                              key={demoChats.map(c=>c.id).join(',') + hDir + hMode}
                              className={`flex items-center gap-3 will-change-transform ${hDir === "right" ? "justify-end" : "justify-start"}`}
                              style={{
                                fontSize: `${theme.fontScale}em`,
                                animation: hMode === "slide" ? `shiftTrack 0.6s cubic-bezier(0.22,1,0.36,1) both` : undefined,
                              }}
                            >
                              {demoChats.slice(-6).map((chat, i) => {
                                const isLast = i === demoChats.slice(-6).length - 1;
                                return (
                                <div
                                  key={chat.id}
                                  className="overlay-chat-bubble flex items-center gap-2.5 px-4 py-2.5 backdrop-blur-2xl shrink-0 will-change-transform"
                                  style={{
                                    background: theme.chatBg,
                                    border: `1px solid ${theme.chatBorder}`,
                                    borderRadius: `${theme.chatRadius}px`,
                                    opacity: theme.chatOpacity / 100,
                                    backdropFilter: theme.chatBlur ? `blur(${theme.chatBlur}px)` : undefined,
                                    boxShadow: theme.shadow ? "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
                                    fontSize: `${theme.fontScale}em`,
                                    animation: hMode === "pop"
                                      ? `popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i * 80}ms both`
                                      : isLast
                                        ? hDir === "right"
                                          ? `slideInHRight 0.7s cubic-bezier(0.22,1,0.36,1) both`
                                          : `slideInHLeft 0.7s cubic-bezier(0.22,1,0.36,1) both`
                                        : undefined,
                                  }}
                                >
                                  {theme.showAvatar && (
                                    <div
                                      className="overlay-chat-avatar w-7 h-7 rounded-lg shrink-0 border border-white/10 flex items-center justify-center overflow-hidden"
                                      style={{ background: i % 3 === 0 ? "#3b82f6" : i % 3 === 1 ? theme.accent : "#8b5cf6" }}
                                    >
                                      <span className="text-white font-black text-[11px]">{(chat.n || "U")[0].toUpperCase()}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="overlay-chat-nickname font-black text-[12px] leading-none" style={{ color: theme.chatText }}>{chat.n}</span>
                                    <span className="text-gray-400 text-[11px]">:</span>
                                    <span className="overlay-chat-text text-[13px] leading-none" style={{ color: theme.chatText }}>{chat.c}</span>
                                  </div>
                                </div>
                              );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  </>
                )}

                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/40 backdrop-blur border border-white/5 rounded-full flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-white grid place-items-center"><Monitor className="w-2.5 h-2.5 text-black" /></div>
                  <span className="text-white font-black text-[7px] uppercase">OBS OVERLAYS</span>
                </div>
              </div>

              {/* OBS url bar */}
              <div className="border-t border-white/10 bg-[#121212] p-3 flex items-center gap-2">
                <code className="flex-1 text-[9px] font-mono text-cyan-300 truncate bg-black/40 border border-white/10 rounded-lg px-2 py-1.5">{obsUrl}</code>
                <button onClick={handleCopy} className="shrink-0 px-3 py-1.5 bg-white text-black rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <Link href={previewUrl} target="_blank" className="h-9 bg-white text-black rounded-xl font-black uppercase flex items-center justify-center gap-1.5">
                <Eye className="w-3 h-3" /> Preview Real
              </Link>
              <Link href={`/widgets/display?key=${privateKey || ""}&${currentParams}&${themeQuery}`} target="_blank" className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">
                <ExternalLink className="w-3 h-3" /> Tanpa OBS
              </Link>
              <button onClick={handleCopy} className="h-9 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">
                <Monitor className="w-3 h-3" /> Pakai di OBS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorRow({ label, value, onChange, allowAlpha }: { label: string; value: string; onChange: (v: string) => void; allowAlpha?: boolean }) {
  const isRgba = value.startsWith("rgba") || value.startsWith("rgb");
  const colorForPicker = (() => {
    if (value.startsWith("rgba")) {
      const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) return `#${[m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, "0")).join("")}`;
    }
    if (value.startsWith("#")) return value.slice(0, 7);
    return "#000000";
  })();
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-[11px] font-bold text-gray-300">{label}</span>
      <div className="flex items-center gap-1.5">
        <input type="color" value={colorForPicker} onChange={e => {
          if (allowAlpha && isRgba) {
            // keep alpha, change rgb
            const hex = e.target.value;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const aMatch = value.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\)/);
            const a = aMatch ? aMatch[1] : "0.9";
            onChange(`rgba(${r},${g},${b},${a})`);
          } else {
            onChange(e.target.value);
          }
        }} className="w-7 h-7 rounded-lg border border-white/10 bg-transparent p-0.5" />
        <input value={value} onChange={e => onChange(e.target.value)} className="w-[140px] h-7 bg-white/5 border border-white/10 rounded-lg px-2 text-[10px] font-mono text-white focus:outline-none focus:border-white/20" />
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-[11px] font-bold text-gray-300">{label}</span>
        <span className="text-white font-mono text-[11px]">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-white" />
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange, icon: Icon }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; icon: any }) {
  return (
    <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/[0.07]">
      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 grid place-items-center shrink-0"><Icon className="w-4 h-4 text-gray-400" /></div>
      <div className="flex-1">
        <div className="text-white font-bold text-[11px]">{label}</div>
        <div className="text-gray-500 text-[10px]">{desc}</div>
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-white" />
    </label>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Memuat editor…</div>}>
      <EditorContent />
    </Suspense>
  );
}
