import type { GoalThemeProps } from './types';

export default function Brutalist({
  title,
  current,
  target,
  percent,
  goalType,
  font,
  fontSize,
  accent,
  showLabel,
  showCounts,
  showBar,
  brutalistBg = '#FFFFFF',
  brutalistTextColor = '#000000',
  brutalistBadgeBg = '#FFFFFF',
  brutalistBorderColor = '#000000',
  brutalistShadow = 6,
  brutalistHalftone = true,
  brutalistTail = true,
  brutalistItalic = true,
  brutalistUppercase = true,
  brutalistInline = false,
}: GoalThemeProps) {
  const labelMap: Record<string, string> = { follow: 'Followers', subs: 'Subscribers', like: 'Likes' };
  const unit = labelMap[goalType] || 'Likes';
  const visualPct = Math.min(Math.max(percent, 0), 100);
  const border = `4px solid ${brutalistBorderColor}`;
  const shadow = `${brutalistShadow}px ${brutalistShadow}px 0px 0px ${brutalistBorderColor}`;
  const tailBg = brutalistBorderColor;
  const bubbleBg = brutalistBg;

  // Inline / compact: judul + counts + bar dalam 1 baris (hemat tinggi)
  if (brutalistInline) {
    return (
      <div className="w-full max-w-full p-2 overflow-visible" style={{ fontFamily: `'Passion One', '${font}', sans-serif`, boxSizing: 'border-box' }}>
        <div
          className="relative rounded-none w-full flex items-center gap-3 px-3 py-2.5 min-w-0 max-w-full"
          style={{
            backgroundColor: bubbleBg,
            border,
            boxShadow: shadow,
            fontFamily: `'Passion One', sans-serif`,
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {brutalistHalftone && (
            <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.05, backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '6px 6px' }} />
          )}
          {/* Title + counts inline */}
          <div className="flex items-center gap-2 min-w-0 shrink-0 relative z-10">
            {showLabel && (
              <span
                className="font-black truncate max-w-[140px]"
                style={{
                  color: brutalistTextColor,
                  fontSize: Math.max(16, fontSize + 4),
                  lineHeight: 1,
                  fontFamily: `'Passion One', sans-serif`,
                  fontStyle: brutalistItalic ? 'italic' : 'normal',
                  textTransform: brutalistUppercase ? 'uppercase' : 'none',
                }}
              >
                {title}
              </span>
            )}
            {showCounts && (
              <span
                className="font-black tabular-nums whitespace-nowrap"
                style={{
                  color: brutalistTextColor,
                  fontSize: Math.max(14, fontSize + 2),
                  lineHeight: 1,
                  fontFamily: `'Passion One', sans-serif`,
                  fontStyle: brutalistItalic ? 'italic' : 'normal',
                  textTransform: brutalistUppercase ? 'uppercase' : 'none',
                }}
              >
                {current.toLocaleString()}/{target.toLocaleString()}
              </span>
            )}
          </div>

          {/* Bar mengisi sisa ruang */}
          {showBar ? (
            <div className="relative flex-1 min-w-0 max-w-full h-7 overflow-hidden flex items-center z-10" style={{ backgroundColor: '#e5e7eb', border: `3px solid ${brutalistBorderColor}`, borderRadius: 999, boxSizing: 'border-box' }}>
              <div
                className="flex items-center h-full transition-all duration-1000 ease-out relative min-w-0 max-w-full"
                style={{ width: `${visualPct}%`, maxWidth: '100%', backgroundColor: accent, borderRight: visualPct > 0 ? `3px solid ${brutalistBorderColor}` : 'none', boxSizing: 'border-box' }}
              >
                <span
                  className="absolute right-0 mr-2 text-white font-black"
                  style={{
                    fontSize: 13,
                    fontFamily: `'Passion One', sans-serif`,
                    WebkitTextStroke: '1px rgba(0,0,0,0.35)',
                    textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                    lineHeight: 1,
                  }}
                >
                  {percent}%
                </span>
              </div>
            </div>
          ) : showCounts ? (
            <span className="ml-auto text-[11px] font-black tabular-nums relative z-10" style={{ color: brutalistTextColor }}>
              {percent}%
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full p-2" style={{ fontFamily: `'Passion One', '${font}', sans-serif`, boxSizing: 'border-box' }}>
      <div
        className="relative rounded-none p-4 w-full max-w-full"
        style={{
          backgroundColor: bubbleBg,
          border,
          boxShadow: shadow,
          fontFamily: `'Passion One', sans-serif`,
          boxSizing: 'border-box',
        }}
      >
        {brutalistHalftone && (
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.05, backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '6px 6px' }} />
        )}
        {brutalistTail && (
          <>
            <div className="absolute w-8 h-8 left-10 -bottom-8" style={{ backgroundColor: tailBg, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
            <div className="absolute w-8 h-8 left-10 -bottom-8 translate-y-[-4px]" style={{ backgroundColor: bubbleBg, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
          </>
        )}
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 mb-2 rotate-[-1deg]"
          style={{
            backgroundColor: brutalistBadgeBg,
            border,
            boxShadow: `4px 4px 0px 0px ${brutalistBorderColor}`,
            color: brutalistTextColor,
            fontFamily: `'Outfit', sans-serif`,
            fontWeight: 800,
            fontSize: 11,
          }}
        >
          <span>{title}</span>
          <span className="px-1.5 py-px border-2 text-[10px] font-black" style={{ borderColor: brutalistBorderColor, backgroundColor: '#fff', color: '#000' }}>
            {unit}
          </span>
        </div>

        {(showLabel || showCounts) && (
          <div className="flex justify-between items-end mb-1 relative z-10">
            {showLabel && (
              <div
                style={{
                  color: brutalistTextColor,
                  fontSize: Math.max(22, fontSize + 10),
                  lineHeight: 1,
                  fontFamily: `'Passion One', sans-serif`,
                  fontStyle: brutalistItalic ? 'italic' : 'normal',
                  textTransform: brutalistUppercase ? 'uppercase' : 'none',
                  fontWeight: 900,
                }}
              >
                {title}
              </div>
            )}
            {showCounts && (
              <div
                className="font-normal text-right"
                style={{
                  color: brutalistTextColor,
                  fontSize: Math.max(22, fontSize + 10),
                  lineHeight: 1,
                  fontFamily: `'Passion One', sans-serif`,
                  fontStyle: brutalistItalic ? 'italic' : 'normal',
                  textTransform: brutalistUppercase ? 'uppercase' : 'none',
                }}
              >
                {current.toLocaleString()} / {target.toLocaleString()} {showLabel ? '' : unit}
              </div>
            )}
          </div>
        )}

        {showBar && (
          <div className="relative w-full max-w-full h-10 overflow-hidden" style={{ backgroundColor: '#e5e7eb', border, borderRadius: 999, boxSizing: 'border-box' }}>
            <div
              className="flex items-center h-full transition-all duration-1000 ease-out relative min-w-0"
              style={{ width: `${visualPct}%`, maxWidth: '100%', backgroundColor: accent, borderRight: visualPct > 0 ? border : 'none', boxSizing: 'border-box' }}
            >
              <span
                className="absolute right-0 mr-3 text-white"
                style={{
                  fontSize: 22,
                  fontFamily: `'Passion One', sans-serif`,
                  WebkitTextStroke: '1px rgba(0,0,0,0.4)',
                  textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                  lineHeight: 1,
                }}
              >
                {percent}%
              </span>
            </div>
          </div>
        )}

        {!showLabel && !showBar && showCounts && (
          <div className="text-center mt-1 font-black" style={{ color: brutalistTextColor, fontSize: 12 }}>
            {current.toLocaleString()} / {target.toLocaleString()} {unit} ({percent}%)
          </div>
        )}
      </div>
    </div>
  );
}
