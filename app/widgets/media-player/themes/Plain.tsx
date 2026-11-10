import type { MediaThemeProps } from './types';
import './Plain.css';

export default function PlainTheme(props: MediaThemeProps) {
  const { track, artist, showPrimary, showSecondary, textAlignCls } = props;
  return (
    <div className={`plain-theme flex flex-col justify-center bg-transparent ${textAlignCls}`}>
      {showPrimary && <div className="plain-primary font-bold leading-tight truncate text-white drop-shadow">{track || '-'}</div>}
      {showSecondary && <div className="plain-secondary text-sm truncate text-white/85 drop-shadow">{artist || '-'}</div>}
    </div>
  );
}
