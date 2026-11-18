'use client';

import type { CSSProperties } from 'react';
import { contrastRatio, hexToRgba, readableOn } from '../utils/color';
import type { LyricLine, LyricsStatus } from '../utils/lyrics';

type SyncedLyricsProps = {
  lyrics: LyricLine[];
  plainLyrics: string;
  activeIndex: number;
  accent: string;
  bgColor: string;
  textColor: string;
  fontSize?: number;
  maxLines?: number;
  align?: string;
  variant?: 'glass' | 'light' | 'brutalist';
  loading?: boolean;
  status?: LyricsStatus;
  debug?: boolean;
  className?: string;
};

function alignClass(align?: string): string {
  if (align === 'left') return 'text-left';
  if (align === 'right') return 'text-right';
  return 'text-center';
}

export function SyncedLyrics({
  lyrics,
  plainLyrics,
  activeIndex,
  accent,
  bgColor,
  textColor,
  fontSize = 16,
  maxLines = 3,
  align = 'center',
  variant = 'glass',
  loading = false,
  status = 'idle',
  debug = false,
  className = '',
}: SyncedLyricsProps) {
  const max = Math.max(1, Math.min(8, Math.floor(maxLines) || 3));
  const safeFont = Math.max(10, Math.min(48, Math.floor(fontSize) || 16));
  const alignCls = alignClass(align);
  const plainLines = (plainLyrics || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const hasSynced = lyrics.length > 0;
  const hasPlain = plainLines.length > 0;

  if (!hasSynced && !hasPlain) {
    if (!debug) return null;
    if (!loading && status !== 'none' && status !== 'error') return null;
    return (
      <div
        className={`text-center text-[10px] font-semibold tracking-wide ${className}`}
        style={{ color: textColor, opacity: 0.55 }}
      >
        {loading ? '♪ Mencari lirik…' : status === 'error' ? '♪ Gagal memuat lirik' : '♪ Lirik tidak ditemukan'}
      </div>
    );
  }

  const safeAccent = accent && accent !== 'transparent' ? accent : '#22c55e';
  const brutalist = variant === 'brutalist';
  const light = variant === 'light';
  const activeText = brutalist
    ? contrastRatio('#000000', safeAccent) >= contrastRatio('#ffffff', safeAccent)
      ? '#000000'
      : '#ffffff'
    : light
      ? readableOn('#ffffff', safeAccent, 3, '#111827', '#111827')
      : readableOn(bgColor, safeAccent, 3, textColor, textColor);

  const cardStyle: CSSProperties = brutalist
    ? {
        color: '#000000',
        background: '#ffffff',
        borderColor: '#000000',
        boxShadow: '5px 5px 0 #000000',
      }
    : light
      ? {
          color: '#111827',
          background: 'rgba(255,255,255,0.92)',
          borderColor: hexToRgba(safeAccent, 35),
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        }
      : {
          color: textColor,
          background: hexToRgba(bgColor || '#111827', 76),
          borderColor: hexToRgba(safeAccent, 42),
          boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
        };

  const cardClass = brutalist
    ? 'rounded-none border-[4px]'
    : 'rounded-2xl border backdrop-blur-md';

  const start = hasSynced && activeIndex >= 0 ? Math.floor(activeIndex / max) * max : 0;
  const windowLines = hasSynced ? lyrics.slice(start, start + max) : [];
  // Keep the panel height stable while lyrics page through. Without this the
  // last page (fewer lines) makes the widget jump in OBS.
  const minHeight = Math.round(max * safeFont * 1.3 + 20);

  return (
    <div
      className={`relative flex w-full min-w-0 flex-col justify-center overflow-hidden px-3.5 py-2.5 ${cardClass} ${className}`}
      style={{ ...cardStyle, minHeight: `${minHeight}px` }}
    >
      {hasSynced ? (
        <div className={`flex flex-col gap-1 ${alignCls}`}>
          {windowLines.map((line, i) => {
            const index = start + i;
            const active = index === activeIndex;
            return (
              <div
                key={`${index}-${line.timeMs}`}
                className={`w-full leading-tight transition-[color,opacity,transform] duration-300 ${
                  active ? 'font-black' : 'font-semibold'
                }`}
                style={{
                  fontSize: `${safeFont}px`,
                  color: brutalist
                    ? active
                      ? activeText
                      : '#000000'
                    : active
                      ? activeText
                      : light
                        ? '#111827'
                        : textColor,
                  opacity: active ? 1 : 0.52,
                  transform: active ? 'scale(1.01)' : 'none',
                  textShadow: brutalist || light ? 'none' : active ? '0 1px 8px rgba(0,0,0,0.35)' : 'none',
                  ...(brutalist
                    ? { background: active ? safeAccent : 'transparent', padding: '1px 5px' }
                    : {}),
                }}
              >
                {line.text || '♪'}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={`${alignCls} leading-relaxed`}
          style={{
            fontSize: `${safeFont}px`,
            color: brutalist ? '#000000' : light ? '#111827' : textColor,
            opacity: 0.85,
          }}
        >
          {plainLines.slice(0, max).join('  •  ')}
        </div>
      )}
    </div>
  );
}
