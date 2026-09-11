import type { TimerThemeProps } from './types';
import { resolveBg, resolveTextColor } from '../../_shared/utils/color';
import './Focus.css';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusTimerTheme({ font, fontSize, timerSeconds, isRunning, currentSession, totalSessions, onToggleTimer, onResetTimer, onNextSession, anim, bg, bgOpacity, accent, textColor }: TimerThemeProps) {
  const eff = anim || 'elegantIn';
  const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn'].includes(eff);
  const dur = isEleg ? '0.62s' : '0.4s';
  const animStyle = `${eff} ${dur} cubic-bezier(0.16,1,0.3,1) both`;
  const cardBg = resolveBg(bg, accent, '#594d4a', bgOpacity);
  const color = resolveTextColor(textColor, '#ffffff');
  const scale = fontSize ? fontSize / 14 : 1;
  return (
    <div className="timer-card w-full max-w-[330px] p-6 flex flex-col items-center justify-between text-center relative overflow-hidden" style={{ fontFamily: `'Nunito','Montserrat','${font}', sans-serif`, animation: animStyle, background: cardBg }}>
      <div className="space-y-0.5 mb-2">
        <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: `${color}CC` }}>FOCUS</span>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: `${color}99` }}>{currentSession} / {totalSessions}</div>
      </div>
      <div className="relative w-44 h-44 my-1 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeOpacity={0.9} strokeWidth="2.5" strokeDasharray="2 3.8" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-extrabold tracking-tight drop-shadow-sm" style={{ fontFamily: `'Montserrat','Nunito', sans-serif`, color, fontSize: `${Math.round(36 * scale)}px` }}>{formatTime(timerSeconds)}</span>
        </div>
      </div>
    </div>
  );
}
