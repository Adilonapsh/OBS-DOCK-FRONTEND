import { QrCodeImg } from './QrCode';
import type { QrThemeProps } from './types';

export default function CuteTheme({ value, label, showLabel, size, fg, qrBg, accent, font, fontSize, level, logo }: QrThemeProps) {
  return (
    <div
      className="qr-font flex flex-col items-center gap-3 px-5 py-5 w-full max-w-[320px]"
      style={{
        fontFamily: `'Nunito','Quicksand','${font}', sans-serif`,
        background: 'linear-gradient(160deg, #2a2440 0%, #1e1d2b 100%)',
        border: `2px solid ${accent}55`,
        borderRadius: 28,
        boxShadow: `0 12px 40px ${accent}33`,
      }}
    >
      <span
        className="font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full"
        style={{ background: `linear-gradient(90deg, ${accent}, #fca4d4)`, color: '#fff' }}
      >
        ✦ Scan Me ✦
      </span>
      <div className="rounded-2xl overflow-hidden bg-white" style={{ padding: 12 }}>
        <QrCodeImg value={value} size={size} fg={fg} qrBg={qrBg} level={level} logo={logo} />
      </div>
      {showLabel && label && (
        <span className="font-black text-center leading-tight break-words" style={{ fontSize, color: '#d8cded' }}>
          {label}
        </span>
      )}
    </div>
  );
}
