import type { MediaThemeProps } from './types';
import './CompactInverted.css';

export default function CompactInvertedTheme(props: MediaThemeProps) {
  const { track, artist, art, accent, progressPercent, showAlbumArt, showProgressBar, showPrimary, showSecondary, textAlignCls } = props;
  return (
    <div className="compact-inverted-theme flex items-center gap-3 px-3 py-2 rounded-full border shadow-lg bg-white text-black border-black/10" style={{ background: '#fff', color: '#111' }}>
      {showAlbumArt && <div className="w-8 h-8 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${art}')` }} />}
      <div className={`flex-1 min-w-0 flex items-center gap-2 ${textAlignCls}`}>
        {showPrimary && <span className="font-bold truncate text-[0.9em]">{track || '-'}</span>}
        {showSecondary && <span className="opacity-60 truncate text-[0.8em]">• {artist || '-'}</span>}
      </div>
      {showProgressBar && <div className="w-16 h-1 bg-black/20 rounded-full overflow-hidden shrink-0"><div className="h-full" style={{ width: `${progressPercent}%`, background: accent }} /></div>}
    </div>
  );
}
