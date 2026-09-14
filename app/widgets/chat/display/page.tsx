'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { ANIM_MAP, ANIM_OUT_MAP, KEYFRAMES_CSS, isElegantAnim } from '../../_shared/constants/animations';
import { getPositionStyle } from '../../_shared/constants/positions';
import StandardTheme from '../themes/Standard';
import BubbleTheme from '../themes/Bubble';
import CleanTheme from '../themes/Clean';
import BoxedTheme from '../themes/Boxed';
import CuteTheme from '../themes/Cute';
import PerCharTheme from '../themes/PerChar';
import { DEMO_CHATS } from '../config';
import type { ChatItem } from '../themes/types';

function ChatInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const accent = getStringParam(params, 'accent', '#8b5cf6');
  const bg = getStringParam(params, 'bg', 'transparent');
  const maxMessages = Math.max(1, Math.min(30, getIntParam(params, 'maxMessages', 6)));
  const hideAfter = getIntParam(params, 'hideAfter', 0);
  const showAvatar = getBoolParam(params, 'showAvatar', true);
  const showPlatform = getBoolParam(params, 'showPlatform', true);
  const showTimestamp = getBoolParam(params, 'showTimestamp', false);
  const anim = getStringParam(params, 'anim', 'elegant');
  const hideAnim = getStringParam(params, 'hideAnim', 'fade');
  const horizontalAnim = getStringParam(params, 'horizontalAnim', 'elegant');
  const fontSize = getIntParam(params, 'fontSize', 14);
  const bgOpacity = Math.max(10, Math.min(100, getIntParam(params, 'bgOpacity', 100)));
  const horizontal = getBoolParam(params, 'horizontal', false);
  const inline = getBoolParam(params, 'inline', false);
  const pos = getStringParam(params, 'pos', horizontal ? 'b' : 'bl');
  const posStyle = getPositionStyle(pos);
  const cuteBubbleBg = getStringParam(params, 'cuteBubbleBg', '#1e1d2b');
  const cuteResubFrom = getStringParam(params, 'cuteResubFrom', '#c4a2f8');
  const cuteResubTo = getStringParam(params, 'cuteResubTo', '#fca4d4');
  const cuteBadgeBg = getStringParam(params, 'cuteBadgeBg', '#2e2c45');
  const cuteBadgeText = getStringParam(params, 'cuteBadgeText', '#a8a3ce');
  const cuteNameMod = getStringParam(params, 'cuteNameMod', '#f5a8d0');
  const cuteNameUser = getStringParam(params, 'cuteNameUser', '#d8cded');
  const charDelayMs = Math.max(0, Math.min(500, getIntParam(params, 'charDelayMs', 25)));
  const charDurationS = Math.max(0.05, Math.min(3, parseFloat(params.get('charDurationS') || '') || 0.35));

  const [chats, setChats] = useState<ChatItem[]>(() => (simulate ? [...DEMO_CHATS] : []));
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(simulate);
  const hideAnimName = ANIM_OUT_MAP[hideAnim] || 'fadeOut';
  const hideDur = isElegantAnim(hideAnimName) ? 620 : 400;

  useEffect(() => loadGoogleFont(font, '400;700;900', 'chat-font'), [font]);

  useEffect(() => {
    if (simulate) return; // mode simulate — demo data lokal, tidak perlu socket
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    socket.on('connect', () => { setConnected(true); socket.emit('join-room', room); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('tiktok-chat', (data: Record<string, unknown>) => {
      const comment = String((data as { comment?: string; message?: string }).comment || (data as { message?: string }).message || '');
      if (!comment) return;
      const d = data as { nickname?: string; uniqueId?: string; profilePictureUrl?: string; platform?: string; fromStreamerBot?: boolean };
      const item: ChatItem = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        nickname: d.nickname || d.uniqueId || 'User',
        comment,
        profilePictureUrl: d.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.nickname || 'U')}&background=222&color=fff`,
        platform: d.platform || (d.fromStreamerBot ? 'twitch' : 'tiktok'),
        timestamp: Date.now(),
      };
      setChats((prev) => [...prev, item].slice(-maxMessages));
      if (hideAfter > 0) {
        setTimeout(() => {
          setExitingIds((prev) => new Set(prev).add(item.id));
          setTimeout(() => {
            setChats((prev) => prev.filter((c) => c.id !== item.id));
            setExitingIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
          }, hideDur);
        }, hideAfter * 1000);
      }
    });
    return () => { socket.disconnect(); };
  }, [privateKey, maxMessages, hideAfter, hideDur, simulate]);

  const themeProps = {
    chats,
    font,
    accent,
    bg,
    maxMessages,
    showAvatar,
    showPlatform,
    showTimestamp,
    anim: ANIM_MAP[anim] || 'elegantIn',
    horizontalAnim: ANIM_MAP[horizontalAnim] || 'elegantIn',
    hideAnim: ANIM_OUT_MAP[hideAnim] || 'fadeOut',
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
    charDelayMs,
    charDurationS,
    exitingIds,
  };

  const renderTheme = () => {
    switch (theme) {
      case 'bubble': return <BubbleTheme {...themeProps} />;
      case 'clean': return <CleanTheme {...themeProps} />;
      case 'boxed': return <BoxedTheme {...themeProps} />;
      case 'cute': return <CuteTheme {...themeProps} />;
      case 'perchar': return <PerCharTheme {...themeProps} />;
      default: return <StandardTheme {...themeProps} />;
    }
  };

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,'+')}:wght@400;700;900&display=swap'); ${KEYFRAMES_CSS} html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; }`}</style>
      <div
        id="chat-display-root"
        className={`${obsMode ? `fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-2` : `w-full min-h-screen bg-[#0a0a0a] flex p-4`}`}
        style={{ ...posStyle, background: obsMode ? 'transparent' : '#0a0a0a', fontFamily: `'${font}', sans-serif` } as any}
      >
        {!obsMode && !connected && chats.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">Menghubungkan… privateKey={privateKey ? `${privateKey.slice(0, 6)}…` : 'global'} • server http://localhost:3000</div>
        )}
        {!obsMode && <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">CHAT • {theme} • {connected ? 'connected' : 'offline'} • {chats.length}/{maxMessages}</div>}
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
