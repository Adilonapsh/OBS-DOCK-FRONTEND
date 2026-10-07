import { useEffect, useState } from 'react';
import type { TimerThemeProps } from './types';

function getTimeParts(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return {
    d,
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
    dStr: String(d).padStart(2, '0'),
  };
}

function AddedSecondsFlash({ value }: { value: number | null | undefined }) {
  const [display, setDisplay] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    if (typeof value === 'number' && value !== 0) {
      setDisplay(value);
      setVisible(true);
      setExiting(false);
    } else if (visible) {
      setExiting(true);
      const t = setTimeout(() => {
        setVisible(false);
        setDisplay(null);
        setExiting(false);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [value]);
  if (!visible || display === null) return null;
  return (
    <span
      key={display}
      className="absolute right-5 top-5 px-2 py-1 text-[11px] font-black border-[3px] border-black bg-white text-black z-10"
      style={{
        boxShadow: '3px 3px 0 #000',
        animation: exiting ? 'brutalistFadeDown 0.35s ease forwards' : 'brutalistFadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      {display > 0 ? `+${display}s` : `${display}s`}
    </span>
  );
}

export default function BrutalistTimerTheme({
  font,
  fontSize,
  timerSeconds,
  isRunning,
  currentSession,
  totalSessions,
  focusMinutes,
  showProgress,
  onToggleTimer,
  onResetTimer,
  anim,
  accent,
  subathonMode,
  addedSeconds,
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistHalftone,
  brutalistTail,
  brutalistItalic,
  brutalistUppercase,
}: TimerThemeProps & {
  brutalistBg?: string;
  brutalistTextColor?: string;
  brutalistBadgeBg?: string;
  brutalistBorderColor?: string;
  brutalistShadow?: number;
  brutalistHalftone?: boolean;
  brutalistTail?: boolean;
  brutalistItalic?: boolean;
  brutalistUppercase?: boolean;
}) {
  const eff = anim || 'elegantIn';
  const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn'].includes(eff);
  const dur = isEleg ? '0.62s' : '0.4s';
  const animStyle = `${eff} ${dur} cubic-bezier(0.16,1,0.3,1) both`;
  const scale = fontSize ? fontSize / 14 : 1;
  const isPaused = String(subathonMode || '') === 'paused';
  const safeAccent = accent && accent !== 'transparent' ? accent : '#ff3b30';
  const { d, h, m, s, dStr } = getTimeParts(timerSeconds);
  const hasDays = d > 0;
  const totalSec = Math.max(1, (focusMinutes || 50) * 60);
  const progress = Math.min(1, Math.max(0, timerSeconds / totalSec));
  // Brutalist khusus Timer — background bisa diubah via settings (hanya tema brutalist)
  const bubbleBg = brutalistBg || '#FFFFFF';
  const txtColor = brutalistTextColor || '#000000';
  const badgeBg = brutalistBadgeBg || '#FFFFFF';
  const borderColor = brutalistBorderColor || '#000000';
  const shadowOffset = brutalistShadow ?? 6;
  const hasHalftone = brutalistHalftone ?? true;

  return (
    <div
      className="timer-brutalist w-full max-w-[560px] flex flex-col select-none relative"
      style={{ fontFamily: `'${font}', sans-serif`, animation: animStyle }}
    >
      {/* MAIN CARD - neo-brutalist INLINE — background khusus brutalist bisa diubah */}
      <div
        className="relative overflow-hidden flex flex-row items-center gap-3 px-4 py-3"
        style={{
          backgroundColor: bubbleBg,
          border: `4px solid ${borderColor}`,
          boxShadow: `${shadowOffset}px ${shadowOffset}px 0px ${borderColor}`,
          minHeight: '88px',
        }}
      >
        <style>{`@keyframes brutalistFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes brutalistFadeDown{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-8px)}}`}</style>
        {/* halftone overlay */}
        {hasHalftone && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(${borderColor} 1.2px, transparent 1.2px)`,
              backgroundSize: '10px 10px',
              opacity: 0.06,
            }}
          />
        )}
        {/* progress bg behind - fills card, hilang saat 0 atau showProgress off */}
        {showProgress !== false && progress > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0"
            style={{ width: `${Math.round(progress * 100)}%`, background: safeAccent, opacity: 0.14, transition: 'width 0.5s ease' }}
          />
        )}
        {/* left accent bar vertical */}
        <div className="absolute left-0 top-0 bottom-0 w-[10px] z-10" style={{ background: safeAccent, borderRight: `4px solid ${borderColor}` }} />

        {/* left badge */}
        <span className="shrink-0 inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-black tracking-widest uppercase leading-none ml-2 relative z-10" style={{ backgroundColor: borderColor, color: badgeBg, border: `2px solid ${borderColor}` }}>
          TIMER
        </span>

        {/* center timer - stacked when hasDays: hari di atas, jam:menit:detik di bawah (tidak 1 line) */}
        <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 py-1">
          {hasDays ? (
            <>
              <div className={`flex items-baseline gap-1.5 leading-none ${isPaused ? 'opacity-70' : ''}`}>
                <span
                  className="font-black tabular-nums tracking-tighter"
                  style={{
                    fontFamily: `'Space Grotesk','Instrument Sans','${font}', monospace`,
                    fontSize: `${Math.round(22 * scale)}px`,
                    letterSpacing: '-0.04em',
                    color: txtColor,
                  }}
                >
                  {dStr}
                </span>
                <span
                  className="font-black tracking-[0.18em] uppercase"
                  style={{ fontSize: `${Math.round(10 * scale)}px`, color: txtColor }}
                >
                </span>
              </div>
              <div
                className={`font-black tabular-nums tracking-tighter leading-none ${isPaused ? 'opacity-70' : ''}`}
                style={{
                  fontFamily: `'Space Grotesk','Instrument Sans','${font}', monospace`,
                  fontSize: `${Math.round(34 * scale)}px`,
                  letterSpacing: '-0.04em',
                  color: txtColor,
                }}
              >
                {`${h}:${m}:${s}`}
              </div>
            </>
          ) : (
            <div
              className={`font-black tabular-nums tracking-tighter leading-none ${isPaused ? 'opacity-70' : ''}`}
              style={{
                fontFamily: `'Space Grotesk','Instrument Sans','${font}', monospace`,
                fontSize: `${Math.round(44 * scale)}px`,
                letterSpacing: '-0.04em',
                color: txtColor,
              }}
            >
              {`${h}:${m}:${s}`}
            </div>
          )}
        </div>
        {/* added seconds flash - fade up/down */}
        <AddedSecondsFlash value={addedSeconds} />
        
        {/* right status idle - visible */}
        <div className="shrink-0 flex flex-col items-center gap-1.5 min-w-[72px] relative z-[1]">
          {/* <span
            className={`w-3 h-3 border-[2px] border-black ${isRunning && !isPaused ? 'animate-pulse' : ''}`}
            style={{ background: isRunning && !isPaused ? safeAccent : '#fff' }}
          /> */}
          <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: txtColor }}>
            {isPaused ? 'PAUSED' : isRunning ? 'RUNNING' : 'IDLE'}
          </span>
        </div>

        
      </div>
    </div>
  );
}
