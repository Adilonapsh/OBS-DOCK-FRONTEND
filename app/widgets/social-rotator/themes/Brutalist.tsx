import type { SocialRotatorThemeProps } from './types';
import { platformLogo, platformGlyph } from '../../_shared/utils/platform';

export default function BrutalistTheme({ socials, index, font, fontSize, accent, bg, textColor, showIcon, showHandle, showLabel, anim, brutalistBg, brutalistTextColor, brutalistBadgeBg, brutalistBorderColor, brutalistShadow, brutalistHalftone, brutalistTail, brutalistItalic, brutalistUppercase }: SocialRotatorThemeProps) {
  const item = socials[index % socials.length];
  if (!item) return null;
  const eff = anim || 'brutalistIn';
  const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn'].includes(eff);
  const dur = isEleg ? '0.62s' : '0.4s';
  const animStyle = eff === 'brutalistIn' || eff === 'brutalistOut' ? `${eff} 0.4s cubic-bezier(0.16,1,0.3,1) both` : `${eff} ${dur} cubic-bezier(0.16,1,0.3,1) both`;
  const itemAccent = item.accent || accent || '#FFE600';
  const bubbleBg = brutalistBg || (bg && bg !== 'transparent' && bg !== '#000000' && bg !== '#000' ? bg : '#FFFFFF');
  const txtColor = brutalistTextColor || (textColor && textColor !== '' && textColor !== '#ffffff' ? textColor : '#000000');
  const badgeBg = brutalistBadgeBg || '#000000';
  const borderColor = brutalistBorderColor || '#000000';
  const shadowOffset = brutalistShadow ?? 6;
  const hasHalftone = brutalistHalftone ?? true;
  const hasTail = brutalistTail ?? true;
  const isItalic = brutalistItalic ?? true;
  const isUppercase = brutalistUppercase ?? true;
  const logo = platformLogo(item.platform);

  const halftone: React.CSSProperties = {
    backgroundImage: `radial-gradient(circle, ${borderColor} 1.2px, transparent 1.45px)`,
    backgroundSize: '10px 10px',
  };

  return (
    <>
      <style>{`@keyframes brutalistIn{from{opacity:0;transform:translateX(-12px) scale(0.98)}to{opacity:1;transform:translateX(0) scale(1)}}@keyframes brutalistOut{from{opacity:1;transform:translateX(0) scale(1)}to{opacity:0;transform:translateX(12px) scale(0.98)}}`}</style>
      <div
        key={`${item.id}-${index}`}
        className="relative flex items-center justify-center gap-3 px-5 py-3 bg-white border-[4px] border-black will-change-transform w-auto max-w-full mx-auto text-center"
        style={{ fontFamily: `'${font}', sans-serif`, boxShadow: `${shadowOffset}px ${shadowOffset}px 0px 0px ${borderColor}`, background: bubbleBg, borderColor, animation: animStyle, borderRadius: 9999 } as any}
      >
      {/* halftone wash inside pill */}
      {hasHalftone && <div className="absolute inset-0 pointer-events-none opacity-[0.06] rounded-full overflow-hidden" style={halftone} />}

      {/* accent left stripe - controlled by brutalistTail */}
      {hasTail && <div className="absolute left-0 top-0 bottom-0 w-1.5 border-r-[3px] border-black rounded-l-full" style={{ background: itemAccent, borderColor }} />}

      {/* platform logo - tanpa rounded-full & tanpa border */}
      {logo ? (
        <img src={logo} alt={item.platform} className="relative w-8 h-8 object-contain bg-transparent p-0 shrink-0" />
      ) : (
        <div
          className="relative w-8 h-8 grid place-items-center text-[13px] font-black shrink-0 rotate-[-1deg]"
          style={{ background: itemAccent, color: '#000' }}
        >
          {platformGlyph(item.platform)}
        </div>
      )}

      <div className="relative flex flex-col items-center justify-center min-w-0 max-w-full leading-none text-center gap-0.5">
        {showLabel && (
          <span
            className="font-black tracking-widest leading-none text-center max-w-full whitespace-nowrap"
            style={{ fontSize: `${Math.round(fontSize * 0.65)}px`, fontFamily: `'${font}', sans-serif`, color: txtColor, opacity: 0.65, fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' : 'none' }}
          >
            <span className="inline-flex items-center justify-center gap-1 text-center">
              <span className="w-2 h-2 bg-black border border-black hidden sm:inline-block" style={{ background: itemAccent, borderColor }} />
              {item.label || item.platform}
            </span>
          </span>
        )}
        {showHandle && (
          <span
            className="font-black tracking-tight leading-none text-center max-w-full whitespace-normal break-words"
            style={{ fontSize: `${fontSize}px`, marginTop: showLabel ? 2 : 0, color: txtColor, fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' : 'none', wordBreak: 'break-word' }}
          >
            {item.handle}
          </span>
        )}
      </div>

        {/* brutalist right badge */}
        <span className="relative hidden sm:inline-flex ml-1 w-6 h-6 items-center justify-center border-[2px] border-black shrink-0 shadow-[2px_2px_0_#000] text-[10px] font-black" style={{ background: badgeBg, color: bubbleBg, borderColor, boxShadow: `2px 2px 0 ${borderColor}`, fontStyle: isItalic ? 'italic' : 'normal' }}>
          {String(index + 1).padStart(1, '0')}
        </span>
      </div>
    </>
  );
}
