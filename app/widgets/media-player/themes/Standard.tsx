import type { MediaThemeProps } from './types';
import './Standard.css';

export default function StandardTheme(props: MediaThemeProps) {
  const { track, artist, art, palette, accent, bgColor, textColor, progressPercent, currentPos, timeline, showAlbumArt, showProgressBar, showPrimary, showSecondary, isPausedOverlay, textAlignCls, msToTime } = props;
  return (
    <div
      id="standard-wrapper"
      className="standard-theme relative flex gap-3 p-3 rounded-2xl overflow-hidden border bg-zinc-900/80 backdrop-blur-xl border-white/10"
      style={{ backgroundColor: bgColor + 'CC', color: textColor }}
    >
      {showAlbumArt && (
        <div id="album-art-container" className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-cover bg-center ${isPausedOverlay ? 'is-paused grayscale' : ''}`} style={{ backgroundImage: `url('${art}')` }}>
          {isPausedOverlay && <div className="absolute inset-0 bg-black/40 grid place-items-center text-white text-[10px] font-black">PAUSED</div>}
        </div>
      )}
      <div id="song-info-container" className={`flex-1 min-w-0 flex flex-col justify-center ${textAlignCls}`}>
        {showPrimary && <div id="track-label" className="font-black leading-tight truncate">{track || '-'}</div>}
        {showSecondary && <div id="artist-label" className="text-sm opacity-70 truncate">{artist || '-'}</div>}
        {showProgressBar && timeline && (
          <div id="progress-container" className="mt-2">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div id="progress-bar-fill" className="h-full transition-all duration-200" style={{ width: `${progressPercent}%`, background: accent }} />
            </div>
            <div className="flex justify-between text-[10px] font-mono opacity-60 mt-1">
              <span id="current-time">{msToTime(currentPos)}</span>
              <span id="duration">{msToTime(timeline.EndTime)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
