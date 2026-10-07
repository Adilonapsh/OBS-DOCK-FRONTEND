import type { InfoSlidesThemeProps } from './types';

export default function BrutalistTheme({
  slides,
  index,
  font,
  fontSize,
  accent,
  bg,
  showBadge,
  showProgress,
  showArrows,
  anim,
  onPrev,
  onNext,
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistHalftone,
  brutalistTail,
  brutalistItalic,
  brutalistUppercase,
}: InfoSlidesThemeProps) {
  const slide = slides[Math.min(index, slides.length - 1)] || slides[0];
  if (!slide) return null;
  const eff = anim || 'brutalistIn';
  const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn'].includes(eff);
  const dur = isEleg ? '0.62s' : '0.4s';
  const animStyle = eff === 'brutalistIn' || eff === 'brutalistOut' ? `${eff} 0.4s cubic-bezier(0.16,1,0.3,1) both` : `${eff} ${dur} cubic-bezier(0.16,1,0.3,1) both`;
  const itemAccent = slide.accent || accent || '#FFE600';
  const bubbleBg = brutalistBg || (bg && bg !== 'transparent' && bg !== '#000000' && bg !== '#000' ? bg : '#FFFFFF');
  const txtColor = brutalistTextColor || '#000000';
  const badgeBg = brutalistBadgeBg || '#FFFFFF';
  const borderColor = brutalistBorderColor || '#000000';
  const shadowOffset = brutalistShadow ?? 6;
  const hasHalftone = brutalistHalftone ?? true;
  const hasTail = brutalistTail ?? true;
  const isItalic = brutalistItalic ?? true;
  const isUppercase = brutalistUppercase ?? true;

  const boxShadow = `${shadowOffset}px ${shadowOffset}px 0px 0px ${borderColor}`;
  const imgShadow = `${Math.max(2, Math.min(6, shadowOffset - 2))}px ${Math.max(2, Math.min(6, shadowOffset - 2))}px 0px 0px ${borderColor}`;

  const halftone: React.CSSProperties = {
    backgroundImage: 'radial-gradient(circle, #000 1.2px, transparent 1.45px)',
    backgroundSize: '10px 10px',
  };

  return (
    <>
      <style>{`@keyframes brutalistIn{from{opacity:0;transform:translateX(-12px) scale(0.98)}to{opacity:1;transform:translateX(0) scale(1)}}@keyframes brutalistOut{from{opacity:1;transform:translateX(0) scale(1)}to{opacity:0;transform:translateX(12px) scale(0.98)}}`}</style>
      <div className="w-full max-w-[640px] select-none" style={{ fontFamily: `'${font}', sans-serif` }}>
        <div
          key={slide.id + index}
          className="relative border-[4px] overflow-hidden flex flex-col"
          style={{ background: bubbleBg, borderColor, boxShadow, animation: animStyle }}
        >
        {/* halftone wash */}
        {hasHalftone && <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={halftone} />}

        {/* top strip brutalist */}
        <div className="relative h-3 border-b-[4px] flex items-center gap-1.5 px-2 shrink-0" style={{ backgroundColor: borderColor, borderColor }}>
          <span className="w-2 h-2 bg-white border border-black" style={{ borderColor }} />
          <span className="w-2 h-2 bg-white border border-black" style={{ borderColor }} />
          <span className="w-2 h-2 bg-white border border-black" style={{ borderColor }} />
          <span className="ml-auto font-mono font-black text-[8px] tracking-[0.18em] text-white uppercase">INFO // BRUTALIST • {slides.length} SLIDES</span>
        </div>

        {/* accent bar */}
        <div className="h-[10px] w-full shrink-0 border-b-[4px] relative" style={{ background: itemAccent, borderColor }}>
          {hasHalftone && <div className="absolute inset-0 pointer-events-none opacity-15" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.1px, transparent 1.35px)', backgroundSize: '8px 8px' }} />}
        </div>

        {/* main content */}
        <div className="relative flex items-center gap-4 px-5 py-5" style={{ backgroundColor: bubbleBg }}>
          {/* image / badge block */}
          {slide.image ? (
            <img src={slide.image} alt={slide.title} className="w-14 h-14 object-cover shrink-0 border-[3px] bg-white rotate-[-1deg]" style={{ borderColor, boxShadow: imgShadow }} loading="eager" />
          ) : (
            <div
              className="w-14 h-14 shrink-0 grid place-items-center border-[3px] rotate-[-1deg] font-black text-white text-[16px] leading-none"
              style={{ background: itemAccent, borderColor, boxShadow: imgShadow }}
            >
              {(slide.badge || slide.title).slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0 relative">
            {showBadge && slide.badge && (
              <div className="inline-flex items-center px-2 py-1 border-[2px] mb-1.5 rotate-[-0.5deg]" style={{ backgroundColor: badgeBg, color: txtColor, borderColor, boxShadow: `3px 3px 0px 0px ${borderColor}` }}>
                <span className={`font-black tracking-[0.14em] text-[10px] leading-none ${isUppercase ? 'uppercase' : ''}`} style={{ fontStyle: isItalic ? 'italic' : 'normal' }}>{slide.badge}</span>
              </div>
            )}
            <div
              className={`font-black tracking-tight leading-none truncate ${isUppercase ? 'uppercase' : ''}`}
              style={{ fontSize: Math.max(16, fontSize + 4), color: txtColor, fontStyle: isItalic ? 'italic' : 'normal' }}
            >
              {slide.title}
            </div>
            <div className={`font-bold leading-snug line-clamp-2 mt-1 ${isUppercase ? '' : ''}`} style={{ fontSize: Math.max(12, fontSize), color: txtColor, opacity: 0.7, fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' : 'none' }}>
              {slide.desc}
            </div>
          </div>

          {showArrows && (
            <div className="hidden sm:flex flex-col gap-1.5 shrink-0">
              <button
                onClick={onPrev}
                className="w-8 h-8 grid place-items-center border-[3px] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all font-black text-[14px] leading-none cursor-pointer"
                style={{ backgroundColor: bubbleBg, color: txtColor, borderColor, boxShadow: `3px 3px 0px 0px ${borderColor}` }}
                aria-label="Prev"
              >
                ‹
              </button>
              <button
                onClick={onNext}
                className="w-8 h-8 grid place-items-center border-[3px] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all font-black text-[14px] leading-none cursor-pointer"
                style={{ backgroundColor: borderColor, color: bubbleBg, borderColor, boxShadow: `3px 3px 0px 0px ${borderColor}` }}
                aria-label="Next"
              >
                ›
              </button>
            </div>
          )}
        </div>

        {/* footer progressive */}
        <div className="relative text-white border-t-[4px] flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: borderColor, borderColor, color: '#FFFFFF' }}>
          <span className={`font-mono font-black text-[9px] tracking-[0.14em] flex items-center gap-1.5 ${isUppercase ? 'uppercase' : ''}`} style={{ fontStyle: isItalic ? 'italic' : 'normal' }}>
            <span className="w-1.5 h-1.5 bg-white border border-black" style={{ borderColor: '#fff' }} /> {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')} • BRUTAL
          </span>
          <span className={`font-black text-[8px] tracking-[0.14em] px-2 py-0.5 border ${isUppercase ? 'uppercase' : ''}`} style={{ backgroundColor: badgeBg, color: txtColor, borderColor: '#fff', fontStyle: isItalic ? 'italic' : 'normal' }}>HARD SHADOW {shadowOffset}PX</span>
        </div>

        {/* diagonal stamp - tail toggle */}
        {hasTail && (
          <div className="absolute -right-7 -bottom-7 w-20 h-20 grid place-items-center rotate-12 pointer-events-none select-none opacity-90" style={{ backgroundColor: borderColor, color: '#FFFFFF' }}>
            <span className={`text-[8px] font-black tracking-widest -rotate-12 ${isUppercase ? 'uppercase' : ''}`} style={{ fontStyle: isItalic ? 'italic' : 'normal' }}>BRUTAL</span>
          </div>
        )}
      </div>

        {showProgress && (
          <div className="flex items-center gap-1.5 justify-center mt-3">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 border-[2px] transition-all ${i === index ? 'w-7' : 'w-2.5 bg-white'} ${i === index ? '' : 'opacity-60'}`}
                style={{ background: i === index ? itemAccent : '#fff', borderColor, boxShadow: i === index ? `2px 2px 0px 0px ${borderColor}` : `1px 1px 0px 0px ${borderColor}` }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
