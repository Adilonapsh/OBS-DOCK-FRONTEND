import type { LyricsThemeProps } from './types';
import './Standard.css';

function LyricsLines({ lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, maxLyricsLines, accent }: Pick<LyricsThemeProps,'lyrics'|'activeIndex'|'plainLyrics'|'lyricsAlign'|'lyricsFontSize'|'maxLyricsLines'|'accent'>) {
  const alignCls = lyricsAlign === 'center' ? 'text-center' : lyricsAlign === 'right' ? 'text-right' : 'text-left';
  if (!lyrics.length) {
    if (!plainLyrics) return <div className={`lyrics-empty opacity-40 text-sm italic ${alignCls}`} style={{ fontSize: `${Math.max(12, lyricsFontSize - 2)}px` }}>♪ instrumental - no lyrics ♪</div>;
    return <div className={`lyrics-plain opacity-80 leading-relaxed ${alignCls}`} style={{ fontSize: `${lyricsFontSize}px` }}>{plainLyrics.split('\n').slice(0, maxLyricsLines).join('  •  ')}</div>;
  }
  // Halaman penuh per maxLyricsLines (bukan geser tiap baris) agar jendela stabil & tidak lompat.
  // Semua baris font-size SAMA - status aktif hanya beda warna/opacity/scale (transform),
  // jadi tidak ada layout-shift saat highlight pindah (sumber glitch sebelumnya).
  const safeActive = Math.max(0, activeIndex);
  const start = Math.floor(safeActive / maxLyricsLines) * maxLyricsLines;
  const win = lyrics.slice(start, start + maxLyricsLines);
  return (
    <div className={`lyrics-window flex flex-col gap-1.5 ${alignCls}`}>
      {win.map((l, i) => {
        const idx = start + i;
        const isActive = idx === activeIndex;
        return <div key={idx} className={`lyrics-line lyrics-line-in leading-tight transition-[color,opacity,transform] duration-300 ${isActive ? 'font-black scale-[1.03]' : 'opacity-40 font-medium'}`} style={{ fontSize: `${lyricsFontSize}px`, color: isActive ? accent : undefined }}>{l.text || '♪'}</div>;
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
