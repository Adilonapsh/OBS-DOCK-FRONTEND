import type { MediaThemeProps } from './types';
import './AlbumArt.css';

export default function AlbumArtTheme(props: MediaThemeProps) {
  const { art, isPausedOverlay, error, smtcBridgeAddress, smtcBridgePort, obsMode } = props;
  return (
    <div className="album-art-theme relative w-full aspect-square max-w-[400px] mx-auto rounded-2xl overflow-hidden bg-black shadow-2xl">
      <div className={`absolute inset-0 bg-cover bg-center ${isPausedOverlay ? 'grayscale' : ''}`} style={{ backgroundImage: `url('${art}')` }} />
      {isPausedOverlay && <div className="absolute inset-0 bg-black/40 grid place-items-center text-white font-black tracking-widest">PAUSED</div>}
      {!obsMode && error && <div className="absolute inset-0 grid place-items-center bg-black/60 text-white text-xs p-4 text-center">{error}<br/><span className="opacity-60">Install SMTC Bridge: {smtcBridgeAddress}:{smtcBridgePort}</span></div>}
      <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl pointer-events-none" />
    </div>
  );
}
