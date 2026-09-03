'use client';
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Copy, Check, Eye, ExternalLink, Sparkles, Palette, Type, LayoutGrid,
  Monitor, Save, RotateCcw, Settings2, MessageSquare, Gift, Pin, Heart, UserPlus,
  SlidersHorizontal, EyeOff, Image as ImageIcon, Zap, Menu, Code2, Brush, Trash2
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "../../components/Sidebar";
import { OverlayTheme, defaultTheme, themePresets, themeToQuery, queryToTheme, themeStorageKey, cssStorageKey, cssSnippets, encodeCss, decodeCss } from "../components/theme";

const OVERLAY_OPTIONS = [
  { id: "full", label: "Full Combined", params: "layout=full&pos=bl" },
  { id: "chat", label: "Chat Overlay", params: "layout=chat&pos=bl&chat=1&gift=0&like=0&member=0&pin=0" },
  { id: "gift", label: "Gift Alert", params: "layout=alerts&chat=0&gift=1&like=0&member=0&pin=0" },
  { id: "pinned", label: "Pinned Chat", params: "chat=0&gift=0&like=0&member=0&pin=1" },
  { id: "like-member", label: "Like & Member", params: "chat=0&gift=0&like=1&member=1&pin=0" },
  { id: "minimal", label: "Minimal Clean", params: "layout=minimal&chat=0&gift=1&like=0&member=0&pin=0" },
  { id: "chat-right", label: "Chat Right", params: "layout=chat&pos=br&chat=1&gift=0&like=0&member=0&pin=0" },
  { id: "vertical", label: "Vertical Chat", params: "layout=chat&pos=center&chat=1&gift=0&like=0&member=0&pin=0" },
  { id: "horizontal-chat", label: "Horizontal Chat", params: "layout=horizontal&pos=bottom&chat=1&gift=0&like=0&member=0&pin=0" },
];

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const initialId = searchParams.get("id") || searchParams.get("overlay") || "full";
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
  const [demoGift, setDemoGift] = useState<DemoGift>(null);
  const [demoLike, setDemoLike] = useState<{ nickname: string; count: number } | null>(null);
  const [demoMembers, setDemoMembers] = useState<{ id: string; n: string }[]>([]);

  const isHorizontal = layout === "horizontal" || overlayId === "horizontal-chat";

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
      if (raw) setTheme(JSON.parse(raw));
      else setTheme(defaultTheme);
    } catch { setTheme(defaultTheme); }
  }, [overlayId]);

  // when overlayId changes, reload theme
  useEffect(() => {
    try {
      const raw = localStorage.getItem(themeStorageKey(overlayId));
      if (raw) {
        const t = JSON.parse(raw);
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

  const currentParams = OVERLAY_OPTIONS.find(o => o.id === overlayId)?.params || `layout=${layout}&pos=${pos}`;
  const themeQuery = themeToQuery(theme);
  const cssQuery = customCss && cssEnabled ? `&css=${encodeCss(customCss)}` : "";
  const isPopOrSlide = hMode === "pop" || hMode === "slide";
  const hQuery = isHorizontal ? `&hMode=${hMode}&speed=${tickerSpeed}${isPopOrSlide ? `&hDir=${hDir}` : ""}` : "";
  const obsUrl = typeof window !== "undefined"
    ? `${window.location.origin}/overlay/display?key=${privateKey || "YOUR_PRIVATE_KEY"}&${currentParams}&scale=${scale}&${themeQuery}${cssQuery}${hQuery}&obs=1`
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
    if (preset) setTheme(preset.theme);
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
  const handleClearTests = () => {
    setDemoChats([
      { id: "d1", n: "Rizky_JR", c: "Lagi main apa nih? 🔥", platform: "tiktok", ts: Date.now() - 5000 },
      { id: "d2", n: "SitiPlay", c: "Gass keun bang!", platform: "tiktok", ts: Date.now() - 3000 },
      { id: "d3", n: "TestUser", c: "Halo overlay! Ini tes chat 👋", platform: "tiktok", ts: Date.now() - 1000 },
    ]);
    setDemoGift(null); setDemoLike(null); setDemoMembers([]);
    setDemoPinned({ nickname: "Moderator", comment: "📌 Jangan lupa follow & share live ini ya guys!" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="overlay" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        {/* header */}
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <Link href="/overlay" className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" /> Edit Tema
                <span className="hidden sm:inline px-2 py-0.5 bg-white text-black rounded-full text-[9px]">{overlayId}</span>
              </div>
              <div className="hidden sm:block text-gray-500 text-[10px]">Sebelum masuk OBS - atur warna, radius, font & posisi</div>
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
              <label className="text-gray-500 font-black uppercase text-[9px] tracking-widest">Template Overlay</label>
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
                {overlayId === "full" && (
                  <span className="col-span-2 text-center text-[9px] font-bold uppercase text-gray-600">Full = semua tombol aktif</span>
                )}
              </div>
              <div className="text-gray-600 text-[10px] leading-tight">Klik untuk trigger preview kanan - warna/radius/blur mengikuti tema yang kamu ubah.</div>
            </div>

            {/* tabs */}
            <div className="flex gap-1 p-2 border-b border-white/5 shrink-0 overflow-x-auto">
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
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(themePresets).map(([k, p]) => (
                        <button key={k} onClick={() => applyPreset(k)} className="h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-white/20">
                          <span className="text-lg">{p.icon}</span>
                          <span className="text-[9px] font-black uppercase text-white">{p.name}</span>
                        </button>
                      ))}
                    </div>
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
                </div>
              )}

              {activeTab === "elemen" && (
                <div className="space-y-3">
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
                      <span className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Editor CSS</span>
                      <span className="text-gray-600 text-[9px] font-mono">{customCss.length} chars</span>
                    </div>
                    <textarea
                      value={customCss}
                      onChange={e => setCustomCss(e.target.value)}
                      placeholder={"/* Tulis CSS custom di sini */\n.overlay-chat-bubble {\n  /* contoh */\n  border-radius: 20px !important;\n}\n\n/* Variabel tersedia: var(--accent), var(--accent2) */"}
                      className="w-full h-[180px] bg-black border border-white/10 rounded-xl p-3 text-[11px] font-mono text-violet-200 placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 resize-none leading-relaxed"
                      spellCheck={false}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => { setCustomCss(""); localStorage.removeItem(cssStorageKey(overlayId)); }} className="flex-1 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-400 flex items-center justify-center gap-1">
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(customCss); }} className="flex-1 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white flex items-center justify-center gap-1">
                        <Copy className="w-3 h-3" /> Copy CSS
                      </button>
                    </div>
                  </div>

                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 space-y-1.5">
                    <div className="text-violet-300 font-black uppercase text-[9px] tracking-widest flex items-center gap-1"><Brush className="w-3 h-3" /> Class & Variabel</div>
                    <code className="block text-[10px] font-mono leading-relaxed text-violet-200/80">
                      .overlay-chat-bubble<br />
                      .overlay-chat-avatar<br />
                      .overlay-chat-text<br />
                      .overlay-pinned<br />
                      .overlay-gift<br />
                      :root &#123; --accent, --accent2 &#125;
                    </code>
                    <div className="text-gray-500 text-[10px] leading-relaxed">Gunakan <code className="bg-white/10 px-1 rounded">!important</code> untuk override. CSS otomatis ter-inject ke preview & OBS.</div>
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
              <span className="ml-auto text-gray-600 text-[9px] font-medium hidden sm:inline">klik → preview kanan update realtime sesuai tema & CSS</span>
            </div>

            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.6)] w-full max-w-full min-w-0">
              {/* canvas 16:9 - dibatasi max 100% parent, bukan 100vw */}
              <div className="relative w-full max-w-full mx-auto aspect-video bg-black overflow-hidden shrink-0" style={{ transform: `scale(${scale})`, transformOrigin: "top center", maxWidth: "100%" }}>
                {/* grid */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <style dangerouslySetInnerHTML={{ __html: `:root{--accent:${theme.accent};--accent2:${theme.accent2}} @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}} @keyframes popIn{0%{opacity:0;transform:scale(0.85) translateY(8px)}60%{transform:scale(1.04) translateY(-2px)}100%{opacity:1;transform:scale(1) translateY(0)}} @keyframes slideIn{from{opacity:0;transform:translateY(10px) translateX(-6px) scale(0.98)}to{opacity:1;transform:translateY(0) translateX(0) scale(1)}} @keyframes slideUp{from{opacity:0;transform:translateY(16px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}} @keyframes slideInHRight{from{transform:translateX(110%)}to{transform:translateX(0)}} @keyframes slideInHLeft{from{transform:translateX(-110%)}to{transform:translateX(0)}} @keyframes shiftTrack{from{transform:translateX(24px)}to{transform:translateX(0)}}` }} />
                {cssEnabled && customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

                {/* simulated overlay content - HANYA overlay yang dipilih (isolasi), kecuali full - live preview sesuai tema & test state */}
                {(overlayId === "full" || overlayId === "pinned") && demoPinned && (
                  <div className="overlay-pinned absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none" style={{ fontSize: `${theme.fontScale}em` }}>
                    <div className="w-full max-w-[520px]">
                      <div className="rounded-[20px] p-[1px] animate-[slideUp_0.45s_cubic-bezier(0.16,1,0.3,1)]" style={{ background: theme.pinnedBorder, boxShadow: theme.shadow ? `0 0 40px ${theme.accent2}30` : "none" }}>
                        <div className="rounded-[19px] p-4 flex gap-3" style={{ background: theme.pinnedBg }}>
                          {theme.showAvatar && <div className="overlay-pinned-avatar w-10 h-10 rounded-2xl shrink-0 border-2" style={{ background: theme.accent2, borderColor: theme.accent2 }} />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[13px]" style={{ color: theme.pinnedText }}>{demoPinned.nickname}</span>
                              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase text-white flex items-center gap-1" style={{ background: theme.accent2 }}><Pin className="w-2.5 h-2.5" /> PINNED</span>
                              {theme.showPlatform && <span className="text-[10px] font-bold" style={{ color: theme.pinnedText, opacity: 0.5 }}>TIKTOK</span>}
                            </div>
                            <div className="font-semibold text-[14px] mt-1 break-words" style={{ color: theme.pinnedText }}>{demoPinned.comment}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {overlayId === "full" && (
                      demoGift ? (
                        <div key={demoGift.id} className="overlay-gift mt-4 flex items-center gap-3 rounded-[24px] px-5 py-3 animate-[popIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)]" style={{ background: theme.giftBg, border: `1px solid ${theme.giftBorder}`, boxShadow: theme.shadow ? `0 10px 30px ${theme.accent}30` : "none" }}>
                          {theme.showAvatar && <div className="overlay-gift-avatar w-12 h-12 rounded-2xl border-2" style={{ background: theme.accent, borderColor: theme.accent }} />}
                          <div>
                            <div className="font-black text-[10px] uppercase tracking-widest" style={{ color: theme.accent }}><Sparkles className="w-3 h-3 inline" /> GIFT ALERT</div>
                            <div className="font-black text-[16px]" style={{ color: theme.giftText }}>{demoGift.nickname} <span className="font-bold text-[12px]" style={{ opacity: 0.6 }}>mengirim</span> <span style={{ color: theme.accent }}>{demoGift.giftName} ×{demoGift.repeatCount}</span></div>
                          </div>
                        </div>
                      ) : (
                        <div className="overlay-gift mt-4 flex items-center gap-3 rounded-[24px] px-5 py-3 opacity-60" style={{ background: theme.giftBg, border: `1px solid ${theme.giftBorder}` }}>
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
                      <div key={demoGift.id} className="flex items-center gap-3 rounded-[24px] px-5 py-3 animate-[popIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)]" style={{ background: theme.giftBg, border: `1px solid ${theme.giftBorder}`, boxShadow: theme.shadow ? `0 10px 30px ${theme.accent}30` : "none" }}>
                        {theme.showAvatar && <div className="overlay-gift-avatar w-12 h-12 rounded-2xl border-2" style={{ background: theme.accent, borderColor: theme.accent }} />}
                        <div>
                          <div className="font-black text-[10px] uppercase tracking-widest" style={{ color: theme.accent }}><Sparkles className="w-3 h-3 inline" /> GIFT ALERT</div>
                          <div className="font-black text-[16px]" style={{ color: theme.giftText }}>{demoGift.nickname} <span className="font-bold text-[12px]" style={{ opacity: 0.6 }}>mengirim</span> <span style={{ color: theme.accent }}>{demoGift.giftName} ×{demoGift.repeatCount}</span></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-[24px] px-5 py-3" style={{ background: theme.giftBg, border: `1px solid ${theme.giftBorder}`, boxShadow: theme.shadow ? `0 10px 30px ${theme.accent}30` : "none" }}>
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

                {(overlayId === "full" || overlayId === "chat" || overlayId === "chat-right" || overlayId === "vertical" || overlayId === "horizontal-chat") && (
                  <>
                    {!isHorizontal && (
                    <div className={`absolute flex flex-col gap-2 max-w-[360px] w-[90%] ${pos === "br" ? "bottom-6 right-6 items-end" : pos === "tl" ? "top-16 left-6 items-start" : pos === "tr" ? "top-16 right-6 items-end" : pos === "center" ? "bottom-20 left-1/2 -translate-x-1/2 items-center" : "bottom-6 left-6 items-start"}`}>
                      {demoChats.map((chat, i) => (
                        <div key={chat.id} className="overlay-chat-bubble flex gap-2.5 px-3 py-2.5 backdrop-blur animate-[slideIn_0.42s_cubic-bezier(0.16,1,0.3,1)]" style={{
                          background: theme.chatBg,
                          border: `1px solid ${theme.chatBorder}`,
                          borderRadius: `${theme.chatRadius}px`,
                          opacity: theme.chatOpacity / 100,
                          backdropFilter: theme.chatBlur ? `blur(${theme.chatBlur}px)` : undefined,
                          boxShadow: theme.shadow ? "0 8px 32px rgba(0,0,0,0.5)" : "none",
                          fontSize: `${theme.fontScale}em`,
                        }}>
                          {theme.showAvatar && <div className="overlay-chat-avatar w-8 h-8 rounded-xl shrink-0 border border-white/10" style={{ background: i === 0 ? "#3b82f6" : i === 1 ? theme.accent : "#8b5cf6", borderRadius: `${Math.max(8, theme.chatRadius - 6)}px` }} />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="overlay-chat-nickname font-black text-[12px]" style={{ color: theme.chatText }}>{chat.n}</span>
                              {theme.showPlatform && <span className="px-1 py-0.5 bg-white/10 border border-white/10 rounded text-[7px] font-black uppercase" style={{ color: theme.chatText, opacity: 0.7 }}>{chat.platform || "tiktok"}</span>}
                              {theme.showTimestamp && <span className="text-[9px] font-mono" style={{ color: theme.chatText, opacity: 0.5 }}>{new Date(chat.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                            </div>
                            <div className="overlay-chat-text text-[13px] font-medium mt-0.5 break-words" style={{ color: theme.chatText }}>{chat.c}</div>
                          </div>
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
                              className="flex items-center gap-4 whitespace-nowrap will-change-transform"
                              style={{
                                fontSize: `${theme.fontScale}em`,
                                animation: `ticker ${tickerSpeed}s ${hMode === "steps" ? "steps(30)" : "linear"} infinite`,
                              }}
                            >
                              {demoChats.slice(-6).map((chat, i) => (
                                <div
                                  key={chat.id}
                                  className="overlay-chat-bubble flex items-center gap-2.5 px-4 py-2.5 backdrop-blur-2xl shrink-0"
                                  style={{
                                    background: theme.chatBg,
                                    border: `1px solid ${theme.chatBorder}`,
                                    borderRadius: `${theme.chatRadius}px`,
                                    opacity: theme.chatOpacity / 100,
                                    backdropFilter: theme.chatBlur ? `blur(${theme.chatBlur}px)` : undefined,
                                    boxShadow: theme.shadow ? "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
                                    fontSize: `${theme.fontScale}em`,
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
                          <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent py-3 px-4">
                            <div
                              className={`flex items-center gap-3 overflow-hidden ${hDir === "right" ? "justify-end" : "justify-start"}`}
                              style={{ fontSize: `${theme.fontScale}em` }}
                            >
                              {demoChats.slice(-6).map((chat, i) => (
                                <div
                                  key={chat.id}
                                  className="overlay-chat-bubble flex items-center gap-2.5 px-4 py-2.5 backdrop-blur-2xl shrink-0"
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
                                      : hDir === "right"
                                        ? `slideInHRight 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 70}ms both`
                                        : `slideInHLeft 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 70}ms both`,
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
              <Link href={`/overlay/display?key=${privateKey || ""}&${currentParams}&${themeQuery}`} target="_blank" className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">
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
