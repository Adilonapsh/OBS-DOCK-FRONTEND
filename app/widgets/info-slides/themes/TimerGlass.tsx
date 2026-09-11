import type { InfoSlidesThemeProps } from './types';
import './TimerGlass.css';

/**
 * Timer Glass — 1:1 port dari app/widgets/timer/themes/Glass.tsx
 * Struktur, kelas, warna, radius, animasi plek sama. Hanya konten tengah diganti
 * dari HH:MM:SS menjadi title/desc slide + dukungan image.
 */
export default function TimerGlassTheme({ slides, index, font, bg, bgOpacity, textColor, accent, anim, showBadge, showProgress, showArrows, onPrev, onNext }: InfoSlidesThemeProps) {
  const slide = slides[Math.min(index, slides.length - 1)] || slides[0];
  if (!slide) return null;

  const eff = anim || 'elegantIn';
  const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn'].includes(eff);
  const dur = isEleg ? '0.62s' : '0.4s';
  const animStyle = `${eff} ${dur} cubic-bezier(0.16,1,0.3,1) both`;

  // map badge -> mode biar pill sama persis kayak timer (powerup/sleep/locked/paused)
  const rawBadge = String(slide.badge || 'INFO').toLowerCase();
  const mode = rawBadge.includes('sponsor') ? 'powerup' : rawBadge.includes('rules') ? 'sleep' : rawBadge.includes('lock') ? 'locked' : 'paused';
  const modeLabel = String(slide.badge || 'INFO').toUpperCase();
  const modeAnim = 'softPopIn 0.42s cubic-bezier(0.16,1,0.3,1) both';

  return (
    <div className="glass-theme w-full max-w-xl mx-auto flex flex-col items-center select-none" style={{ fontFamily: `'Nunito','${font}', sans-serif` }}>
      {showBadge && (
        <div key={mode + index} className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase will-change-transform" style={{ background: mode === 'powerup' ? '#ebd1b3' : mode === 'sleep' ? '#8b88d9' : 'rgba(0,0,0,0.2)', color: mode === 'powerup' ? '#2b2b42' : '#ffffff', animation: modeAnim }}>
          {mode === 'powerup' && <><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> 2X • {modeLabel}</>}
          {mode === 'sleep' && <><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg> Zz • {modeLabel}</>}
          {mode === 'locked' && <><svg className="w-3 h-3 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg> {modeLabel}</>}
          {mode === 'paused' && <><svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> {modeLabel}</>}
        </div>
      )}

      <div className="timer-overlay-card w-full px-6 py-5 sm:px-8 sm:py-6 flex items-center justify-between relative overflow-hidden mt-2" style={{ background: bg && bg !== 'transparent' ? bg : undefined, opacity: bgOpacity ? bgOpacity / 100 : undefined }}>
        <div className="clock-badge w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 overflow-hidden">
          {slide.image ? (
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" loading="eager" />
          ) : (
            <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5" />
            </svg>
          )}
        </div>

        {/* tengah: plek seperti timer tapi isi slide — pakai div h-12 overflow-hidden + slide-up biar anim sama */}
        <div className="flex-1 flex flex-col items-center justify-center px-2 min-w-0">
          <div className="h-6 sm:h-7 overflow-hidden flex items-center justify-center max-w-full">
            <span key={slide.title + index} className="inline-block slide-up font-black text-[15px] sm:text-[20px] tracking-tight text-white leading-none truncate text-center" style={{ color: textColor || '#ffffff', animation: animStyle }}>
              {slide.title}
            </span>
          </div>
          <div className="h-4 sm:h-5 overflow-hidden flex items-center justify-center max-w-full">
            <span key={slide.desc + index} className="inline-block slide-up text-[10px] sm:text-[11px] font-bold tracking-wide text-white/80 leading-none truncate text-center" style={{ color: textColor ? textColor + 'CC' : 'rgba(255,255,255,0.85)', animation: animStyle }}>
              {slide.desc}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {showArrows && (
            <>
              <button onClick={onPrev} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white grid place-items-center hover:scale-105 active:scale-95 transition-transform">‹</button>
              <button onClick={onNext} className="w-7 h-7 rounded-full bg-white text-[#2b2b42] grid place-items-center hover:scale-105 active:scale-95 transition-transform font-black">›</button>
            </>
          )}
          <span className="plus-badge px-3 py-1 sm:px-3.5 sm:py-1.5 flex items-center justify-center shrink-0">
            {index + 1}/{slides.length}
          </span>
        </div>
      </div>

      {showProgress && (
        <div className="flex items-center gap-1.5 justify-center mt-3">
          {slides.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6' : 'w-1.5'}`} style={{ background: i === index ? (slide.accent || accent || '#ffffff') : 'rgba(255,255,255,0.35)' }} />
          ))}
        </div>
      )}
    </div>
  );
}
