'use client';

import { useEffect, useRef, useState } from 'react';
import type { GoalThemeProps } from './types';

// GameHud - gaya HUD game / RPG: ikon dalam lingkaran bergaris tebal,
// label uppercase, dan bar progress ber-border hitam tebal dengan fill warna.
// Cocok untuk donation goal (nominal otomatis diformat Rp) maupun follow/subs/like.

type IconName = 'heart' | 'bolt' | 'eye' | 'star' | 'coin';

const HUD_BORDER = '#181618';
const HUD_CIRCLE_BG = '#2a272a';

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = String(hex || '').replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (!Number.isFinite(n) || full.length !== 6) return [244, 179, 200];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Track bar tetap gelap tapi ikut warna accent supaya nyatu dengan fill.
function trackColor(accent: string): string {
  const [r, g, b] = hexToRgb(accent);
  const base = [34, 28, 32];
  const ratio = 0.22;
  const mix = (a: number, c: number) => Math.round(a * ratio + c * (1 - ratio));
  return `rgba(${mix(r, base[0])}, ${mix(g, base[1])}, ${mix(b, base[2])}, 0.9)`;
}

function resolveIcon(icon: string | undefined, goalType: string): IconName {
  if (icon && icon !== 'auto') {
    if (['heart', 'bolt', 'eye', 'star', 'coin'].includes(icon)) return icon as IconName;
  }
  if (goalType === 'subs') return 'bolt';
  if (goalType === 'follow') return 'star';
  return 'heart';
}

function HudIcon({ name }: { name: IconName }) {
  switch (name) {
    case 'bolt':
      return <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />;
    case 'eye':
      return <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />;
    case 'star':
      return <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />;
    case 'coin':
      return (
        <>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <path d="M12 6.5v11M9.5 9.5h4a2.25 2.25 0 0 1 0 4.5h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </>
      );
    case 'heart':
    default:
      return <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />;
  }
}

function formatValue(n: number, donation: boolean): string {
  const value = Math.max(0, Math.floor(n));
  const text = value.toLocaleString('id-ID');
  return donation ? `Rp ${text}` : text;
}

export default function GameHud({
  title,
  current,
  target,
  percent,
  goalType,
  font,
  fontSize,
  accent,
  bg,
  showLabel,
  showCounts,
  showBar,
  hudIcon,
  hudSegment = false,
  hudEndCap = true,
}: GoalThemeProps) {
  const pct = clampPct(percent);
  const color = accent || '#f4b3c8';
  const donation = goalType === 'donation';
  const iconName = resolveIcon(hudIcon, goalType);

  const [flash, setFlash] = useState(false);
  const prevCurrent = useRef(current);

  // Efek kilau singkat saat progress bertambah (donasi/follow masuk).
  useEffect(() => {
    if (current === prevCurrent.current) return;
    const grew = current > prevCurrent.current;
    prevCurrent.current = current;
    if (!grew) return;
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 650);
    return () => window.clearTimeout(t);
  }, [current]);

  const fontFamily = `'${font}', 'Inter', sans-serif`;
  const iconSize = Math.max(36, Math.min(64, Math.round(fontSize * 2.8)));
  const barHeight = Math.max(22, Math.round(fontSize * 1.7));
  const labelSize = Math.max(10, fontSize - 2);
  const amountSize = Math.max(10, fontSize - 2);
  const bgColor = bg && bg !== 'transparent' ? bg : undefined;
  const done = pct >= 100;

  return (
    <div className="w-full max-w-[620px] select-none" style={{ fontFamily, background: bgColor, borderRadius: bgColor ? 12 : 0, padding: bgColor ? 10 : 0, boxSizing: 'border-box' }}>
      <style>{`
        @keyframes hud-bar-flash { 0% { filter: brightness(1); } 30% { filter: brightness(1.6); } 100% { filter: brightness(1); } }
        @keyframes hud-icon-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        .hud-bar-flash { animation: hud-bar-flash 0.6s ease-out; }
        .hud-icon-pulse { animation: hud-icon-pulse 1.5s infinite ease-in-out; }
      `}</style>

      <div className="flex items-center" style={{ gap: Math.max(10, Math.round(fontSize * 0.85)) }}>
        {/* Lingkaran ikon */}
        <div
          className={`relative shrink-0 flex items-center justify-center ${done ? 'hud-icon-pulse' : ''}`}
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: '9999px',
            backgroundColor: HUD_CIRCLE_BG,
            border: `3px solid ${HUD_BORDER}`,
            boxSizing: 'border-box',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: Math.round(iconSize * 0.52), height: Math.round(iconSize * 0.52), color, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
          >
            <HudIcon name={iconName} />
          </svg>
        </div>

        {/* Label + bar */}
        <div className="flex-1 min-w-0 flex flex-col">
          {(showLabel || showCounts) && (
            <div
              className="flex items-end justify-between px-0.5"
              style={{ marginBottom: Math.max(4, Math.round(fontSize * 0.25)), gap: 8 }}
            >
              {showLabel ? (
                <span
                  className="font-extrabold uppercase tracking-wide truncate"
                  style={{ color: '#fff', fontSize: labelSize, lineHeight: 1.2, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {title}
                </span>
              ) : (
                <span />
              )}
              {showCounts && (
                <span
                  className="font-extrabold tabular-nums whitespace-nowrap shrink-0"
                  style={{ color, fontSize: amountSize, lineHeight: 1.2 }}
                >
                  {formatValue(current, donation)} / {formatValue(target, donation)}
                </span>
              )}
            </div>
          )}

          {showBar && (
            <div
              className="relative w-full overflow-hidden"
              style={{
                height: barHeight,
                backgroundColor: trackColor(color),
                border: `3px solid ${HUD_BORDER}`,
                boxSizing: 'border-box',
              }}
            >
              <div
                className={`h-full relative ${flash ? 'hud-bar-flash' : ''}`}
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                  transition: 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.3s ease',
                }}
              >
                {hudEndCap && pct > 0 && (
                  <div
                    className="absolute top-0 bottom-0 right-0"
                    style={{ width: 3, backgroundColor: 'rgba(255,255,255,0.8)' }}
                  />
                )}
              </div>

              {hudSegment && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{ left: '50%', width: 3, marginLeft: -1.5, backgroundColor: HUD_BORDER, zIndex: 10 }}
                />
              )}
            </div>
          )}

          {!showBar && showCounts && !showLabel && (
            <div className="text-right font-extrabold tabular-nums" style={{ color, fontSize: amountSize, }}>
              {formatValue(current, donation)} / {formatValue(target, donation)} ({pct}%)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
