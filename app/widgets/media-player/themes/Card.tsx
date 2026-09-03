import type { MediaThemeProps } from './types';
import './Card.css';

export default function CardTheme(props: MediaThemeProps) {
  const { track, artist, art, accent, progressPercent, currentPos, timeline, showAlbumArt, showProgressBar, showPrimary, showSecondary, msToTime } = props;
  return (
    <div className="card-theme bg-white text-zinc-900 rounded-2xl overflow-hidden shadow-2xl flex">
      {showAlbumArt && <div className="w-32 h-32 bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${art}')` }} />}
      <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
        {showPrimary && <div className="font-black truncate text-zinc-900">{track || '-'}</div>}
        {showSecondary && <div className="text-sm opacity-60 truncate text-zinc-700">{artist || '-'}</div>}
        {showProgressBar && timeline && <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-zinc-600"><span>{msToTime(currentPos)}</span><div className="flex-1 h-1 bg-zinc-200 rounded-full overflow-hidden"><div className="h-full" style={{ width: `${progressPercent}%`, background: accent }} /></div><span>{msToTime(timeline.EndTime)}</span></div>}
      </div>
    </div>
  );
}
