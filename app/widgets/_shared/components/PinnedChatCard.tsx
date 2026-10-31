'use client';

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, ReactNode } from 'react';

// Satu renderer tema pinned chat, dipakai widget Pinned dan Speak supaya
// tampilan keduanya benar-benar sama (standard/minimal/perchar/monkey/island/plain/brutalist).

export type PinnedCardItem = {
  nickname: string;
  comment: string;
  profilePictureUrl?: string;
  platform?: string;
};

export type PinnedCardStatus = 'loading' | 'error';

type KbKey = { d: string; m?: string; sub?: string; w?: number; dark?: boolean };

const KB60: KbKey[][] = [
  [{ d: 'Esc', dark: true }, ...'1234567890'.split('').map((c, i) => ({ d: c, m: c, sub: '!@#$%^&*()'[i] })), { d: '⌫', dark: true, w: 1.6 }],
  [{ d: 'Tab', w: 1.6 }, ...'QWERTYUIOP'.split('').map((c) => ({ d: c, m: c })), { d: 'Del', w: 1.4 }],
  [{ d: 'Caps', w: 1.8 }, ...'ASDFGHJKL'.split('').map((c) => ({ d: c, m: c })), { d: '⏎', dark: true, w: 1.8 }],
  [{ d: '⇧', w: 2 }, ...'ZXCVBNM'.split('').map((c) => ({ d: c, m: c })), { d: '⇧', w: 2 }],
  [{ d: 'Ctrl', w: 1.4 }, { d: 'Alt', dark: true, w: 1.4 }, { d: 'space', m: ' ', w: 6 }, { d: 'Alt', dark: true, w: 1.4 }, { d: 'Ctrl', w: 1.4 }],
];

export function platformLogo(p?: string): string {
  const v = (p || 'tiktok').toLowerCase();
  if (v.includes('tiktok')) return '/assets/logo/tik-tok.png';
  if (v.includes('youtube') || v === 'yt') return '/assets/logo/youtube.png';
  if (v.includes('twitch')) return '/assets/logo/twitch.png';
  if (v.includes('kick')) return '/assets/logo/sbot.png';
  return '/assets/logo/tik-tok.png';
}

export function pinnedBaseWidth(theme: string): number {
  if (theme === 'island') return 360;
  if (theme === 'minimal' || theme === 'plain') return 560;
  if (theme === 'card') return 380;
  return 420;
}

// Bungkus bubble saja dengan outline berputar (bukan seluruh card)
function SpinWrap({ active, accent, radius, solid, children }: {
  active: boolean;
  accent: string;
  radius: string;
  solid?: boolean;
  children: ReactNode;
}) {
  if (!active) return <>{children}</>;
  return (
    <div className="pin-fx-spin" style={{ '--pin-accent': accent, borderRadius: radius } as CSSProperties}>
      <div className={`pin-fx-inner${solid ? ' pin-fx-inner-solid' : ''}`} style={{ borderRadius: `calc(${radius} - 2px)` }}>
        {children}
      </div>
    </div>
  );
}

function StatusBody({ status, text }: { status?: PinnedCardStatus; text: string }) {
  if (status === 'loading') {
    return <span className="pin-card-dots"><span /><span /><span /></span>;
  }
  if (status === 'error') {
    return <span className="pin-card-error">{text}</span>;
  }
  return null;
}

export type PinnedChatCardProps = {
  item: PinnedCardItem;
  theme: string;
  fontSize: number;
  accent: string;
  showAvatar: boolean;
  showPlatform: boolean;
  showTimestamp: boolean;
  timeStr: string;
  cardBg?: string;
  fxColor: string;
  spinActive: boolean;
  kbTheme: string;
  kbGlow: boolean;
  kbCaps: string;
  mkText: string;
  mkDim: string;
  brutalistBg: string;
  brutalistTextColor: string;
  brutalistBadgeBg: string;
  brutalistBorderColor: string;
  brutalistShadow: number;
  brutalistHalftone: boolean;
  brutalistTail: boolean;
  brutalistItalic: boolean;
  brutalistUppercase: boolean;
  charDelayMs: number;
  charDurationS: number;
  typedCount?: number;
  badge?: string;
  status?: PinnedCardStatus;
  typing?: boolean;
  showKeyboard?: boolean;
  // Hanya tampilkan isi pesan (tanpa username/avatar/badge) - dipakai panel balasan AI.
  messageOnly?: boolean;
  // Lebar mengikuti container (dipakai Speak supaya user card & AI row selebar yang sama).
  fluid?: boolean;
  // Hilangkan shadow tema non-brutalist (brutalist tetap memakai drop shadow).
  noShadow?: boolean;
  avatarRef?: (el: HTMLElement | null) => void;
};

