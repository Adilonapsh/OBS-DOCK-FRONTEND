'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import { ANIM_MAP, KEYFRAMES_CSS } from '../../_shared/constants/animations';

function platformLogo(p?: string) {
  const v = (p || "tiktok").toLowerCase();
  if (v.includes("tiktok")) return "/assets/logo/tik-tok.png";
  if (v.includes("youtube") || v === "yt") return "/assets/logo/youtube.png";
  if (v.includes("twitch")) return "/assets/logo/twitch.png";
  if (v.includes("kick")) return "/assets/logo/sbot.png";
  return "/assets/logo/tik-tok.png";
}

type PinnedItem = {
  nickname: string;
  comment: string;
  profilePictureUrl?: string;
  platform?: string;
};

type KbKey = { d: string; m?: string; sub?: string; w?: number; dark?: boolean };
const KB60: KbKey[][] = [
  [{ d: 'Esc', dark: true }, ...'1234567890'.split('').map((c, i) => ({ d: c, m: c, sub: '!@#$%^&*()'[i] })), { d: '⌫', dark: true, w: 1.6 }],
  [{ d: 'Tab', w: 1.6 }, ...'QWERTYUIOP'.split('').map((c) => ({ d: c, m: c })), { d: 'Del', w: 1.4 }],
  [{ d: 'Caps', w: 1.8 }, ...'ASDFGHJKL'.split('').map((c) => ({ d: c, m: c })), { d: '⏎', dark: true, w: 1.8 }],
  [{ d: '⇧', w: 2 }, ...'ZXCVBNM'.split('').map((c) => ({ d: c, m: c })), { d: '⇧', w: 2 }],
  [{ d: 'Ctrl', w: 1.4 }, { d: 'Alt', dark: true, w: 1.4 }, { d: 'space', m: ' ', w: 6 }, { d: 'Alt', dark: true, w: 1.4 }, { d: 'Ctrl', w: 1.4 }],
];

