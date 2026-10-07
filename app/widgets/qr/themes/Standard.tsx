import { QrCodeImg } from './QrCode';
import type { QrThemeProps } from './types';

export default function StandardTheme({ value, label, showLabel, size, fg, qrBg, bg, accent, font, fontSize, level, logo }: QrThemeProps) {
  return (
    <div
      className="qr-font flex flex-col items-center gap-3 px-5 py-5 rounded-2xl border border-white/10 shadow-xl w-full max-w-[320px]"
      style={{ fontFamily: `'${font}', sans-serif`, background: bg === 'transparent' ? 'transparent' : bg }}
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
