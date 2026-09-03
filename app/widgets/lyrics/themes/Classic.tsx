import type { LyricsThemeProps } from './types';
import './Classic.css';

function LyricsLines({ lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines, accent }: Pick<LyricsThemeProps,'lyrics'|'activeIndex'|'plainLyrics'|'lyricsAlign'|'lyricsFontSize'|'maxLyricsLines'|'accent'>) {
  const alignCls = lyricsAlign === 'center' ? 'text-center' : lyricsAlign === 'right' ? 'text-right' : 'text-left';
  if (!lyrics.length) {
    if (!plainLyrics) return <div className={`opacity-40 text-sm italic ${alignCls}`} style={{ fontSize: `${Math.max(12, lyricsFontSize - 2)}px` }}>♪ instrumental - no lyrics ♪</div>;
    return <div className={`opacity-80 leading-relaxed ${alignCls}`} style={{ fontSize: `${lyricsFontSize}px` }}>{plainLyrics.split('\n').slice(0, maxLyricsLines).join('  •  ')}</div>;
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
        return <div key={idx} className={`leading-tight transition-all ${active ? 'font-black scale-[1.03] drop-shadow' : 'opacity-50 font-medium'}`} style={{ fontSize: active ? `${lyricsFontSize+2}px` : `${lyricsFontSize-2}px`, color: active ? accent : undefined }}>{l.text || '♪'}</div>;
      })}
    </div>
  );
}

export default function ClassicTheme(props: LyricsThemeProps) {
  const { bgArt, bgColor, textColor, accent, lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines } = props;
  return (
    <div className="classic-theme relative p-6 rounded-2xl overflow-hidden border bg-black/70 backdrop-blur-xl border-white/10" style={{ background: `linear-gradient(0deg, ${bgColor}ee, ${bgColor}aa), url('${bgArt}') center/cover`, color: textColor }}>
      <LyricsLines lyrics={lyrics} activeIndex={activeIndex} plainLyrics={plainLyrics} lyricsAlign={lyricsAlign} lyricsFontSize={lyricsFontSize} maxLyricsLines={maxLyricsLines} accent={accent} />
    </div>
  );
}
