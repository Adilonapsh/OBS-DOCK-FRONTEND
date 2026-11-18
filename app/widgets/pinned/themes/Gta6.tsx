'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PinnedChatCardProps } from './types';
import { pinnedTypingState, platformLogo, StatusBody } from './shared';

export const themeMeta = { value: 'gta6', label: 'GTA 6' } as const;

const TAIL_W = 10;
const CORNER = 18;
const BUBBLE_FILL = 'rgba(235, 233, 229, 0.92)';

// Satu path utuh (badan rounded + ekor kiri bawah) seperti referensi GTA 6.
function buildBubblePath(w: number, h: number): string {
  if (w <= 0 || h <= 0) return '';
  const totalW = w + TAIL_W;
  const r = CORNER;
  return [
    `M ${TAIL_W + r} 0.5`,
    `H ${totalW - r}`,
    `Q ${totalW - 0.5} 0.5 ${totalW - 0.5} ${r}`,
    `V ${h - r}`,
    `Q ${totalW - 0.5} ${h - 0.5} ${totalW - r} ${h - 0.5}`,
    'H 2.8',
    `C 1.0 ${h - 0.5} 0.5 ${h - 2.3} 2.0 ${h - 3.3}`,
    `C 7.5 ${h - 6.8} ${TAIL_W} ${h - 11.5} ${TAIL_W} ${h - 18}`,
    `V ${r}`,
    `Q ${TAIL_W} 0.5 ${TAIL_W + r} 0.5`,
    'Z',
  ].join(' ');
}

