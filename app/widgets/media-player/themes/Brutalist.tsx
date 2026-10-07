import type { MediaThemeProps } from './types';

export const themeMeta = { value: 'brutalist', label: 'Brutalist' } as const;

export default function BrutalistTheme(props: MediaThemeProps) {
  const {
    track,
    artist,
    art,
    accent,
    progressPercent,
    currentPos,
    timeline,
    showAlbumArt,
    showProgressBar,
    showPrimary,
    showSecondary,
    isPausedOverlay,
    textAlignCls,
    msToTime,
  } = props;

  const safeAccent = accent && accent !== 'transparent' ? accent : '#ffe600';
  const pct = Math.max(0, Math.min(100, progressPercent || 0));
  const hasArt = !!art && art !== '' && !art.includes('placeholder.com');

  return (
    <div
      className={`brutalist-media relative flex gap-0 bg-white border-[4px] border-black overflow-hidden ${textAlignCls}`}
      style={{ minWidth: '320px', maxWidth: '520px' }}
    >
      {/* halftone overlay */}
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

      {/* album art block - brutal square - FIXED: always show art via img */}
      {showAlbumArt && (
        <div className="relative w-28 sm:w-32 shrink-0 border-r-[4px] border-black bg-white overflow-hidden mt-[10px] self-stretch min-h-[7rem] sm:min-h-[8rem] flex flex-col">
          {hasArt ? (
            <img src={art!} alt={track || 'album art'} className="w-full flex-1 min-h-0 object-cover" />
          ) : (
            <div className="w-full flex-1 min-h-0 grid place-items-center bg-white">
              <span className="text-[28px] font-black text-black">♪</span>
            </div>
          )}
          {isPausedOverlay && (
            <div className="absolute inset-0 bg-white/80 grid place-items-center border-[3px] border-black m-2">
              <span className="px-2 py-1 bg-black text-white text-[10px] font-black tracking-widest uppercase">
                PAUSED
              </span>
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
              backgroundSize: '8px 8px',
              opacity: 0.07,
            }}
          />
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black text-white text-[8px] font-black uppercase tracking-widest">
            ART
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-between mt-[10px] bg-white relative self-stretch min-h-[7rem] sm:min-h-[8rem]">
        {/* header */}
        <div className="flex items-center gap-2 px-3 pt-2 pb-2 border-b-[3px] border-black">
          <span className="px-2 py-1 bg-black text-white text-[9px] font-black tracking-widest uppercase">
            NOW PLAYING
          </span>
          <span
            className="ml-auto w-2.5 h-2.5 border-[2px] border-black"
            style={{ background: isPausedOverlay ? '#fff' : safeAccent }}
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-black">
            {isPausedOverlay ? 'PAUSED' : 'PLAYING'}
          </span>
        </div>

        <div className="flex-1 min-w-0 px-3 py-3 flex flex-col justify-center gap-1.5">
          {showPrimary && (
            <div
              className="font-black leading-tight truncate text-black text-[15px] sm:text-[16px]"
              style={{ letterSpacing: '-0.02em' }}
            >
              {track || '-'}
            </div>
          )}
          {showSecondary && (
            <div className="text-[12px] font-bold truncate text-black/70 flex items-center gap-1.5">
              <span className="w-3 h-[3px] bg-black shrink-0" style={{ background: safeAccent }} />
              {artist || '-'}
            </div>
          )}
          {!showPrimary && !showSecondary && (
            <div className="text-[12px] font-black text-black/40 uppercase tracking-widest">No track</div>
          )}
        </div>

        {/* progress - brutal bar - always show when enabled, even without timeline */}
        {showProgressBar && (
          <div className="px-3 pb-3">
            <div
              className="h-4 bg-white border-[3px] border-black relative overflow-hidden"
              style={{ boxShadow: '3px 3px 0 #000' }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(#000 0.9px, transparent 0.9px)',
                  backgroundSize: '6px 6px',
                  opacity: 0.08,
                }}
              />
              <div
                className="h-full border-r-[3px] border-black transition-all duration-200"
                style={{ width: `${pct}%`, background: safeAccent }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black font-mono text-black mt-1">
              <span className="px-1 bg-black text-white">{msToTime(currentPos)}</span>
              <span className="px-1 bg-white border-[2px] border-black text-black">
                {timeline ? msToTime(timeline.EndTime) : msToTime((currentPos * 100) / Math.max(1, pct))}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
