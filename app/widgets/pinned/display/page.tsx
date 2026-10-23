'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import { AutoScale } from '../../_shared/components/AutoScale';
import { ANIM_MAP, KEYFRAMES_CSS } from '../../_shared/constants/animations';
import { PinnedChatCard, PINNED_CHAT_CSS, pinnedBaseWidth } from '../../_shared/components/PinnedChatCard';

type PinnedItem = {
  nickname: string;
  comment: string;
  profilePictureUrl?: string;
  platform?: string;
};

function PinnedInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const fontSize = getIntParam(params, 'fontSize', 15);
  const accent = getStringParam(params, 'accent', '#8b5cf6');
  const showAvatar = getBoolParam(params, 'showAvatar', true);
  const showPlatform = getBoolParam(params, 'showPlatform', true);
  const showTimestamp = getBoolParam(params, 'showTimestamp', false);
  const anim = getStringParam(params, 'anim', 'elegant');
  const bg = getStringParam(params, 'bg', 'transparent');
  const bgOpacity = Math.max(10, Math.min(100, getIntParam(params, 'bgOpacity', 100)));
  const pos = getStringParam(params, 'pos', 'center');
  const posStyle = getPositionStyle(pos);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);
  const animName = ANIM_MAP[anim] || 'elegantIn';
  const borderFx = getStringParam(params, 'borderFx', 'none');
  const fxColor = getStringParam(params, 'borderFxColor', '') || accent;
  const kbTheme = getStringParam(params, 'kbTheme', 'dark');
  const kbGlow = getBoolParam(params, 'kbGlow', true);
  const kbCaps = getStringParam(params, 'kbCaps', 'dark');
  const mkText = getStringParam(params, 'mkText', '#ffffff');
  const mkDim = getStringParam(params, 'mkDim', '#ffffff40');
  const brutalistBg = getStringParam(params, 'brutalistBg', '#FFFFFF');
  const brutalistTextColor = getStringParam(params, 'brutalistTextColor', '#000000');
  const brutalistBadgeBg = getStringParam(params, 'brutalistBadgeBg', '#FFFFFF');
  const brutalistBorderColor = getStringParam(params, 'brutalistBorderColor', '#000000');
  const brutalistShadow = Math.max(0, Math.min(14, getIntParam(params, 'brutalistShadow', 6)));
  const brutalistHalftone = getBoolParam(params, 'brutalistHalftone', true);
  const brutalistTail = getBoolParam(params, 'brutalistTail', true);
  const brutalistItalic = getBoolParam(params, 'brutalistItalic', true);
  const brutalistUppercase = getBoolParam(params, 'brutalistUppercase', true);
  const charDelayMs = Math.max(0, Math.min(500, getIntParam(params, 'charDelayMs', 25)));
  const charDurationS = Math.max(0.05, Math.min(3, parseFloat(params.get('charDurationS') || '') || 0.35));
  const typingMs = Math.max(10, Math.min(500, getIntParam(params, 'typingMs', 60)));
  const cardBg = bg === 'transparent' ? undefined : `${bg}${Math.round((bgOpacity / 100) * 255).toString(16).padStart(2, '0')}`;
  const spinActive = borderFx === 'spin';
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [pinned, setPinned] = useState<PinnedItem | null>(null);
  const [connected, setConnected] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [typedCount, setTypedCount] = useState(0);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // mirror agar callback socket (didaftarkan sekali) tidak baca state basi
  const liveRef = useRef({ pinned: null as PinnedItem | null, exiting: false });

  // Efek mengetik untuk tema typing/monkey - reset tiap pin baru
  useEffect(() => {
    if ((theme !== 'typing' && theme !== 'monkey') || !pinned) return;
    setTypedCount(0);
    const len = pinned.comment.length;
    if (len === 0) return;
    const step = Math.max(10, typingMs);
    const id = setInterval(() => {
      setTypedCount((c) => {
        if (c >= len) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, step);
    return () => clearInterval(id);
  }, [pinned?.nickname, pinned?.comment, theme, typingMs]);

  useEffect(() => loadGoogleFont(font, '400;700;900', 'pinned-font'), [font]);

  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
  }, []);

  useEffect(() => {
    if (simulate) {
      setPinned({
        nickname: 'Rizky_JR',
        comment: 'Gass keun bang, semangat live-nya!',
        profilePictureUrl: 'https://ui-avatars.com/api/?name=Rizky&background=8b5cf6&color=fff',
        platform: 'tiktok',
      });
      return; // mode simulate - 1 file untuk OBS + preview, tidak perlu socket
    }
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    socket.on('connect', () => { setConnected(true); socket.emit('join-room', room); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('pinned-chat', (data: Record<string, unknown>) => {
      const d = (data as { chat?: Record<string, unknown> }).chat || data;
      const chat = d as { nickname?: string; user?: string; uniqueId?: string; comment?: string; text?: string; message?: string; profilePictureUrl?: string; avatar?: string; platform?: string };
      const comment = String(chat.comment || chat.text || chat.message || '');
      if (!comment) return;
      if (exitTimer.current) clearTimeout(exitTimer.current);
      const item: PinnedItem = {
        nickname: chat.nickname || chat.user || chat.uniqueId || 'Pinned',
        comment,
        profilePictureUrl: chat.profilePictureUrl || chat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.nickname || 'P')}&background=222&color=fff`,
        platform: chat.platform || 'tiktok',
      };
      liveRef.current = { pinned: item, exiting: false };
      setExiting(false);
      setPinned(item);
    });
    socket.on('unpin-chat', () => {
      const st = liveRef.current;
      if (!st.pinned || st.exiting) return;
      liveRef.current = { ...st, exiting: true };
      setExiting(true);
      if (exitTimer.current) clearTimeout(exitTimer.current);
      exitTimer.current = setTimeout(() => {
        liveRef.current = { pinned: null, exiting: false };
        setPinned(null);
        setExiting(false);
      }, 380);
    });
    return () => { socket.disconnect(); };
  }, [privateKey, simulate]);

  const fontFamily = `'${font}', sans-serif`;

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent" style={{ fontFamily }}>
      <style>{`${KEYFRAMES_CSS}${PINNED_CHAT_CSS} .pinned-font { font-family: '${font}', sans-serif; }`}</style>
      <div className="w-full h-full flex" style={posStyle as React.CSSProperties}>
        {pinned ? (
          <div
            className={borderFx === 'glow' ? 'pin-fx-glow' : undefined}
            style={{ '--pin-accent': fxColor } as React.CSSProperties}
          >
            <div key={`${pinned.nickname}-${pinned.comment}`} style={{ animation: exiting ? 'pinOut 0.38s cubic-bezier(0.16,1,0.3,1) both' : `${animName} 0.45s cubic-bezier(0.16,1,0.3,1) both` }}>
              <AutoScale defaultBase={420} baseWidth={pinnedBaseWidth(theme)}>
                <PinnedChatCard
                  item={pinned}
                  theme={theme}
                  fontSize={fontSize}
                  accent={accent}
                  showAvatar={showAvatar}
                  showPlatform={showPlatform}
                  showTimestamp={showTimestamp}
                  timeStr={timeStr}
                  cardBg={cardBg}
                  fxColor={fxColor}
                  spinActive={spinActive}
                  kbTheme={kbTheme}
                  kbGlow={kbGlow}
                  kbCaps={kbCaps}
                  mkText={mkText}
                  mkDim={mkDim}
                  brutalistBg={brutalistBg}
                  brutalistTextColor={brutalistTextColor}
                  brutalistBadgeBg={brutalistBadgeBg}
                  brutalistBorderColor={brutalistBorderColor}
                  brutalistShadow={brutalistShadow}
                  brutalistHalftone={brutalistHalftone}
                  brutalistTail={brutalistTail}
                  brutalistItalic={brutalistItalic}
                  brutalistUppercase={brutalistUppercase}
                  charDelayMs={charDelayMs}
                  charDurationS={charDurationS}
                  typedCount={typedCount}
                  badge={theme === 'minimal' ? 'Pinned' : 'Pin'}
                  noShadow={theme !== 'brutalist'}
                />
              </AutoScale>
            </div>
          </div>
        ) : (
          !obsMode && (
            <div className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">
              {simulate ? 'SIMULATE' : connected ? 'Menunggu pin dari dock…' : 'Menghubungkan…'}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function PinnedDisplayPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-transparent" />}>
      <PinnedInner />
    </Suspense>
  );
}
