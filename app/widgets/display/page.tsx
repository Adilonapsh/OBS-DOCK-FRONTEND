'use client';
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import {
  MessageSquare, Gift, Heart, UserPlus, Pin, Eye, Copy, Check, ExternalLink,
  Settings2, Monitor, Sparkles, Zap, Users, Activity, Clock, Trophy, Hash, Target
} from "lucide-react";
import { queryToTheme, decodeCss, googleFontUrl } from "../../overlay/components/theme";

type ChatItem = {
  id: string;
  nickname: string;
  comment: string;
  profilePictureUrl?: string;
  platform?: string;
  timestamp: number;
};
type GiftItem = {
  id: string;
  nickname: string;
  giftName: string;
  repeatCount: number;
  diamondCount?: number;
  profilePictureUrl?: string;
  timestamp: number;
};
type MemberItem = { id: string; nickname: string; profilePictureUrl?: string; timestamp: number };
type LikeItem = { id: string; nickname: string; likeCount: number; timestamp: number };

import { getSocketUrl } from "../_shared/utils/socket";
function platformLogo(p?: string) {
  const v = (p || "tiktok").toLowerCase();
  if (v.includes("tiktok")) return "/assets/logo/tik-tok.png";
  if (v.includes("youtube") || v === "yt") return "/assets/logo/youtube.png";
  if (v.includes("twitch")) return "/assets/logo/twitch.png";
  if (v.includes("kick")) return "/assets/logo/sbot.png";
  return "/assets/logo/tik-tok.png";
}

