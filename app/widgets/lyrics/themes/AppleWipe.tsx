'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { LyricsThemeProps } from './types';

// AppleWipe - lirik gaya Apple Music: teks tebal, baris non-aktif blur + meredup,
// baris aktif menyala dengan sapuan karaoke (wipe) dari kiri ke kanan.
// Tanpa background/card - hanya teks, cocok untuk OBS overlay transparan.

export const themeMeta = { value: 'apple-wipe', label: 'Apple Music - Karaoke Wipe' } as const;

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function withAlpha(color: string, alpha: number): string {
  const c = String(color || '#ffffff').trim();
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].split('').map((ch) => ch + ch).join('') : hex[1];
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const rgb = c.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1].split(',').map((p) => p.trim());
    return `rgba(${parts[0] ?? 255}, ${parts[1] ?? 255}, ${parts[2] ?? 255}, ${alpha})`;
  }
  return `rgba(255, 255, 255, ${alpha})`;
}

type LineLevel = 'active' | 'near' | 'far' | 'very-far';

function levelFor(distance: number): LineLevel {
  if (distance === 0) return 'active';
  if (distance <= 2) return 'near';
  if (distance <= 5) return 'far';
  return 'very-far';
}

export default function AppleWipeTheme({
  lyrics,
  activeIndex,
  plainLyrics,
  lyricsAlign,
  lyricsFontSize,
  maxLyricsLines,
  currentPos,
  textColor,
  lyricsAltAlign = true,
  lyricsKaraoke = true,
  lyricsBlur = true,
  lyricsGlow = true,
  lyricsTextColor = '',
}: LyricsThemeProps) {
  const baseColor = lyricsTextColor && lyricsTextColor !== 'transparent'
    ? lyricsTextColor
    : textColor && textColor !== 'transparent' ? textColor : '#ffffff';
  const visibleLines = Math.max(1, maxLyricsLines);
  const fontSize = Math.max(12, lyricsFontSize);
  const safeActive = lyrics.length ? (activeIndex < 0 ? -1 : Math.min(activeIndex, lyrics.length - 1)) : -1;
  const started = safeActive >= 0;

  const lineHeight = Math.round(fontSize * 1.32);
  const gap = Math.round(fontSize * 0.55);
  const containerHeight = lineHeight * visibleLines + gap * (visibleLines - 1);
  const targetY = containerHeight / 2;

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [shift, setShift] = useState(0);
  const [ready, setReady] = useState(false);

  const recalc = useCallback(() => {
    const container = containerRef.current;
    const el = safeActive >= 0 ? lineRefs.current[safeActive] : lineRefs.current[0];
    if (!container || !el) return;
    const center = el.offsetTop + el.offsetHeight / 2;
    setShift(targetY - center);
  }, [safeActive, targetY]);

  useIsoLayoutEffect(() => {
    recalc();
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [recalc]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => recalc());
    ro.observe(container);
    return () => ro.disconnect();
  }, [recalc]);

  // Progress karaoke: ikuti durasi baris aktif sampai baris berikutnya.
  // 108% supaya teks sudah full putih sedikit sebelum baris berganti.
  let wipePct = 0;
  if (started) {
    const line = lyrics[safeActive];
    const next = lyrics[safeActive + 1];
    const start = line?.timeMs ?? 0;
    const end = next ? next.timeMs : start + 4000;
    const duration = Math.max(400, end - start);
    wipePct = clamp01((currentPos - start) / duration) * 108;
  }

  const alignOf = (index: number): 'left' | 'center' | 'right' => {
    if (lyricsAltAlign) return Math.floor(index / 4) % 2 === 0 ? 'right' : 'left';
    return lyricsAlign === 'center' ? 'center' : lyricsAlign === 'right' ? 'right' : 'left';
  };

  if (!lyrics.length) {
    const align = lyricsAlign === 'center' ? 'center' : lyricsAlign === 'right' ? 'right' : 'left';
    if (!plainLyrics) {
      return (
        <div
          className="w-full text-center"
          style={{ color: withAlpha(baseColor, 0.4), fontSize: Math.max(12, fontSize - 3), fontStyle: 'italic', fontWeight: 600 }}
        >
          ♪ instrumental - no lyrics ♪
        </div>
      );
    }
    return (
      <div
        className="w-full"
        style={{
          color: withAlpha(baseColor, 0.85),
          fontSize: `${fontSize}px`,
          fontWeight: 800,
          lineHeight: 1.35,
          letterSpacing: '-0.02em',
          textAlign: align,
          whiteSpace: 'pre-line',
        }}
      >
        {plainLyrics.split('\n').slice(0, visibleLines).join('\n')}
      </div>
    );
  }

  return (
    <div className="apple-wipe-theme w-full">
      <style>{`
        @property --apple-wipe {
          syntax: '<percentage>';
          inherits: false;
          initial-value: 0%;
        }
        .apple-wipe-line {
          transition: opacity 0.65s ease, filter 0.65s ease, transform 0.65s ease;
        }
        .apple-wipe-text {
          transition: --apple-wipe 0.3s linear;
        }
      `}</style>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{
          height: containerHeight,
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 9%, black 91%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 9%, black 91%, transparent 100%)',
        }}
      >
        <div
          className="relative"
          style={{
            transform: `translate3d(0, ${shift}px, 0)`,
            transition: ready ? 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
            willChange: 'transform',
          }}
        >
          {lyrics.map((line, i) => {
            const distance = Math.abs(i - safeActive);
            const isActive = started && i === safeActive;
            const level = started ? levelFor(distance) : 'far';
            const align = alignOf(i);
            const opacity = !lyricsBlur ? (isActive ? 1 : 0.55) : level === 'near' ? 0.42 : level === 'far' ? 0.25 : 0.12;
            const blur = !lyricsBlur ? 0 : level === 'near' ? 0.6 : level === 'far' ? 1.4 : 2.4;
            const scale = isActive ? 1.05 : level === 'near' ? 0.98 : level === 'far' ? 0.96 : 0.94;
            const justify = align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start';
            const filter = `blur(${isActive ? 0 : blur}px)${isActive && lyricsGlow && wipePct > 1 ? ` drop-shadow(0 0 14px ${withAlpha(baseColor, 0.25)})` : ''}`;
            const useWipe = isActive && lyricsKaraoke;
            const wordTimings = useWipe && line.words && line.words.length ? line.words : null;
            const lineWipe = useWipe && !wordTimings;

            let content: React.ReactNode = line.text || '♪';
            if (wordTimings) {
              const lineEnd = line.endMs ?? lyrics[i + 1]?.timeMs ?? line.timeMs + 4000;
              content = wordTimings.map((word, wi) => {
                const wordStart = word.timeMs || line.timeMs;
                const wordEnd = wordTimings[wi + 1]?.timeMs ?? lineEnd;
                const duration = Math.max(120, wordEnd - wordStart);
                const pct = clamp01((currentPos - wordStart) / duration) * 100;
                const done = currentPos >= wordEnd;
                if (done) {
                  return (
                    <span key={wi} style={{ display: 'inline', whiteSpace: 'pre-wrap', color: withAlpha(baseColor, 1) }}>
                      {word.text}
                    </span>
                  );
                }
                if (pct <= 0) {
                  return (
                    <span key={wi} style={{ display: 'inline', whiteSpace: 'pre-wrap', color: withAlpha(baseColor, 0.35) }}>
                      {word.text}
                    </span>
                  );
                }
                return (
                  <span
                    key={wi}
                    className="apple-wipe-text"
                    style={{
                      display: 'inline',
                      whiteSpace: 'pre-wrap',
                      color: 'transparent',
                      backgroundImage: `linear-gradient(90deg, ${withAlpha(baseColor, 1)} 0%, ${withAlpha(baseColor, 1)} calc(var(--apple-wipe) - 3%), ${withAlpha(baseColor, 0.35)} calc(var(--apple-wipe) + 3%), ${withAlpha(baseColor, 0.35)} 100%)`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      ['--apple-wipe' as string]: `${pct.toFixed(2)}%`,
                    } as React.CSSProperties}
                  >
                    {word.text}
                  </span>
                );
              });
            }

            return (
              <div
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                className="apple-wipe-line w-full flex"
                style={{
                  justifyContent: justify,
                  paddingBottom: i === lyrics.length - 1 ? 0 : gap,
                  opacity: isActive ? 1 : opacity,
                  filter,
                  transform: `scale(${scale})`,
                  transformOrigin: align === 'right' ? 'center right' : align === 'left' ? 'center left' : 'center center',
                  willChange: 'transform, opacity, filter',
                }}
              >
                <span
                  className={wordTimings ? 'inline' : 'apple-wipe-text inline'}
                  style={{
                    display: 'inline',
                    maxWidth: '100%',
                    color: lineWipe ? 'transparent' : wordTimings ? undefined : withAlpha(baseColor, isActive ? 1 : 0.85),
                    fontSize: `${fontSize}px`,
                    fontWeight: 800,
                    lineHeight: 1.32,
                    letterSpacing: '-0.02em',
                    textAlign: align,
                    textWrap: 'balance',
                    backgroundImage: lineWipe
                      ? `linear-gradient(90deg, ${withAlpha(baseColor, 1)} 0%, ${withAlpha(baseColor, 1)} calc(var(--apple-wipe) - 4%), ${withAlpha(baseColor, 0.35)} calc(var(--apple-wipe) + 4%), ${withAlpha(baseColor, 0.35)} 100%)`
                      : undefined,
                    WebkitBackgroundClip: lineWipe ? 'text' : undefined,
                    backgroundClip: lineWipe ? 'text' : undefined,
                    WebkitTextFillColor: lineWipe ? 'transparent' : undefined,
                    ['--apple-wipe' as string]: lineWipe ? `${wipePct.toFixed(2)}%` : '0%',
                  } as React.CSSProperties}
                >
                  {content}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
