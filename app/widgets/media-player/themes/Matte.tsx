import type { MediaThemeProps } from './types';
import './Matte.css';

export default function MatteTheme(props: MediaThemeProps) {
  const { track, artist, art, accent, progressPercent, currentPos, timeline, showAlbumArt, showProgressBar, showPrimary, showSecondary, isPausedOverlay, textAlignCls, msToTime } = props;
  return (
    <div className="matte-theme relative flex gap-3 p-3 rounded-2xl overflow-hidden border bg-white text-zinc-900 border-zinc-200 shadow-lg">
      {showAlbumArt && (
        <div className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-cover bg-center ${isPausedOverlay ? 'grayscale' : ''}`} style={{ backgroundImage: `url('${art}')` }}>
          {isPausedOverlay && <div className="absolute inset-0 bg-black/40 grid place-items-center text-white text-[10px] font-black">PAUSED</div>}
        </div>
      )}
      <div className={`flex-1 min-w-0 flex flex-col justify-center ${textAlignCls}`}>
        {showPrimary && <div className="font-black leading-tight truncate text-zinc-900">{track || '-'}</div>}
        {showSecondary && <div className="text-sm opacity-60 truncate text-zinc-700">{artist || '-'}</div>}
        {showProgressBar && timeline && (
          <div className="mt-2">
            <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div className="h-full" style={{ width: `${progressPercent}%`, background: accent }} />
            </div>
            <div className="flex justify-between text-[10px] font-mono opacity-60 mt-1">
              <span>{msToTime(currentPos)}</span>
              <span>{msToTime(timeline.EndTime)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
