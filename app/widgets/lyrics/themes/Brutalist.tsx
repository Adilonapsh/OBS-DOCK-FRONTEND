import type { LyricsThemeProps } from './types';

export const themeMeta = { value: 'brutalist', label: 'Brutalist - Neo Brutalist' } as const;

function LyricsLines({
  lyrics,
  activeIndex,
  plainLyrics,
  lyricsAlign,
  lyricsFontSize,
  maxLyricsLines,
  accent,
}: Pick<LyricsThemeProps, 'lyrics' | 'activeIndex' | 'plainLyrics' | 'lyricsAlign' | 'lyricsFontSize' | 'maxLyricsLines' | 'accent'>) {
  const alignCls = lyricsAlign === 'center' ? 'text-center' : lyricsAlign === 'right' ? 'text-right' : 'text-left';
  const safeAccent = accent && accent !== 'transparent' ? accent : '#ffe600';
  if (!lyrics.length) {
    if (!plainLyrics)
      return (
        <div
          className={`inline-flex items-center justify-center gap-2 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] px-3 py-2 ${alignCls}`}
          style={{ fontSize: `${Math.max(12, lyricsFontSize - 2)}px` }}
        >
          <span className="w-2 h-2 bg-black border border-black shrink-0" style={{ background: safeAccent }} />
          <span className="font-black uppercase tracking-widest text-black/60 italic text-sm">
            ♪ instrumental - no lyrics ♪
          </span>
        </div>
      );
    return (
      <div className={`relative bg-white border-[3px] border-black shadow-[4px_4px_0_#000] px-4 py-3 ${alignCls}`}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
            backgroundSize: '8px 8px',
            opacity: 0.05,
          }}
        />
        <span
          className="relative font-black uppercase tracking-tight leading-relaxed text-black"
          style={{ fontSize: `${lyricsFontSize}px` }}
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
              isActive ? 'bg-black text-white border-black shadow-[4px_4px_0_#000] font-black' : 'bg-white text-black/70 border-black shadow-[3px_3px_0_#000] opacity-70 font-bold'
            }`}
            style={{
              fontSize: `${lyricsFontSize}px`,
              transform: isActive ? 'rotate(-0.5deg)' : 'rotate(0deg)',
            }}
          >
            {isActive && (
              <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 border-[2px] border-black flex items-center justify-center" style={{ background: safeAccent }}>
                <span className="w-1 h-1 bg-black" />
              </span>
            )}
            <span className={isActive ? 'uppercase tracking-tight' : 'uppercase tracking-wide'}>
              {l.text || '♪'}
            </span>
            {isActive && (
              <span className="ml-2 inline-flex px-1.5 py-0.5 bg-white text-black text-[8px] font-black uppercase tracking-widest border border-white align-middle">
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
  } = props;

  const safeAccent = accent && accent !== 'transparent' ? accent : '#ffe600';
  const title = track || 'Unknown Track';
  const subtitle = artist || 'Unknown Artist';

  return (
    <div
      className="brutalist-lyrics relative bg-white border-[4px] border-black overflow-hidden w-full max-w-[560px]"
      style={{ boxShadow: '8px 8px 0 #000' }}
    >
      {/* halftone */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(#000 1.2px, transparent 1.2px)',
          backgroundSize: '10px 10px',
          opacity: 0.06,
        }}
      />
      {/* top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[10px] border-b-[4px] border-black" style={{ background: safeAccent }} />

      {/* header */}
      <div className="relative mt-[10px] flex items-center gap-2 px-3 py-2 border-b-[3px] border-black bg-white">
        <span className="px-2 py-1 bg-black text-white text-[9px] font-black tracking-widest uppercase">LYRICS</span>
        <span className="flex-1 min-w-0 truncate text-[11px] font-black uppercase tracking-tight text-black">
          {title}
        </span>
        <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-widest text-black/50 truncate max-w-[150px]">
          — {subtitle}
        </span>
        <span className="w-2.5 h-2.5 border-[2px] border-black shrink-0" style={{ background: safeAccent }} />
      </div>

      {/* lyrics window */}
      <div className="relative p-4 bg-white">
        <LyricsLines
          lyrics={lyrics}
          activeIndex={activeIndex}
          plainLyrics={plainLyrics}
          lyricsAlign={lyricsAlign}
          lyricsFontSize={lyricsFontSize}
          maxLyricsLines={maxLyricsLines}
          accent={safeAccent}
        />
      </div>

      {/* footer */}
      <div className="relative bg-black text-white border-t-[4px] border-black flex items-center justify-between px-3 py-1.5">
        <span className="font-mono font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-white border border-black" style={{ background: safeAccent }} /> BRUTAL LYRICS • WHITE / BLACK / HALFTONE
        </span>
        <span className="font-black uppercase text-[8px] tracking-[0.14em] bg-white text-black px-1.5 py-0.5 border border-white">
          {lyrics.length ? `${Math.max(0, activeIndex + 1)}/${lyrics.length}` : plainLyrics ? 'PLAIN' : '—'}
        </span>
      </div>
    </div>
  );
}
