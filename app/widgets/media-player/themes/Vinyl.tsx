import type { MediaThemeProps } from './types';
import './Vinyl.css';

export default function VinylTheme(props: MediaThemeProps) {
  const { track, artist, art, accent, progressPercent, showAlbumArt, showProgressBar, showPrimary, showSecondary, isPausedOverlay, playbackStatus, timeline, textAlignCls } = props;
  const isPlaying = playbackStatus === 4; // PLAYING
  return (
    <div className="vinyl-theme flex items-center gap-4 bg-black/80 backdrop-blur rounded-full p-3 pr-6 border border-white/10 shadow-xl">
      {showAlbumArt && (
        <div className={`vinyl-record w-24 h-24 rounded-full shrink-0 overflow-hidden border-4 border-zinc-800 relative ${isPlaying && !isPausedOverlay ? 'spinning' : ''}`} style={{ backgroundImage: `url('${art}')`, backgroundSize: 'cover' }}>
          <div className="absolute inset-0 grid place-items-center"><div className="w-6 h-6 bg-zinc-900 rounded-full border-2 border-white/20 shadow-inner" /></div>
          <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />
        </div>
      )}
      <div className={`flex-1 min-w-0 ${textAlignCls}`}>
        {showPrimary && <div className="font-black text-white truncate">{track || '-'}</div>}
        {showSecondary && <div className="text-sm truncate opacity-80 text-white/70">{artist || '-'}</div>}
        {showProgressBar && timeline && <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full" style={{ width: `${progressPercent}%`, background: accent }} /></div>}
      </div>
    </div>
  );
}
