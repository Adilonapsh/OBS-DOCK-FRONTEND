import { Music } from 'lucide-react';
import type { ViewCounterThemeProps } from './types';
import { PLATFORM_META, fmtCount } from './shared';

export type SongLite = {
  id: string;
  title: string;
  requestedBy: string;
};

export default function MusicTheme({
  counts,
  total,
  font,
  fontSize,
  accent,
  showLabel,
  showBreakdown,
  inline,
  emptyLabel,
  songs,
  currentSong,
}: ViewCounterThemeProps & { songs?: SongLite[]; currentSong?: SongLite | null }) {
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (inline) {
    return (
      <div className="vc-font flex items-center gap-2 px-3 py-2 bg-black rounded-full border border-white/10 max-w-full" style={{ fontFamily: `'${font}', sans-serif` }}>
        <Music className="w-4 h-4 shrink-0" style={{ color: accent }} />
        <span className="text-white font-black tabular-nums" style={{ fontSize: Math.max(14, fontSize - 8) }}>{fmtCount(total)}</span>
        {showLabel && <span className="text-white/50 text-[10px] font-black uppercase tracking-widest hidden sm:inline">Watching</span>}
        {currentSong && <span className="text-white/80 text-[10px] font-bold truncate max-w-[160px]">♪ {currentSong.title}</span>}
      </div>
    );
  }
  return (
    <div className="vc-font w-[240px] rounded-2xl overflow-hidden border border-white/10 bg-black shadow-xl" style={{ fontFamily: `'${font}', sans-serif` }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <Music className="w-4 h-4 shrink-0" style={{ color: accent }} />
        {showLabel && <span className="text-white/50 text-[9px] font-black uppercase tracking-widest">Watching</span>}
        <span className="ml-auto text-white font-black tabular-nums leading-none" style={{ fontSize: Math.max(14, fontSize - 6) }}>{fmtCount(total)}</span>
      </div>
      {showBreakdown && (
        <div className="px-3 pb-1 flex items-center gap-2 flex-wrap">
          {rows.length === 0 && <span className="text-white/40 text-[9px] font-bold">{emptyLabel}</span>}
          {rows.map(([p, n]) => {
            const meta = PLATFORM_META[p] || PLATFORM_META.tiktok;
            return (
              <span key={p} className="flex items-center gap-1 shrink-0" title={meta.label}>
                <img src={meta.logo} alt={meta.label} className="w-4 h-4 object-contain" />
                <span className="text-white text-[10px] font-black tabular-nums">{fmtCount(n)}</span>
              </span>
            );
          })}
        </div>
      )}
      <div className="mx-3 mb-2.5 mt-1 rounded-xl bg-white/5 border border-white/10 px-2.5 py-2">
        <div className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Now Playing</div>
        {currentSong ? (
          <>
            <div className="text-white text-[11px] font-black truncate">{currentSong.title}</div>
            <div className="text-gray-500 text-[9px] truncate">req by {currentSong.requestedBy}</div>
          </>
        ) : (
          <div className="text-gray-600 text-[10px] italic">Queue kosong</div>
        )}
        {songs && songs.length > 1 && (
          <div className="mt-1.5 space-y-1">
            {songs.slice(1, 4).map((s, i) => (
              <div key={s.id} className="text-gray-500 text-[9px] truncate">
                {i + 2}. {s.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
