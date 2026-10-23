'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getBoolParam, getIntParam, getStringParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import { AutoScale } from '../../_shared/components/AutoScale';
import { KEYFRAMES_CSS } from '../../_shared/constants/animations';
import { PinnedChatCard, PINNED_CHAT_CSS, pinnedBaseWidth, type PinnedCardItem } from '../../_shared/components/PinnedChatCard';
import { SPEAK_THEMES } from '../config';

type SpeakItem = PinnedCardItem;

const DEMO_ITEM: SpeakItem = {
  nickname: 'Terminal_User',
  comment: 'Halo! Ada yang bisa saya bantu hari ini?',
  profilePictureUrl: 'https://ui-avatars.com/api/?name=User&background=222&color=fff&bold=true',
  platform: 'tiktok',
};

const DEMO_REPLY = 'Mode OBS Overlay aktif. Sistem siap menerima perintah.';

const REPLY_TIMEOUT_MS = 40000;

function fallbackAvatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=222&color=fff&bold=true`;
}

function SpeakInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);

  const themeParam = getStringParam(params, 'theme', 'standard');
  const theme = SPEAK_THEMES.some((t) => t.value === themeParam) ? themeParam : 'standard';
  const font = getStringParam(params, 'font', 'Outfit');
  const fontSize = getIntParam(params, 'fontSize', 15);
  const accent = getStringParam(params, 'accent', '#8b5cf6');
  const bg = getStringParam(params, 'bg', 'transparent');
  const bgOpacity = Math.max(10, Math.min(100, getIntParam(params, 'bgOpacity', 100)));
  const pos = getStringParam(params, 'pos', 'center');
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
  const typingMs = Math.max(10, Math.min(300, getIntParam(params, 'typingMs', 30)));
  const hideDelayMs = Math.max(0, Math.min(60000, getIntParam(params, 'hideDelayMs', 3000)));
  const showUser = getBoolParam(params, 'showUser', true);
  const showAvatar = getBoolParam(params, 'showAvatar', true);
  const avatarReaction = getStringParam(params, 'avatarReaction', 'light') === 'scale' ? 'scale' : 'light';
  const showPlatform = getBoolParam(params, 'showPlatform', true);
  const showTimestamp = getBoolParam(params, 'showTimestamp', false);

  const posStyle = getPositionStyle(pos);
  const cardBg = bg === 'transparent' ? undefined : `${bg}${Math.round((bgOpacity / 100) * 255).toString(16).padStart(2, '0')}`;
  const spinActive = borderFx === 'spin';
  const base = pinnedBaseWidth(theme);
  // Proporsi avatar user mengikuti lebar tema (mirip 112px di layout neon).
  const avatarSize = Math.max(72, Math.min(112, Math.round(base * 0.2)));
  // Jarak user card -> baris AI sedikit lebih rapat supaya balasan + avatar naik.
  const stackGap = Math.max(10, Math.min(16, Math.round(base * 0.028)));
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [item, setItem] = useState<SpeakItem | null>(simulate ? DEMO_ITEM : null);
  const [replyText, setReplyText] = useState(simulate ? DEMO_REPLY : '');
  const [typedCount, setTypedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exiting, setExiting] = useState(false);
  const [audioSrc, setAudioSrc] = useState('');
  const [connected, setConnected] = useState(false);
  const [nonce, setNonce] = useState(0);

  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioPlayedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const avatarRef = useRef<HTMLElement | null>(null);
  const avatarFrameRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => loadGoogleFont(font, '400;700;900', 'speak-font'), [font]);

  const clearTimers = useCallback(() => {
    if (exitTimer.current) { clearTimeout(exitTimer.current); exitTimer.current = null; }
    if (fadeTimer.current) { clearTimeout(fadeTimer.current); fadeTimer.current = null; }
    if (replyTimer.current) { clearTimeout(replyTimer.current); replyTimer.current = null; }
  }, []);

  const stopVisualizer = useCallback(() => {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (avatarRef.current) avatarRef.current.style.opacity = '0';
    if (avatarFrameRef.current) avatarFrameRef.current.style.transform = '';
  }, []);

  const setAvatarEl = useCallback((el: HTMLElement | null) => {
    avatarRef.current = el;
  }, []);

  const startExit = useCallback((delay = 3000) => {
    if (simulate) return;
    clearTimers();
    exitTimer.current = setTimeout(() => {
      setExiting(true);
      try { audioRef.current?.pause(); } catch { /* autoplay/audio not ready */ }
      stopVisualizer();
      fadeTimer.current = setTimeout(() => {
        setItem(null);
        setExiting(false);
        setReplyText('');
        setTypedCount(0);
        setAudioSrc('');
        setError('');
        setLoading(false);
        audioPlayedRef.current = false;
      }, 1200);
    }, Math.max(0, delay));
  }, [clearTimers, simulate, stopVisualizer]);

  const showSpeak = useCallback((chat: SpeakItem) => {
    clearTimers();
    stopVisualizer();
    try {
      const a = audioRef.current;
      if (a) { a.pause(); a.removeAttribute('src'); a.load(); }
    } catch { /* ignore */ }
    audioPlayedRef.current = false;
    setExiting(false);
    setReplyText('');
    setTypedCount(0);
    setAudioSrc('');
    setError('');
    setLoading(true);
    setItem({
      nickname: chat.nickname || 'User',
      comment: chat.comment || '',
      profilePictureUrl: chat.profilePictureUrl || fallbackAvatar(chat.nickname || 'User'),
      platform: chat.platform || 'tiktok',
    });
    setNonce((n) => n + 1);

    // Jaring pengaman kalau backend/webhook tidak pernah membalas.
    replyTimer.current = setTimeout(() => {
      replyTimer.current = null;
      setLoading(false);
      setError('TIDAK ADA RESPONS DARI BACKEND');
      startExit(5000);
    }, REPLY_TIMEOUT_MS);
  }, [clearTimers, startExit, stopVisualizer]);

  const applyReply = useCallback((data: Record<string, unknown>) => {
    if (replyTimer.current) { clearTimeout(replyTimer.current); replyTimer.current = null; }
    const err = String(data?.error || '').trim();
    if (err) {
      setLoading(false);
      setReplyText('');
      setError(err);
      startExit(6000);
      return;
    }
    const text = String(data?.text || '').trim() || 'Balasan suara diterima.';
    const base64 = String(data?.base64 || '');
    const audioType = String(data?.audioType || 'mp3');
    setReplyText(text);
    setAudioSrc(base64 ? (base64.startsWith('data:') ? base64 : `data:audio/${audioType};base64,${base64}`) : '');
    setError('');
    setLoading(false);
  }, [startExit]);

  // Socket - terima pesan Speak + balasan dari backend (yang memanggil n8n).
  useEffect(() => {
    if (simulate) return;
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    socket.on('connect', () => { setConnected(true); socket.emit('join-room', room); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('speak-chat', (data: Record<string, unknown>) => {
      const d = (data as { chat?: Record<string, unknown> }).chat || data;
      const chat = d as { nickname?: string; user?: string; uniqueId?: string; comment?: string; text?: string; message?: string; profilePictureUrl?: string; avatar?: string; platform?: string };
      const comment = String(chat.comment || chat.text || chat.message || '');
      if (!comment) return;
      const nickname = chat.nickname || chat.user || chat.uniqueId || 'User';
      showSpeak({
        nickname,
        comment,
        profilePictureUrl: chat.profilePictureUrl || chat.avatar || fallbackAvatar(nickname),
        platform: chat.platform || 'tiktok',
      });
    });
    socket.on('speak-reply', (data: Record<string, unknown>) => applyReply(data || {}));
    socket.on('speak-stop', () => startExit(0));
    return () => { socket.disconnect(); };
  }, [applyReply, privateKey, showSpeak, simulate, startExit]);

  // Efek mengetik balasan AI.
  useEffect(() => {
    if (loading || error || !replyText) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTypedCount(i);
      if (i >= replyText.length) clearInterval(id);
    }, Math.max(10, typingMs));
    return () => clearInterval(id);
  }, [error, loading, nonce, replyText, typingMs]);

  const initVisualizer = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    try {
      if (!ctxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        const source = ctx.createMediaElementSource(a);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        analyser.fftSize = 64;
        ctxRef.current = ctx;
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      void ctxRef.current.resume?.();
      if (rafRef.current == null) {
        const render = () => {
          rafRef.current = requestAnimationFrame(render);
          const analyser = analyserRef.current;
          const data = dataRef.current;
          if (!analyser || !data) return;
          analyser.getByteFrequencyData(data as Uint8Array<ArrayBuffer>);
          let sum = 0;
          for (let i = 0; i < 8; i++) sum += data[i] || 0;
          const avg = sum / 8;
          const intensity = Math.min(1, avg / 160);
          if (avatarReaction === 'scale') {
            if (avatarFrameRef.current) avatarFrameRef.current.style.transform = `scale(${1 + intensity * 0.2})`;
          } else if (avatarRef.current) {
            avatarRef.current.style.opacity = String(intensity);
          }
        };
        render();
      }
    } catch (err) {
      console.warn('Speak visualizer failed:', err);
    }
  }, [avatarReaction]);

  // Setelah teks selesai diketik → putar audio, lalu auto-hide.
  useEffect(() => {
    if (simulate || loading || error) return;
    if (!replyText || typedCount < replyText.length || audioPlayedRef.current) return;
    audioPlayedRef.current = true;
    if (!audioSrc) {
      startExit(15000);
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    a.play()
      .then(() => initVisualizer())
      .catch(() => startExit(15000));
  }, [audioSrc, error, initVisualizer, loading, replyText, simulate, startExit, typedCount]);

  useEffect(() => () => {
    clearTimers();
    stopVisualizer();
    try { void ctxRef.current?.close(); } catch { /* already closed */ }
  }, [clearTimers, stopVisualizer]);

  const fontFamily = `'${font}', sans-serif`;

  const cardProps = {
    theme,
    fontSize,
    accent,
    showAvatar,
    showPlatform,
    showTimestamp,
    timeStr,
    cardBg,
    fxColor,
    spinActive,
    kbTheme,
    kbGlow,
    kbCaps,
    mkText,
    mkDim,
    brutalistBg,
    brutalistTextColor,
    brutalistBadgeBg,
    brutalistBorderColor,
    brutalistShadow,
    brutalistHalftone,
    brutalistTail,
    brutalistItalic,
    brutalistUppercase,
    charDelayMs,
    charDurationS,
  };

  const userAvatar = item?.profilePictureUrl || fallbackAvatar(item?.nickname || 'User');
  const aiItem: SpeakItem = {
    nickname: 'AI',
    comment: error || replyText,
    profilePictureUrl: item?.profilePictureUrl || '',
  };
  const aiStatus = loading ? 'loading' : error ? 'error' : undefined;
  const showAiCard = loading || !!error || !!replyText;
  const aiRowAlign = theme === 'monkey' || theme === 'brutalist'
    ? 'items-start'
    : theme === 'perchar'
      ? 'items-end'
      : 'items-center';
  const avatarFrameStyle: React.CSSProperties = theme === 'brutalist'
    ? {
        width: avatarSize,
        height: avatarSize,
        border: `4px solid ${brutalistBorderColor}`,
        borderRadius: 0,
        background: '#fff',
        padding: 6,
        boxShadow: `${brutalistShadow}px ${brutalistShadow}px 0 0 ${brutalistBorderColor}`,
      }
    : {
        width: avatarSize,
        height: avatarSize,
        border: `3px solid ${accent}`,
        borderRadius: theme === 'island' ? 20 : 14,
        background: cardBg || '#050505',
      };

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent" style={{ fontFamily }}>
      <style>{`${KEYFRAMES_CSS}${PINNED_CHAT_CSS}
        .pinned-font { font-family: '${font}', sans-serif; }
        @keyframes speakFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes speakScaleDemo { from { transform: scale(1); } to { transform: scale(1.2); } }
        @keyframes speakVisualizerPulse { from { opacity: 0.12; box-shadow: inset 0 0 4px ${accent}; } to { opacity: 0.95; box-shadow: inset 0 0 22px ${accent}; } }
        .speak-visualizer-demo { animation: speakVisualizerPulse 0.72s ease-in-out infinite alternate; }
        .speak-visualizer-demo-scale { animation: speakScaleDemo 0.72s ease-in-out infinite alternate; }
        .speak-stack { transition: opacity 1.1s cubic-bezier(0.4,0,0.2,1), transform 1.1s cubic-bezier(0.4,0,0.2,1), filter 1.1s cubic-bezier(0.4,0,0.2,1); }
        .speak-exit { opacity: 0; transform: scale(0.95); filter: blur(10px); pointer-events: none; }
      `}</style>

      <div className="w-full h-full p-8" style={posStyle}>
        {item ? (
          <AutoScale defaultBase={base} baseWidth={base} defaultFitBoth>
            <div
              key={nonce}
              className={`speak-stack${exiting ? ' speak-exit' : ''}${borderFx === 'glow' ? ' pin-fx-glow' : ''}`}
              style={{ '--pin-accent': fxColor } as React.CSSProperties}
            >
              {/* Layout ala neon: pesan user full-width, lalu avatar user + panel balasan AI berdampingan. */}
              <div className="flex w-full flex-col items-stretch" style={{ gap: stackGap }}>
                {showUser && (
                  <div key={`user-${nonce}`} style={{ animation: 'speakFadeUp 0.5s ease-out both' }}>
                    <PinnedChatCard
                      item={item}
                      {...cardProps}
                      showAvatar={false}
                      typedCount={item.comment.length}
                      badge=""
                      showKeyboard={false}
                      fluid
                      noShadow={theme !== 'brutalist'}
                    />
                  </div>
                )}
                {showAiCard && (
                  <div
                    key={`ai-${nonce}-${error ? 'e' : loading ? 'l' : 'r'}`}
                    className={`flex w-full ${aiRowAlign} gap-6`}
                    style={{ animation: 'speakFadeUp 0.5s ease-out 0.5s both' }}
                  >
                    {showAvatar && (
                      <div
                        className="grid shrink-0 place-items-center"
                        style={avatarReaction === 'scale'
                          ? { width: avatarSize * 1.25, height: avatarSize * 1.25 }
                          : { width: avatarSize, height: avatarSize }}
                      >
                        <div
                          ref={avatarFrameRef}
                          className={`relative overflow-hidden${simulate && avatarReaction === 'scale' ? ' speak-visualizer-demo-scale' : ''}`}
                          style={avatarFrameStyle}
                        >
                          <img src={userAvatar} alt={item.nickname} className="w-full h-full object-cover grayscale" />
                          <div
                            ref={setAvatarEl}
                            aria-hidden="true"
                            className={`pointer-events-none absolute inset-0${simulate && avatarReaction === 'light' ? ' speak-visualizer-demo' : ''}`}
                            style={{
                              borderRadius: theme === 'island' ? 16 : theme === 'brutalist' ? 0 : 10,
                              border: `3px solid ${accent}`,
                              boxShadow: `inset 0 0 18px ${accent}`,
                              opacity: simulate && avatarReaction === 'light' ? undefined : 0,
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <PinnedChatCard
                        item={aiItem}
                        {...cardProps}
                        showPlatform={false}
                        showTimestamp={false}
                        typedCount={typedCount}
                        messageOnly
                        fluid
                        noShadow={theme !== 'brutalist'}
                        status={aiStatus}
                        typing={!loading && !error}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AutoScale>
        ) : (
          !obsMode && (
            <div className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">
              {simulate ? 'SIMULATE' : connected ? 'Menunggu Speak dari dock…' : 'Menghubungkan…'}
            </div>
          )
        )}
      </div>

      <audio
        ref={audioRef}
        src={audioSrc || undefined}
        onEnded={() => startExit(hideDelayMs)}
        className="hidden"
      />
    </div>
  );
}

export default function SpeakDisplayPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-transparent" />}>
      <SpeakInner />
    </Suspense>
  );
}
