import type { MediaThemeProps } from './types';
import './MatteDark.css';

export default function MatteDarkTheme(props: MediaThemeProps) {
  const { track, artist, art, palette, accent, progressPercent, currentPos, timeline, showAlbumArt, showProgressBar, showPrimary, showSecondary, isPausedOverlay, textAlignCls, msToTime } = props;
  const bgColor = palette.DarkMuted;
  const textColor = '#ffffff';
  return (
    <div className="matte-dark-theme relative flex gap-3 p-3 rounded-2xl overflow-hidden border bg-zinc-900 text-white border-white/10" style={{ backgroundColor: bgColor, color: textColor }}>
      {showAlbumArt && (
        <div className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-cover bg-center ${isPausedOverlay ? 'grayscale' : ''}`} style={{ backgroundImage: `url('${art}')` }}>
          {isPausedOverlay && <div className="absolute inset-0 bg-black/40 grid place-items-center text-white text-[10px] font-black">PAUSED</div>}
        </div>
      )}
      <div className={`flex-1 min-w-0 flex flex-col justify-center ${textAlignCls}`}>
        {showPrimary && <div className="font-black leading-tight truncate">{track || '-'}</div>}
        {showSecondary && <div className="text-sm opacity-60 truncate">{artist || '-'}</div>}
        {showProgressBar && timeline && (
          <div className="mt-2">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
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
