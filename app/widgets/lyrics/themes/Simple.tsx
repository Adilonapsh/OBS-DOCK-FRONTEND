import type { LyricsThemeProps } from './types';
import './Simple.css';

function LyricsLines({ lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines, accent }: Pick<LyricsThemeProps,'lyrics'|'activeIndex'|'plainLyrics'|'lyricsAlign'|'lyricsFontSize'|'maxLyricsLines'|'accent'>) {
  const alignCls = lyricsAlign === 'center' ? 'text-center' : lyricsAlign === 'right' ? 'text-right' : 'text-left';
  if (!lyrics.length) {
    if (!plainLyrics) return <div className={`opacity-30 text-sm italic ${alignCls} text-white/60`} style={{ fontSize: `${Math.max(12, lyricsFontSize - 2)}px` }}>♪ instrumental - no lyrics ♪</div>;
    return <div className={`opacity-80 leading-relaxed ${alignCls} text-white/90`} style={{ fontSize: `${lyricsFontSize}px` }}>{plainLyrics.split('\n').slice(0, maxLyricsLines).join('  •  ')}</div>;
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
        return <div key={idx} className={`leading-tight transition-all drop-shadow ${active ? 'font-black' : 'opacity-40 font-medium text-white/60'}`} style={{ fontSize: active ? `${lyricsFontSize+3}px` : `${lyricsFontSize-2}px`, color: active ? '#fff' : undefined, textShadow: active ? `0 0 12px ${accent}` : undefined }}>{l.text || '♪'}</div>;
      })}
    </div>
  );
}

export default function SimpleTheme(props: LyricsThemeProps) {
  const { accent, lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines, textAlignCls } = props;
  return (
    <div className={`simple-theme flex flex-col justify-center bg-transparent ${textAlignCls}`} style={{ textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}>
      <LyricsLines lyrics={lyrics} activeIndex={activeIndex} plainLyrics={plainLyrics} lyricsAlign={lyricsAlign} lyricsFontSize={lyricsFontSize} maxLyricsLines={maxLyricsLines} accent={accent} />
    </div>
  );
}
