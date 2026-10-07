import type { InfoSlidesThemeProps } from './types';
import './Clean.css';

export default function CleanTheme({ slides, index, font, accent, textColor, showBadge, showProgress, showArrows, anim, onPrev, onNext }: InfoSlidesThemeProps) {
  const slide = slides[Math.min(index, slides.length - 1)] || slides[0];
  if (!slide) return null;
  const eff = anim || 'elegantIn';
  const animStyle = `${eff} 0.6s cubic-bezier(0.16,1,0.3,1) both`;

  return (
    <div className="info-slides-clean w-full max-w-[640px] flex flex-col gap-3 select-none" style={{ fontFamily: `'${font}', sans-serif` }}>
      <div key={slide.id + index} className="clean-card w-full px-6 py-5 flex items-center gap-4" style={{ animation: animStyle, borderColor: accent + '40', background: `linear-gradient(135deg, ${accent}18, transparent)` }}>
        {slide.image ? (
          <img src={slide.image} alt={slide.title} className="shrink-0 w-14 h-14 rounded-xl object-cover border border-white/10 bg-white" loading="eager" />
        ) : showBadge && slide.badge && (
          <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase" style={{ background: accent, color: '#fff' }}>{slide.badge}</span>
        )}
        <div className="flex-1 min-w-0">
          {slide.image && showBadge && slide.badge && <div className="text-[10px] font-black tracking-widest uppercase opacity-60" style={{ color: accent }}>{slide.badge}</div>}
          <div className="font-black text-[18px] leading-tight truncate" style={{ color: textColor }}>{slide.title}</div>
          <div className="text-[13px] leading-snug opacity-80 line-clamp-2" style={{ color: textColor }}>{slide.desc}</div>
        </div>
        {showArrows && (
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <button onClick={onPrev} className="w-8 h-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10">‹</button>
            <button onClick={onNext} className="w-8 h-8 grid place-items-center rounded-full bg-white text-black hover:bg-zinc-100">›</button>
          </div>
        )}
      </div>
      {showProgress && (
        <div className="flex items-center gap-1.5 justify-center">
          {slides.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} style={i === index ? { background: accent } : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