function hexToRgb(input: string): [number, number, number] | null {
  const hex = input.trim().replace(/^#/, '');
  const full = hex.length === 3 || hex.length === 4
    ? hex.split('').map((c) => c + c).join('')
    : hex;
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

// Bubble terang default -> teks gelap. Kalau user memakai bg gelap, teks dibalik.
function inkColors(cardBg?: string) {
  const rgb = cardBg ? hexToRgb(cardBg) : null;
  if (rgb) {
    const luma = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    if (luma < 0.5) return { name: '#f5f5f4', message: '#e4e4e7' };
  }
  return { name: '#18181b', message: '#1f1f23' };
}

function Gta6Avatar({ src, ring, avatarRef }: {
  src?: string;
  ring: string;
  avatarRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <div
      className="shrink-0 rounded-full overflow-hidden"
      style={{ width: 40, height: 40, padding: 2, background: `linear-gradient(to bottom, #d8b4fe, ${ring})` }}
    >
      {src ? (
        <img ref={avatarRef} src={src} alt="" className="w-full h-full rounded-full object-cover" style={{ background: '#e9d5ff' }} />
      ) : (
        <svg viewBox="0 0 64 64" className="w-full h-full rounded-full" style={{ background: '#e9d5ff' }} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 60C14 48 22 44 32 44C42 44 50 48 52 60" fill="#3F3F46" />
          <rect x="27" y="37" width="10" height="9" rx="4" fill="#C68863" />
          <path d="M20 26C20 18 25 14 32 14C39 14 44 18 44 26C44 35 39 41 32 41C25 41 20 35 20 26Z" fill="#D99E78" />
          <path d="M24 24.5C25.5 23.5 27.5 23.5 29 24.5" stroke="#27272A" strokeWidth={1.8} strokeLinecap="round" />
          <path d="M35 24.5C36.5 23.5 38.5 23.5 40 24.5" stroke="#27272A" strokeWidth={1.8} strokeLinecap="round" />
          <circle cx="26.5" cy="27" r="2" fill="#18181B" />
          <circle cx="37.5" cy="27" r="2" fill="#18181B" />
          <circle cx="27.1" cy="26.4" r="0.6" fill="#FFFFFF" />
          <circle cx="38.1" cy="26.4" r="0.6" fill="#FFFFFF" />
          <path d="M27 33.5C29 36 35 36 37 33.5" fill="#FFFFFF" stroke="#27272A" strokeWidth={1.2} strokeLinecap="round" />
          <path d="M24 32C25 38 39 38 40 32" stroke="#3F2E26" strokeWidth={1.6} strokeLinecap="round" fill="none" />
          <path d="M19 21C19 13 24.5 9 32 9C39.5 9 45 13 45 21H19Z" fill="#7F2D36" />
          <circle cx="32" cy="14.5" r="2.2" fill="#FDE047" />
          <path d="M18 20.5C23 18.5 41 18.5 46 20.5C46 22.5 41 23 32 23C23 23 18 22.5 18 20.5Z" fill="#92400E" />
        </svg>
      )}
    </div>
  );
}

// Indikator D-Pad console: tombol atas putih (pin), sisanya abu gelap.
function ConsoleDpad() {
  return (
    <div className="shrink-0" title="D-Pad Up: Pinned Message" style={{ marginBottom: 6 }}>
      <svg width={36} height={36} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 3.5C13 2.67157 13.6716 2 14.5 2H21.5C22.3284 2 23 2.67157 23 3.5V10.5L18 15L13 10.5V3.5Z" fill="#F5F5F4" stroke="#18181B" strokeWidth={2.2} strokeLinejoin="round" />
        <path d="M13 32.5C13 33.3284 13.6716 34 14.5 34H21.5C22.3284 34 23 33.3284 23 32.5V25.5L18 21L13 25.5V32.5Z" fill="#78716C" fillOpacity={0.9} stroke="#18181B" strokeWidth={2.2} strokeLinejoin="round" />
        <path d="M3.5 23C2.67157 23 2 22.3284 2 21.5V14.5C2 13.6716 2.67157 13 3.5 13H10.5L15 18L10.5 23H3.5Z" fill="#78716C" fillOpacity={0.9} stroke="#18181B" strokeWidth={2.2} strokeLinejoin="round" />
        <path d="M32.5 23C33.3284 23 34 22.3284 34 21.5V14.5C34 13.6716 33.3284 13 32.5 13H25.5L21 18L25.5 23H32.5Z" fill="#78716C" fillOpacity={0.9} stroke="#18181B" strokeWidth={2.2} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function Gta6Theme({
  item,
  fontSize,
  accent,
  showAvatar,
  showPlatform,
  showTimestamp,
  timeStr,
  cardBg,
  typedCount,
  status,
  typing = false,
  messageOnly = false,
  fluid = false,
  noShadow = false,
  avatarRef,
}: PinnedChatCardProps) {
  const { visible, showCursor } = pinnedTypingState(item, typing, typedCount, status);
  const ink = inkColors(cardBg);
  const fill = cardBg || BUBBLE_FILL;
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [shape, setShape] = useState({ w: 0, h: 0 });

  // Path bubble digambar ulang setiap ukuran konten berubah (teks mengetik / ganti pesan / resize).
  useEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      setShape((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [item.comment, item.nickname, fill, messageOnly, showAvatar, showPlatform, showTimestamp, fontSize, fluid]);

  const path = buildBubblePath(shape.w, shape.h);
  const nameSize = Math.max(15, Math.round(fontSize * 1.08));
  const maxBubble = fluid || messageOnly ? '100%' : 430;

  return (
    <div
      className={`pinned-font flex items-end max-w-full${fluid ? ' w-full' : ''}${noShadow ? ' pin-no-shadow' : ''}`}
      style={{ gap: 14, '--pin-accent': accent } as CSSProperties}
    >
      {!messageOnly && <ConsoleDpad />}

      <div
        ref={bubbleRef}
        className="relative"
        style={{
          marginLeft: messageOnly ? 0 : 8,
          maxWidth: maxBubble,
          padding: messageOnly ? '14px 20px' : '15px 22px',
          borderRadius: path ? 0 : CORNER,
          background: path ? 'transparent' : fill,
          // filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.24)) drop-shadow(0 2px 5px rgba(0,0,0,0.1))',
          transformOrigin: 'bottom left',
        }}
      >
        <svg
          aria-hidden="true"
          width={Math.max(1, shape.w + TAIL_W)}
          height={Math.max(1, shape.h)}
          style={{ position: 'absolute', top: 0, left: -TAIL_W, zIndex: 0, pointerEvents: 'none', overflow: 'visible' }}
        >
          <path d={path} fill={fill} stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
        </svg>

        <div className="relative" style={{ zIndex: 1 }}>
          {!messageOnly && (
            <div className="flex items-center min-w-0" style={{ gap: 12, marginBottom: 8 }}>
              {showAvatar && <Gta6Avatar src={item.profilePictureUrl} ring={accent} avatarRef={avatarRef} />}
              <span
                className="truncate"
                style={{ fontSize: nameSize, fontWeight: 800, color: ink.name, letterSpacing: '-0.02em', lineHeight: 1 }}
              >
                {item.nickname}
              </span>
              {showPlatform && item.platform && (
                <img
                  src={platformLogo(item.platform)}
                  alt=""
                  className="shrink-0"
                  style={{ width: 14, height: 14, borderRadius: 4, objectFit: 'contain', background: '#fff', padding: 1, opacity: 0.9 }}
                />
              )}
              {showTimestamp && (
                <span className="shrink-0" style={{ fontSize: 10, color: ink.message, opacity: 0.55, fontFamily: 'monospace' }}>{timeStr}</span>
              )}
            </div>
          )}

          <p
            style={{
              margin: 0,
              fontSize,
              fontWeight: 600,
              color: ink.message,
              lineHeight: 1.35,
              letterSpacing: '-0.01em',
              overflowWrap: 'anywhere',
              whiteSpace: 'pre-wrap',
            }}
          >
            {status ? (
              <StatusBody status={status} text={item.comment} />
            ) : (
              <>
                {visible}
                {showCursor && <span className="pin-type-cursor" />}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
