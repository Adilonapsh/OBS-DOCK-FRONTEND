import { QrCodeImg } from './QrCode';
import type { QrThemeProps } from './types';

// Gaya chat Clean: kartu terang minimalis dengan aksen garis kiri.
export default function CleanTheme({ value, label, showLabel, size, fg, qrBg, bg, accent, font, fontSize, level, logo }: QrThemeProps) {
  const bgColor = bg === 'transparent' ? 'rgba(255,255,255,0.92)' : bg;
  const isLight =
    bg === 'transparent' || bg.toLowerCase().includes('fff') || bg.toLowerCase().includes('ffffff');
  const textColor = isLight ? '#111' : '#fff';
  return (
    <div className="qr-font flex flex-col items-center w-full max-w-[320px]" style={{ fontFamily: `'${font}', sans-serif` }}>
      <div
        className="rounded-xl border px-5 py-4 flex flex-col items-center gap-2"
        style={{
          background: bgColor,
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
          borderLeft: `3px solid ${accent}`,
        }}
      >
        <QrCodeImg value={value} size={size} fg={fg} qrBg={qrBg} level={level} logo={logo} />
        {showLabel && label && (
          <span className="font-black text-center leading-tight break-words" style={{ color: textColor, fontSize }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