function WidgetDisplayContent() {
  const searchParams = useSearchParams();
  const privateKey = searchParams.get("key") || searchParams.get("privateKey") || "";
  const obsMode = searchParams.get("obs") === "1" || searchParams.get("transparent") === "1";
  const widget = searchParams.get("widget") || searchParams.get("layout") || "chat";
  const layoutParam = searchParams.get("layout") || widget;
  const scaleParam = parseFloat(searchParams.get("scale") || "1");
  const theme = queryToTheme(searchParams as any);
  const hMode = (searchParams.get("hMode") as "smooth" | "steps" | "pop" | "slide") || (searchParams.get("snappy") === "1" ? "pop" : "smooth");
  const tickerSpeed = parseInt(searchParams.get("speed") || searchParams.get("tickerSpeed") || "30", 10);
  const hDir = (searchParams.get("hDir") as "left" | "right") || (searchParams.get("dir") as "left" | "right") || "right";
  const isTickerMode = hMode === "smooth" || hMode === "steps";
  const isPopMode = hMode === "pop";
  const isSlideMode = hMode === "slide";
  const isCounter = widget === "counter" || layoutParam === "counter" || searchParams.get("counter") === "1";
  const isClock = widget === "clock";
  const isGoal = widget === "goal";
  const isSocial = widget === "social";
  const isChatWidget = widget === "chat" || widget === "chat-box";
  const isGiftWidget = widget === "gift" || widget === "gift-alert";
  const isPinnedWidget = widget === "pinned" || widget === "pinned-chat";
  const isLikeWidget = widget === "like" || widget === "like-burst";
  const isTickerWidget = widget === "ticker" || widget === "ticker-chat" || layoutParam === "horizontal";
  const isMinimal = widget === "minimal" || widget === "minimal-alert";
  const isFull = widget === "full" || widget === "full-combined" || layoutParam === "full";
  const counterMode = (searchParams.get("counterMode") as "counter" | "clock" | "both") || (isClock ? "clock" : "counter");
  const chatAnim = searchParams.get("chatAnim") || "slideUp";
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
  const customCssRaw = searchParams.get("css") || searchParams.get("customCss") || "";
  const customCss = customCssRaw ? (() => { try { return decodeCss(customCssRaw); } catch { try { return decodeURIComponent(customCssRaw); } catch { return customCssRaw; } } })() : "";

  // goal params
  const goalCur = parseInt(searchParams.get("cur") || searchParams.get("current") || "320", 10);
  const goalTarget = parseInt(searchParams.get("target") || searchParams.get("goal") || "500", 10);
  const goalLabel = searchParams.get("label") || "FOLLOWER GOAL";
  const socialHandle = searchParams.get("handle") || searchParams.get("username") || "namachannel";

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [pinned, setPinned] = useState<ChatItem | null>(null);
  const [displayedPinned, setDisplayedPinned] = useState<ChatItem | null>(null);
  const [pinnedExiting, setPinnedExiting] = useState(false);
  const [gifts, setGifts] = useState<GiftItem | null>(null);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [likes, setLikes] = useState<LikeItem | null>(null);
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showControls, setShowControls] = useState(!obsMode);
  const [now, setNow] = useState<string>(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
  const [goalCurrent, setGoalCurrent] = useState(goalCur);

  const showChat = searchParams.get("chat") !== "0";
  const showGift = searchParams.get("gift") !== "0";
  const showLike = searchParams.get("like") !== "0";
  const showMember = searchParams.get("member") !== "0";
  const showPin = searchParams.get("pin") !== "0";
  const hideAfter = parseInt(searchParams.get("hideAfter") || "0", 10);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (chats.length > 0) return;
    const demo: ChatItem[] = [
      { id: "d1", nickname: "Rizky_JR", comment: "Lagi main apa nih? 🔥", profilePictureUrl: "https://ui-avatars.com/api/?name=Rizky&background=3b82f6&color=fff", platform: "tiktok", timestamp: Date.now() - 5000 },
      { id: "d2", nickname: "SitiPlay", comment: "Gass keun bang!", profilePictureUrl: "https://ui-avatars.com/api/?name=Siti&background=FE2C55&color=fff", platform: "tiktok", timestamp: Date.now() - 3000 },
    ];
    const t = setTimeout(() => { if (!connected) setChats(demo); }, 1500);
    return () => clearTimeout(t);
  }, [connected, chats.length]);

  useEffect(() => {
    if ((!isCounter && !isClock) || viewerCount !== null || connected) return;
    const t = setTimeout(() => setViewerCount(1248), 800);
    return () => clearTimeout(t);
  }, [isCounter, isClock, viewerCount, connected]);

  useEffect(() => {
    if (isClock || counterMode === "clock" || counterMode === "both") {
      const t = setInterval(() => setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })), 1000);
      return () => clearInterval(t);
    }
  }, [isClock, counterMode]);

  useEffect(() => {
    if (pinned) {
      if (displayedPinned && displayedPinned.id !== pinned.id) {
        setPinnedExiting(true);
        const tt = setTimeout(() => { setDisplayedPinned(pinned); setPinnedExiting(false); }, 380);
        return () => clearTimeout(tt);
      } else {
        setDisplayedPinned(pinned);
        setPinnedExiting(false);
      }
    } else {
      if (displayedPinned) {
        setPinnedExiting(true);
        const tt = setTimeout(() => { setDisplayedPinned(null); setPinnedExiting(false); }, 380);
        return () => clearTimeout(tt);
      }
    }
  }, [pinned, displayedPinned]);

  // goal live increment from gift/member events (optional)
  useEffect(() => {
    setGoalCurrent(goalCur);
  }, [goalCur]);

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
    } else if (link.href !== href) link.href = href;
  }, [theme.fontFamily]);

  useEffect(() => {
    const socket = io(getSocketUrl(), { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect", () => {
      setConnected(true);
      const room = privateKey || "global";
      socket.emit("join-room", room);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("tiktok-connected", () => setTiktokConnected(true));
    socket.on("tiktok-disconnected", () => setTiktokConnected(false));
    socket.on("tiktok-chat", (data: any) => {
      if (!showChat) return;
      const item: ChatItem = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        nickname: data.nickname || data.uniqueId || "User",
        comment: data.comment || data.message || "",
        profilePictureUrl: data.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nickname || "U")}&background=111&color=fff`,
        platform: data.platform || "tiktok",
        timestamp: Date.now(),
      };
      if (!item.comment) return;
      setChats(prev => [...prev, item].slice(-6));
      if (hideAfter > 0) setTimeout(() => setChats(prev => prev.filter(c => c.id !== item.id)), hideAfter * 1000);
    });
    socket.on("pinned-chat", (data: any) => {
      if (!showPin) return;
      const chat = data.chat || data;
      const item: ChatItem = {
        id: `pin_${Date.now()}`,
        nickname: chat.nickname || chat.user || "Pinned",
        comment: chat.comment || chat.text || chat.message || "",
        profilePictureUrl: chat.profilePictureUrl || chat.avatar,
        platform: chat.platform,
        timestamp: Date.now(),
      };
      if (!item.comment) return;
      setPinned(item);
    });
    socket.on("unpin-chat", () => setPinned(null));
    socket.on("tiktok-gift", (data: any) => {
      if (!showGift) return;
      setGifts({
        id: `gift_${Date.now()}`,
        nickname: data.nickname || "Someone",
        giftName: data.giftName || data.gift || "Gift",
        repeatCount: data.repeatCount || data.count || 1,
        diamondCount: data.diamondCount,
        profilePictureUrl: data.profilePictureUrl,
        timestamp: Date.now(),
      });
      setTimeout(() => setGifts(null), 4200);
      if (isGoal) setGoalCurrent(v => Math.min(goalTarget, v + (data.repeatCount || 1)));
    });
    socket.on("tiktok-like", (data: any) => {
      if (!showLike) return;
      setLikes({ id: `like_${Date.now()}`, nickname: data.nickname || "Someone", likeCount: data.likeCount || 1, timestamp: Date.now() });
      setTimeout(() => setLikes(null), 2500);
    });
    socket.on("tiktok-member", (data: any) => {
      if (!showMember) return;
      const m: MemberItem = { id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`, nickname: data.nickname || "New Viewer", profilePictureUrl: data.profilePictureUrl, timestamp: Date.now() };
      setMembers(prev => [...prev, m].slice(-3));
      setTimeout(() => setMembers(prev => prev.filter(x => x.id !== m.id)), 4000);
      if (isGoal) setGoalCurrent(v => Math.min(goalTarget, v + 1));
    });
    socket.on("tiktok-roomUser", (data: any) => {
      const vc = data.viewerCount ?? data.viewer_count ?? data.totalUser ?? null;
      if (typeof vc === "number") setViewerCount(vc);
    });
    return () => { socket.disconnect(); };
  }, [privateKey, showChat, showGift, showLike, showMember, showPin, hideAfter, isGoal, goalTarget]);

  const widgetUrl = typeof window !== "undefined" ? (() => {
    const p = new URLSearchParams(searchParams.toString());
    if (!p.get("key") && privateKey) p.set("key", privateKey);
    if (!p.get("key")) p.set("key", "YOUR_PRIVATE_KEY");
    p.set("obs", "1");
    return `${window.location.origin}/widgets/display?${p.toString()}`;
  })() : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(widgetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleTestChat = () => {
    const item: ChatItem = { id: `test_${Date.now()}`, nickname: "TestUser", comment: "Halo widget! Ini tes chat 👋", profilePictureUrl: "https://ui-avatars.com/api/?name=Test&background=8b5cf6&color=fff", platform: "tiktok", timestamp: Date.now() };
    setChats(prev => [...prev, item].slice(-6));
  };
  const handleTestGift = () => {
    setGifts({ id: `gift_test_${Date.now()}`, nickname: "DonaturKece", giftName: "Rose", repeatCount: 10, diamondCount: 10, profilePictureUrl: "https://ui-avatars.com/api/?name=Donatur&background=ec4899&color=fff", timestamp: Date.now() });
    setTimeout(() => setGifts(null), 4200);
    if (isGoal) setGoalCurrent(v => Math.min(goalTarget, v + 10));
  };
  const handleTestPin = () => {
    setPinned({ id: `pin_test_${Date.now()}`, nickname: "Moderator", comment: "📌 Jangan lupa follow & share live ini ya guys!", profilePictureUrl: "https://ui-avatars.com/api/?name=Mod&background=06b6d4&color=fff", platform: "tiktok", timestamp: Date.now() });
    setTimeout(() => setPinned(null), 6000);
  };

  const isHorizontal = isTickerWidget;
  const chatPositionClass = (() => {
    const pos = searchParams.get("pos") || "center";
    if (isHorizontal) return "bottom-0 left-0 right-0 items-start justify-center";
    switch (pos) {
      case "br": return "bottom-6 right-6 items-end";
      case "tl": return "top-20 left-6 items-start";
      case "tr": return "top-20 right-6 items-end";
      case "center": return "bottom-32 left-1/2 -translate-x-1/2 items-center";
      default: return "bottom-6 left-6 items-start";
    }
  })();
  const counterPositionClass = (() => {
    const pos = searchParams.get("pos") || "center";
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
    const pos = searchParams.get("pos") || "center";
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

  const isTransparent = obsMode;
  const showAsWidgetOnly = !isFull;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root{--accent:${theme.accent};--accent2:${theme.accent2};--chat-bg:${theme.chatBg};--chat-text:${theme.chatText}}` }} />
      {isTransparent && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      <div className={`w-full ${isTransparent ? "fixed inset-0 w-screen h-screen bg-transparent overflow-hidden" : "min-h-screen bg-[#0a0a0a] flex flex-col"}`}>
        {showControls && (
          <div className="shrink-0 bg-[#121212] border-b border-white/10 px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <Monitor className="w-4 h-4 text-black" />
              </div>
              <div>
                <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Widget
                  <span className="px-2 py-0.5 bg-violet-500 text-white rounded-full text-[8px]">{widget}</span>
                  <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-red-500"}`} />
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${connected ? "bg-green-500/20 text-green-400 border border-green-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"}`}>
                    {connected ? "Socket Connected" : "Disconnected"}
                  </span>
                </div>
                <div className="text-gray-500 text-[10px] font-medium">
                  Browser Source • Transparent • key isolasi {privateKey ? `${privateKey.slice(0, 8)}…` : "GLOBAL"}
                  {viewerCount !== null && <span className="ml-2 inline-flex items-center gap-1 text-violet-400"><Eye className="w-3 h-3" /> {viewerCount} viewers</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden lg:flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2 py-1.5">
                <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest px-1">URL OBS</span>
                <code className="text-[10px] font-mono text-violet-300 max-w-[260px] truncate">{widgetUrl}</code>
                <button onClick={handleCopy} className="ml-1 p-1.5 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <button onClick={handleTestChat} className="h-8 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Test Chat
              </button>
              <button onClick={handleTestGift} className="h-8 px-3 bg-[#FE2C55]/20 hover:bg-[#FE2C55]/30 border border-[#FE2C55]/20 rounded-xl text-[10px] font-black uppercase text-[#FE2C55] flex items-center gap-1.5">
                <Gift className="w-3 h-3" /> Gift
              </button>
              <button onClick={handleTestPin} className="h-8 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/20 rounded-xl text-[10px] font-black uppercase text-cyan-400 flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pin
              </button>
              <Link href={privateKey ? `/dock?key=${privateKey}` : "/dock"} className="h-8 px-3 bg-white hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase text-black flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3" /> Dock
              </Link>
              <button onClick={() => setShowControls(false)} className="h-8 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400">
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {!showControls && !isTransparent && (
          <button onClick={() => setShowControls(true)} className="fixed top-3 right-3 z-50 p-2 bg-black/60 backdrop-blur border border-white/10 rounded-xl text-white hover:bg-white/10">
            <Settings2 className="w-4 h-4" />
          </button>
        )}

        <div className={`${isTransparent ? "absolute inset-0 w-screen h-screen overflow-hidden bg-transparent" : "flex-1 relative overflow-hidden bg-[#0a0a0a] p-4 md:p-6"}`}>
          <div
            className={`${isTransparent ? "absolute inset-0 w-full h-full overflow-hidden bg-transparent border-0 shadow-none rounded-none" : "relative w-full h-full overflow-hidden bg-black border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl min-h-[60vh] lg:min-h-[70vh]"}`}
            style={{ transform: `scale(${scaleParam})`, transformOrigin: isTransparent ? "center" : "top center", fontFamily: `'${theme.fontFamily || "Outfit"}', sans-serif` }}
          >
            {!isTransparent && (
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            )}

            {/* Top bar */}
            <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                {!isTransparent && viewerCount !== null && (isCounter || isFull) && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                    <span className="text-white font-black text-[10px] tracking-widest uppercase flex items-center gap-1"><Eye className="w-3 h-3" /> {viewerCount.toLocaleString()}</span>
                    <span className="text-gray-400 text-[9px] font-bold uppercase">Viewers</span>
                  </div>
                )}
                {tiktokConnected && (
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#FE2C55] rounded-full text-white font-black text-[9px] uppercase tracking-widest shadow-lg">
                    <Activity className="w-3 h-3 animate-pulse" /> TikTok Live
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isTransparent && (
                  <div className="px-2 py-1 bg-white/5 backdrop-blur border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-400">
                    WIDGET • {widget} • Browser Source
                  </div>
                )}
              </div>
            </div>

            {/* Goal Widget - centered */}
            {isGoal && (
              <div className={`absolute ${overlayPosClass} w-[min(560px,90%)] pointer-events-none`} style={{ fontSize: `${theme.fontScale}em` }}>
                <div className="w-full bg-[#0f0f0f]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)]" style={{ borderColor: theme.chatBorder }}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-black text-[10px] uppercase tracking-[0.14em] flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> {goalLabel}</span>
                    <span className="text-white font-mono font-black text-[12px]">{goalCurrent} / {goalTarget}</span>
                  </div>
                  <div className="mt-3 h-4 bg-black/40 border border-white/10 rounded-full overflow-hidden p-1">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(100, (goalCurrent / goalTarget) * 100)}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`, boxShadow: theme.shadow ? `0 0 12px ${theme.accent}80` : "none" }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-gray-400">{Math.round((goalCurrent / goalTarget) * 100)}% tercapai</span>
                    <span className="text-violet-300 flex items-center gap-1"><Target className="w-3 h-3" /> {Math.max(0, goalTarget - goalCurrent)} lagi</span>
                  </div>
                </div>
              </div>
            )}

            {/* Social Bar Widget */}
            {isSocial && (
              <div className={`absolute ${overlayPosClass} pointer-events-none`} style={{ fontSize: `${theme.fontScale}em` }}>
                <div className="flex items-center gap-3 px-6 py-3 rounded-full border shadow-[0_12px_40px_rgba(0,0,0,0.5)]" style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`, borderColor: "rgba(255,255,255,0.15)" }}>
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
                    <Hash className="w-5 h-5 text-black" />
                  </div>
                  <span className="text-white font-black text-[16px] tracking-tight">@{socialHandle}</span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-white text-black rounded-full text-[9px] font-black uppercase">Follow</span>
                </div>
              </div>
            )}

            {/* Counter / Clock single */}
            {(isCounter || isClock) && !isFull && !isGoal && !isSocial && (
              <div className={`absolute ${counterPositionClass} pointer-events-none z-20`} style={{ fontSize: `${theme.fontScale}em` }}>
                <div className="flex items-center gap-3 rounded-full backdrop-blur-2xl border shadow-[0_12px_40px_rgba(0,0,0,0.5)]" style={{ background: theme.chatBg, borderColor: theme.chatBorder, padding: theme.overlayPadding }}>
                  {(counterMode === "counter" || counterMode === "both") && (
                    <>
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                      <Eye className="w-5 h-5" style={{ color: theme.chatText }} />
                      <span key={viewerCount ?? 0} className="font-black text-[22px] tracking-tight animate-[popIn_0.4s_ease]" style={{ color: theme.chatText }}>{(viewerCount ?? 0).toLocaleString()}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.chatText, opacity: 0.6 }}>Viewers</span>
                    </>
                  )}
                  {counterMode === "both" && <span className="w-px h-6 bg-white/10" />}
                  {(counterMode === "clock" || counterMode === "both") && (
                    <>
                      <Clock className="w-4 h-4" style={{ color: theme.chatText, opacity: 0.9 }} />
                      <span className="font-black text-[18px] tracking-tight tabular-nums" style={{ color: theme.chatText }}>{now}</span>
                      <span className="text-[9px] font-bold uppercase" style={{ color: theme.chatText, opacity: 0.5 }}>WIB</span>
                    </>
                  )}
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-full text-[8px] font-black uppercase"><Activity className="w-3 h-3" /> LIVE</span>
                </div>
              </div>
            )}

            {/* Central pinned/gift/like for single widgets */}
            {(isPinnedWidget || isGiftWidget || isLikeWidget || isFull) && (
              <div className={`absolute ${overlayPosClass} flex flex-col pointer-events-none p-6 w-full max-w-[520px]`} style={{ fontSize: `${theme.fontScale}em` }}>
                {displayedPinned && showPin && (isPinnedWidget || isFull) && (
                  <div className={`overlay-pinned w-full max-w-[640px] ${pinnedExiting ? "animate-[pinnedOut_0.38s_ease_forwards]" : "animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)]"}`} style={{ fontSize: `${theme.fontScale}em` }}>
                    <div className="relative backdrop-blur-2xl rounded-[20px] p-[1px] overflow-hidden" style={{ background: theme.pinnedBorder, boxShadow: theme.shadow ? `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${theme.accent2}25` : "none" }}>
                      <div className="absolute inset-0 opacity-20 rounded-[20px]" style={{ background: `linear-gradient(135deg, ${theme.accent2}20, transparent, ${theme.accent}10)` }} />
                      <div className="relative rounded-[19px] p-4 md:p-5" style={{ background: theme.pinnedBg }}>
                        <div className="flex items-start gap-3">
                          {theme.showAvatar && <img src={displayedPinned.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayedPinned.nickname)}`} alt={displayedPinned.nickname} className="overlay-pinned-avatar w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover border-2 shrink-0" style={{ borderColor: theme.accent2 }} />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-[13px] md:text-[15px] tracking-tight" style={{ color: theme.pinnedText }}>{displayedPinned.nickname}</span>
                              <span className="px-1.5 py-0.5 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1" style={{ background: theme.accent2 }}><Pin className="w-2.5 h-2.5" /> PINNED</span>
                            </div>
                            <p className="text-[14px] md:text-[16px] font-semibold leading-snug mt-1 break-words" style={{ color: theme.pinnedText }}>{displayedPinned.comment}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {gifts && showGift && (isGiftWidget || isFull) && (
                  <div key={gifts.id} className="overlay-gift animate-[popIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)] mt-4" style={{ fontSize: `${theme.fontScale}em` }}>
                    <div className="relative">
                      <div className="absolute -inset-3 blur-2xl rounded-full opacity-30" style={{ background: `linear-gradient(to right, ${theme.accent}, ${theme.accent2})` }} />
                      <div className="relative rounded-[24px] px-6 py-4 md:px-8 md:py-5 flex items-center gap-4" style={{ background: theme.giftBg, border: `1px solid ${theme.giftBorder}`, boxShadow: theme.shadow ? `0 20px 60px ${theme.accent}40` : "none" }}>
                        <div className="relative">
                          {theme.showAvatar && <img src={gifts.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(gifts.nickname)}`} alt={gifts.nickname} className="overlay-gift-avatar w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border-2" style={{ borderColor: theme.accent }} />}
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-black" style={{ background: theme.accent }}>
                            <Gift className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="font-black text-[10px] uppercase tracking-[0.14em] flex items-center gap-1.5" style={{ color: theme.accent }}><Sparkles className="w-3 h-3" /> GIFT ALERT</div>
                          <div className="font-black text-[16px] md:text-[20px] leading-none tracking-tight mt-0.5" style={{ color: theme.giftText }}>
                            {gifts.nickname} <span className="font-bold text-[12px]" style={{ color: theme.giftText, opacity: 0.6 }}>mengirim</span> <span style={{ color: theme.accent }}>{gifts.giftName} ×{gifts.repeatCount}</span>
                          </div>
                          {gifts.diamondCount ? <div className="font-black text-[11px] mt-1 flex items-center gap-1" style={{ color: "#facc15" }}>♦ {gifts.diamondCount} diamonds</div> : null}
                        </div>
                        <div className="hidden md:flex w-12 h-12 rounded-2xl items-center justify-center text-2xl" style={{ background: `${theme.accent}20`, border: `1px solid ${theme.accent}30` }}>🎁</div>
                      </div>
                    </div>
                  </div>
                )}
                {likes && showLike && (isLikeWidget || isFull) && (
                  <div key={likes.id} className="animate-[slideUp_0.4s_ease] mt-3 w-full flex items-center gap-2 px-4 py-3 bg-pink-500/20 backdrop-blur-xl border border-pink-500/30 rounded-2xl shadow-lg">
                    <Heart className="w-4 h-4 text-pink-400 fill-pink-400 animate-pulse shrink-0" />
                    <span className="text-white font-black text-[12px] flex-1 truncate">{likes.nickname}</span>
                    <span className="text-pink-200 font-bold text-[11px] whitespace-nowrap">+{likes.likeCount} likes</span>
                    <span className="text-pink-300 shrink-0">💗</span>
                  </div>
                )}
                {members.length > 0 && showMember && (isLikeWidget || isFull) && (
                  <div className="mt-3 flex flex-col gap-2 w-full">
                    {members.slice(-2).map(m => (
                      <div key={m.id} className="animate-[slideIn_0.4s_ease] w-full flex items-center gap-2 px-3 py-2.5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl">
                        <img src={m.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nickname)}`} alt={m.nickname} className="w-6 h-6 rounded-full object-cover border border-white/20 shrink-0" />
                        <span className="text-white font-bold text-[11px] flex-1 truncate">{m.nickname}</span>
                        <span className="text-gray-300 text-[10px] flex items-center gap-1 whitespace-nowrap shrink-0"><UserPlus className="w-3 h-3 text-green-400" /> joined</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat Stack - for chat, ticker, full, minimal */}
            {(isChatWidget || isTickerWidget || isFull || isMinimal || showAsWidgetOnly) && (isChatWidget || isTickerWidget || isFull) && (
              <>
                {!isHorizontal && (
                  <div className={`absolute ${chatPositionClass} flex flex-col max-w-[380px] w-[92%] sm:w-[380px] pointer-events-none`} style={{ gap: theme.chatGap, margin: theme.chatMargin }}>
                    {chats.length === 0 ? null : (
                      chats.map((chat) => (
                        <div
                          key={chat.id}
                          className="overlay-chat-bubble group flex gap-2.5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] will-change-transform hover:scale-[1.02] transition-all duration-200"
                          style={{
                            background: theme.chatBg,
                            border: `1px solid ${theme.chatBorder}`,
                            borderRadius: `${theme.chatRadius}px`,
                            opacity: theme.chatOpacity / 100,
                            backdropFilter: theme.chatBlur ? `blur(${theme.chatBlur}px)` : undefined,
                            boxShadow: theme.shadow ? undefined : "none",
                            fontSize: `${theme.fontScale}em`,
                            padding: theme.chatPadding,
                            animation: `${CHAT_ANIM_MAP[chatAnim] || CHAT_ANIM_MAP.slideUp} both`,
                          }}
                        >
                          {theme.showAvatar && (
                            <img
                              src={chat.profilePictureUrl}
                              alt={chat.nickname}
                              className="overlay-chat-avatar w-8 h-8 rounded-xl object-cover border border-white/10 shadow-md shrink-0"
                              style={{ borderRadius: `${Math.max(8, theme.chatRadius - 6)}px` }}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.nickname)}&background=222&color=fff`; }}
                            />
                          )}
                          {theme.inlineChat ? (
                            <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                              <span className="overlay-chat-nickname font-black text-[12px] whitespace-nowrap flex items-center gap-1" style={{ color: theme.chatText }}>{theme.showPlatform && <img src={platformLogo(chat.platform)} alt={chat.platform || "tiktok"} title={chat.platform || "tiktok"} className="w-3.5 h-3.5 rounded-full object-contain bg-white p-0.5 shrink-0" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none'; }} />}{chat.nickname}:</span>
                              <span className="overlay-chat-text text-[13px] font-medium break-words flex-1" style={{ color: theme.chatText }}>{chat.comment}</span>
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="overlay-chat-nickname font-black text-[12px] leading-none tracking-tight flex items-center gap-1" style={{ color: theme.chatText }}>{theme.showPlatform && <img src={platformLogo(chat.platform)} alt={chat.platform || "tiktok"} title={chat.platform || "tiktok"} className="w-3.5 h-3.5 rounded-full object-contain bg-white p-0.5 shrink-0" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none'; }} />}{chat.nickname}</span>
                              </div>
                              <p className="overlay-chat-text text-[13px] leading-[1.35] font-medium mt-0.5 break-words line-clamp-3" style={{ color: theme.chatText }}>{chat.comment}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
                {isHorizontal && (
                  <>
                    {isTickerMode ? (
                      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent py-3 px-4 overflow-hidden">
                          <div className="flex items-center whitespace-nowrap will-change-transform" style={{ fontSize: `${theme.fontScale}em`, gap: theme.chatGap, animation: `ticker ${tickerSpeed}s ${hMode === "steps" ? "steps(30)" : "linear"} infinite` }}>
                            {chats.length === 0 ? null : (
                              chats.map((chat, i) => (
                                <div key={chat.id} className="overlay-chat-bubble flex items-center gap-2.5 backdrop-blur-2xl shrink-0" style={{ background: theme.chatBg, border: `1px solid ${theme.chatBorder}`, borderRadius: `${theme.chatRadius}px`, opacity: theme.chatOpacity / 100, backdropFilter: theme.chatBlur ? `blur(${theme.chatBlur}px)` : undefined, fontSize: `${theme.fontScale}em`, padding: theme.chatPadding }}>
                                  {theme.showAvatar && <div className="overlay-chat-avatar w-7 h-7 rounded-lg shrink-0 border border-white/10 flex items-center justify-center overflow-hidden" style={{ background: i % 3 === 0 ? "#3b82f6" : i % 3 === 1 ? theme.accent : "#8b5cf6" }}><span className="text-white font-black text-[11px]">{(chat.nickname || "U")[0].toUpperCase()}</span></div>}
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="overlay-chat-nickname font-black text-[12px]" style={{ color: theme.chatText }}>{chat.nickname}</span>
                                    <span className="text-gray-400 text-[11px]">:</span>
                                    <span className="overlay-chat-text text-[13px]" style={{ color: theme.chatText }}>{chat.comment}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent py-3 px-4 overflow-hidden">
                          <div key={chats.map(c => c.id).join(",") + hDir + hMode} className={`flex items-center will-change-transform ${hDir === "right" ? "justify-end" : "justify-start"}`} style={{ fontSize: `${theme.fontScale}em`, gap: theme.chatGap, animation: isSlideMode ? `shiftTrack 0.6s cubic-bezier(0.22,1,0.36,1) both` : undefined }}>
                            {chats.length === 0 ? null : (
                              chats.slice(-6).map((chat, idx, arr) => {
                                const isLast = idx === arr.length - 1;
                                return (
                                  <div key={chat.id} className="overlay-chat-bubble flex items-center gap-2.5 backdrop-blur-2xl shrink-0 will-change-transform" style={{ background: theme.chatBg, border: `1px solid ${theme.chatBorder}`, borderRadius: `${theme.chatRadius}px`, opacity: theme.chatOpacity / 100, backdropFilter: theme.chatBlur ? `blur(${theme.chatBlur}px)` : undefined, fontSize: `${theme.fontScale}em`, padding: theme.chatPadding, animation: isPopMode ? `popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both` : isLast ? hDir === "right" ? `slideInHRight 0.7s cubic-bezier(0.22,1,0.36,1) both` : `slideInHLeft 0.7s cubic-bezier(0.22,1,0.36,1) both` : undefined }}>
                                    {theme.showAvatar && <div className="overlay-chat-avatar w-7 h-7 rounded-lg shrink-0 border border-white/10 flex items-center justify-center overflow-hidden" style={{ background: theme.accent }}><span className="text-white font-black text-[11px]">{(chat.nickname || "U")[0].toUpperCase()}</span></div>}
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                      <span className="overlay-chat-nickname font-black text-[12px]" style={{ color: theme.chatText }}>{chat.nickname}</span>
                                      <span className="text-gray-400 text-[11px]">:</span>
                                      <span className="overlay-chat-text text-[13px]" style={{ color: theme.chatText }}>{chat.comment}</span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {!isTransparent && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur border border-white/5 rounded-full pointer-events-none">
                <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center">
                  <Monitor className="w-3 h-3 text-black" />
                </div>
                <span className="text-white font-black text-[8px] tracking-widest uppercase">OBS OVERLAYS</span>
                <span className="text-gray-500 text-[8px] font-bold">WIDGET</span>
              </div>
            )}
          </div>

          {!isTransparent && (
            <div className="max-w-[1280px] mx-auto mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
                <div className="text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-violet-400" /> Widget: {widget}</div>
                <ol className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-gray-400 list-decimal list-inside">
                  <li>Copy <span className="text-white font-bold">URL OBS</span> di atas (yang ada <code className="bg-white/10 px-1 rounded text-violet-300">?obs=1</code>)</li>
                  <li>OBS → Add Source → <span className="text-white font-bold">Browser Source</span> → Paste URL</li>
                  <li>Set <span className="text-white font-bold">Width/Height</span> sesuai widget (lihat card di /widgets)</li>
                  <li>Background otomatis transparan</li>
                </ol>
              </div>
              <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
                <div className="text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><Settings2 className="w-3.5 h-3.5 text-blue-400" /> Kustom URL Params</div>
                <div className="mt-2 space-y-1.5 font-mono text-[10px] leading-relaxed">
                  <div><span className="text-gray-500">?key=</span><span className="text-violet-400">PRIVATE_KEY</span> <span className="text-gray-600">- isolasi room</span></div>
                  <div><span className="text-gray-500">?widget=</span><span className="text-white">chat | gift | counter | goal | ticker | pinned | like | clock | social</span></div>
                  <div><span className="text-gray-500">?cur=320&target=500&label=</span><span className="text-white">GOAL</span> <span className="text-gray-600">- untuk goal bar</span></div>
                  <div><span className="text-gray-500">?handle=</span><span className="text-white">username</span> <span className="text-gray-600">- untuk social bar</span></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-violet-900/20 via-[#161616] to-indigo-900/10 border border-white/10 rounded-2xl p-4 flex flex-col">
                <div className="text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-yellow-400" /> Status</div>
                <div className="mt-3 space-y-2 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase text-[9px]">Socket</span><span className={`font-black uppercase text-[10px] ${connected ? "text-green-400" : "text-red-400"}`}>{connected ? "Connected" : "Disconnected"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase text-[9px]">TikTok</span><span className={`font-black uppercase text-[10px] ${tiktokConnected ? "text-[#FE2C55]" : "text-gray-500"}`}>{tiktokConnected ? "Live" : "Idle"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase text-[9px]">Chats</span><span className="text-white font-mono font-bold">{chats.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase text-[9px]">Widget</span><span className="text-white font-bold">{widget}</span></div>
                </div>
                <div className="mt-auto pt-3 flex gap-2">
                  <Link href={`/widgets?key=${privateKey || ""}`} className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-gray-100">
                    <ExternalLink className="w-3 h-3" /> Daftar Widget
                  </Link>
                  <button onClick={() => { setChats([]); setPinned(null); setGifts(null); }} className="px-3 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Clear</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <style>{`
          @keyframes slideIn { from { opacity: 0; transform: translateY(10px) translateX(-6px) scale(0.98); } to { opacity: 1; transform: translateY(0) translateX(0) scale(1); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes slideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideLeft { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes slideRight { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes swivel { from { opacity: 0; transform: perspective(600px) rotateY(28deg); } to { opacity: 1; transform: perspective(600px) rotateY(0); } }
          @keyframes bounceIn { 0% { opacity: 0; transform: scale(0.72) translateY(10px); } 50% { transform: scale(1.06); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
          @keyframes flipIn { from { opacity: 0; transform: perspective(600px) rotateX(-28deg); } to { opacity: 1; transform: perspective(600px) rotateX(0); } }
          @keyframes zoomIn { from { opacity: 0; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
          @keyframes popIn { 0% { opacity: 0; transform: scale(0.8) translateY(12px); } 60% { transform: scale(1.04) translateY(-2px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
          @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          @keyframes slideInHRight { from { transform: translateX(110%); } to { transform: translateX(0); } }
          @keyframes slideInHLeft { from { transform: translateX(-110%); } to { transform: translateX(0); } }
          @keyframes shiftTrack { from { transform: translateX(24px); } to { transform: translateX(0); } }
          @keyframes pinnedOut { from { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } to { opacity: 0; transform: translateY(-10px) scale(0.96); filter: blur(6px); } }
        `}</style>
      </div>
    </>
  );
}

export default function WidgetsDisplayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500 text-sm"><Activity className="w-4 h-4 animate-spin" /> Memuat widget…</div>
      </div>
    }>
      <WidgetDisplayContent />
    </Suspense>
  );
}
