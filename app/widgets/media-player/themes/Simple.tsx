import type { MediaThemeProps } from './types';
import './Simple.css';

export default function SimpleTheme(props: MediaThemeProps) {
  const { track, artist, accent, progressPercent, currentPos, timeline, showProgressBar, showPrimary, showSecondary, textAlignCls, msToTime } = props;
  return (
    <div className={`simple-theme flex flex-col justify-center ${textAlignCls} bg-transparent`}>
      {showPrimary && <div className="font-black leading-tight truncate text-white drop-shadow">{track || '-'}</div>}
      {showSecondary && <div className="text-sm opacity-70 truncate text-white/80">{artist || '-'}</div>}
      {showProgressBar && timeline && (
        <div className="mt-1 h-1 bg-white/20 rounded-full overflow-hidden w-full">
          <div className="h-full" style={{ width: `${progressPercent}%`, background: accent }} />
        </div>
      )}
      {showProgressBar && timeline && (
        <div className="flex justify-between text-[10px] font-mono opacity-50 mt-1 text-white/60">
          <span>{msToTime(currentPos)}</span>
          <span>{msToTime(timeline.EndTime)}</span>
        </div>
      )}
    </div>
  );
}
