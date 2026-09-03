import type { MediaThemeProps } from './types';
import './Classic.css';

export default function ClassicTheme(props: MediaThemeProps) {
  const { track, artist, art, bgArt, bgColor, textColor, accent, progressPercent, currentPos, timeline, showAlbumArt, showProgressBar, showPrimary, showSecondary, isPausedOverlay, textAlignCls, msToTime } = props;
  return (
    <div
      className="classic-theme relative flex gap-4 p-4 rounded-2xl overflow-hidden border bg-black/70 backdrop-blur-xl border-white/10"
      style={{ background: `linear-gradient(0deg, ${bgColor}ee, ${bgColor}aa), url('${bgArt}') center/cover`, color: textColor }}
    >
      {showAlbumArt && (
        <div className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-cover bg-center ${isPausedOverlay ? 'grayscale' : ''}`} style={{ backgroundImage: `url('${art}')` }}>
          {isPausedOverlay && <div className="absolute inset-0 bg-black/40 grid place-items-center text-white text-[10px] font-black">PAUSED</div>}
        </div>
      )}
      <div className={`flex-1 min-w-0 flex flex-col justify-center ${textAlignCls}`}>
        {showPrimary && <div className="font-black leading-tight truncate drop-shadow">{track || '-'}</div>}
        {showSecondary && <div className="text-sm opacity-80 truncate">{artist || '-'}</div>}
        {showProgressBar && timeline && (
          <div className="mt-2">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full" style={{ width: `${progressPercent}%`, background: accent }} />
            </div>
            <div className="flex justify-between text-[10px] font-mono opacity-70 mt-1">
              <span>{msToTime(currentPos)}</span>
              <span>{msToTime(timeline.EndTime)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
