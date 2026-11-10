import { QrCodeImg } from './QrCode';
import type { QrThemeProps } from './types';

export const themeMeta = { value: 'brutalist', label: 'Brutalist' } as const;

export default function BrutalistTheme({
  value,
  label,
  showLabel,
  size,
  fg,
  qrBg,
  bg,
  accent,
  font,
  fontSize,
  level,
  logo,
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistHalftone,
  brutalistTail,
  brutalistItalic,
  brutalistUppercase,
}: QrThemeProps) {
  const safeAccent = accent && accent !== 'transparent' ? accent : '#ffe600';
  const bubbleBg = brutalistBg || '#FFFFFF';
  const textColor = brutalistTextColor || '#000000';
  const badgeBg = brutalistBadgeBg || '#FFFFFF';
  const borderColor = brutalistBorderColor || '#000000';
  const shadowOffset = brutalistShadow ?? 6;
  const hasHalftone = brutalistHalftone ?? true;
  const hasTail = brutalistTail ?? true;
  const isItalic = brutalistItalic ?? true;
  const isUppercase = brutalistUppercase ?? true;

  const cardStyle: React.CSSProperties = {
    background: bubbleBg,
    borderColor,
    boxShadow: `${shadowOffset}px ${shadowOffset}px 0 ${borderColor}`,
  };
  const qrBoxShadow = `${Math.max(2, Math.round(shadowOffset * 0.5))}px ${Math.max(2, Math.round(shadowOffset * 0.5))}px 0 ${borderColor}`;
  const labelShadow = `${Math.max(2, Math.round(shadowOffset * 0.4))}px ${Math.max(2, Math.round(shadowOffset * 0.4))}px 0 ${borderColor}`;

  return (
    <div
      className="qr-font flex flex-col items-center w-full max-w-[360px]"
      style={{ fontFamily: `'${font}', sans-serif` }}
    >
      <div
        className="relative w-full bg-white border-[4px] overflow-hidden flex flex-col items-center"
        style={cardStyle}
      >
        {/* halftone overlay */}
        {hasHalftone && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(#000 1.2px, transparent 1.2px)',
              backgroundSize: '10px 10px',
              opacity: 0.06,
            }}
          />
        )}
        {/* top accent bar - treated as tail */}
        {hasTail && (
          <div
            className="absolute top-0 left-0 right-0 h-[10px] border-b-[4px]"
            style={{ background: safeAccent, borderColor }}
          />
        )}

        {/* header */}
        <div
          className="relative w-full flex items-center justify-between px-3 py-2 border-b-[3px] bg-white"
          style={{
            marginTop: hasTail ? '10px' : '0',
            borderColor,
            background: bubbleBg,
          }}
        >
          <span
            className="px-2 py-1 text-[9px] font-black tracking-widest border-[2px]"
            style={{
              background: badgeBg,
              color: textColor,
              borderColor,
              fontStyle: isItalic ? 'italic' : 'normal',
              textTransform: isUppercase ? 'uppercase' : 'none',
            }}
          >
            QR CODE
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 border-[2px] animate-pulse"
              style={{ background: safeAccent, borderColor }}
            />
            <span
              className="text-[10px] font-black tracking-widest"
              style={{
                color: textColor,
                fontStyle: isItalic ? 'italic' : 'normal',
                textTransform: isUppercase ? 'uppercase' : 'none',
              }}
            >
              SCAN ME
            </span>
          </span>
        </div>

        {/* QR centered with brutal border */}
        <div className="relative p-4 flex flex-col items-center gap-3 w-full" style={{ background: bubbleBg }}>
          <div
            className="bg-white border-[3px] p-3 flex items-center justify-center"
            style={{ boxShadow: qrBoxShadow, background: qrBg, borderColor }}
          >
            <QrCodeImg value={value} size={size} fg={fg} qrBg={qrBg} level={level} logo={logo} />
          </div>

          {showLabel && label && (
            <div className="w-full flex flex-col items-center gap-1.5">
              <span className="w-full h-[3px]" style={{ background: safeAccent }} />
              <span
                className="w-full text-center font-black tracking-tight leading-tight border-[3px] px-3 py-2"
                style={{
                  fontSize,
                  boxShadow: labelShadow,
                  background: badgeBg,
                  color: textColor,
                  borderColor,
                  fontStyle: isItalic ? 'italic' : 'normal',
                  textTransform: isUppercase ? 'uppercase' : 'none',
                }}
              >
                {label}
              </span>
              <span
                className="text-[9px] font-black tracking-widest border-[2px] px-2 py-0.5"
                style={{
                  background: bubbleBg,
                  color: textColor,
                  borderColor,
                  opacity: 0.6,
                  fontStyle: isItalic ? 'italic' : 'normal',
                  textTransform: isUppercase ? 'uppercase' : 'none',
                }}
              >
                {value.slice(0, 32)}
                {value.length > 32 ? '…' : ''}
              </span>
            </div>
          )}
        </div>

        {/* footer */}
        <div
          className="relative w-full border-t-[4px] flex items-center justify-between px-3 py-1.5"
          style={{ background: borderColor, color: bubbleBg, borderColor }}
        >
          <span className="font-mono font-black text-[8px] tracking-[0.14em] flex items-center gap-1.5" style={{ textTransform: isUppercase ? 'uppercase' : 'none', fontStyle: isItalic ? 'italic' : 'normal' }}>
            <span className="w-1.5 h-1.5 border" style={{ background: safeAccent, borderColor: bubbleBg }} /> BRUTAL QR • HALFTONE
          </span>
          <span
            className="font-black text-[8px] tracking-[0.14em] px-1.5 py-0.5 border"
            style={{
              background: badgeBg,
              color: textColor,
              borderColor: bubbleBg,
              fontStyle: isItalic ? 'italic' : 'normal',
              textTransform: isUppercase ? 'uppercase' : 'none',
            }}
          >
            4px BORDER
          </span>
        </div>
      </div>
    </div>
  );
}
