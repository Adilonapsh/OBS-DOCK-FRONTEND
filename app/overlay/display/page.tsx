'use client';
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import {
  MessageSquare, Gift, Heart, UserPlus, Pin, Eye, Copy, Check, ExternalLink,
  Settings2, Monitor, Sparkles, Zap, Users, Activity, Volume2, AlertCircle
} from "lucide-react";
import { queryToTheme, decodeCss } from "../components/theme";

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

import { getSocketUrl } from "../../widgets/_shared/utils/socket";

function OverlayContent() {
  const searchParams = useSearchParams();
  const privateKey = searchParams.get("key") || searchParams.get("privateKey") || "";
  const obsMode = searchParams.get("obs") === "1" || searchParams.get("transparent") === "1";
  const layoutParam = searchParams.get("layout") || "full"; // full | chat | alerts | minimal
  const scaleParam = parseFloat(searchParams.get("scale") || "1");
  const theme = queryToTheme(searchParams as any);
  const hMode = (searchParams.get("hMode") as "smooth" | "steps" | "pop" | "slide") || (searchParams.get("snappy") === "1" ? "pop" : "smooth");
  const tickerSpeed = parseInt(searchParams.get("speed") || searchParams.get("tickerSpeed") || "30", 10);
  const hDir = (searchParams.get("hDir") as "left" | "right") || (searchParams.get("dir") as "left" | "right") || "right";
  const isTickerMode = hMode === "smooth" || hMode === "steps";
  const isPopMode = hMode === "pop";
  const isSlideMode = hMode === "slide";
  const customCssRaw = searchParams.get("css") || searchParams.get("customCss") || "";
  const customCss = customCssRaw ? (() => { try { return decodeCss(customCssRaw); } catch { try { return decodeURIComponent(customCssRaw); } catch { return customCssRaw; } } })() : "";

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [pinned, setPinned] = useState<ChatItem | null>(null);
  const [gifts, setGifts] = useState<GiftItem | null>(null);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [likes, setLikes] = useState<LikeItem | null>(null);
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showControls, setShowControls] = useState(!obsMode);

  // filters from URL
  const showChat = searchParams.get("chat") !== "0";
  const showGift = searchParams.get("gift") !== "0";
  const showLike = searchParams.get("like") !== "0";
  const showMember = searchParams.get("member") !== "0";
  const showPin = searchParams.get("pin") !== "0";
  const hideAfter = parseInt(searchParams.get("hideAfter") || "0", 10); // 0 = stay

  const socketRef = useRef<Socket | null>(null);
  const viewerRef = useRef<number | null>(null);

  // demo mock when no connection
  useEffect(() => {
    if (chats.length > 0) return;
    const demo: ChatItem[] = [
      { id: "d1", nickname: "Rizky_JR", comment: "Lagi main apa nih? 🔥", profilePictureUrl: "https://ui-avatars.com/api/?name=Rizky&background=3b82f6&color=fff", platform: "tiktok", timestamp: Date.now() - 5000 },
      { id: "d2", nickname: "SitiPlay", comment: "Gass keun bang!", profilePictureUrl: "https://ui-avatars.com/api/?name=Siti&background=FE2C55&color=fff", platform: "tiktok", timestamp: Date.now() - 3000 },
    ];
    // only show demo if not connected after 2s
    const t = setTimeout(() => {
      if (!connected) setChats(demo);
    }, 1500);
    return () => clearTimeout(t);
  }, [connected, chats.length]);

  useEffect(() => {
    const socket = io(getSocketUrl(), { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      const room = privateKey || "global";
      // join room isolasi - server expects connect-tiktok with privateKey, but for overlay we join room manually
      socket.emit("join-room", room);
      if (privateKey) {
        // also try to ensure we receive tiktok events for this key
        // no explicit join for tiktok room aside from connect-tiktok, but pinned events use privateKey
      }
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("tiktok-connected", () => setTiktokConnected(true));
    socket.on("tiktok-disconnected", () => setTiktokConnected(false));
    socket.on("tiktok-error", () => setTiktokConnected(false));

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
      setChats(prev => {
        const next = [...prev, item];
        return next.slice(-6);
      });
      if (hideAfter > 0) {
        setTimeout(() => setChats(prev => prev.filter(c => c.id !== item.id)), hideAfter * 1000);
      }
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
    });

    socket.on("tiktok-like", (data: any) => {
      if (!showLike) return;
      setLikes({
        id: `like_${Date.now()}`,
        nickname: data.nickname || "Someone",
        likeCount: data.likeCount || 1,
        timestamp: Date.now(),
      });
      setTimeout(() => setLikes(null), 2500);
    });

    socket.on("tiktok-member", (data: any) => {
      if (!showMember) return;
      const m: MemberItem = {
        id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
        nickname: data.nickname || "New Viewer",
        profilePictureUrl: data.profilePictureUrl,
        timestamp: Date.now(),
      };
      setMembers(prev => [...prev, m].slice(-3));
      setTimeout(() => setMembers(prev => prev.filter(x => x.id !== m.id)), 4000);
    });

    socket.on("tiktok-roomUser", (data: any) => {
      const vc = data.viewerCount ?? data.viewer_count ?? data.totalUser ?? null;
      if (typeof vc === "number") {
        setViewerCount(vc);
        viewerRef.current = vc;
      }
    });

    socket.on("tiktok-social", () => { });

    return () => {
      socket.disconnect();
    };
  }, [privateKey, showChat, showGift, showLike, showMember, showPin, hideAfter]);

  const overlayUrl = typeof window !== "undefined" ? (() => {
    const p = new URLSearchParams(searchParams.toString());
    if (!p.get("key") && privateKey) p.set("key", privateKey);
    if (!p.get("key")) p.set("key", "YOUR_PRIVATE_KEY");
    p.set("obs", "1");
    return `${window.location.origin}/overlay/display?${p.toString()}`;
  })() : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleTestChat = () => {
    const item: ChatItem = {
      id: `test_${Date.now()}`,
      nickname: "TestUser",
      comment: "Halo overlay! Ini tes chat 👋",
      profilePictureUrl: "https://ui-avatars.com/api/?name=Test&background=8b5cf6&color=fff",
      platform: "tiktok",
      timestamp: Date.now(),
    };
    setChats(prev => [...prev, item].slice(-6));
  };

  const handleTestGift = () => {
    setGifts({
      id: `gift_test_${Date.now()}`,
      nickname: "DonaturKece",
      giftName: "Rose",
      repeatCount: 10,
      diamondCount: 10,
      profilePictureUrl: "https://ui-avatars.com/api/?name=Donatur&background=ec4899&color=fff",
      timestamp: Date.now(),
    });
    setTimeout(() => setGifts(null), 4200);
  };

  const handleTestPin = () => {
    setPinned({
      id: `pin_test_${Date.now()}`,
      nickname: "Moderator",
      comment: "📌 Jangan lupa follow & share live ini ya guys!",
      profilePictureUrl: "https://ui-avatars.com/api/?name=Mod&background=06b6d4&color=fff",
      platform: "tiktok",
      timestamp: Date.now(),
    });
    setTimeout(() => setPinned(null), 6000);
  };

  const isHorizontal = layoutParam === "horizontal";

  // posisi chat stack
  const chatPositionClass = (() => {
    const pos = searchParams.get("pos") || "bl"; // bl br tl tr bottom
    if (isHorizontal) return "bottom-0 left-0 right-0 items-start justify-center";
    switch (pos) {
      case "br": return "bottom-6 right-6 items-end";
      case "tl": return "top-20 left-6 items-start";
      case "tr": return "top-20 right-6 items-end";
      case "center": return "bottom-32 left-1/2 -translate-x-1/2 items-center";
      default: return "bottom-6 left-6 items-start";
    }
  })();

  const isTransparent = obsMode;

  return (
    <>
      {/* CSS variables untuk custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: `:root{--accent:${theme.accent};--accent2:${theme.accent2};--chat-bg:${theme.chatBg};--chat-text:${theme.chatText}}` }} />
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      <div className={`min-h-screen w-full ${isTransparent ? "bg-transparent" : "bg-[#0a0a0a]"} flex flex-col`}>
      {/* Top controls - hidden in OBS mode */}
      {showControls && (
        <div className="shrink-0 bg-[#121212] border-b border-white/10 px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Monitor className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Overlay
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-red-500"}`} />
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${connected ? "bg-green-500/20 text-green-400 border border-green-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"}`}>
                  {connected ? "Socket Connected" : "Disconnected"}
                </span>
              </div>
              <div className="text-gray-500 text-[10px] font-medium">
                Browser Source • 1920×1080 • Transparent • key isolasi {privateKey ? `${privateKey.slice(0, 8)}…` : "GLOBAL"}
                {viewerCount !== null && <span className="ml-2 inline-flex items-center gap-1 text-cyan-400"><Eye className="w-3 h-3" /> {viewerCount} viewers</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2 py-1.5">
              <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest px-1">URL OBS</span>
              <code className="text-[10px] font-mono text-cyan-300 max-w-[260px] truncate">{overlayUrl}</code>
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

      {/* Show toggle when hidden */}
      {!showControls && !isTransparent && (
        <button onClick={() => setShowControls(true)} className="fixed top-3 right-3 z-50 p-2 bg-black/60 backdrop-blur border border-white/10 rounded-xl text-white hover:bg-white/10">
          <Settings2 className="w-4 h-4" />
        </button>
      )}

      {/* OBS Preview Frame */}
      <div className={`flex-1 relative overflow-hidden ${isTransparent ? "bg-transparent" : "bg-[#0a0a0a]"} ${!isTransparent ? "p-4 md:p-6" : ""}`}>
        {/* 16:9 canvas */}
        <div
          className={`relative w-full max-w-[1280px] mx-auto aspect-video rounded-2xl overflow-hidden ${isTransparent ? "bg-transparent border-0 shadow-none" : "bg-black border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"}`}
          style={{ transform: `scale(${scaleParam})`, transformOrigin: "top center" }}
        >
          {/* subtle grid for preview only */}
          {!isTransparent && (
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          )}

          {/* Top bar - viewer + status */}
          <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              {!isTransparent && viewerCount !== null && (
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
              {pinned && showPin && (
                <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-cyan-500/20 backdrop-blur border border-cyan-500/30 rounded-full">
                  <Pin className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-300 font-black text-[9px] uppercase tracking-widest">Pinned</span>
                </div>
              )}
              {!isTransparent && (
                <div className="px-2 py-1 bg-white/5 backdrop-blur border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-400">
                  1920×1080 • 60fps • Browser Source
                </div>
              )}
            </div>
          </div>

          {/* Center - Pinned Chat + Gift Alert */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
            {/* Pinned Chat - big centered */}
            {pinned && showPin && (
              <div className="overlay-pinned animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)] w-full max-w-[640px]" style={{ fontSize: `${theme.fontScale}em` }}>
                <div className="relative backdrop-blur-2xl rounded-[20px] p-[1px] overflow-hidden" style={{ background: theme.pinnedBorder, boxShadow: theme.shadow ? `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${theme.accent2}25` : "none" }}>
                  <div className="absolute inset-0 opacity-20 rounded-[20px]" style={{ background: `linear-gradient(135deg, ${theme.accent2}20, transparent, ${theme.accent}10)` }} />
                  <div className="relative rounded-[19px] p-4 md:p-5" style={{ background: theme.pinnedBg }}>
                    <div className="flex items-start gap-3">
                      {theme.showAvatar && <img src={pinned.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(pinned.nickname)}`} alt={pinned.nickname} className="overlay-pinned-avatar w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover border-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0" style={{ borderColor: theme.accent2 }} />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-[13px] md:text-[15px] tracking-tight" style={{ color: theme.pinnedText }}>{pinned.nickname}</span>
                          <span className="px-1.5 py-0.5 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1" style={{ background: theme.accent2 }}><Pin className="w-2.5 h-2.5" /> PINNED</span>
                          {theme.showPlatform && <span className="text-[10px] font-bold" style={{ color: theme.pinnedText, opacity: 0.5 }}>{pinned.platform?.toUpperCase()}</span>}
                        </div>
                        <p className="text-[14px] md:text-[16px] font-semibold leading-snug mt-1 break-words" style={{ color: theme.pinnedText }}>{pinned.comment}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gift Alert - epic center */}
            {gifts && showGift && (
              <div key={gifts.id} className="overlay-gift animate-[popIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)] mt-4" style={{ fontSize: `${theme.fontScale}em` }}>
                <div className="relative">
                  <div className="absolute -inset-3 blur-2xl rounded-full opacity-30" style={{ background: `linear-gradient(to right, ${theme.accent}, ${theme.accent2})` }} />
                  <div className="relative rounded-[24px] px-6 py-4 md:px-8 md:py-5 flex items-center gap-4" style={{ background: theme.giftBg, border: `1px solid ${theme.giftBorder}`, boxShadow: theme.shadow ? `0 20px 60px ${theme.accent}40` : "none" }}>
                    <div className="relative">
                      {theme.showAvatar && <img src={gifts.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(gifts.nickname)}`} alt={gifts.nickname} className="overlay-gift-avatar w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border-2" style={{ borderColor: theme.accent, boxShadow: `0 0 20px ${theme.accent}50` }} />}
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
                    <div className="hidden md:flex w-12 h-12 rounded-2xl items-center justify-center text-2xl" style={{ background: `${theme.accent}20`, border: `1px solid ${theme.accent}30` }}>
                      🎁
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Like burst */}
            {likes && showLike && (
              <div key={likes.id} className="animate-[slideUp_0.4s_ease] mt-3 flex items-center gap-2 px-4 py-2 bg-pink-500/20 backdrop-blur-xl border border-pink-500/30 rounded-full shadow-lg">
                <Heart className="w-4 h-4 text-pink-400 fill-pink-400 animate-pulse" />
                <span className="text-white font-black text-[12px]">{likes.nickname}</span>
                <span className="text-pink-200 font-bold text-[11px]">+{likes.likeCount} likes</span>
                <span className="text-pink-300">💗</span>
              </div>
            )}

            {/* Members join stack */}
            {members.length > 0 && showMember && (
              <div className="mt-3 flex flex-col items-center gap-2">
                {members.slice(-2).map(m => (
                  <div key={m.id} className="animate-[slideIn_0.4s_ease] flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full">
                    <img src={m.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nickname)}`} alt={m.nickname} className="w-6 h-6 rounded-full object-cover border border-white/20" />
                    <span className="text-white font-bold text-[11px]">{m.nickname}</span>
                    <span className="text-gray-300 text-[10px] flex items-center gap-1"><UserPlus className="w-3 h-3 text-green-400" /> joined</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Stack */}
          {showChat && layoutParam !== "alerts" && (
            <>
              {/* Vertical stack */}
              {!isHorizontal && (
                <div className={`absolute ${chatPositionClass} flex flex-col gap-2 max-w-[380px] w-[92%] sm:w-[380px] pointer-events-none`}>
                  {chats.length === 0 ? null : (
                    chats.map((chat) => (
                      <div
                        key={chat.id}
                        className="overlay-chat-bubble animate-[slideIn_0.45s_cubic-bezier(0.16,1,0.3,1)] group flex gap-2.5 px-3 py-2.5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
                        style={{
                          background: theme.chatBg,
                          border: `1px solid ${theme.chatBorder}`,
                          borderRadius: `${theme.chatRadius}px`,
                          opacity: theme.chatOpacity / 100,
                          backdropFilter: theme.chatBlur ? `blur(${theme.chatBlur}px)` : undefined,
                          boxShadow: theme.shadow ? undefined : "none",
                          fontSize: `${theme.fontScale}em`,
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="overlay-chat-nickname font-black text-[12px] leading-none tracking-tight" style={{ color: theme.chatText }}>{chat.nickname}</span>
                            {theme.showPlatform && (
                              <span className="px-1 py-0.5 bg-white/10 border border-white/10 rounded text-[7px] font-black uppercase tracking-widest" style={{ color: theme.chatText, opacity: 0.7 }}>
                                {chat.platform}
                              </span>
                            )}
                            {theme.showTimestamp && (
                              <span className="text-[9px] font-mono" style={{ color: theme.chatText, opacity: 0.5 }}>{new Date(chat.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            )}
                          </div>
                          <p className="overlay-chat-text text-[13px] leading-[1.35] font-medium mt-0.5 break-words line-clamp-3" style={{ color: theme.chatText }}>{chat.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Horizontal Ticker / Snappy Pop / Slide Geser */}
              {isHorizontal && (
                <>
                  {isTickerMode ? (
                    <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                      <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent py-3 px-4 overflow-hidden">
                        <div
                          className="flex items-center gap-4 whitespace-nowrap will-change-transform"
                          style={{
                            fontSize: `${theme.fontScale}em`,
                            animation: `ticker ${tickerSpeed}s ${hMode === "steps" ? "steps(30)" : "linear"} infinite`,
                          }}
                        >
                          {chats.length === 0 ? null : (
                            chats.map((chat, i) => (
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
                                    <span className="text-white font-black text-[11px]">{(chat.nickname || "U")[0].toUpperCase()}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                  <span className="overlay-chat-nickname font-black text-[12px] leading-none" style={{ color: theme.chatText }}>{chat.nickname}</span>
                                  <span className="text-gray-400 text-[11px]">:</span>
                                  <span className="overlay-chat-text text-[13px] leading-none" style={{ color: theme.chatText }}>{chat.comment}</span>
                                </div>
                              </div>
                            ))
                          )}
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
                          {chats.length === 0 ? null : (
                            chats.slice(-6).map((chat) => (
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
                                  animation: isPopMode
                                    ? `popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both`
                                    : hDir === "right"
                                      ? `slideInHRight 0.55s cubic-bezier(0.22,1,0.36,1) both`
                                      : `slideInHLeft 0.55s cubic-bezier(0.22,1,0.36,1) both`,
                                }}
                              >
                                {theme.showAvatar && (
                                  <div
                                    className="overlay-chat-avatar w-7 h-7 rounded-lg shrink-0 border border-white/10 flex items-center justify-center overflow-hidden"
                                    style={{ background: theme.accent }}
                                  >
                                    <span className="text-white font-black text-[11px]">{(chat.nickname || "U")[0].toUpperCase()}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                  <span className="overlay-chat-nickname font-black text-[12px] leading-none" style={{ color: theme.chatText }}>{chat.nickname}</span>
                                  <span className="text-gray-400 text-[11px]">:</span>
                                  <span className="overlay-chat-text text-[13px] leading-none" style={{ color: theme.chatText }}>{chat.comment}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {layoutParam === "minimal" && !showChat && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur border border-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Minimal Overlay • Alerts only
            </div>
          )}

          {/* watermark - preview only */}
          {!isTransparent && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur border border-white/5 rounded-full pointer-events-none">
              <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center">
                <Monitor className="w-3 h-3 text-black" />
              </div>
              <span className="text-white font-black text-[8px] tracking-widest uppercase">OBS OVERLAYS</span>
              <span className="text-gray-500 text-[8px] font-bold">OVERLAY</span>
            </div>
          )}
        </div>

        {/* Helper bar below canvas - only in preview */}
        {!isTransparent && (
          <div className="max-w-[1280px] mx-auto mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
              <div className="text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Cara Pakai di OBS</div>
              <ol className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-gray-400 list-decimal list-inside">
                <li>Copy <span className="text-white font-bold">URL OBS</span> di atas (yang ada <code className="bg-white/10 px-1 rounded text-cyan-300">?obs=1</code>)</li>
                <li>OBS → Add Source → <span className="text-white font-bold">Browser Source</span> → Paste URL</li>
                <li>Set <span className="text-white font-bold">Width 1920</span> Height <span className="text-white font-bold">1080</span>, FPS 60, Shutdown source when not visible ✓</li>
                <li>Background otomatis transparan - tinggal atur posisi & scale</li>
              </ol>
            </div>

            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
              <div className="text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><Settings2 className="w-3.5 h-3.5 text-blue-400" /> Kustom URL Params</div>
              <div className="mt-2 space-y-1.5 font-mono text-[10px] leading-relaxed">
                <div><span className="text-gray-500">?key=</span><span className="text-cyan-400">PRIVATE_KEY</span> <span className="text-gray-600">- isolasi room (wajib)</span></div>
                <div><span className="text-gray-500">?pos=</span><span className="text-white">bl | br | tl | tr | center</span> <span className="text-gray-600">- posisi chat</span></div>
                <div><span className="text-gray-500">?layout=</span><span className="text-white">full | chat | alerts | minimal</span></div>
                <div><span className="text-gray-500">?scale=</span><span className="text-white">0.8 - 1.4</span> <span className="text-gray-600">- zoom overlay</span></div>
                <div><span className="text-gray-500">?chat=0 & gift=0 & like=0</span> <span className="text-gray-600">- hide elemen</span></div>
                <div><span className="text-gray-500">?hideAfter=8</span> <span className="text-gray-600">- auto hapus chat (detik)</span></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 via-[#161616] to-cyan-900/10 border border-white/10 rounded-2xl p-4 flex flex-col">
              <div className="text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-yellow-400" /> Status</div>
              <div className="mt-3 space-y-2 text-[11px]">
                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase text-[9px]">Socket</span><span className={`font-black uppercase text-[10px] ${connected ? "text-green-400" : "text-red-400"}`}>{connected ? "Connected" : "Disconnected"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase text-[9px]">TikTok</span><span className={`font-black uppercase text-[10px] ${tiktokConnected ? "text-[#FE2C55]" : "text-gray-500"}`}>{tiktokConnected ? "Live" : "Idle"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase text-[9px]">Chats</span><span className="text-white font-mono font-bold">{chats.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase text-[9px]">Pinned</span><span className="text-white font-bold">{pinned ? "Active" : "-"}</span></div>
              </div>
              <div className="mt-auto pt-3 flex gap-2">
                <Link href={`/overlay?key=${privateKey || ""}`} className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-gray-100">
                  <ExternalLink className="w-3 h-3" /> Buka Transparent
                </Link>
                <button onClick={() => { setChats([]); setPinned(null); setGifts(null); }} className="px-3 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px) translateX(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) translateX(0) scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.8) translateY(12px); }
          60% { transform: scale(1.04) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes slideInHRight {
          from { transform: translateX(110%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInHLeft {
          from { transform: translateX(-110%); }
          to { transform: translateX(0); }
        }
        @keyframes shiftTrack {
          from { transform: translateX(18px); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
    </>
  );
}

export default function OverlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500 text-sm"><Activity className="w-4 h-4 animate-spin" /> Memuat overlay…</div>
      </div>
    }>
      <OverlayContent />
    </Suspense>
  );
}
