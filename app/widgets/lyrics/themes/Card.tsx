import type { LyricsThemeProps } from './types';
import './Card.css';

function LyricsLines({ lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines, accent }: Pick<LyricsThemeProps,'lyrics'|'activeIndex'|'plainLyrics'|'lyricsAlign'|'lyricsFontSize'|'maxLyricsLines'|'accent'>) {
  const alignCls = lyricsAlign === 'center' ? 'text-center' : lyricsAlign === 'right' ? 'text-right' : 'text-left';
  if (!lyrics.length) {
    if (!plainLyrics) return <div className={`opacity-30 text-sm italic ${alignCls} text-zinc-400`} style={{ fontSize: `${Math.max(12, lyricsFontSize - 2)}px` }}>♪ instrumental - no lyrics ♪</div>;
    return <div className={`opacity-70 leading-relaxed ${alignCls} text-zinc-700`} style={{ fontSize: `${lyricsFontSize}px` }}>{plainLyrics.split('\n').slice(0, maxLyricsLines).join('  •  ')}</div>;
  }
  const half = Math.floor(maxLyricsLines / 2);
  let start = Math.max(0, activeIndex - half);
  let end = start + maxLyricsLines;
  if (end > lyrics.length) { end = lyrics.length; start = Math.max(0, end - maxLyricsLines); }
  const win = lyrics.slice(start, end);
  return (
    <div className={`flex flex-col gap-1.5 ${alignCls}`}>
      {win.map(l => {
        const idx = lyrics.indexOf(l);
        const active = idx === activeIndex;
        return <div key={idx} className={`leading-tight transition-all ${active ? 'font-black' : 'opacity-40 font-medium text-zinc-400'}`} style={{ fontSize: active ? `${lyricsFontSize+2}px` : `${lyricsFontSize-2}px`, color: active ? accent : undefined }}>{l.text || '♪'}</div>;
      })}
    </div>
  );
}

export default function CardTheme(props: LyricsThemeProps) {
  const { accent, lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines } = props;
  return (
    <div className="card-theme bg-white text-zinc-900 rounded-2xl overflow-hidden shadow-2xl p-6">
      <LyricsLines lyrics={lyrics} activeIndex={activeIndex} plainLyrics={plainLyrics} lyricsAlign={lyricsAlign} lyricsFontSize={lyricsFontSize} maxLyricsLines={maxLyricsLines} accent={accent} />
    </div>
  );
}
