import { QrCodeImg } from './QrCode';
import type { QrThemeProps } from './types';

// Gaya chat Boxed: kartu gelap dengan header bar + dot pulse.
export default function BoxedTheme({ value, label, showLabel, size, fg, qrBg, bg, accent, font, fontSize, level, logo }: QrThemeProps) {
  const cardBg = bg === 'transparent' ? 'rgba(12,12,12,0.9)' : bg;
  return (
    <div
      className="qr-font w-full max-w-[320px] rounded-[20px] border border-white/10 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      style={{ fontFamily: `'${font}', sans-serif`, background: cardBg }}
    >
      <div
        className="px-4 py-3 border-b border-white/10 flex items-center justify-between"
        style={{ background: `linear-gradient(90deg, ${accent}22, transparent)` }}
      >
        <span className="font-black text-[11px] uppercase tracking-widest text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent }} />
          SCAN QR
        </span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
      </div>
      <div className="p-4 flex flex-col items-center gap-2">
        <QrCodeImg value={value} size={size} fg={fg} qrBg={qrBg} level={level} logo={logo} />
        {showLabel && label && (
          <span className="text-white font-black text-center leading-tight break-words" style={{ fontSize }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
