import type { TickerThemeProps } from './types';
import { TickerTrack } from './TickerTrack';

export const themeMeta = { value: 'brutalist', label: 'Brutalist' } as const;

export default function BrutalistTheme({
  items,
  font,
  fontSize,
  accent,
  bg: _bg,
  textColor,
  separator,
  speed,
  direction,
  showBadge,
  badgeText,
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistHalftone,
  brutalistTail,
  brutalistItalic,
  brutalistUppercase,
}: TickerThemeProps) {
  const safeAccent = accent && accent !== 'transparent' ? accent : '#ffe600';
  const barBg = brutalistBg ?? '#FFFFFF';
  const text = brutalistTextColor ?? (textColor && textColor !== '' ? textColor : '#000000');
  const badgeBg = brutalistBadgeBg ?? '#FFFFFF';
  const borderColor = brutalistBorderColor ?? '#000000';
  const shadowOffset = brutalistShadow ?? 6;
  const hasHalftone = brutalistHalftone ?? true;
  const hasTail = brutalistTail ?? true;
  const isItalic = brutalistItalic ?? true;
  const isUppercase = brutalistUppercase ?? true;

  return (
    <div
      className="relative w-full flex items-stretch gap-0 border-[4px] overflow-hidden"
      style={{ background: barBg, borderColor, boxShadow: `${shadowOffset}px ${shadowOffset}px 0 ${borderColor}`, fontFamily: `'${font}', sans-serif` }}
    >
      {/* halftone */}
      {hasHalftone && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(${borderColor} 1.2px, transparent 1.2px)`,
            backgroundSize: '10px 10px',
            opacity: 0.06,
          }}
        />
      )}
      {/* top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[6px] border-b-[3px]" style={{ background: safeAccent, borderColor }} />

      {showBadge && (
        <div
          className="relative shrink-0 self-stretch flex items-center gap-1.5 px-3 border-r-[4px] mt-[6px]"
          style={{ background: badgeBg, color: text, borderColor }}
        >
          <span className="w-2 h-2 border border-white animate-pulse shrink-0" style={{ background: safeAccent }} />
          <span className="font-black text-[11px] tracking-widest whitespace-nowrap" style={{ fontSize: Math.max(11, fontSize * 0.85), textTransform: isUppercase ? 'uppercase' : 'none', fontStyle: isItalic ? 'italic' : 'normal' }}>
            {badgeText || 'LIVE'}
          </span>
        </div>
      )}

      <div className="relative flex-1 min-w-0 flex items-center py-3 mt-[6px] px-2" style={{ fontSize, color: text }}>
        <TickerTrack
          items={items}
          separator={separator}
          speed={speed}
          direction={direction}
          renderItem={(t) => (
            <span
              className="font-black tracking-tight whitespace-nowrap"
              style={{
                fontFamily: `'${font}', sans-serif`,
                color: text,
                fontStyle: isItalic ? 'italic' : 'normal',
                textTransform: isUppercase ? 'uppercase' : 'none',
              }}
            >
              {t}
            </span>
          )}
        />
      </div>

      {/* right accent stub - controlled by brutalistTail */}
      {hasTail && (
        <div className="hidden sm:flex relative w-3 shrink-0 border-l-[4px] mt-[6px]" style={{ background: safeAccent, borderColor }}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)',
              backgroundSize: '6px 6px',
            }}
          />
        </div>
      )}

      <style>{`.ticker-sep{color:${safeAccent}; background:${borderColor}; padding:0 6px; border:2px solid ${borderColor}; font-weight:900; font-size:0.7em; line-height:1; }`}</style>
    </div>
  );
}