export function PinnedChatCard({
  item,
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
  typedCount,
  badge = 'Pin',
  status,
  typing = false,
  showKeyboard = true,
  messageOnly = false,
  fluid = false,
  noShadow = false,
  avatarRef,
}: PinnedChatCardProps) {
  const count = typedCount ?? item.comment.length;
  const visible = typing ? item.comment.slice(0, count) : item.comment;
  const showCursor = typing && !status && count < item.comment.length;

  if (theme === 'monkey' || theme === 'typing') {
    return (
      <div className={`pinned-font flex flex-col gap-2 ${fluid ? 'w-full' : 'w-[420px]'} max-w-[90vw]${noShadow ? ' pin-no-shadow' : ''}`}>
        {!messageOnly && (
          <div className="flex items-center gap-2">
            <span className="pin-pc-username">{item.nickname}</span>
            {showTimestamp && <span className="text-white/40 text-[10px] font-mono shrink-0">{timeStr}</span>}
          </div>
        )}
        <div className="font-bold break-words leading-relaxed" style={{ fontSize: fontSize + 4, fontFamily: `'JetBrains Mono', ui-monospace, monospace`, '--pin-mk-text': mkText, '--pin-mk-dim': mkDim } as CSSProperties}>
          {status ? (
            <StatusBody status={status} text={item.comment} />
          ) : (
            <>
              {[...item.comment].map((ch, i) => (
                <span key={i} className={`pin-mk-char${i < count ? ' done' : ''}`}>{ch}</span>
              ))}
              {count < item.comment.length && <span className="pin-mk-caret" style={{ '--pin-accent': fxColor } as CSSProperties} />}
            </>
          )}
        </div>
        {showKeyboard && (
          <div className="w-full" style={{ '--pin-accent': fxColor } as CSSProperties}>
            <div className={`pin-kb${kbTheme === 'light' ? ' kb-light' : kbTheme === 'cyber' ? ' kb-cyber' : ''}${kbGlow ? ' glow' : ''} kb-cap-${kbCaps}`}>
              {KB60.map((row, ri) => {
                const done = status || count >= item.comment.length;
                const cur = done ? '' : (item.comment[count - 1] || '').toUpperCase();
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
        )}
      </div>
    );
  }

  if (theme === 'island') {
    return (
      <div className={`pinned-font ${fluid ? 'w-full' : 'w-[360px]'} max-w-[90vw]${noShadow ? ' pin-no-shadow' : ''}`}>
        <div className="pin-island px-4 py-3 flex items-center gap-3">
          {messageOnly ? (
            <span className="pin-island-dot shrink-0" style={{ background: accent }} />
          ) : showAvatar ? (
            <img ref={avatarRef} src={item.profilePictureUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <span className="pin-island-dot shrink-0" style={{ background: accent }} />
          )}
          <div className="flex-1 min-w-0">
            {!messageOnly && (
              <div className="flex items-center gap-1.5">
                <span className="text-white font-black truncate" style={{ fontSize }}>{item.nickname}</span>
                {showPlatform && item.platform && (
                  <img src={platformLogo(item.platform)} alt={item.platform} className="w-3.5 h-3.5 rounded-full object-contain bg-white p-0.5 shrink-0" />
                )}
                {showTimestamp && <span className="text-white/40 text-[9px] font-mono shrink-0">{timeStr}</span>}
              </div>
            )}
            <div className={`text-white/85 font-bold ${messageOnly ? 'break-words' : 'truncate'}`} style={{ fontSize: Math.max(11, fontSize - 2) }}>
              {status ? <StatusBody status={status} text={item.comment} /> : <>{visible}{showCursor && <span className="pin-type-cursor" />}</>}
            </div>
          </div>
          {!messageOnly && <span className="pin-island-dot shrink-0" style={{ background: accent }} />}
        </div>
      </div>
    );
  }

  if (theme === 'perchar') {
    return (
      <div className={`pinned-font flex flex-col gap-1.5 ${fluid ? 'w-full' : 'max-w-[420px]'}${noShadow ? ' pin-no-shadow' : ''}`}>
        {!messageOnly && (
          <div className="pin-pc-meta">
            {showPlatform && item.platform && (
              <img src={platformLogo(item.platform)} alt={item.platform} className="w-[22px] h-[22px] rounded-md object-contain bg-white p-0.5 shrink-0" />
            )}
            <span className="pin-pc-username">{item.nickname}</span>
            {showTimestamp && <span className="text-white/40 text-[10px] font-mono shrink-0">{timeStr}</span>}
          </div>
        )}
        <div className="flex items-end gap-2.5">
          {!messageOnly && showAvatar && (
            <img ref={avatarRef} src={item.profilePictureUrl} alt="" className="pin-pc-avatar" style={avatarRef ? { animation: 'none' } : undefined} />
          )}
          <SpinWrap active={spinActive} accent={fxColor} radius="20px">
            <div className="pin-pc-bubble" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, fontSize }}>
              {status ? (
                <StatusBody status={status} text={item.comment} />
              ) : typing ? (
                <>{visible}{showCursor && <span className="pin-type-cursor" />}</>
              ) : (
                [...item.comment].map((ch, i) => (
                  <span key={i} className="pin-pc-char" style={{ animationDelay: `${(i * charDelayMs) / 1000}s`, animationDuration: `${charDurationS}s` }}>{ch}</span>
                ))
              )}
            </div>
          </SpinWrap>
        </div>
      </div>
    );
  }

  if (theme === 'minimal') {
    return (
      <SpinWrap active={spinActive} accent={fxColor} radius="12px">
        <div className={`pinned-font flex items-center gap-2 px-3 ${messageOnly ? 'py-4' : 'py-2'} bg-black/60 border-l-4 rounded-r-xl ${fluid ? 'w-full max-w-full' : 'max-w-[560px]'}${noShadow ? ' pin-no-shadow' : ''}`} style={{ borderColor: accent, ...(cardBg ? { background: cardBg } : {}) }}>
          {!messageOnly && showAvatar && (
            <img ref={avatarRef} src={item.profilePictureUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            {!messageOnly && (
              <div className="flex items-center gap-1.5">
                <span className="text-white font-black truncate" style={{ fontSize: fontSize - 2 }}>{item.nickname}</span>
                {showPlatform && item.platform && (
                  <img src={platformLogo(item.platform)} alt={item.platform} className="w-3.5 h-3.5 rounded-full object-contain bg-white p-0.5 shrink-0" />
                )}
                {showTimestamp && <span className="text-white/40 text-[9px] font-mono shrink-0">{timeStr}</span>}
                {badge && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: `${accent}33`, color: accent }}>{badge}</span>}
              </div>
            )}
            <div className="text-white/90 font-bold break-words" style={{ fontSize }}>
              {status ? <StatusBody status={status} text={item.comment} /> : <>{visible}{showCursor && <span className="pin-type-cursor" />}</>}
            </div>
          </div>
        </div>
      </SpinWrap>
    );
  }

  if (theme === 'brutalist') {
    return (
      <div
        className={`${fluid ? 'w-full' : 'w-[420px]'} max-w-[90vw] flex flex-row gap-4 items-start${noShadow ? ' pin-no-shadow' : ''}`}
        style={{ paddingBottom: ((brutalistTail && !messageOnly) ? 32 : 0) + (noShadow ? 0 : brutalistShadow + 2), paddingRight: noShadow ? 0 : brutalistShadow + 4 }}
      >
        {!messageOnly && showAvatar && (
          <div ref={avatarRef} className="block shrink-0 mt-1.5 overflow-hidden" style={{ border: `4px solid ${brutalistBorderColor}`, backgroundColor: '#FFFFFF', boxShadow: `3px 3px 0px 0px ${brutalistBorderColor}`, width: 44, height: 44 }}>
            <img src={item.profilePictureUrl} alt="" className="w-10 h-10 object-cover rotate-[-2deg] scale-110" onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nickname)}&background=222&color=fff`; }} />
          </div>
        )}
        <div className="flex flex-col gap-0 max-w-full items-start flex-1 min-w-0">
          {!messageOnly && (
            <div className="flex flex-row flex-wrap items-center gap-2 px-3 py-1 mb-[-4px] z-20 rotate-[-1deg]" style={{ border: `4px solid ${brutalistBorderColor}`, backgroundColor: brutalistBadgeBg, color: brutalistTextColor, fontSize: 12, fontWeight: 800, fontFamily: `'Outfit', sans-serif`, boxShadow: `4px 4px 0px 0px ${brutalistBorderColor}` }}>
              <span>{item.nickname}</span>
              {showPlatform && item.platform && <img src={platformLogo(item.platform)} alt={item.platform} style={{ width: 14, height: 14, objectFit: 'contain' }} />}
              {showTimestamp && <span className="text-[10px] font-mono" style={{ color: brutalistTextColor, opacity: 0.6 }}>{timeStr}</span>}
            </div>
          )}
          <div className="relative p-4 px-6 w-full" style={{ border: `4px solid ${brutalistBorderColor}`, backgroundColor: brutalistBg, color: brutalistTextColor, boxShadow: `${brutalistShadow}px ${brutalistShadow}px 0px 0px ${brutalistBorderColor}`, fontStyle: brutalistItalic ? 'italic' : 'normal', textTransform: brutalistUppercase ? 'uppercase' : 'none', fontWeight: 700, fontSize }}>
            {brutalistHalftone && <div className="absolute inset-0 z-0 pointer-events-none" style={{ opacity: 0.05, backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '6px 6px' }} />}
            {brutalistTail && !messageOnly && (
              <>
                <div className="absolute w-8 h-8 left-10 -bottom-8" style={{ backgroundColor: brutalistBorderColor, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
                <div className="absolute w-8 h-8 left-10 -bottom-8 translate-y-[-4px]" style={{ backgroundColor: brutalistBg, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
              </>
            )}
            <div className="relative z-10" style={{ wordBreak: 'break-word' }}>
              {status ? <StatusBody status={status} text={item.comment} /> : <>{visible}{showCursor && <span className="pin-type-cursor" />}</>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (theme === 'plain') {
    return (
      <div className={`pinned-font ${fluid ? 'w-full max-w-full' : 'max-w-[560px]'}${noShadow ? ' pin-no-shadow' : ''}`} style={{ animation: 'fadeIn 0.4s ease both' }}>
        {!messageOnly && <div className="font-black leading-none" style={{ fontSize, color: accent }}>{item.nickname}</div>}
        <div className={`text-white font-bold break-words leading-relaxed ${messageOnly ? '' : 'mt-1'}`} style={{ fontSize: fontSize + 1 }}>
          {status ? <StatusBody status={status} text={item.comment} /> : <>{visible}{showCursor && <span className="pin-type-cursor" />}</>}
        </div>
        {!messageOnly && showTimestamp && <div className="text-white/40 text-[10px] font-mono mt-1">{timeStr}</div>}
      </div>
    );
  }

  return (
    <div className={`pinned-font ${fluid ? 'w-full' : 'w-[380px]'} max-w-[90vw] rounded-2xl overflow-hidden border border-white/10 backdrop-blur-md shadow-2xl${noShadow ? ' pin-no-shadow' : ''}`} style={{ ...(cardBg ? { background: cardBg } : { background: 'rgba(0,0,0,0.7)' }) }}>
      {!messageOnly && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10" style={{ background: `${accent}22` }}>
          {showAvatar && (
            <img ref={avatarRef} src={item.profilePictureUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/20" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-black truncate" style={{ fontSize }}>{item.nickname}</span>
              {showPlatform && item.platform && (
                <img src={platformLogo(item.platform)} alt={item.platform} className="w-4 h-4 rounded-full object-contain bg-white p-0.5 shrink-0" />
              )}
              {showTimestamp && <span className="text-white/40 text-[9px] font-mono shrink-0">{timeStr}</span>}
            </div>
          </div>
          {badge && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full text-black shrink-0" style={{ background: accent }}>{badge}</span>}
        </div>
      )}
      <SpinWrap active={spinActive} accent={fxColor} radius="12px" solid>
        <div className={`${messageOnly ? 'px-5 py-4' : 'px-3 py-2.5'} text-white font-bold break-words leading-relaxed`} style={{ fontSize: fontSize + 1 }}>
          {status ? <StatusBody status={status} text={item.comment} /> : <>{visible}{showCursor && <span className="pin-type-cursor" />}</>}
        </div>
      </SpinWrap>
    </div>
  );
}

export const PINNED_CHAT_CSS = `
  /* Pinned & Speak: shadow tema non-brutalist dihilangkan; brutalist tetap memakai drop shadow. */
  .pin-no-shadow, .pin-no-shadow * { box-shadow: none !important; }
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
  .pin-card-dots { display: inline-flex; align-items: center; gap: 6px; }
  .pin-card-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--pin-accent, #8b5cf6); animation: pinCardDot 1.2s infinite ease-in-out; }
  .pin-card-dots span:nth-child(2) { animation-delay: 0.18s; }
  .pin-card-dots span:nth-child(3) { animation-delay: 0.36s; }
  @keyframes pinCardDot { 0%, 100% { transform: scale(0.55); opacity: 0.35; } 50% { transform: scale(1); opacity: 1; } }
  .pin-card-error { display: inline-block; color: #ef4444; font-weight: 800; }
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
  @keyframes pinFxSpin { to { transform: rotate(360deg); } }
`;
