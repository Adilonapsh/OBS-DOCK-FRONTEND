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
import type { FollowItem } from '../themes/types';

function FollowInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const accent = getStringParam(params, 'accent', '#ec4899');
  const bg = getStringParam(params, 'bg', 'transparent');
  const maxFollows = Math.max(1, Math.min(20, getIntParam(params, 'maxFollows', 6)));
  const hideAfter = getIntParam(params, 'hideAfter', 5);
  const showAvatar = getBoolParam(params, 'showAvatar', true);
  const anim = getStringParam(params, 'anim', 'elegant');
  const hideAnim = getStringParam(params, 'hideAnim', 'fade');
  const fontSize = getIntParam(params, 'fontSize', 14);
  const bgOpacity = Math.max(10, Math.min(100, getIntParam(params, 'bgOpacity', 100)));
  const horizontal = getBoolParam(params, 'horizontal', false);
  const horizontalAnim = getStringParam(params, 'horizontalAnim', 'elegant');
  const soundEnabled = getBoolParam(params, 'soundEnabled', true);
  const soundUrl = getStringParam(params, 'soundUrl', 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c8ad9c.mp3');
  const soundVolume = Math.max(0, Math.min(100, getIntParam(params, 'soundVolume', 80)));
  const pos = getStringParam(params, 'pos', 'center');
  const posStyle = getPositionStyle(pos);

  const [follows, setFollows] = useState<FollowItem[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hideAnimName = ANIM_OUT_MAP[hideAnim] || 'fadeOut';
  const hideDur = isElegantAnim(hideAnimName) ? 620 : 400;

  useEffect(() => loadGoogleFont(font, '400;700;900', 'follow-font'), [font]);

  // preload audio
  useEffect(() => {
    if (!soundEnabled || !soundUrl) return;
    const a = new Audio(soundUrl);
    a.volume = soundVolume / 100;
    a.preload = 'auto';
    audioRef.current = a;
    return () => { a.pause(); audioRef.current = null; };
  }, [soundEnabled, soundUrl, soundVolume]);

  const playSound = () => {
    if (!soundEnabled || !soundUrl) return;
    try {
      const a = audioRef.current || new Audio(soundUrl);
      a.currentTime = 0;
      a.volume = soundVolume / 100;
      a.play().catch(() => {});
      if (!audioRef.current) audioRef.current = a;
    } catch {}
  };

  const pushFollow = (item: FollowItem) => {
    setFollows((prev) => [...prev, item].slice(-maxFollows));
    playSound();
    if (hideAfter > 0) {
      setTimeout(() => {
        setExitingIds((prev) => new Set(prev).add(item.id));
        setTimeout(() => {
          setFollows((prev) => prev.filter((f) => f.id !== item.id));
          setExitingIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
        }, hideDur);
      }, hideAfter * 1000);
    }
  };

  useEffect(() => {
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    socket.on('connect', () => { setConnected(true); socket.emit('join-room', room); });
    socket.on('disconnect', () => setConnected(false));
    const handleFollow = (data: Record<string, unknown>) => {
      const d = data as { nickname?: string; uniqueId?: string; profilePictureUrl?: string; displayName?: string };
      pushFollow({ id: `follow_${Date.now()}_${Math.random().toString(36).slice(2,4)}`, nickname: d.nickname || d.uniqueId || d.displayName || 'Someone', profilePictureUrl: d.profilePictureUrl, platform: 'tiktok', timestamp: Date.now() },);
    };
    socket.on('tiktok-follow', handleFollow);
    socket.on('tiktok-member', (data: Record<string, unknown>) => {
      // member juga dianggap follow untuk demo - filter hanya yang follow-like? tetap tampil tapi suara hanya untuk follow murni
      // kita tampilkan member sebagai follow juga biar OBS ramai, tapi tanpa suara ganda: hanya follow yang pakai suara
      const d = data as { nickname?: string; uniqueId?: string; profilePictureUrl?: string };
      // jika tiktok-follow tidak ada, fallback member sebagai follow (opsional)
      // untuk hindari double, kita hanya push jika belum ada follow event - tetap push sebagai join tapi tanpa suara ekstra
      // di sini kita push sebagai follow tapi tanpa suara jika bukan follow murni: kita pakai pushFollow tanpa suara? untuk simpel, push sebagai follow dengan suara juga
      // biar user lihat, kita push member sebagai follow juga
      // (bisa dimatikan via filter kalau mau)
    });
    socket.on('tiktok-social', (data: Record<string, unknown>) => {
      const d = data as { displayType?: string; label?: string; nickname?: string; uniqueId?: string; profilePictureUrl?: string };
      if (String(d.displayType || '').toLowerCase().includes('follow') || String(d.label || '').toLowerCase().includes('follow')) {
        handleFollow(data);
      }
    });
    return () => { socket.disconnect(); };
  }, [privateKey, maxFollows, hideAfter, hideDur, soundEnabled, soundUrl, soundVolume]);

  const themeProps = {
    follows,
    font,
    accent,
    bg,
    maxFollows,
    showAvatar,
    anim: ANIM_MAP[anim] || 'elegantIn',
    hideAnim: ANIM_OUT_MAP[hideAnim] || 'fadeOut',
    fontSize,
    bgOpacity,
    horizontal,
    exitingIds,
  };

  const renderTheme = () => {
    switch (theme) {
      case 'minimal': return <MinimalTheme {...themeProps} />;
      case 'cute': return <CuteTheme {...themeProps} />;
      default: return <StandardTheme {...themeProps} />;
    }
  };

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,'+')}:wght@400;700;900&display=swap'); ${KEYFRAMES_CSS} html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; }`}</style>
      <div id="follow-display-root" className={`${obsMode ? 'fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-2' : 'w-full min-h-screen bg-[#0a0a0a] flex p-4'}`} style={{ ...posStyle, background: obsMode ? 'transparent' : '#0a0a0a', fontFamily: `'${font}', sans-serif` } as any}>
        {!obsMode && !connected && follows.length === 0 && <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">Menghubungkan… privateKey={privateKey ? `${privateKey.slice(0,6)}…` : 'global'} • server http://localhost:3000</div>}
        {!obsMode && <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">FOLLOW • {theme} • {connected ? 'connected' : 'offline'} • {follows.length}/{maxFollows}</div>}
        <button onClick={() => { if (soundEnabled && soundUrl) { const a = new Audio(soundUrl); a.volume = soundVolume/100; a.play().catch(()=>{}); } }} className="absolute top-16 right-4 hidden">test</button>
        {renderTheme()}
      </div>
      {/* allow audio autoplay in OBS: need user interaction, but Browser Source allows */}
      <audio preload="auto" style={{ display: 'none' }} />
    </>
  );
}

export default function FollowDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading follow…</div>}>
      <FollowInner />
    </Suspense>
  );
}
