import type { TimerThemeProps } from './types';
import { hexToRgba, resolveTextColor } from '../../_shared/utils/color';
import './Glass.css';

function formatHMS(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    sTens: String(s).padStart(2, '0')[0],
    sOnes: String(s).padStart(2, '0')[1],
    sStr: String(s).padStart(2, '0'),
  };
}

export default function GlassTheme({ font, fontSize, timerSeconds, isRunning, onToggleTimer, anim, subathonMode, textColor, bg, bgOpacity, accent, onAddTime, addedSeconds }: TimerThemeProps & { subathonMode?: string; textColor?: string; onAddTime?: (sec: number) => void; addedSeconds?: number | null }) {
  const eff = anim || 'elegantIn';
  const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn'].includes(eff);
  const dur = isEleg ? '0.62s' : '0.4s';
  const animStyle = `${eff} ${dur} cubic-bezier(0.16,1,0.3,1) both`;
  const { h, m, sTens, sOnes } = formatHMS(timerSeconds);
  const color = resolveTextColor(textColor, '#ffffff');
  // Glass: bg & accent now themable — default tint pakai accent jika ada, fallback ke ungu muda lama
  const glassBg = bg && bg !== 'transparent' ? hexToRgba(bg, bgOpacity) : accent && accent !== 'transparent' ? hexToRgba(accent, Math.round(bgOpacity * 0.45)) : hexToRgba('#939eff', Math.round(bgOpacity * 0.45));
  const glassBorder = `${color}66`;
  const sOnesColor = accent && accent !== '#594d4a' && accent !== 'transparent' ? accent : (textColor && textColor !== '#ffffff' ? textColor : '#c3d3ff');

  const handleAddTimeDelta = (sec: number) => {
    if (onAddTime) onAddTime(sec);
    else (window as unknown as { __glassAddTime?: (sec: number) => void }).__glassAddTime?.(sec);
  };

  const addedLabel = addedSeconds ? (Math.abs(addedSeconds) >= 60 ? `${addedSeconds > 0 ? '+' : '-'}${Math.floor(Math.abs(addedSeconds)/60)}m` : `${addedSeconds > 0 ? '+' : ''}${addedSeconds}s`) : null;

  const mode = String(subathonMode || 'powerup');
  const modeLabel = mode === 'powerup' ? 'POWER-UP' : mode === 'sleep' ? 'SLEEP' : mode === 'locked' ? 'LOCKED' : 'PAUSED';
  const modeAnim = 'softPopIn 0.42s cubic-bezier(0.16,1,0.3,1) both';

  return (
    <div className="glass-theme w-full max-w-xl mx-auto flex flex-col items-center select-none" style={{ fontFamily: `'Nunito','${font}', sans-serif` }}>
      <div key={mode} className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase will-change-transform" style={{ background: mode === 'powerup' ? '#ebd1b3' : mode === 'sleep' ? '#8b88d9' : 'rgba(0,0,0,0.2)', color: mode === 'powerup' ? '#2b2b42' : '#ffffff', animation: modeAnim }}>
        {mode === 'powerup' && <><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> 2X • {modeLabel}</>}
        {mode === 'sleep' && <><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg> Zz • {modeLabel}</>}
        {mode === 'locked' && <><svg className="w-3 h-3 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg> {modeLabel}</>}
        {mode === 'paused' && <><svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> {modeLabel}</>}
      </div>

      <div className="timer-overlay-card w-full px-10 py-5 sm:px-8 sm:py-6 flex items-center justify-between relative overflow-hidden mt-2" style={{ background: glassBg, borderColor: glassBorder }}>
        <div className="clock-badge w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0" style={{ borderColor: `${color}D9` }}>
          <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5" />
          </svg>
        </div>

        <div className="flex items-center justify-center font-black tracking-tight space-x-1 sm:space-x-1.5 px-2" style={{ fontSize: fontSize ? `${Math.round(48 * (fontSize/14))}px` : undefined, color }}>
          <div className="h-12 sm:h-16 overflow-hidden flex items-center">
            <span key={h} className="inline-block slide-up" style={{ color }}>{h}</span>
          </div>
          <span style={{ color }}>:</span>
          <div className="h-12 sm:h-16 overflow-hidden flex items-center">
            <span key={m} className="inline-block slide-up" style={{ color }}>{m}</span>
          </div>
          <span style={{ color }}>:</span>
          <div className="h-12 sm:h-16 overflow-hidden flex items-center">
            <span key={sTens} className="inline-block slide-up" style={{ color }}>{sTens}</span>
          </div>
          <div className="h-12 sm:h-16 overflow-hidden flex items-center -ml-1">
            <span key={sOnes} className="inline-block slide-up" style={{ color: sOnesColor }}>{sOnes}</span>
          </div>
        </div>

        <div className="flex items-center gap-2"></div>
      </div>
    </div>
  );
}
