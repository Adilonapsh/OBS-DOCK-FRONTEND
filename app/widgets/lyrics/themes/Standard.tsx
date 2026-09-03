import type { LyricsThemeProps } from './types';
import './Standard.css';

function LyricsLines({ lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines, accent }: Pick<LyricsThemeProps,'lyrics'|'activeIndex'|'plainLyrics'|'lyricsAlign'|'lyricsFontSize'|'maxLyricsLines'|'accent'>) {
  const alignCls = lyricsAlign === 'center' ? 'text-center' : lyricsAlign === 'right' ? 'text-right' : 'text-left';
  if (!lyrics.length) {
    if (!plainLyrics) return <div className={`lyrics-empty opacity-40 text-sm italic ${alignCls}`} style={{ fontSize: `${Math.max(12, lyricsFontSize - 2)}px` }}>♪ instrumental - no lyrics ♪</div>;
    return <div className={`lyrics-plain opacity-80 leading-relaxed ${alignCls}`} style={{ fontSize: `${lyricsFontSize}px` }}>{plainLyrics.split('\n').slice(0, maxLyricsLines).join('  •  ')}</div>;
  }
  const half = Math.floor(maxLyricsLines / 2);
  let start = Math.max(0, activeIndex - half);
  let end = start + maxLyricsLines;
  if (end > lyrics.length) { end = lyrics.length; start = Math.max(0, end - maxLyricsLines); }
  const win = lyrics.slice(start, end);
  return (
    <div className={`lyrics-window flex flex-col gap-1.5 ${alignCls}`}>
      {win.map((l) => {
        const idx = lyrics.indexOf(l);
        const isActive = idx === activeIndex;
        return <div key={idx} className={`lyrics-line leading-tight transition-all duration-300 ${isActive ? 'font-black scale-[1.03]' : 'opacity-40 font-medium'}`} style={{ fontSize: isActive ? `${lyricsFontSize + 2}px` : `${lyricsFontSize - 2}px`, color: isActive ? accent : undefined }}>{l.text || '♪'}</div>;
      })}
    </div>
  );
}

export default function StandardTheme(props: LyricsThemeProps) {
  const { bgColor, textColor, accent, lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines } = props;
  return (
    <div className="standard-theme relative flex flex-col p-5 rounded-2xl overflow-hidden border bg-zinc-900/80 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]" style={{ backgroundColor: bgColor + 'CC', color: textColor }}>
      <LyricsLines lyrics={lyrics} activeIndex={activeIndex} plainLyrics={plainLyrics} lyricsAlign={lyricsAlign} lyricsFontSize={lyricsFontSize} maxLyricsLines={maxLyricsLines} accent={accent} />
    </div>
  );
}
