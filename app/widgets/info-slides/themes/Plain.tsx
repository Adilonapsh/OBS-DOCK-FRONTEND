import type { InfoSlidesThemeProps } from './types';
import { resolveTextColor } from '../../_shared/utils/color';

export default function PlainTheme({ slides, index, font, fontSize, accent, textColor, showBadge, showProgress, showArrows, onPrev, onNext }: InfoSlidesThemeProps) {
  const slide = slides[Math.min(index, slides.length - 1)] || slides[0];
  if (!slide) return null;
  const color = resolveTextColor(textColor, '#ffffff');
  const itemAccent = slide.accent || accent;

  return (
    <div className="w-full max-w-[640px] select-none" style={{ fontFamily: `'${font}', sans-serif` }}>
      <div key={slide.id + index} style={{ animation: 'fadeIn 0.4s ease both' }}>
        {showBadge && slide.badge && (
          <div className="font-black uppercase tracking-widest" style={{ color: itemAccent, fontSize: Math.max(10, Math.round(fontSize * 0.75)) }}>{slide.badge}</div>
        )}
        <div className="font-black leading-tight" style={{ color, fontSize: fontSize + 4 }}>{slide.title}</div>
        <div className="leading-snug opacity-80" style={{ color, fontSize }}>{slide.desc}</div>
      </div>
      {showProgress && slides.length > 1 && (
        <div className="flex items-center gap-1.5 mt-2">
          {slides.map((_, i) => (
            <span key={i} className="h-1 rounded-full" style={{ width: i === index ? 24 : 6, background: i === index ? itemAccent : color, opacity: i === index ? 1 : 0.35 }} />
          ))}
        </div>
      )}
      {showArrows && (
        <div className="flex items-center gap-4 mt-1">
          <button onClick={onPrev} className="cursor-pointer font-black" style={{ color, fontSize: fontSize + 2 }}>‹</button>
          <button onClick={onNext} className="cursor-pointer font-black" style={{ color, fontSize: fontSize + 2 }}>›</button>
        </div>
      )}
    </div>
  );
}
