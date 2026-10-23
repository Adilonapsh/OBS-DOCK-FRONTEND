import { QrCode } from 'lucide-react';
import type { QrThemeProps } from './types';

type Props = QrThemeProps & { theme: string };

// Versi ringkas dari tiap tema QR untuk state collapsed.
// Isinya teks URL (bukan QR), tapi bentuk/warna mengikuti tema yang dipilih.
export function QrCollapsedPill({
  theme,
  value,
  label,
  bg,
  accent,
  font,
  fontSize,
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistItalic,
  brutalistUppercase,
}: Props) {
  const urlText = value || label || 'Scan QR';
  const text = value ? value.replace(/^https?:\/\//i, '') : urlText;
  const size = Math.min(14, Math.max(11, fontSize));
  const family = `'${font}', sans-serif`;
  const bold = 'font-black truncate leading-tight min-w-0';

  if (theme === 'bubble') {
    return (
      <div
        className="flex items-center gap-2.5 rounded-[24px] rounded-bl-[8px] px-4 py-2.5 border shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        style={{ background: bg === 'transparent' ? '#ffffff' : bg, borderColor: 'rgba(0,0,0,0.06)', fontFamily: family }}
      >
        <span className="font-black text-[10px] tracking-tight shrink-0 max-w-[92px] truncate" style={{ color: accent }}>
          {label || 'SCAN ME'}
        </span>
        <span className={bold} style={{ color: 'rgba(0,0,0,0.85)', fontSize: size, maxWidth: 210 }}>
          {text}
        </span>
      </div>
    );
  }

  if (theme === 'clean') {
    const isLight = bg === 'transparent' || bg.toLowerCase().includes('fff');
    return (
      <div
        className="flex items-center gap-2.5 rounded-xl border px-4 py-2.5"
        style={{
          background: bg === 'transparent' ? 'rgba(255,255,255,0.92)' : bg,
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
          borderLeft: `3px solid ${accent}`,
          fontFamily: family,
        }}
      >
        <QrCode className="w-4 h-4 shrink-0" style={{ color: accent }} />
        <span className={bold} style={{ color: isLight ? '#111111' : '#ffffff', fontSize: size, maxWidth: 250 }}>
          {text}
        </span>
      </div>
    );
  }

  if (theme === 'boxed') {
    return (
      <div
        className="rounded-[20px] border border-white/10 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        style={{ background: bg === 'transparent' ? 'rgba(12,12,12,0.9)' : bg, fontFamily: family }}
      >
        <div
          className="px-3 py-1.5 border-b border-white/10 flex items-center gap-1.5"
          style={{ background: `linear-gradient(90deg, ${accent}22, transparent)` }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent }} />
          <span className="font-black text-[10px] uppercase tracking-widest text-white">SCAN QR</span>
        </div>
        <div className={`${bold} px-3 py-2 text-white`} style={{ fontSize: size, maxWidth: 280 }}>
          {text}
        </div>
      </div>
    );
  }

  if (theme === 'minimal') {
    return (
      <div className="flex items-center gap-2" style={{ fontFamily: family }}>
        <QrCode className="w-4 h-4 shrink-0" style={{ color: accent }} />
        <span
          className={`${bold} text-white`}
          style={{ fontSize: size, maxWidth: 280, textShadow: '0 2px 12px rgba(0,0,0,0.85)' }}
        >
          {text}
        </span>
      </div>
    );
  }

  if (theme === 'cute') {
    return (
      <div
        className="flex items-center gap-2.5 px-3.5 py-2"
        style={{
          fontFamily: `'Nunito','Quicksand','${font}', sans-serif`,
          background: 'linear-gradient(160deg, #2a2440 0%, #1e1d2b 100%)',
          border: `2px solid ${accent}55`,
          borderRadius: 28,
          boxShadow: `0 12px 40px ${accent}33`,
        }}
      >
        <span
          className="grid place-items-center rounded-full shrink-0"
          style={{ width: 28, height: 28, background: `linear-gradient(90deg, ${accent}, #fca4d4)` }}
        >
          <QrCode className="w-4 h-4 text-white" />
        </span>
        <span className={bold} style={{ fontSize: size, color: '#d8cded', maxWidth: 240 }}>
          {text}
        </span>
      </div>
    );
  }

  if (theme === 'plain') {
    return (
      <div className="flex items-center gap-2" style={{ fontFamily: family }}>
        <QrCode className="w-4 h-4 shrink-0" style={{ color: accent }} />
        <span
          className={`${bold} text-white`}
          style={{ fontSize: size, maxWidth: 280, textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
        >
          {text}
        </span>
      </div>
    );
  }

  if (theme === 'brutalist') {
    const safeAccent = accent && accent !== 'transparent' ? accent : '#ffe600';
    const bubbleBg = brutalistBg || '#ffffff';
    const textColor = brutalistTextColor || '#000000';
    const badgeBg = brutalistBadgeBg || '#ffffff';
    const borderColor = brutalistBorderColor || '#000000';
    const shadowOffset = brutalistShadow ?? 6;

    return (
      <div
        className="flex items-center gap-2 px-3 py-2 border-[3px]"
        style={{
          fontFamily: family,
          background: bubbleBg,
          borderColor,
          boxShadow: `${shadowOffset}px ${shadowOffset}px 0 ${borderColor}`,
        }}
      >
        <span
          className="px-1.5 py-0.5 text-[9px] font-black border-[2px] shrink-0"
          style={{
            background: badgeBg,
            color: textColor,
            borderColor,
            fontStyle: brutalistItalic ? 'italic' : 'normal',
            textTransform: brutalistUppercase ? 'uppercase' : 'none',
          }}
        >
          QR
        </span>
        <span
          className="font-mono font-black truncate leading-tight"
          style={{
            fontSize: size,
            maxWidth: 230,
            color: textColor,
            fontStyle: brutalistItalic ? 'italic' : 'normal',
            textTransform: brutalistUppercase ? 'uppercase' : 'none',
          }}
        >
          {text}
        </span>
        <span className="w-2 h-2 shrink-0" style={{ background: safeAccent }} />
      </div>
    );
  }

  // standard (default)
  return (
    <div
      className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2 border border-white/10 shadow-xl"
      style={{ background: bg === 'transparent' ? '#0a0a0a' : bg, fontFamily: family }}
    >
      <span className="grid place-items-center rounded-full shrink-0" style={{ width: 30, height: 30, background: accent }}>
        <QrCode className="w-4 h-4 text-white" />
      </span>
      <div className="flex flex-col min-w-0">
        <span className="font-black text-[9px] uppercase tracking-widest leading-none" style={{ color: accent }}>
          QR Code
        </span>
        <span className={`${bold} text-white mt-1`} style={{ fontSize: size, maxWidth: 240 }}>
          {text}
        </span>
      </div>
    </div>
  );
}
