import { QrCodeImg } from './QrCode';
import type { QrThemeProps } from './types';

export default function PlainTheme({ value, label, showLabel, size, fg, qrBg, font, fontSize, level, logo }: QrThemeProps) {
  return (
    <div className="qr-font flex flex-col items-center gap-2 bg-transparent w-full max-w-[320px]" style={{ fontFamily: `'${font}', sans-serif` }}>
      <QrCodeImg value={value} size={size} fg={fg} qrBg={qrBg} level={level} logo={logo} />
      {showLabel && label && (
        <span className="text-white font-bold text-center leading-tight break-words" style={{ fontSize, textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
          {label}
        </span>
      )}
    </div>
  );
}