// Bungkus bubble saja dengan outline berputar (bukan seluruh card)
function SpinWrap({ active, accent, radius, solid, children }: {
  active: boolean;
  accent: string;
  radius: string;
  solid?: boolean;
  children: React.ReactNode;
}) {
  if (!active) return <>{children}</>;
  return (
    <div className="pin-fx-spin" style={{ '--pin-accent': accent, borderRadius: radius } as React.CSSProperties}>
      <div className={`pin-fx-inner${solid ? ' pin-fx-inner-solid' : ''}`} style={{ borderRadius: `calc(${radius} - 2px)` }}>
        {children}
      </div>
    </div>
  );
}

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

  // Efek mengetik untuk tema typing/monkey — reset tiap pin baru
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
      return; // mode simulate — 1 file untuk OBS + preview, tidak perlu socket
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
      <style>{`${KEYFRAMES_CSS} .pinned-font { font-family: '${font}', sans-serif; }
        .pin-pc-meta { display: flex; align-items: center; gap: 8px; padding-left: 2px; animation: pinPcMetaIn 0.3s ease both; }
        @keyframes pinPcMetaIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .pin-pc-username { background: rgba(40,38,64,0.92); color: #fff; font-size: 14px; font-weight: 800; padding: 5px 14px; border-radius: 16px; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
        .pin-pc-avatar { width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; object-fit: cover; background: #0d0c18; border: 2.5px solid transparent; animation: pinPcAvatarPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both; }
        @keyframes pinPcAvatarPop { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
        .pin-pc-bubble { position: relative; color: #fff; font-weight: 800; line-height: 1.45; padding: 13px 20px; border-radius: 20px; max-width: 370px; box-shadow: 0 4px 18px rgba(0,0,0,0.25); overflow-wrap: break-word; transform-origin: bottom left; animation: pinPcBubbleIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .pin-pc-bubble::after { content: ''; position: absolute; bottom: -9px; left: 18px; width: 18px; height: 14px; background: inherit; clip-path: path("M 0,0 C 2,5 0,10 -6,12 C 2,10 10,6 16,0 Z"); }
        @keyframes pinPcBubbleIn { 0% { opacity: 0; transform: scale(0.85) translateY(12px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .pin-pc-char { display: inline-block; opacity: 0; animation-name: pinPcCharIn; animation-timing-function: ease-out; animation-fill-mode: forwards; white-space: pre; }
        @keyframes pinPcCharIn { 0% { opacity: 0; transform: translateY(2px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pinOut { from { opacity: 1; } to { opacity: 0; } }
        .pin-island { background: #000; border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.55); overflow: hidden; animation: pinIslandIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes pinIslandIn { 0% { opacity: 0; transform: scaleX(0.35) scaleY(0.7); } 60% { opacity: 1; transform: scaleX(1.04) scaleY(1.02); } 100% { opacity: 1; transform: scaleX(1) scaleY(1); } }
        .pin-island-dot { width: 8px; height: 8px; border-radius: 50%; animation: pinIslandPulse 1.6s ease-in-out infinite; }
        @keyframes pinIslandPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.8); } }
        .pin-mk-char { color: var(--pin-mk-dim, rgba(255,255,255,0.25)); transition: color 0.08s ease; white-space: pre; }
        .pin-mk-char.done { color: var(--pin-mk-text, #fff); }
        .pin-mk-caret { display: inline-block; width: 3px; height: 1.1em; background: var(--pin-accent, #e2b714); vertical-align: -0.15em; margin-left: 1px; border-radius: 1px; animation: pinMkCaret 1s steps(1) infinite; }
        @keyframes pinMkCaret { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
        .pin-type-cursor { display: inline-block; width: 2px; height: 1em; background: currentColor; vertical-align: -0.12em; margin-left: 2px; animation: pinCursorBlink 0.9s steps(1) infinite; }
        @keyframes pinCursorBlink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
        .pin-kb { --kb-plate: #101014; --kb-key: #232329; --kb-text: rgba(255,255,255,0.75); --kb-shadow: #0a0a0d; display: flex; flex-direction: column; gap: 4px; align-items: stretch; background: var(--kb-plate); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 8px 6px; }
        .pin-kb.glow { box-shadow: 0 8px 20px rgba(0,0,0,0.5), 0 0 18px -4px var(--pin-accent, #8b5cf6); }
        .pin-kb.kb-light { --kb-plate: #e2e4e8; --kb-key: #f4f5f7; --kb-text: #1f2937; --kb-shadow: #9ca3af; }
        .pin-kb.kb-cyber { --kb-plate: #150826; --kb-key: #3b0764; --kb-text: #f0abfc; --kb-shadow: #2e1065; }
        .pin-kb.kb-cap-ewhite { --kb-key: #f4f5f7; --kb-text: #1f2937; --kb-shadow: #9ca3af; }
        .pin-kb.kb-cap-samurai { --kb-key: #450a0a; --kb-text: #fef2f2; --kb-shadow: #290606; }
        .pin-kb.kb-cap-botanical { --kb-key: #f8fafc; --kb-text: #14532d; --kb-shadow: #94a3b8; }
        .pin-kb.kb-cap-cyber { --kb-key: #3b0764; --kb-text: #f0abfc; --kb-shadow: #2e1065; }
        .pin-kb.kb-cap-mono { --kb-key: #18181b; --kb-text: #f4f4f5; --kb-shadow: #09090b; }
        .pin-kb-row { display: flex; gap: 4px; }
        .pin-kb-key { flex: 1 1 0; height: 24px; padding: 0 2px; border-radius: 5px; background: var(--kb-key); border: 1px solid var(--kb-shadow); color: var(--kb-text); font-size: 8px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 3px 0 0 var(--kb-shadow), 0 4px 6px 0 rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.14); transition: transform 0.05s ease, box-shadow 0.05s ease, background-color 0.12s ease; user-select: none; overflow: hidden; }
        .pin-kb-key.dark { background: #141417; color: rgba(255,255,255,0.85); }
        .pin-kb-key .sub { position: absolute; bottom: 1px; right: 3px; font-size: 6px; font-weight: 700; opacity: 0.5; }
        .pin-kb-key.on { background: var(--pin-accent, #8b5cf6); border-color: var(--pin-accent, #8b5cf6); color: #000; transform: translateY(2.5px); box-shadow: 0 0.5px 0 0 var(--pin-accent, #8b5cf6), 0 1px 2px 0 rgba(0,0,0,0.3), 0 0 12px var(--pin-accent, #8b5cf6); }
        .pin-kb-key.on .sub { opacity: 0.8; }
        .pin-fx-glow { animation: pinFxGlow 2.4s ease-in-out infinite; }
        @keyframes pinFxGlow { 0%, 100% { filter: drop-shadow(0 0 2px var(--pin-accent, #8b5cf6)); } 50% { filter: drop-shadow(0 0 12px var(--pin-accent, #8b5cf6)); } }
        .pin-fx-spin { position: relative; }
        .pin-fx-spin::before { content: ''; position: absolute; inset: -28%; z-index: 0; background: conic-gradient(from 0deg, transparent 0%, var(--pin-accent, #8b5cf6) 14%, transparent 30%, transparent 55%, var(--pin-accent, #8b5cf6) 70%, transparent 86%); animation: pinFxSpin 3.2s linear infinite; filter: blur(16px); opacity: 0.8; pointer-events: none; }
        .pin-fx-spin > .pin-fx-inner { position: relative; z-index: 1; overflow: hidden; }
        .pin-fx-inner-solid { background: rgba(0,0,0,0.35); }
        @keyframes pinFxSpin { to { transform: rotate(360deg); } }`}</style>
      <div className="w-full h-full flex" style={posStyle as React.CSSProperties}>
        {pinned ? (
          <div
            className={borderFx === 'glow' ? 'pin-fx-glow' : undefined}
            style={{ '--pin-accent': fxColor } as React.CSSProperties}
          >
          <div key={`${pinned.nickname}-${pinned.comment}`} style={{ animation: exiting ? 'pinOut 0.38s cubic-bezier(0.16,1,0.3,1) both' : `${animName} 0.45s cubic-bezier(0.16,1,0.3,1) both` }}>
          {theme === 'monkey' || theme === 'typing' ? (
            <div className="pinned-font flex flex-col gap-2 w-[420px] max-w-[90vw]">
              <div className="flex items-center gap-2">
                <span className="pin-pc-username">{pinned.nickname}</span>
                {showTimestamp && <span className="text-white/40 text-[10px] font-mono shrink-0">{timeStr}</span>}
              </div>
              <div className="font-bold break-words leading-relaxed" style={{ fontSize: fontSize + 4, fontFamily: `'JetBrains Mono', ui-monospace, monospace`, '--pin-mk-text': mkText, '--pin-mk-dim': mkDim } as React.CSSProperties}>
                {[...pinned.comment].map((ch, i) => (
                  <span key={i} className={`pin-mk-char${i < typedCount ? ' done' : ''}`}>{ch}</span>
                ))}
                {typedCount < pinned.comment.length && <span className="pin-mk-caret" style={{ '--pin-accent': fxColor } as React.CSSProperties} />}
              </div>
              <div className="w-full" style={{ '--pin-accent': fxColor } as React.CSSProperties}>
                <div className={`pin-kb${kbTheme === 'light' ? ' kb-light' : kbTheme === 'cyber' ? ' kb-cyber' : ''}${kbGlow ? ' glow' : ''} kb-cap-${kbCaps}`}>
                  {KB60.map((row, ri) => {
                    const done = typedCount >= pinned.comment.length;
                    const cur = done ? '' : (pinned.comment[typedCount - 1] || '').toUpperCase();
                    return (
                      <div key={ri} className="pin-kb-row">
                        {row.map((k, ki) => (
                          <span
                            key={ki}
                            className={`pin-kb-key${k.dark ? ' dark' : ''}${k.m !== undefined && cur === k.m ? ' on' : ''}`}
                            style={k.w ? { flexGrow: k.w } : undefined}
                          >
                            {k.d === 'space' ? 'space' : k.d}
                            {k.sub && <span className="sub">{k.sub}</span>}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : theme === 'island' ? (
            <div className="pinned-font w-[360px] max-w-[90vw]">
              <div className="pin-island px-4 py-3 flex items-center gap-3">
                {showAvatar ? (
                  <img src={pinned.profilePictureUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="pin-island-dot shrink-0" style={{ background: accent }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-black truncate" style={{ fontSize }}>{pinned.nickname}</span>
                    {showPlatform && pinned.platform && (
                      <img src={platformLogo(pinned.platform)} alt={pinned.platform} className="w-3.5 h-3.5 rounded-full object-contain bg-white p-0.5 shrink-0" />
                    )}
                    {showTimestamp && <span className="text-white/40 text-[9px] font-mono shrink-0">{timeStr}</span>}
                  </div>
                  <div className="text-white/85 font-bold truncate" style={{ fontSize: Math.max(11, fontSize - 2) }}>{pinned.comment}</div>
                </div>
                <span className="pin-island-dot shrink-0" style={{ background: accent }} />
              </div>
            </div>
          ) : theme === 'perchar' ? (
            <div className="pinned-font flex flex-col gap-1.5 max-w-[420px]">
              <div className="pin-pc-meta">
                {showPlatform && pinned.platform && (
                  <img src={platformLogo(pinned.platform)} alt={pinned.platform} className="w-[22px] h-[22px] rounded-md object-contain bg-white p-0.5 shrink-0" />
                )}
                <span className="pin-pc-username">{pinned.nickname}</span>
                {showTimestamp && <span className="text-white/40 text-[10px] font-mono shrink-0">{timeStr}</span>}
              </div>
              <div className="flex items-end gap-2.5">
                {showAvatar && (
                  <img src={pinned.profilePictureUrl} alt="" className="pin-pc-avatar" />
                )}
                <SpinWrap active={spinActive} accent={fxColor} radius="20px">
                <div className="pin-pc-bubble" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, fontSize }}>
                  {[...pinned.comment].map((ch, i) => (
                    <span key={i} className="pin-pc-char" style={{ animationDelay: `${(i * charDelayMs) / 1000}s`, animationDuration: `${charDurationS}s` }}>{ch}</span>
                  ))}
                </div>
                </SpinWrap>
              </div>
            </div>
          ) : theme === 'minimal' ? (
            <SpinWrap active={spinActive} accent={fxColor} radius="12px">
            <div className="pinned-font flex items-center gap-2 px-3 py-2 bg-black/60 border-l-4 rounded-r-xl max-w-[560px]" style={{ borderColor: accent, ...(cardBg ? { background: cardBg } : {}) }}>
              {showAvatar && (
                <img src={pinned.profilePictureUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-black truncate" style={{ fontSize: fontSize - 2 }}>{pinned.nickname}</span>
                  {showPlatform && pinned.platform && (
                    <img src={platformLogo(pinned.platform)} alt={pinned.platform} className="w-3.5 h-3.5 rounded-full object-contain bg-white p-0.5 shrink-0" />
                  )}
                  {showTimestamp && <span className="text-white/40 text-[9px] font-mono shrink-0">{timeStr}</span>}
                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: `${accent}33`, color: accent }}>Pinned</span>
                </div>
                <div className="text-white/90 font-bold break-words" style={{ fontSize }}>{pinned.comment}</div>
              </div>
            </div>
            </SpinWrap>
          ) : (
            <div className="pinned-font w-[380px] max-w-[90vw] rounded-2xl overflow-hidden border border-white/10 backdrop-blur-md shadow-2xl" style={{ ...(cardBg ? { background: cardBg } : { background: 'rgba(0,0,0,0.7)' }) }}>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10" style={{ background: `${accent}22` }}>
                {showAvatar && (
                  <img src={pinned.profilePictureUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/20" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-black truncate" style={{ fontSize }}>{pinned.nickname}</span>
                    {showPlatform && pinned.platform && (
                      <img src={platformLogo(pinned.platform)} alt={pinned.platform} className="w-4 h-4 rounded-full object-contain bg-white p-0.5 shrink-0" />
                    )}
                    {showTimestamp && <span className="text-white/40 text-[9px] font-mono shrink-0">{timeStr}</span>}
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full text-black shrink-0" style={{ background: accent }}>Pin</span>
              </div>
              <SpinWrap active={spinActive} accent={fxColor} radius="12px" solid>
              <div className="px-3 py-2.5 text-white font-bold break-words leading-relaxed" style={{ fontSize: fontSize + 1 }}>{pinned.comment}</div>
              </SpinWrap>
            </div>
          )}
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
