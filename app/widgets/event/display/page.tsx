'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { ANIM_MAP, ANIM_OUT_MAP, KEYFRAMES_CSS, isElegantAnim } from '../../_shared/constants/animations';
import { getPositionStyle } from '../../_shared/constants/positions';
import StandardTheme from '../themes/Standard';
import MinimalTheme from '../themes/Minimal';
import CuteTheme from '../themes/Cute';
import PerCharTheme from '../themes/PerChar';
import { DEMO_EVENTS } from '../config';
import type { EventItem } from '../themes/types';

function EventInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const accent = getStringParam(params, 'accent', '#8b5cf6');
  const bg = getStringParam(params, 'bg', 'transparent');
  const maxEvents = Math.max(1, Math.min(20, getIntParam(params, 'maxEvents', 6)));
  const hideAfter = getIntParam(params, 'hideAfter', 0);
  const showAvatar = getBoolParam(params, 'showAvatar', true);
  const showJoin = getBoolParam(params, 'showJoin', true);
  const showGift = getBoolParam(params, 'showGift', true);
  const showLike = getBoolParam(params, 'showLike', true);
  const anim = getStringParam(params, 'anim', 'elegant');
  const hideAnim = getStringParam(params, 'hideAnim', 'fade');
  const horizontalAnim = getStringParam(params, 'horizontalAnim', 'elegant');
  const fontSize = getIntParam(params, 'fontSize', 14);
  const bgOpacity = Math.max(10, Math.min(100, getIntParam(params, 'bgOpacity', 100)));
  const horizontal = getBoolParam(params, 'horizontal', false);
  const inline = getBoolParam(params, 'inline', false);
  const pos = getStringParam(params, 'pos', 'center');
  const posStyle = getPositionStyle(pos);
  const cuteBubbleBg = getStringParam(params, 'cuteBubbleBg', '#1e1d2b');
  const cuteResubFrom = getStringParam(params, 'cuteResubFrom', '#c4a2f8');
  const cuteResubTo = getStringParam(params, 'cuteResubTo', '#fca4d4');
  const cuteBadgeBg = getStringParam(params, 'cuteBadgeBg', '#2e2c45');
  const cuteBadgeText = getStringParam(params, 'cuteBadgeText', '#a8a3ce');
  const cuteNameMod = getStringParam(params, 'cuteNameMod', '#f5a8d0');
  const cuteNameUser = getStringParam(params, 'cuteNameUser', '#d8cded');
  const joinSoundEnabled = getBoolParam(params, 'joinSoundEnabled', true);
  const joinSoundUrl = getStringParam(params, 'joinSoundUrl', 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_9bd4170e1c.mp3');
  const joinSoundVolume = Math.max(0, Math.min(100, getIntParam(params, 'joinSoundVolume', 80)));
  const giftSoundEnabled = getBoolParam(params, 'giftSoundEnabled', true);
  const giftSoundUrl = getStringParam(params, 'giftSoundUrl', 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c8ad9c.mp3');
  const giftSoundVolume = Math.max(0, Math.min(100, getIntParam(params, 'giftSoundVolume', 80)));
  const likeSoundEnabled = getBoolParam(params, 'likeSoundEnabled', true);
  const likeSoundUrl = getStringParam(params, 'likeSoundUrl', 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c0143c.mp3');
  const likeSoundVolume = Math.max(0, Math.min(100, getIntParam(params, 'likeSoundVolume', 80)));
  const charDelayMs = Math.max(0, Math.min(500, getIntParam(params, 'charDelayMs', 25)));
  const charDurationS = Math.max(0.05, Math.min(3, parseFloat(params.get('charDurationS') || '') || 0.35));

  const [events, setEvents] = useState<EventItem[]>(() => (simulate ? [...DEMO_EVENTS] : []));
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(simulate);
  const hideAnimName = ANIM_OUT_MAP[hideAnim] || 'fadeOut';
  const hideDur = isElegantAnim(hideAnimName) ? 620 : 400;

  useEffect(() => loadGoogleFont(font, '400;700;900', 'event-font'), [font]);

  const joinAudioRef = useRef<HTMLAudioElement | null>(null);
  const giftAudioRef = useRef<HTMLAudioElement | null>(null);
  const likeAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    if (joinSoundEnabled && joinSoundUrl) { const a = new Audio(joinSoundUrl); a.volume = joinSoundVolume/100; a.preload='auto'; joinAudioRef.current = a; }
    if (giftSoundEnabled && giftSoundUrl) { const a = new Audio(giftSoundUrl); a.volume = giftSoundVolume/100; a.preload='auto'; giftAudioRef.current = a; }
    if (likeSoundEnabled && likeSoundUrl) { const a = new Audio(likeSoundUrl); a.volume = likeSoundVolume/100; a.preload='auto'; likeAudioRef.current = a; }
    return () => { joinAudioRef.current?.pause(); giftAudioRef.current?.pause(); likeAudioRef.current?.pause(); };
  }, [joinSoundEnabled, joinSoundUrl, joinSoundVolume, giftSoundEnabled, giftSoundUrl, giftSoundVolume, likeSoundEnabled, likeSoundUrl, likeSoundVolume]);

  const playSound = (type: EventItem['type']) => {
    try {
      let a: HTMLAudioElement | null = null;
      let url = '';
      let vol = 80;
      let enabled = true;
      if (type === 'join') { a = joinAudioRef.current; url = joinSoundUrl; vol = joinSoundVolume; enabled = joinSoundEnabled; a = a || (joinSoundEnabled ? new Audio(url) : null); if (a && !joinAudioRef.current) joinAudioRef.current = a; }
      else if (type === 'gift') { a = giftAudioRef.current; url = giftSoundUrl; vol = giftSoundVolume; enabled = giftSoundEnabled; a = a || (giftSoundEnabled ? new Audio(url) : null); if (a && !giftAudioRef.current) giftAudioRef.current = a; }
      else if (type === 'like') { a = likeAudioRef.current; url = likeSoundUrl; vol = likeSoundVolume; enabled = likeSoundEnabled; a = a || (likeSoundEnabled ? new Audio(url) : null); if (a && !likeAudioRef.current) likeAudioRef.current = a; }
      if (!enabled || !url || !a) return;
      a.currentTime = 0; a.volume = vol/100; a.play().catch(()=>{});
    } catch {}
  };

  const pushEvent = (item: EventItem, filter: boolean) => {
    if (!filter) return;
    setEvents((prev) => [...prev, item].slice(-maxEvents));
    playSound(item.type);
    if (hideAfter > 0) {
      setTimeout(() => {
        setExitingIds((prev) => new Set(prev).add(item.id));
        setTimeout(() => {
          setEvents((prev) => prev.filter((e) => e.id !== item.id));
          setExitingIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
        }, hideDur);
      }, hideAfter * 1000);
    }
  };

  useEffect(() => {
    if (simulate) return; // mode simulate — demo data lokal, tidak perlu socket
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    socket.on('connect', () => { setConnected(true); socket.emit('join-room', room); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('tiktok-member', (data: Record<string, unknown>) => {
      const d = data as { nickname?: string; uniqueId?: string; profilePictureUrl?: string };
      pushEvent({ id: `join_${Date.now()}_${Math.random().toString(36).slice(2,4)}`, type: 'join', nickname: d.nickname || d.uniqueId || 'Someone', profilePictureUrl: d.profilePictureUrl, timestamp: Date.now() }, showJoin);
    });
    socket.on('tiktok-gift', (data: Record<string, unknown>) => {
      const d = data as { nickname?: string; uniqueId?: string; giftName?: string; giftPictureUrl?: string; repeatCount?: number; diamondCount?: number; profilePictureUrl?: string };
      pushEvent({ id: `gift_${Date.now()}_${Math.random().toString(36).slice(2,4)}`, type: 'gift', nickname: d.nickname || d.uniqueId || 'Someone', giftName: d.giftName || 'Gift', giftPictureUrl: d.giftPictureUrl, repeatCount: d.repeatCount || 1, diamondCount: d.diamondCount, profilePictureUrl: d.profilePictureUrl, timestamp: Date.now() }, showGift);
    });
    socket.on('tiktok-like', (data: Record<string, unknown>) => {
      const d = data as { nickname?: string; uniqueId?: string; likeCount?: number; profilePictureUrl?: string };
      pushEvent({ id: `like_${Date.now()}_${Math.random().toString(36).slice(2,4)}`, type: 'like', nickname: d.nickname || d.uniqueId || 'Someone', likeCount: d.likeCount || 1, profilePictureUrl: d.profilePictureUrl, timestamp: Date.now() }, showLike);
    });
    return () => { socket.disconnect(); };
  }, [privateKey, maxEvents, hideAfter, hideDur, showJoin, showGift, showLike, simulate]);

  const themeProps = {
    events,
    font,
    accent,
    bg,
    maxEvents,
    showAvatar,
    anim: ANIM_MAP[anim] || 'elegantIn',
    horizontalAnim: ANIM_MAP[horizontalAnim] || 'elegantIn',
    hideAnim: ANIM_OUT_MAP[hideAnim] || 'fadeOut',
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
      case 'minimal': return <MinimalTheme {...themeProps} />;
      case 'cute': return <CuteTheme {...themeProps} />;
      case 'perchar': return <PerCharTheme {...themeProps} />;
      default: return <StandardTheme {...themeProps} />;
    }
  };

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,'+')}:wght@400;700;900&display=swap'); ${KEYFRAMES_CSS} html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; }`}</style>
      <div id="event-display-root" className={`${obsMode ? `fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-2` : `w-full min-h-screen bg-[#0a0a0a] flex p-4`}`} style={{ background: obsMode ? 'transparent' : '#0a0a0a', fontFamily: `'${font}', sans-serif`, ...posStyle } as any}>
        {!obsMode && !connected && events.length === 0 && <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">Menghubungkan… privateKey={privateKey ? `${privateKey.slice(0,6)}…` : 'global'} • server http://localhost:3000</div>}
        {!obsMode && <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">EVENT • {theme} • {connected ? 'connected' : 'offline'} • {events.length}/{maxEvents}</div>}
        {renderTheme()}
      </div>
    </>
  );
}

export default function EventDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading event…</div>}>
      <EventInner />
    </Suspense>
  );
}
