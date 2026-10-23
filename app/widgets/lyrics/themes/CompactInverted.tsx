import type { LyricsThemeProps } from './types';
import './CompactInverted.css';

function LyricsLines({ lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines, accent }: Pick<LyricsThemeProps,'lyrics'|'activeIndex'|'plainLyrics'|'lyricsAlign'|'lyricsFontSize'|'maxLyricsLines'|'accent'>) {
  const alignCls = lyricsAlign === 'center' ? 'text-center' : lyricsAlign === 'right' ? 'text-right' : 'text-left';
  if (!lyrics.length) {
    if (!plainLyrics) return <div className={`opacity-40 text-sm italic ${alignCls}`} style={{ fontSize: `${Math.max(11, lyricsFontSize - 3)}px` }}>♪ no lyrics ♪</div>;
    return <div className={`opacity-70 leading-tight ${alignCls}`} style={{ fontSize: `${lyricsFontSize-1}px` }}>{plainLyrics.split('\n').slice(0, maxLyricsLines).join(' • ')}</div>;
  }
  const half = Math.floor(maxLyricsLines / 2);
  let start = Math.max(0, activeIndex - half);
  let end = start + maxLyricsLines;
  if (end > lyrics.length) { end = lyrics.length; start = Math.max(0, end - maxLyricsLines); }
  const win = lyrics.slice(start, end);
  return (
    <div className={`flex flex-col gap-1 ${alignCls}`}>
      {win.map(l => {
        const idx = lyrics.indexOf(l);
        const active = idx === activeIndex;
        return <div key={idx} className={`leading-tight transition-all ${active ? 'font-bold' : 'opacity-40'}`} style={{ fontSize: active ? `${lyricsFontSize}px` : `${lyricsFontSize-3}px`, color: active ? accent : undefined }}>{l.text || '♪'}</div>;
      })}
    </div>
  );
}

export default function CompactInvertedTheme(props: LyricsThemeProps) {
  const { palette, accent, lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines } = props;
  const bgColor = palette.LightMuted || '#ffffff';
  return (
    <div className="compact-inverted-theme px-5 py-3 rounded-full border shadow-lg bg-white text-zinc-900 border-zinc-200" style={{ background: bgColor }}>
      <LyricsLines lyrics={lyrics} activeIndex={activeIndex} plainLyrics={plainLyrics} lyricsAlign={lyricsAlign} lyricsFontSize={lyricsFontSize} maxLyricsLines={maxLyricsLines} accent={accent} />
    </div>
  );
}
