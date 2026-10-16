import { Fragment, useEffect, useRef, useState } from 'react';
import type { TimerThemeProps } from './types';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

// Format delta mengikuti label dock: >= 60 detik → +5:00 / -2:30, selain itu → +30s / -10s
function formatDelta(sec: number) {
  const a = Math.abs(sec);
  const sign = sec > 0 ? '+' : '-';
  if (a >= 60) return `${sign}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`;
  return `${sign}${a}s`;
}

export type FlatlineThemeExtra = {
  flatlineCard?: string;
  flatlineHours?: string;
  flatlineMinutes?: string;
  flatlineDays?: string;
  flatlineSeconds?: string;
  flatlineBubble?: string;
  flatlineBadge?: string;
  flatlineBackText?: string;
  flatlineShowBubbles?: boolean;
  flatlineShowBack?: boolean;
  flatlineTilt?: number;
  flatlineLayout?: string;
};

// Flatline- 1:1 port dari HTML user (back-card miring + front-card + bubble mode/delta)
// timerSeconds -> DAYS (hari, otomatis jika >= 24 jam) / HRS (jam) / MIN (menit) / pill (detik).
export default function FlatlineTheme({
  font,
  fontSize,
  timerSeconds,
  isRunning,
  currentSession,
  totalSessions,
  focusMinutes,
  onResetTimer,
  addedSeconds,
  subathonMode,
  anim,
  flatlineCard,
  flatlineHours,
  flatlineMinutes,
  flatlineDays,
  flatlineSeconds,
  flatlineBubble,
  flatlineBadge,
  flatlineBackText,
  flatlineShowBubbles,
  flatlineShowBack,
  flatlineTilt,
  flatlineLayout,
}: TimerThemeProps & FlatlineThemeExtra) {
  const eff = anim || 'elegantIn';
  const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn'].includes(eff);
  const dur = isEleg ? '0.62s' : '0.4s';
  const animStyle = `${eff} ${dur} cubic-bezier(0.16,1,0.3,1) both`;
  const scale = fontSize ? fontSize / 14 : 1;

  const card = flatlineCard || '#24283b';
  const hoursColor = flatlineHours || '#ffb5f0';
  const minutesColor = flatlineMinutes || '#baa9ff';
  const daysColor = flatlineDays || '#ffd166';
  const secColor = flatlineSeconds || '#a7f3d0';
  const bubbleBg = flatlineBubble || '#f4d3a1';
  const badgeBg = flatlineBadge || '#1a1d2d';
  const backTextColor = flatlineBackText || '#dda5d0';
  const showBubbles = flatlineShowBubbles ?? true;
  const showBack = flatlineShowBack ?? true;
  const tilt = flatlineTilt ?? 8;
  const isHorizontal = (flatlineLayout || 'vertical') === 'horizontal';

  // Delta phase untuk bubble: show = pop scale, hide = shrink+fade baru unmount
  // (in → tampil 1.4 dtk, out → animasi keluar, null → unmount)
  const [deltaPhase, setDeltaPhase] = useState<'in' | 'out' | null>(null);
  const [stuckDelta, setStuckDelta] = useState<number | null>(null);
  const phaseRef = useRef(deltaPhase);
  phaseRef.current = deltaPhase;
  useEffect(() => {
    if (addedSeconds == null || addedSeconds === 0) {
      // tidak ada delta masuk → animasikan hide dulu, unmount setelah 320ms
      if (phaseRef.current !== null) {
        setDeltaPhase('out');
        const t = setTimeout(() => {
          setDeltaPhase(null);
          setStuckDelta(null);
        }, 320);
        return () => clearTimeout(t);
      }
      return;
    }
    setStuckDelta(addedSeconds);
    setDeltaPhase('in');
    const t = setTimeout(() => setDeltaPhase('out'), 1400);
    return () => clearTimeout(t);
  }, [addedSeconds]);
  const activeDelta = addedSeconds ?? stuckDelta;
  const deltaLabel = activeDelta ? formatDelta(activeDelta) : null;
  const isAdd = (activeDelta ?? 0) > 0;

  // Mode bubble 2X mengikuti subathonMode dari dock/settings
  const mode = String(subathonMode || 'powerup');
  const isPowerUp = mode === 'powerup';
  const isSleep = mode === 'sleep';
  const isLocked = mode === 'locked';
  const isPaused = mode === 'paused';

  const h = Math.floor(timerSeconds / 3600);
  const m = Math.floor((timerSeconds % 3600) / 60);
  const s = timerSeconds % 60;
  const d = Math.floor(timerSeconds / 86400);
  const hStr = pad2(h % 24);
  const mStr = pad2(m);
  const sStr = pad2(s);
  const dStr = pad2(d);
  const backLabel = `FLATLINE ${(focusMinutes || 50)}M`;
  const sessionLabel = `S${currentSession || 1}/${totalSessions || 3}`;

  const timeSize = Math.round(115 * Math.min(1.15, Math.max(0.7, scale)));
  const wrapW = 250;
  const wrapH = 330;

  // Baris waktu: DD/DAYS muncul otomatis kalau >= 24 jam.
  // Horizontal selalu tampil full + SEC inline (HH:MM:SS); vertikal detik tetap di pill footer.
  const baseRows = d > 0
    ? [
      { v: dStr, label: 'DAYS', color: daysColor },
      { v: hStr, label: 'HRS', color: hoursColor },
      { v: mStr, label: 'MIN', color: minutesColor },
    ]
    : [
      { v: hStr, label: 'HRS', color: hoursColor },
      { v: mStr, label: 'MIN', color: minutesColor },
    ];
  const rows = isHorizontal ? [...baseRows, { v: sStr, label: 'SEC', color: secColor }] : baseRows;
  const hSize = Math.round((rows.length > 3 ? 38 : 56) * Math.min(1.15, Math.max(0.7, scale)));

  return (
    <div
      className="select-none"
      style={{ fontFamily: `'Poppins','${font}', sans-serif`, animation: animStyle }}
    >
      <style>{`@keyframes flatlineDeltaIn{0%{opacity:0;transform:scale(0.6)}60%{opacity:1;transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}@keyframes flatlineDeltaUpOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-10px)}}@keyframes flatlineDeltaDownOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(10px)}}@keyframes flatlineBubbleIn{0%{opacity:0;transform:scale(0.4) rotate(-3deg)}60%{opacity:1;transform:scale(1.12) rotate(-3deg)}100%{opacity:1;transform:scale(1) rotate(-3deg)}}@keyframes flatlineBubbleOut{from{opacity:1;transform:scale(1) rotate(-3deg)}to{opacity:0;transform:scale(0.6) rotate(-3deg)}}`}</style>      <div style={{ position: 'relative', width: `${wrapW}px`, height: isHorizontal ? 'auto' : wrapH, marginTop: isHorizontal ? 38 : 20, marginRight: 30 }}>
        {/* Back Card miring */}
        {showBack && (
          <div
            style={{
              position: 'absolute', top: -15, left: -15, width: '100%', height: '100%',
              backgroundColor: card, borderRadius: 20, transform: `rotate(-${tilt}deg)`,
              zIndex: 1, padding: '20px 15px', boxSizing: 'border-box',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ color: backTextColor, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {backLabel}
            </div>
            <div style={{ color: backTextColor, opacity: 0.55, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginTop: 4 }}>
              {sessionLabel} {isRunning ? '• RUNNING' : '• IDLE'}
            </div>
          </div>
        )}

        {/* Front Card- horizontal: height fit to text; vertikal: fix 330px + footer pill */}
        <div
          style={{
            position: 'relative', width: '100%', height: isHorizontal ? 'auto' : '100%', backgroundColor: card,
            borderRadius: 20, zIndex: 2, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: isHorizontal ? 'flex-start' : 'center',
            boxShadow: '-5px 5px 25px rgba(0,0,0,0.2)',
            ...(isHorizontal ? { padding: '24px 20px 28px' } : { paddingBottom: 20 }),
            boxSizing: 'border-box',
          }}
        >
          {isHorizontal ? (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {rows.map((row, i) => (
                <Fragment key={row.label}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    <div style={{ fontSize: hSize, fontWeight: 900, lineHeight: 1, letterSpacing: -2, color: row.color }}>
                      {row.v}
                    </div>
                    <span style={{ marginTop: 8, backgroundColor: badgeBg, color: '#ffffff', fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 99, letterSpacing: 0.5, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transform: `rotate(${i % 2 === 0 ? '-6deg' : '6deg'})`, lineHeight: 1.4 }}>
                      {row.label}
                    </span>
                  </div>
                  {i < rows.length - 1 && (
                    <div style={{ fontSize: Math.round(hSize * 0.7), fontWeight: 900, color: bubbleBg, opacity: 0.7, paddingBottom: 26, paddingLeft: 4, paddingRight: 4 }}>:</div>
                  )}
                </Fragment>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', marginTop: -10 }}>
              {/* Vertikal: DD/DAYS muncul otomatis kalau >= 24 jam, font mengecil biar muat 3 baris */}
              {rows.map((row, i, arr) => {
                const badgeLeft = i % 2 === 0;
                return (
                  <div
                    key={row.label}
                    style={{ fontSize: d > 0 ? Math.round(timeSize * 0.62) : timeSize, fontWeight: 900, lineHeight: 0.85, letterSpacing: -2, position: 'relative', color: row.color, marginBottom: i < arr.length - 1 ? 8 : 0 }}
                  >
                    {row.v}
                    <span style={{ position: 'absolute', backgroundColor: badgeBg, color: '#ffffff', fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 99, letterSpacing: 0.5, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 3, bottom: -5, ...(badgeLeft ? { left: -8, transform: 'rotate(-12deg)' } : { right: 8, transform: 'rotate(10deg)' }), lineHeight: 1.4 }}>
                      {row.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer vertikal saja: pill detik (horizontal tanpa footer, detik sudah inline SEC) */}
          {!isHorizontal && (
            <div style={{ position: 'absolute', bottom: 25, display: 'flex', alignItems: 'center' }}>
              <div
                title="Detik"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: bubbleBg, fontSize: 12, fontWeight: 700, padding: '6px 18px', borderRadius: 99, letterSpacing: 1 }}
              >
                {sStr}
              </div>
            </div>
          )}
        </div>

        {/* Floating Bubbles */}
        {showBubbles && (
          <>
            {/* Bubble mode: vertikal = kanan-atas, horizontal = atas-tengah */}
            <div
              style={{ position: 'absolute', backgroundColor: bubbleBg, color: card, borderRadius: 14, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 900, boxShadow: '0 8px 20px rgba(0,0,0,0.15)', padding: '12px 16px 8px 16px', ...(isHorizontal ? { top: -60, right: -70, transform: 'translateX(-50%) rotate(10deg)' } : { top: -25, right: -45, transform: 'rotate(4deg)' }) }}
            >
              <span
                aria-hidden
                style={{ content: "''" as unknown as string, position: 'absolute', backgroundColor: bubbleBg, width: 14, height: 14, bottom: -5, transform: 'rotate(45deg)', borderBottomRightRadius: 3, zIndex: -1, ...(isHorizontal ? { left: '50%', marginLeft: -7 } : { left: 18 }) }}
              />
              <div key={mode} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'flatlineDeltaIn 0.3s cubic-bezier(0.16,1,0.3,1) both', minHeight: 56 }}>
                {isPowerUp && (
                  <>
                    <div style={{ fontSize: 42, lineHeight: 0.8, letterSpacing: -1 }}>2X</div>
                    <div style={{ fontSize: 11, letterSpacing: 2, marginTop: 4 }}>TIME</div>
                  </>
                )}
                {isSleep && (
                  <>
                    <div style={{ fontSize: 42, lineHeight: 0.8, letterSpacing: -1 }}>Zz</div>
                    <div style={{ fontSize: 11, letterSpacing: 2, marginTop: 4 }}>SLEEP</div>
                  </>
                )}
                {isLocked && (
                  <>
                    <svg viewBox="0 0 24 24" style={{ width: 30, height: 30 }} fill="none" stroke={card} strokeWidth={2.5}>
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 018 0v4" />
                    </svg>
                    <div style={{ fontSize: 11, letterSpacing: 2, marginTop: 4 }}>LOCKED</div>
                  </>
                )}
                {isPaused && (
                  <>
                    <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, fill: card }}>
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                    <div style={{ fontSize: 11, letterSpacing: 2, marginTop: 4 }}>PAUSED</div>
                  </>
                )}
              </div>
              <button
                onClick={onResetTimer}
                title="Reset timer"
                style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, backgroundColor: card, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: `2px solid ${bubbleBg}`, cursor: 'pointer' }}
              >
                <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: '#ffffff', transform: 'rotate(45deg)' }}>
                  <path d="M12 2.75a9.25 9.25 0 1 0 4.737 17.197l-1.056-1.688A7.25 7.25 0 1 1 12 4.75v3.5l4.5-4.5-4.5-4.5v3.5z" />
                </svg>
              </button>
            </div>

            {/* Bubble delta: show = pop scale, hide = shrink+fade baru unmount */}
            {deltaLabel && deltaPhase && (
              <div
                title={isAdd ? 'Waktu ditambah' : 'Waktu dikurangi'}
                style={{ position: 'absolute', backgroundColor: bubbleBg, color: card, borderRadius: 10, zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, boxShadow: '0 8px 20px rgba(0,0,0,0.15)', top: 145, right: -25, padding: '6px 12px', fontSize: 15, transform: 'rotate(-3deg)', fontFamily: 'inherit', animation: deltaPhase === 'in' ? 'flatlineBubbleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both' : 'flatlineBubbleOut 0.3s ease forwards' }}
              >
                <span aria-hidden style={{ position: 'absolute', backgroundColor: bubbleBg, width: 10, height: 10, left: 10, bottom: -3, transform: 'rotate(45deg)', borderBottomRightRadius: 2, zIndex: -1 }} />
                <span
                  key={deltaLabel}
                  style={{
                    display: 'inline-block',
                    color: isAdd ? card : '#b91c1c',
                    animation: deltaPhase === 'in' ? 'flatlineDeltaIn 0.3s cubic-bezier(0.16,1,0.3,1) both' : isAdd ? 'flatlineDeltaUpOut 0.35s ease forwards' : 'flatlineDeltaDownOut 0.35s ease forwards',
                  }}
                >
                  {deltaLabel}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
