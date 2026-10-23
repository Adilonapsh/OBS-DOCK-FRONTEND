import type { DonationLeaderboardThemeProps } from './types';

export const themeMeta = { value: 'brutalist', label: 'Brutalist' } as const;

export default function BrutalistTheme({
  entries,
  font,
  fontSize,
  accent,
  title,
  showAmount,
  showPlatform,
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistHalftone,
  brutalistTail,
  brutalistItalic,
  brutalistUppercase,
}: DonationLeaderboardThemeProps) {
  const bubbleBg = brutalistBg || '#FFFFFF';
  const textColor = brutalistTextColor || '#000000';
  const badgeBg = brutalistBadgeBg || '#FFFFFF';
  const borderColor = brutalistBorderColor || '#000000';
  const shadowOffset = brutalistShadow ?? 6;
  const hasHalftone = brutalistHalftone ?? true;
  const hasTail = brutalistTail ?? true;
  const isItalic = brutalistItalic ?? true;
  const isUppercase = brutalistUppercase ?? true;

  const getBorder = (w: number) => `${w}px solid ${borderColor}`;
  const textStyle = {
    color: textColor,
    fontStyle: isItalic ? 'italic' : 'normal',
    textTransform: isUppercase ? 'uppercase' : 'none',
  } as const;
  const nameSize = Math.max(10, fontSize - 4);
  const badgeSize = Math.max(8, fontSize - 7);
  const rankSize = Math.max(9, fontSize - 5);

  return (
    <div
      className="w-full"
      style={{
        fontFamily: `'${font}', sans-serif`,
        paddingBottom: (hasTail ? 28 : 0) + shadowOffset + 2,
        paddingRight: shadowOffset + 4,
      }}
    >
      <div
        className="relative"
        style={{
          backgroundColor: bubbleBg,
          border: getBorder(4),
          boxShadow: `${shadowOffset}px ${shadowOffset}px 0px 0px ${borderColor}`,
        }}
      >
        {hasHalftone && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.16,
              backgroundImage: `radial-gradient(${borderColor} 1px, transparent 1px)`,
              backgroundSize: '6px 6px',
            }}
          />
        )}

        <div className="relative z-10 p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="inline-flex items-center gap-2 px-2.5 py-1"
              style={{
                backgroundColor: badgeBg,
                border: getBorder(3),
                boxShadow: `4px 4px 0px 0px ${borderColor}`,
              }}
            >
              <span
                className="font-black leading-none"
                style={{ ...textStyle, fontSize: Math.max(11, fontSize - 3) }}
              >
                {title}
              </span>
              <span
                className="font-black leading-none px-1.5 py-0.5"
                style={{
                  backgroundColor: accent,
                  color: textColor,
                  border: getBorder(2),
                  fontSize: badgeSize,
                  fontStyle: 'normal',
                }}
              >
                TOP {entries.length}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {entries.length === 0 ? (
              <div
                className="p-4 text-center font-black"
                style={{
                  ...textStyle,
                  border: `2px dashed ${borderColor}`,
                  fontSize: nameSize,
                }}
              >
                BELUM ADA DONASI
              </div>
            ) : (
              entries.map((e, i) => (
                <div
                  key={e.donorName + i}
                  className="flex items-center gap-2 px-2 py-1.5 min-w-0"
                  style={{
                    backgroundColor: 'transparent',
                    border: getBorder(2),
                    boxShadow: `3px 3px 0px 0px ${borderColor}`,
                  }}
                >
                  <span
                    className="grid place-items-center font-black shrink-0"
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: accent,
                      color: textColor,
                      border: getBorder(2),
                      fontSize: rankSize,
                      fontStyle: 'normal',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="flex-1 min-w-0 truncate font-black"
                    style={{ ...textStyle, fontSize: nameSize }}
                  >
                    {e.donorName}
                  </span>
                  {showPlatform && (
                    <span
                      className="shrink-0 px-1.5 py-0.5 font-black"
                      style={{
                        backgroundColor: badgeBg,
                        color: textColor,
                        border: getBorder(1),
                        fontSize: badgeSize,
                        fontStyle: isItalic ? 'italic' : 'normal',
                        textTransform: isUppercase ? 'uppercase' : 'none',
                      }}
                    >
                      {e.platform}
                    </span>
                  )}
                  {showAmount && (
                    <span
                      className="shrink-0 px-1.5 py-0.5 font-black tabular-nums"
                      style={{
                        backgroundColor: badgeBg,
                        color: textColor,
                        border: getBorder(2),
                        fontSize: nameSize,
                        fontStyle: isItalic ? 'italic' : 'normal',
                      }}
                    >
                      {e.amountFormatted}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {hasTail && (
          <>
            <div
              className="absolute w-8 h-8 left-8 -bottom-8"
              style={{ backgroundColor: borderColor, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
            />
            <div
              className="absolute w-8 h-8 left-8 -bottom-8 -translate-y-1"
              style={{ backgroundColor: bubbleBg, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
            />
          </>
        )}
      </div>
    </div>
  );
}
