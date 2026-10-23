import type { TimerThemeProps } from './types';
import { resolveBg, resolveTextColor } from '../../_shared/utils/color';
import './Minimal.css';
function formatTime(sec:number){const m=Math.floor(sec/60);const s=sec%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
export default function MinimalTimerTheme({ font, fontSize, timerSeconds, isRunning, currentSession, totalSessions, anim, bg, bgOpacity, accent, textColor }: TimerThemeProps){
  const eff=anim||'elegantIn'; const isEleg=['elegantIn','softPopIn','blurIn','luxeIn'].includes(eff); const dur=isEleg?'0.62s':'0.4s';
  const bgColor = resolveBg(bg, accent, '#121212', bgOpacity);
  const color = resolveTextColor(textColor, '#ffffff');
  const scale = fontSize ? fontSize / 14 : 1;
  return <div className="timer-minimal-theme w-full max-w-[360px] border rounded-2xl p-5 flex items-center justify-between" style={{fontFamily:`'${font}', sans-serif`, animation:`${eff} ${dur} cubic-bezier(0.16,1,0.3,1) both`, background: bgColor, borderColor: `${color}1A`}}><span className="font-black text-[11px] uppercase tracking-widest" style={{color}}>Focus {currentSession}/{totalSessions}</span><span className="font-mono font-black" style={{color, fontSize: `${Math.round(18 * scale)}px`}}>{formatTime(timerSeconds)}</span><span className={`w-2 h-2 rounded-full ${isRunning?'bg-green-500 animate-pulse':'bg-gray-500'}`} style={{ background: isRunning ? (accent && accent !== 'transparent' ? accent : undefined) : undefined }} /></div>;
}
