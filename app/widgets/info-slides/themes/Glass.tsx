import type { InfoSlidesThemeProps } from './types';
import './Glass.css';

export default function GlassTheme({ slides, index, font, accent, textColor, showBadge, showProgress, anim, onPrev, onNext }: InfoSlidesThemeProps) {
  const slide = slides[Math.min(index, slides.length - 1)] || slides[0];
  if (!slide) return null;
  const eff = anim || 'elegantIn';
  const animStyle = `${eff} 0.6s cubic-bezier(0.16,1,0.3,1) both`;
  return (
    <div className="w-full max-w-[640px] select-none" style={{ fontFamily: `'${font}', sans-serif` }}>
      <div key={slide.id + index} className="glass-card w-full px-6 py-5 flex items-center gap-4" style={{ animation: animStyle }}>
        {slide.image ? (
          <img src={slide.image} alt={slide.title} className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-white/20 bg-white" loading="eager" />
        ) : (
          <div className="w-12 h-12 rounded-2xl grid place-items-center shrink-0 text-white font-black" style={{ background: slide.accent || accent }}>{(slide.badge || '★').slice(0,2)}</div>
        )}
        <div className="flex-1 min-w-0">
          {showBadge && <div className="text-[10px] font-black tracking-widest uppercase text-white/60">{slide.badge}</div>}
          <div className="font-black text-[18px] leading-tight text-white">{slide.title}</div>
          <div className="text-[12px] text-white/80 leading-snug">{slide.desc}</div>
        </div>
        <div className="hidden sm:flex gap-1">
          <button onClick={onPrev} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white grid place-items-center">‹</button>
          <button onClick={onNext} className="w-8 h-8 rounded-full bg-white text-black grid place-items-center">›</button>
        </div>
      </div>
      {showProgress && <div className="flex justify-center gap-1.5 mt-3">{slides.map((_,i)=> <span key={i} className={`h-1.5 rounded-full transition-all ${i===index?'w-6 bg-white':'w-1.5 bg-white/30'}`} />)}</div>}
    </div>
  );
}
