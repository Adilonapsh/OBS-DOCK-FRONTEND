import { QrCodeImg } from './QrCode';
import type { QrThemeProps } from './types';

export default function MinimalTheme({ value, size, fg, qrBg, font, level, logo }: QrThemeProps) {
  return (
    <div className="qr-font flex flex-col items-center w-full max-w-[320px]" style={{ fontFamily: `'${font}', sans-serif` }}>
      <div className="rounded-2xl overflow-hidden" style={{ background: qrBg, padding: 10 }}>
        <QrCodeImg value={value} size={size} fg={fg} qrBg={qrBg} level={level} logo={logo} />
      </div>
    </div>
  );
}
