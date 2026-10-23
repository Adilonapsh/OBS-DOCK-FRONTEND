import { QrCodeImg } from './QrCode';
import type { QrThemeProps } from './types';

// Gaya chat Bubble: kartu putih rounded gelembung, teks gelap, nama aksen.
export default function BubbleTheme({ value, label, showLabel, size, fg, qrBg, bg, accent, font, fontSize, level, logo }: QrThemeProps) {
  const bubbleBg = bg === 'transparent' ? '#ffffff' : bg;
  return (
    <div className="qr-font flex flex-col items-center w-full max-w-[320px]" style={{ fontFamily: `'${font}', sans-serif` }}>
      <div
        className="relative rounded-[24px] rounded-bl-[8px] px-5 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border flex flex-col items-center gap-2"
        style={{ background: bubbleBg, borderColor: 'rgba(0,0,0,0.06)' }}
      >
        <span className="font-black text-[11px] tracking-tight" style={{ color: accent }}>
          {label || 'SCAN ME'}
        </span>
        <QrCodeImg value={value} size={size} fg={fg} qrBg={qrBg} level={level} logo={logo} />
        {showLabel && label && (
          <span className="text-[13px] font-bold text-center leading-snug break-words" style={{ color: 'rgba(0,0,0,0.85)', fontSize }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
