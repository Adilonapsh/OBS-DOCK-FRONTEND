import type { TimerThemeProps } from './types';
import { hexToRgba, resolveBg, resolveTextColor } from '../../_shared/utils/color';
import './Subathon.css';

function formatHMS(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SubathonTheme({
  font,
  fontSize,
  timerSeconds,
  isRunning,
  onToggleTimer,
  anim,
  subathonMode = 'powerup',
  textColor,
  bg,
  bgOpacity,
  accent,
}: TimerThemeProps & { subathonMode?: string; textColor?: string }) {
  const eff = anim || 'elegantIn';
  const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn'].includes(eff);
  const dur = isEleg ? '0.62s' : '0.4s';
  const animStyle = `${eff} ${dur} cubic-bezier(0.16,1,0.3,1) both`;

  const mode = String(subathonMode || 'powerup');
  const isPowerUp = mode === 'powerup';
  const isSleep = mode === 'sleep';
  const isLocked = mode === 'locked';
  const isPaused = mode === 'paused' || (!isRunning && !isPowerUp && !isSleep && !isLocked);

  // Sekarang warna fully themable: bg → capsule, accent → badge, textColor → waktu
  const capsuleBg = resolveBg(bg, accent, '#2b2b42', bgOpacity);
  const effectiveText = resolveTextColor(textColor, isPowerUp ? '#ebd1b3' : isSleep ? '#ffffff' : '#8b88d9');
  const timeOpacity = isPaused ? 'opacity-70' : '';
  const badgePowerBg = accent && accent !== '#594d4a' && accent !== 'transparent' ? accent : '#ebd1b3';
  const badgeSleepBg = accent && accent !== '#594d4a' && accent !== 'transparent' ? hexToRgba(accent, 100) : '#8b88d9';

  // mode change animation — key remount triggers softPop with blur
  const modeAnim = 'softPopIn 0.42s cubic-bezier(0.16,1,0.3,1) both';

  return (
    <div className="subathon-theme w-full max-w-[360px] flex flex-col items-center gap-3 select-none" style={{ fontFamily: `'Nunito','${font}', sans-serif` }}>
      <div
        className="timer-capsule w-full h-[56px] px-3.5 flex items-center gap-20 justify-between overflow-hidden"
        style={{ animation: animStyle, background: capsuleBg }}
      >
        <div key={mode} className="flex items-center gap-2 will-change-transform" style={{ animation: modeAnim }}>
          {isPowerUp && (
            <>
              <svg className="w-5 h-5 fill-current" style={{ color: badgePowerBg }} viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span className="badge-powerup" style={{ background: badgePowerBg, color: '#2b2b42' }}>2X</span>
            </>
          )}
          {isSleep && (
            <>
              <svg className="w-5 h-5 fill-current" style={{ color: badgeSleepBg }} viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
              <span className="badge-sleep" style={{ background: badgeSleepBg }}>Zz</span>
            </>
          )}
          {isLocked && (
            <div className="w-7 h-7 icon-circle-dark flex items-center justify-center">
              <svg className="w-4 h-4 stroke-2" fill="none" stroke={badgeSleepBg} viewBox="0 0 24 24">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 018 0v4" />
              </svg>
            </div>
          )}
          {isPaused && !isLocked && !isSleep && !isPowerUp && (
            <div className="w-7 h-7 icon-circle-dark flex items-center justify-center">
              <svg className="w-4 h-4 fill-current" style={{ color: badgeSleepBg }} viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            </div>
          )}
        </div>
        <span className={`font-extrabold tracking-wider ${timeOpacity} transition-colors duration-300`} style={{ fontFamily: `'Nunito', sans-serif`, color: effectiveText, fontSize: fontSize ? `${Math.round(18 * (fontSize/14))}px` : undefined }}>
          {formatHMS(timerSeconds)}
        </span>
      </div>

      {/* controls for OBS preview - hidden in OBS transparent mode but visible in settings preview via parent */}
      <div className="flex gap-2">
        <button onClick={onToggleTimer} className="hidden" />
      </div>
    </div>
  );
}
