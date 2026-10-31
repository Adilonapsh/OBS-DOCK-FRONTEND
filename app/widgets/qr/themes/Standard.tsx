import { QrCodeImg } from './QrCode';
import type { QrThemeProps } from './types';

export default function StandardTheme({ value, label, showLabel, size, fg, qrBg, bg, bare, accent, font, fontSize, level, logo }: QrThemeProps) {
  const transparent = bare || bg === 'transparent';
  return (
    <div
      className={`qr-font flex flex-col items-center gap-3 px-5 py-5 w-full max-w-[320px] ${transparent ? '' : 'rounded-2xl border border-white/10 shadow-xl'}`}
      style={{ fontFamily: `'${font}', sans-serif`, background: transparent ? 'transparent' : bg }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent }} />
        <span className="font-black text-[10px] uppercase tracking-widest" style={{ color: accent }}>QR Code</span>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10" style={{ background: qrBg, padding: 12 }}>
        <QrCodeImg value={value} size={size} fg={fg} qrBg={qrBg} level={level} logo={logo} />
      </div>
      {showLabel && label && (
        <span className="text-white font-black text-center leading-tight break-words" style={{ fontSize }}>
          {label}
        </span>
      )}
    </div>
  );
}
