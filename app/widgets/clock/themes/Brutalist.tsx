'use client';
import React from 'react';
import type { ClockThemeProps } from './types';

export type BrutalistClockProps = ClockThemeProps;

export default function BrutalistClockTheme({
  font,
  accent = '#FFE600',
  line1Text,
  line2Text,
  line3Text,
  gap = 8,
  s1 = 56,
  s2 = 22,
  s3 = 16,
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistHalftone,
  brutalistTail,
  brutalistItalic,
  brutalistUppercase,
}: BrutalistClockProps) {
  const bubbleBg = brutalistBg || '#FFFFFF';
  const textColor = brutalistTextColor || '#000000';
  const badgeBg = brutalistBadgeBg || '#FFFFFF';
  const borderColor = brutalistBorderColor || '#000000';
  const shadowOffset = brutalistShadow ?? 6;
  const hasHalftone = brutalistHalftone ?? true;
  const hasTail = brutalistTail ?? true;
  const isItalic = brutalistItalic ?? true;
  const isUppercase = brutalistUppercase ?? true;

  const halftone: React.CSSProperties = {
    backgroundImage: 'radial-gradient(circle, #000 1.2px, transparent 1.45px)',
    backgroundSize: '10px 10px',
  };
  const barHalftone: React.CSSProperties = {
    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1.1px, transparent 1.35px)',
    backgroundSize: '8px 8px',
  };

  const getBorder = (w: number) => `${w}px solid ${borderColor}`;
  const getShadow = (o: number) => `${o}px ${o}px 0px 0px ${borderColor}`;

  return (
    <div
      id="clock-brutalist-wrapper"
      className="clock-brutalist-theme relative overflow-hidden w-full max-w-[560px]"
      style={{
        fontFamily: `'${font}', sans-serif`,
        backgroundColor: bubbleBg,
        border: getBorder(4),
        boxShadow: getShadow(shadowOffset),
      }}
    >
      {hasHalftone && <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={halftone} />}

      {/* top strip */}
      <div
        className="relative h-3 flex items-center gap-1.5 px-2"
        style={{ backgroundColor: borderColor, borderBottom: getBorder(4) }}
      >
        <span className="w-2 h-2 border" style={{ backgroundColor: bubbleBg, borderColor }} />
        <span className="w-2 h-2 border" style={{ backgroundColor: bubbleBg, borderColor }} />
        <span className="w-2 h-2 border" style={{ backgroundColor: bubbleBg, borderColor }} />
        <span className="ml-auto font-mono font-black text-[8px] tracking-[0.18em] text-white uppercase" style={{ color: bubbleBg }}>CLOCK // BRUTALIST</span>
      </div>

      {/* main card */}
      <div className="relative px-6 py-6 flex flex-col" style={{ gap: `${gap}px` }}>
        {/* accent block */}
        <div className="absolute top-0 left-0 w-2 bottom-0 border-r-[4px]" style={{ background: accent, borderColor }} />
        <div className="absolute top-0 left-2 w-1 bottom-0 opacity-10" style={{ backgroundColor: borderColor }} />

        {line1Text ? (
          <div className="relative ml-4">
            <div
              className="inline-flex px-3 py-2"
              style={{ background: borderColor, border: getBorder(3), boxShadow: getShadow(4) }}
            >
              <span
                className="font-black tracking-tight leading-none"
                style={{
                  fontSize: `${s1}px`,
                  lineHeight: 0.9,
                  fontFamily: `'${font}', sans-serif`,
                  color: badgeBg,
                  fontStyle: isItalic ? 'italic' : 'normal',
                  textTransform: isUppercase ? 'uppercase' : 'none',
                }}
              >
                {line1Text}
              </span>
            </div>
            <div className="mt-2 h-1.5 border flex" style={{ backgroundColor: borderColor, borderColor }}>
              <div className="flex-1" style={{ background: accent }}>
                {hasHalftone && <div className="w-full h-full opacity-20" style={barHalftone} />}
              </div>
              <div className="w-6" style={{ backgroundColor: borderColor }} />
            </div>
          </div>
        ) : null}

        {line2Text ? (
          <div
            className="relative ml-4 px-3 py-2 inline-flex self-start"
            style={{ backgroundColor: badgeBg, border: getBorder(3), boxShadow: getShadow(4) }}
          >
            {hasHalftone && <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={halftone} />}
            <span
              className="relative font-black tracking-widest leading-none"
              style={{
                fontSize: `${s2}px`,
                fontFamily: `'${font}', sans-serif`,
                color: textColor,
                fontStyle: isItalic ? 'italic' : 'normal',
                textTransform: isUppercase ? 'uppercase' : 'none',
              }}
            >
              {line2Text}
            </span>
          </div>
        ) : null}

        {line3Text ? (
          <div
            className="relative ml-4 px-3 py-2 inline-flex self-start"
            style={{ backgroundColor: borderColor, border: getBorder(3), boxShadow: getShadow(4) }}
          >
            <span
              className="font-mono font-black tracking-[0.12em] leading-none"
              style={{
                fontSize: `${s3}px`,
                fontFamily: `'${font}', monospace`,
                color: badgeBg,
                fontStyle: isItalic ? 'italic' : 'normal',
                textTransform: isUppercase ? 'uppercase' : 'none',
              }}
            >
              {line3Text}
            </span>
          </div>
        ) : null}

        {/* decorative corner stamps - tail */}
        {hasTail && (
          <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-60">
            <span className="w-3 h-3 border-[2px]" style={{ backgroundColor: badgeBg, borderColor, boxShadow: getShadow(2) }} />
            <span className="w-3 h-3 border-[2px]" style={{ backgroundColor: borderColor, borderColor }} />
            <span className="w-3 h-3 border-[2px]" style={{ background: accent, borderColor }} />
          </div>
        )}
      </div>

      {/* footer */}
      <div
        className="relative flex items-center justify-between px-3 py-1.5"
        style={{ backgroundColor: borderColor, color: bubbleBg, borderTop: getBorder(4) }}
      >
        <span className="font-mono font-black text-[9px] uppercase tracking-[0.14em] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 border" style={{ backgroundColor: bubbleBg, borderColor: bubbleBg }} /> BRUTALIST TIME • {hasHalftone ? 'HALFTONE' : 'SOLID'}
        </span>
        <span
          className="font-black uppercase text-[8px] tracking-[0.14em] px-1.5 py-0.5 border"
          style={{ backgroundColor: badgeBg, color: textColor, borderColor: badgeBg }}
        >
          HARD SHADOW {shadowOffset}px
        </span>
      </div>
    </div>
  );
}
