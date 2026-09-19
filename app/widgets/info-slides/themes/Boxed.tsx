import type { InfoSlidesThemeProps } from './types';
import './Boxed.css';

export default function BoxedTheme({ slides, index, font, accent, textColor, bg, bgOpacity, showBadge, showProgress, showArrows, anim, onPrev, onNext }: InfoSlidesThemeProps) {
  const slide = slides[Math.min(index, slides.length - 1)] || slides[0];
  if (!slide) return null;
  const eff = anim || 'elegantIn';
  const animStyle = `${eff} 0.55s cubic-bezier(0.16,1,0.3,1) both`;

  return (
    <div className="info-slides-boxed w-full max-w-[640px] select-none" style={{ fontFamily: `'${font}', sans-serif` }}>
      <div key={slide.id + index} className="boxed-card overflow-hidden" style={{ animation: animStyle, background: bg && bg !== 'transparent' ? bg : '#161616', opacity: bgOpacity ? bgOpacity/100 : 1, borderColor: accent + '30' }}>
        <div className="h-1 w-full" style={{ background: slide.accent || accent }} />
        <div className="p-5 flex gap-4 items-start">
          {slide.image ? (
            <img src={slide.image} alt={slide.title} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10 bg-white" loading="eager" />
          ) : (
            <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0 font-black text-white" style={{ background: slide.accent || accent }}>{(slide.badge || slide.title).slice(0, 2).toUpperCase()}</div>
          )}
          <div className="flex-1 min-w-0">
            {showBadge && slide.badge && <div className="text-[10px] font-black tracking-widest uppercase opacity-60" style={{ color: slide.accent || accent }}>{slide.badge}</div>}
            <div className="font-black text-[17px] leading-tight" style={{ color: textColor }}>{slide.title}</div>
            <div className="text-[12px] leading-relaxed opacity-70 mt-1" style={{ color: textColor }}>{slide.desc}</div>
          </div>
          {showArrows && (
            <div className="hidden sm:flex flex-col gap-1">
              <button onClick={onPrev} className="w-7 h-7 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10">‹</button>
              <button onClick={onNext} className="w-7 h-7 grid place-items-center rounded-lg bg-white text-black hover:bg-zinc-100">›</button>
            </div>
          )}
        </div>
        {showProgress && (
          <div className="px-4 pb-3 flex gap-1">
            {slides.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full transition-all ${i===index ? 'opacity-100' : 'opacity-30'}`} style={{ background: i===index ? (slide.accent || accent) : '#fff' }} />)}
          </div>
        )}
      </div>
    </div>
  );
}
