import type { LyricsThemeProps } from './types';

export const themeMeta = { value: 'brutalist', label: 'Brutalist' } as const;

function LyricsLines({
  lyrics,
  activeIndex,
  plainLyrics,
  lyricsAlign,
  lyricsFontSize,
  maxLyricsLines,
  accent,
  bubbleBg,
  txtColor,
  borderColor,
  isItalic,
  isUppercase,
}: Pick<LyricsThemeProps, 'lyrics' | 'activeIndex' | 'plainLyrics' | 'lyricsAlign' | 'lyricsFontSize' | 'maxLyricsLines' | 'accent'> & {
  bubbleBg: string;
  txtColor: string;
  borderColor: string;
  isItalic: boolean;
  isUppercase: boolean;
}) {
  const alignCls = lyricsAlign === 'center' ? 'text-center' : lyricsAlign === 'right' ? 'text-right' : 'text-left';
  const safeAccent = accent && accent !== 'transparent' ? accent : '#ffe600';
  const fontStyle = isItalic ? 'italic' : 'normal';
  const textTransform = isUppercase ? 'uppercase' : 'none';
  if (!lyrics.length) {
    if (!plainLyrics)
      return (
        <div
          className={`inline-flex items-center justify-center gap-2 border-[3px] px-3 py-2 ${alignCls}`}
          style={{ fontSize: `${Math.max(12, lyricsFontSize - 2)}px`, background: bubbleBg, borderColor, boxShadow: `4px 4px 0 ${borderColor}` }}
        >
          <span className="w-2 h-2 border shrink-0" style={{ background: safeAccent, borderColor }} />
          <span className="font-black tracking-widest text-sm" style={{ color: txtColor, opacity: 0.6, fontStyle, textTransform }}>
            ♪ instrumental - no lyrics ♪
          </span>
        </div>
      );
    return (
      <div className={`relative border-[3px] px-4 py-3 ${alignCls}`} style={{ background: bubbleBg, borderColor, boxShadow: `4px 4px 0 ${borderColor}` }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(${borderColor} 1px, transparent 1px)`,
            backgroundSize: '8px 8px',
            opacity: 0.05,
          }}
        />
        <span
          className="relative font-black tracking-tight leading-relaxed"
          style={{ fontSize: `${lyricsFontSize}px`, color: txtColor, fontStyle, textTransform }}
        >
          {plainLyrics.split('\n').slice(0, maxLyricsLines).join('  •  ')}
        </span>
      </div>
    );
  }
  const safeActive = Math.max(0, activeIndex);
  const start = Math.floor(safeActive / maxLyricsLines) * maxLyricsLines;
  const win = lyrics.slice(start, start + maxLyricsLines);
  return (
    <div className={`flex flex-col gap-2 w-full ${alignCls}`}>
      {win.map((l, i) => {
        const idx = start + i;
        const isActive = idx === activeIndex;
        return (
          <div
            key={idx}
            className={`relative leading-tight border-[3px] px-3 py-2 transition-[transform,box-shadow] duration-200 ${
              isActive ? 'font-black' : 'opacity-70 font-bold'
            }`}
            style={{
              fontSize: `${lyricsFontSize}px`,
              transform: isActive ? 'rotate(-0.5deg)' : 'rotate(0deg)',
              background: isActive ? borderColor : bubbleBg,
              color: isActive ? bubbleBg : txtColor,
              borderColor,
              boxShadow: isActive ? `4px 4px 0 ${borderColor}` : `3px 3px 0 ${borderColor}`,
            }}
          >
            {isActive && (
              <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 border-[2px] flex items-center justify-center" style={{ background: safeAccent, borderColor }}>
                <span className="w-1 h-1" style={{ background: borderColor }} />
              </span>
            )}
            <span style={{ textTransform, fontStyle, letterSpacing: isActive ? '-0.02em' : '0.02em' }}>
              {l.text || '♪'}
            </span>
            {isActive && (
              <span className="ml-2 inline-flex px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border align-middle" style={{ background: bubbleBg, color: txtColor, borderColor }}>
                LIVE
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BrutalistTheme(props: LyricsThemeProps) {
  const {
    track,
    artist,
    accent,
    lyrics,
    activeIndex,
    plainLyrics,
    lyricsAlign,
    lyricsFontSize,
    maxLyricsLines,
    brutalistBg,
    brutalistTextColor,
    brutalistBadgeBg,
    brutalistBorderColor,
    brutalistShadow,
    brutalistHalftone,
    brutalistTail,
    brutalistItalic,
    brutalistUppercase,
  } = props;

  const safeAccent = accent && accent !== 'transparent' ? accent : '#ffe600';
  const bubbleBg = brutalistBg || '#FFFFFF';
  const txtColor = brutalistTextColor || '#000000';
  const badgeBg = brutalistBadgeBg || '#000000';
  const borderColor = brutalistBorderColor || '#000000';
  const shadowOffset = brutalistShadow ?? 8;
  const hasHalftone = brutalistHalftone ?? true;
  const hasTail = brutalistTail ?? true;
  const isItalic = brutalistItalic ?? true;
  const isUppercase = brutalistUppercase ?? true;
  const fontStyle = isItalic ? 'italic' : 'normal';
  const textTransform = isUppercase ? 'uppercase' : 'none';
  const title = track || 'Unknown Track';
  const subtitle = artist || 'Unknown Artist';

  return (
    <div
      className="brutalist-lyrics relative border-[4px] overflow-hidden w-full max-w-[560px]"
      style={{ background: bubbleBg, borderColor, boxShadow: `${shadowOffset}px ${shadowOffset}px 0 ${borderColor}` }}
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
      {/* top accent bar - controlled by brutalistTail */}
      {hasTail && <div className="absolute top-0 left-0 right-0 h-[10px] border-b-[4px]" style={{ background: safeAccent, borderColor }} />}

      {/* header */}
      <div className="relative flex items-center gap-2 px-3 py-2 border-b-[3px]" style={{ marginTop: hasTail ? '10px' : '0', borderColor, background: bubbleBg }}>
        <span className="px-2 py-1 text-[9px] font-black tracking-widest uppercase" style={{ background: badgeBg, color: bubbleBg, fontStyle, textTransform }}>LYRICS</span>
        <span className="flex-1 min-w-0 truncate text-[11px] font-black tracking-tight" style={{ color: txtColor, fontStyle, textTransform }}>
          {title}
        </span>
        <span className="hidden sm:inline-flex text-[10px] font-bold tracking-widest truncate max-w-[150px]" style={{ color: txtColor, opacity: 0.5, fontStyle, textTransform }}>
          - {subtitle}
        </span>
        <span className="w-2.5 h-2.5 border-[2px] shrink-0" style={{ background: safeAccent, borderColor }} />
      </div>

      {/* lyrics window */}
      <div className="relative p-4" style={{ background: bubbleBg }}>
        <LyricsLines
          lyrics={lyrics}
          activeIndex={activeIndex}
          plainLyrics={plainLyrics}
          lyricsAlign={lyricsAlign}
          lyricsFontSize={lyricsFontSize}
          maxLyricsLines={maxLyricsLines}
          accent={safeAccent}
          bubbleBg={bubbleBg}
          txtColor={txtColor}
          borderColor={borderColor}
          isItalic={isItalic}
          isUppercase={isUppercase}
        />
      </div>

      {/* footer */}
      <div className="relative border-t-[4px] flex items-center justify-between px-3 py-1.5" style={{ background: borderColor, borderColor }}>
        <span className="font-mono font-black text-[9px] tracking-widest flex items-center gap-1.5" style={{ color: bubbleBg, fontStyle, textTransform }}>
          <span className="w-1.5 h-1.5 border" style={{ background: safeAccent, borderColor: bubbleBg }} /> BRUTAL LYRICS • WHITE / BLACK / HALFTONE
        </span>
        <span className="font-black text-[8px] tracking-[0.14em] px-1.5 py-0.5 border" style={{ background: badgeBg, color: bubbleBg, borderColor: bubbleBg, fontStyle, textTransform }}>
          {lyrics.length ? `${Math.max(0, activeIndex + 1)}/${lyrics.length}` : plainLyrics ? 'PLAIN' : '-'}
        </span>
      </div>
    </div>
  );
}
