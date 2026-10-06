import { Eye } from 'lucide-react';
import type { ViewCounterThemeProps } from './types';
import { PLATFORM_META, fmtCount } from './shared';
import './Brutalist.css';

export const themeMeta = { value: 'brutalist', label: 'Brutalist - Neo Brutalist' } as const;

export default function BrutalistTheme({
  counts,
  total,
  font,
  fontSize,
  accent,
  bg,
  showLabel,
  showBreakdown,
  inline,
  emptyLabel,
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg: _brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistHalftone,
  brutalistTail,
  brutalistItalic,
  brutalistUppercase,
}: ViewCounterThemeProps) {
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const bubbleBg = brutalistBg || (bg && bg !== 'transparent' && bg !== '#000000' && bg !== '#000' ? bg : '#FFFFFF');
  const textColor = brutalistTextColor || '#000000';
  const borderColor = brutalistBorderColor || '#000000';
  const shadowOffset = brutalistShadow ?? 6;
  const hasHalftone = brutalistHalftone ?? true;
  const hasTail = brutalistTail ?? true;
  const isItalic = brutalistItalic ?? true;
  const isUppercase = brutalistUppercase ?? true;
  const getBorder = () => `4px solid ${borderColor}`;
  const getShadow = () => `${shadowOffset}px ${shadowOffset}px 0px 0px ${borderColor}`;

  if (inline) {
    return (
      <div
        className="brutalist-bubble relative flex items-center max-w-full shrink-0"
        style={{
          fontFamily: `'${font}', sans-serif`,
          border: getBorder(),
          backgroundColor: bubbleBg,
          boxShadow: getShadow(),
        }}
      >
        {hasHalftone && <div className="absolute inset-0 pointer-events-none brutal-halftone" style={{ opacity: 0.05 }} />}
        {hasTail && (
          <>
            <div className="absolute w-6 h-6 left-8 -bottom-6 brut-bubble-tail" style={{ backgroundColor: borderColor }} />
            <div
              className="absolute w-6 h-6 left-8 -bottom-6 brut-bubble-tail translate-y-[-3px] translate-x-[-1px]"
              style={{ backgroundColor: bubbleBg }}
            />
          </>
        )}
        <div className="relative z-10 flex items-center gap-3 px-4 py-2.5 max-w-full flex-wrap">
          <Eye className="w-5 h-5 shrink-0" style={{ color: accent }} strokeWidth={2.5} />
          <span
            className="font-black tabular-nums leading-none shrink-0"
            style={{
              color: textColor,
              fontSize: Math.max(16, fontSize - 6),
              fontStyle: isItalic ? 'italic' : 'normal',
              textTransform: isUppercase ? 'uppercase' : 'none',
            }}
          >
            {fmtCount(total)}
          </span>
          {showLabel && (
            <span
              className="font-black tracking-widest text-[10px] hidden sm:inline shrink-0"
              style={{
                color: textColor,
                opacity: 0.55,
                fontStyle: isItalic ? 'italic' : 'normal',
                textTransform: isUppercase ? 'uppercase' : 'none',
              }}
            >
              Watching
            </span>
          )}
          {showBreakdown && rows.length > 0 && <span className="w-px h-5 shrink-0 hidden sm:block" style={{ backgroundColor: borderColor, opacity: 0.12 }} />}
          {showBreakdown &&
            rows.map(([p, n]) => {
              const meta = PLATFORM_META[p] || PLATFORM_META.tiktok;
              return (
                <span key={p} className="flex items-center gap-1.5 shrink-0" title={meta.label}>
                  <img
                    src={meta.logo}
                    alt={meta.label}
                    className="w-6 h-6 rounded-full object-contain shrink-0 bg-white p-0.5"
                    style={{ border: `2px solid ${borderColor}` }}
                  />
                  <span
                    className="font-black tabular-nums text-[11px]"
                    style={{
                      color: textColor,
                      fontStyle: isItalic ? 'italic' : 'normal',
                      textTransform: isUppercase ? 'uppercase' : 'none',
                    }}
                  >
                    {fmtCount(n)}
                  </span>
                </span>
              );
            })}
          {showBreakdown && rows.length === 0 && (
            <span
              className="font-bold text-[10px] shrink-0"
              style={{
                color: textColor,
                opacity: 0.4,
                fontStyle: isItalic ? 'italic' : 'normal',
                textTransform: isUppercase ? 'uppercase' : 'none',
              }}
            >
              {emptyLabel}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="brutalist-bubble relative px-5 py-4 w-full max-w-[360px]"
      style={{
        fontFamily: `'${font}', sans-serif`,
        border: getBorder(),
        backgroundColor: bubbleBg,
        boxShadow: getShadow(),
      }}
    >
      {hasHalftone && <div className="absolute inset-0 pointer-events-none brutal-halftone" style={{ opacity: 0.05 }} />}
      {hasTail && (
        <>
          <div className="absolute w-8 h-8 left-10 -bottom-8 brut-bubble-tail" style={{ backgroundColor: borderColor }} />
          <div className="absolute w-8 h-8 left-10 -bottom-8 brut-bubble-tail translate-y-[-4px]" style={{ backgroundColor: bubbleBg }} />
        </>
      )}
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 flex items-center justify-center shrink-0 rotate-[-1deg]"
            style={{ border: `3px solid ${borderColor}`, backgroundColor: '#fff', boxShadow: `3px 3px 0px 0px ${borderColor}` }}
          >
            <Eye className="w-4 h-4" style={{ color: accent }} strokeWidth={2.5} />
          </div>
          {showLabel && (
            <span
              className="font-black tracking-[0.14em] text-[10px]"
              style={{
                color: textColor,
                opacity: 0.6,
                fontStyle: isItalic ? 'italic' : 'normal',
                textTransform: isUppercase ? 'uppercase' : 'none',
              }}
            >
              Watching • Live
            </span>
          )}
          <span className="ml-auto w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: accent, border: `2px solid ${borderColor}` }} />
        </div>
        <div
          className="font-black tabular-nums leading-none tracking-tighter"
          style={{
            color: textColor,
            fontSize,
            fontStyle: isItalic ? 'italic' : 'normal',
            textTransform: isUppercase ? 'uppercase' : 'none',
          }}
        >
          {fmtCount(total)}
        </div>
        {showBreakdown && (
          <div className="mt-1 pt-3 flex flex-col gap-1.5" style={{ borderTop: `3px solid ${borderColor}` }}>
            {rows.length === 0 && (
              <span
                className="font-bold text-[11px]"
                style={{
                  color: textColor,
                  opacity: 0.4,
                  fontStyle: isItalic ? 'italic' : 'normal',
                  textTransform: isUppercase ? 'uppercase' : 'none',
                }}
              >
                {emptyLabel}
              </span>
            )}
            {rows.map(([p, n]) => {
              const meta = PLATFORM_META[p] || PLATFORM_META.tiktok;
              return (
                <div
                  key={p}
                  className="flex items-center gap-2 px-2 py-1.5"
                  style={{ border: `2px solid ${borderColor}`, backgroundColor: '#fff', boxShadow: `2px 2px 0px 0px ${borderColor}` }}
                >
                  <img
                    src={meta.logo}
                    alt={meta.label}
                    className="w-5 h-5 rounded-full object-contain shrink-0 bg-white p-px"
                    style={{ border: `2px solid ${borderColor}` }}
                  />
                  <span
                    className="font-black tracking-widest text-[10px] flex-1 truncate"
                    style={{
                      color: textColor,
                      fontStyle: isItalic ? 'italic' : 'normal',
                      textTransform: isUppercase ? 'uppercase' : 'none',
                    }}
                  >
                    {meta.label}
                  </span>
                  <span
                    className="font-black tabular-nums text-[12px]"
                    style={{
                      color: textColor,
                      fontStyle: isItalic ? 'italic' : 'normal',
                      textTransform: isUppercase ? 'uppercase' : 'none',
                    }}
                  >
                    {fmtCount(n)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
