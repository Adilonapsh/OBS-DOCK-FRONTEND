import type { LyricsThemeProps } from './types';
import './AlbumArt.css';

function LyricsLines({ lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines, accent }: Pick<LyricsThemeProps,'lyrics'|'activeIndex'|'plainLyrics'|'lyricsAlign'|'lyricsFontSize'|'maxLyricsLines'|'accent'>) {
  const alignCls = lyricsAlign === 'center' ? 'text-center' : lyricsAlign === 'right' ? 'text-right' : 'text-left';
  if (!lyrics.length) {
    if (!plainLyrics) return <div className={`opacity-70 text-sm italic ${alignCls}`} style={{ fontSize: `${Math.max(12, lyricsFontSize - 2)}px` }}>♪ instrumental - no lyrics ♪</div>;
    return <div className={`opacity-90 leading-relaxed ${alignCls}`} style={{ fontSize: `${lyricsFontSize}px` }}>{plainLyrics.split('\n').slice(0, maxLyricsLines).join(' • ')}</div>;
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
        return <div key={idx} className={`leading-tight transition-all drop-shadow ${active ? 'font-black' : 'opacity-60 font-medium'}`} style={{ fontSize: active ? `${lyricsFontSize+3}px` : `${lyricsFontSize}px`, color: active ? '#fff' : 'rgba(255,255,255,0.7)', textShadow: active ? `0 0 10px ${accent}` : undefined }}>{l.text || '♪'}</div>;
      })}
    </div>
  );
}

export default function AlbumArtTheme(props: LyricsThemeProps) {
  const { bgArt, bgColor, accent, lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines } = props;
  return (
    <div className="album-art-theme relative w-full max-w-[560px] mx-auto rounded-2xl overflow-hidden shadow-2xl min-h-[180px] flex items-center justify-center p-8" style={{ background: `linear-gradient(0deg, ${bgColor}ee, rgba(0,0,0,0.5)), url('${bgArt}') center/cover` }}>
      <LyricsLines lyrics={lyrics} activeIndex={activeIndex} plainLyrics={plainLyrics} lyricsAlign={lyricsAlign} lyricsFontSize={lyricsFontSize} maxLyricsLines={maxLyricsLines} accent={accent} />
      <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl pointer-events-none" />
    </div>
  );
}
