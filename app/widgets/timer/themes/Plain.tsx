import type { TimerThemeProps } from './types';
import { resolveTextColor } from '../../_shared/utils/color';
import './Plain.css';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function PlainTimerTheme({ font, fontSize, timerSeconds, textColor, accent }: TimerThemeProps) {
  const color = resolveTextColor(textColor || accent || '#ffffff', '#ffffff');
  const scale = fontSize ? fontSize / 14 : 1;
  return (
    <div
      className="timer-plain-theme"
      style={{ fontFamily: `'${font}', sans-serif`, background: 'transparent' }}
    >
      <span className="font-bold tabular-nums" style={{ color, fontSize: `${Math.round(32 * scale)}px`, lineHeight: 1 }}>
        {formatTime(timerSeconds)}
      </span>
    </div>
  );
}
