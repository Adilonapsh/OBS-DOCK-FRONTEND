import { QRCodeSVG } from 'qrcode.react';

// QR + logo tengah opsional. Kalau logo dipasang, error correction dipaksa 'H'
// agar tetap ke-scan walau modul tengah ketutup logo.
export function QrCodeImg({
  value,
  size,
  fg,
  qrBg,
  level,
  logo,
}: {
  value: string;
  size: number;
  fg: string;
  qrBg: string;
  level: 'L' | 'M' | 'Q' | 'H';
  logo?: string;
}) {
  const hasLogo = !!logo;
  const s = Math.max(24, Math.round(size * 0.22));
  return (
    <QRCodeSVG
      value={value}
      size={size}
      fgColor={fg}
      bgColor={qrBg}
      level={hasLogo ? 'H' : level}
      imageSettings={
        hasLogo
          ? { src: logo as string, width: s, height: s, excavate: true }
          : undefined
      }
    />
  );
}
