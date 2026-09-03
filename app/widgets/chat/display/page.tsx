'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import StandardTheme from '../themes/Standard';
import BubbleTheme from '../themes/Bubble';
import CleanTheme from '../themes/Clean';
import BoxedTheme from '../themes/Boxed';
import CuteTheme from '../themes/Cute';
import type { ChatItem } from '../themes/types';

function getSocketUrl() {
  if (typeof window === 'undefined') return 'http://localhost:3000';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
  return window.location.origin;
}

function getParam(params: URLSearchParams, key: string, fallback: string) {
  const v = params.get(key);
  return v === null || v === '' ? fallback : v;
}
function getIntParam(params: URLSearchParams, key: string, fallback: number) {
  const v = params.get(key);
  if (v === null || v === '') return fallback;
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}
function getBoolParam(params: URLSearchParams, key: string, fallback: boolean) {
  const v = params.get(key);
  if (v === null) return fallback;
  return v === 'true' || v === '1';
}

function ChatInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = params.get('key') || params.get('privateKey') || '';
  const obsMode = params.get('obs') === '1' || params.get('transparent') === '1';

  // widget params (mirrored from settings page buildUrl)
  const theme = getParam(params, 'theme', 'standard');
  const font = getParam(params, 'font', 'Outfit');
  const accent = getParam(params, 'accent', '#8b5cf6');
  const bg = getParam(params, 'bg', 'transparent');
  const maxMessages = Math.max(1, Math.min(30, getIntParam(params, 'maxMessages', 6)));
  const hideAfter = getIntParam(params, 'hideAfter', 0);
  const showAvatar = getBoolParam(params, 'showAvatar', true);
  const showPlatform = getBoolParam(params, 'showPlatform', true);
  const showTimestamp = getBoolParam(params, 'showTimestamp', false);
  const anim = getParam(params, 'anim', 'slideUp');
  const horizontalAnim = getParam(params, 'horizontalAnim', 'slideLeft');
  const fontSize = getIntParam(params, 'fontSize', 14);
  const bgOpacity = Math.max(10, Math.min(100, getIntParam(params, 'bgOpacity', 100)));
  const horizontal = getBoolParam(params, 'horizontal', false);
  const inline = getBoolParam(params, 'inline', false);
  const cuteBubbleBg = getParam(params, 'cuteBubbleBg', '#1e1d2b');
  const cuteResubFrom = getParam(params, 'cuteResubFrom', '#c4a2f8');
  const cuteResubTo = getParam(params, 'cuteResubTo', '#fca4d4');
  const cuteBadgeBg = getParam(params, 'cuteBadgeBg', '#2e2c45');
  const cuteBadgeText = getParam(params, 'cuteBadgeText', '#a8a3ce');
  const cuteNameMod = getParam(params, 'cuteNameMod', '#f5a8d0');
  const cuteNameUser = getParam(params, 'cuteNameUser', '#d8cded');

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [connected, setConnected] = useState(false);

  // font loader
  useEffect(() => {
    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,'+')}:wght@400;700;900&display=swap`;
    const sel = `link[data-chat-font="${font}"]`;
    let link = document.querySelector(sel) as HTMLLinkElement | null;
    if (!link) { link = document.createElement('link'); link.rel = 'stylesheet'; (link as any).dataset.chatFont = font; link.href = href; document.head.appendChild(link); }
    else if (link.href !== href) link.href = href;
  }, [font]);

  useEffect(() => {
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    socket.on('connect', () => { setConnected(true); socket.emit('join-room', room); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('tiktok-chat', (data: any) => {
      const comment = (data.comment || data.message || '').toString();
      if (!comment) return;
      const item: ChatItem = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        nickname: data.nickname || data.uniqueId || 'User',
        comment,
        profilePictureUrl: data.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nickname || 'U')}&background=222&color=fff`,
        platform: data.platform || (data.fromStreamerBot ? 'twitch' : 'tiktok'),
        timestamp: Date.now(),
      };
      setChats((prev) => {
        const next = [...prev, item].slice(-maxMessages);
        return next;
      });
      if (hideAfter > 0) {
        setTimeout(() => {
          setChats((prev) => prev.filter((c) => c.id !== item.id));
        }, hideAfter * 1000);
      }
    });
    return () => { socket.disconnect(); };
  }, [privateKey, maxMessages, hideAfter]);

  const animMap: Record<string, string> = {
    elegant: 'elegantIn',
    softPop: 'softPopIn',
    blur: 'blurIn',
    luxe: 'luxeIn',
    slideUp: 'slideUp',
    slideLeft: 'slideLeft',
    slideRight: 'slideRight',
    pop: 'popIn',
    fade: 'fadeIn',
    flip: 'flipIn',
  };
  const animName = animMap[anim] || 'elegantIn';

  const hAnimMap2: Record<string, string> = { elegant: 'elegantIn', softPop: 'softPopIn', blur: 'blurIn', luxe: 'luxeIn', slideLeft: 'slideLeft', slideRight: 'slideRight', slideUp: 'slideUp', pop: 'popIn', fade: 'fadeIn', flip: 'flipIn' };
  const horizontalAnimName = hAnimMap2[horizontalAnim] || 'elegantIn';
  const themeProps = {
    chats,
    font,
    accent,
    bg,
    maxMessages,
    showAvatar,
    showPlatform,
    showTimestamp,
    anim: animName,
    horizontalAnim: horizontalAnimName,
    hideAfter,
    fontSize,
    bgOpacity,
    horizontal,
    inline,
    cuteBubbleBg,
    cuteResubFrom,
    cuteResubTo,
    cuteBadgeBg,
    cuteBadgeText,
    cuteNameMod,
    cuteNameUser,
  };

  const renderTheme = () => {
    switch (theme) {
      case 'bubble': return <BubbleTheme {...themeProps} />;
      case 'clean': return <CleanTheme {...themeProps} />;
      case 'boxed': return <BoxedTheme {...themeProps} />;
      case 'cute': return <CuteTheme {...themeProps} />;
      case 'standard':
      default: return <StandardTheme {...themeProps} />;
    }
  };

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,'+')}:wght@400;700;900&display=swap');
        @keyframes elegantIn { from { opacity:0; transform: translateY(14px) scale(0.97); filter: blur(8px); } to { opacity:1; transform: translateY(0) scale(1); filter: blur(0); } }
        @keyframes softPopIn { from { opacity:0; transform: scale(0.94) translateY(8px); filter: blur(6px); } to { opacity:1; transform: scale(1) translateY(0); filter: blur(0); } }
        @keyframes blurIn { from { opacity:0; filter: blur(12px); } to { opacity:1; filter: blur(0); } }
        @keyframes luxeIn { from { opacity:0; transform: translateY(18px) scale(0.96); filter: blur(10px); letter-spacing: 0.04em; } to { opacity:1; transform: translateY(0) scale(1); filter: blur(0); letter-spacing: 0; } }
        @keyframes slideUp { from { opacity:0; transform: translateY(16px) scale(0.96); filter: blur(6px); } to { opacity:1; transform: translateY(0) scale(1); filter: blur(0); } }
        @keyframes slideLeft { from { opacity:0; transform: translateX(18px); filter: blur(4px); } to { opacity:1; transform: translateX(0); filter: blur(0); } }
        @keyframes slideRight { from { opacity:0; transform: translateX(-18px); filter: blur(4px); } to { opacity:1; transform: translateX(0); filter: blur(0); } }
        @keyframes popIn { 0%{ opacity:0; transform: scale(0.85) translateY(8px); filter: blur(6px);} 60%{ transform: scale(1.03); filter: blur(0);} 100%{ opacity:1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from{ opacity:0; filter: blur(6px); } to{ opacity:1; filter: blur(0); } }
        @keyframes flipIn { from { opacity:0; transform: perspective(600px) rotateX(-20deg); filter: blur(6px); } to { opacity:1; transform: perspective(600px) rotateX(0); filter: blur(0); } }
        html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; }
      `}</style>
      <div
        id="chat-display-root"
        className={`${obsMode ? `fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex ${horizontal ? 'items-end justify-center p-2' : 'items-end justify-start p-4'}` : `w-full min-h-screen bg-[#0a0a0a] flex ${horizontal ? 'items-end justify-center p-4' : 'items-end justify-start p-6'}`}`}
        style={{ background: obsMode ? 'transparent' : '#0a0a0a', fontFamily: `'${font}', sans-serif` }}
      >
        {!obsMode && connected === false && chats.length === 0 ? (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">Menghubungkan… privateKey={privateKey ? privateKey.slice(0,6)+'…' : 'global'} • server http://localhost:3000</div>
        ) : null}
        {!obsMode && (
          <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">
            CHAT • {theme} • {connected ? 'connected' : 'offline'} • {chats.length}/{maxMessages}
          </div>
        )}
        {renderTheme()}
      </div>
    </>
  );
}

export default function ChatDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading chat…</div>}>
      <ChatInner />
    </Suspense>
  );
}
