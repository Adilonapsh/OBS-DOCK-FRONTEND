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
}: GoalThemeProps) {
  const labelMap: Record<string, string> = { follow: 'Followers', subs: 'Subscribers', like: 'Likes' };
  const unit = labelMap[goalType] || 'Likes';
  const visualPct = Math.min(Math.max(percent, 0), 100);
  const border = `4px solid ${brutalistBorderColor}`;
  const shadow = `${brutalistShadow}px ${brutalistShadow}px 0px 0px ${brutalistBorderColor}`;
  const tailBg = brutalistBorderColor;
  const bubbleBg = brutalistBg;

  return (
    <div className="w-full max-w-[640px] p-2" style={{ fontFamily: `'Passion One', '${font}', sans-serif` }}>
      <div
        className="relative rounded-none p-4 w-full"
        style={{
          backgroundColor: bubbleBg,
          border,
          boxShadow: shadow,
          fontFamily: `'Passion One', sans-serif`,
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
          <div className="relative w-full h-10 overflow-hidden" style={{ backgroundColor: '#e5e7eb', border, borderRadius: 999 }}>
            <div
              className="flex items-center h-full transition-all duration-1000 ease-out relative"
              style={{ width: `${visualPct}%`, backgroundColor: accent, borderRight: visualPct > 0 ? border : 'none' }}
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
