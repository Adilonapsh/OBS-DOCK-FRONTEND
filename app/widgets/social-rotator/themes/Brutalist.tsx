import type { SocialRotatorThemeProps } from './types';
import { platformLogo, platformGlyph } from '../../_shared/utils/platform';

export default function BrutalistTheme({ socials, index, font, fontSize, accent, bg, showIcon, showHandle, showLabel, anim }: SocialRotatorThemeProps) {
  const item = socials[index % socials.length];
  if (!item) return null;
  const eff = anim || 'brutalistIn';
  const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn'].includes(eff);
  const dur = isEleg ? '0.62s' : '0.4s';
  const animStyle = eff === 'brutalistIn' || eff === 'brutalistOut' ? `${eff} 0.4s cubic-bezier(0.16,1,0.3,1) both` : `${eff} ${dur} cubic-bezier(0.16,1,0.3,1) both`;
  const itemAccent = item.accent || accent || '#FFE600';
  const bubbleBg = bg && bg !== 'transparent' && bg !== '#000000' && bg !== '#000' ? bg : '#FFFFFF';
  const logo = platformLogo(item.platform);

  const halftone: React.CSSProperties = {
    backgroundImage: 'radial-gradient(circle, #000 1.2px, transparent 1.45px)',
    backgroundSize: '10px 10px',
  };

  return (
    <>
      <style>{`@keyframes brutalistIn{from{opacity:0;transform:translateX(-12px) scale(0.98)}to{opacity:1;transform:translateX(0) scale(1)}}@keyframes brutalistOut{from{opacity:1;transform:translateX(0) scale(1)}to{opacity:0;transform:translateX(12px) scale(0.98)}}`}</style>
      <div
        key={`${item.id}-${index}`}
        className="relative flex items-center gap-2.5 px-4 py-2.5 bg-white border-[4px] border-black overflow-hidden will-change-transform max-w-full"
        style={{ fontFamily: `'${font}', sans-serif`, boxShadow: '6px 6px 0px 0px #000', background: bubbleBg, animation: animStyle, borderRadius: 9999 } as any}
      >
      {/* halftone wash inside pill */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] rounded-full overflow-hidden" style={halftone} />

      {/* accent left stripe - brutalist touch */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 border-r-[3px] border-black rounded-l-full" style={{ background: itemAccent }} />

      {showIcon && (
        logo ? (
          <img src={logo} alt={item.platform} className="relative w-8 h-8 rounded-full object-contain bg-white p-1 shrink-0 border-[2.5px] border-black shadow-[2px_2px_0_#000] ml-1" />
        ) : (
          <div
            className="relative w-8 h-8 rounded-full grid place-items-center text-[13px] font-black shrink-0 border-[2.5px] border-black shadow-[2px_2px_0_#000] ml-1 rotate-[-1deg]"
            style={{ background: itemAccent, color: '#000' }}
          >
            {platformGlyph(item.platform)}
          </div>
        )
      )}

      <div className="relative flex flex-col min-w-0 leading-none pr-1">
        {showLabel && (
          <span
            className="font-black uppercase tracking-widest text-black/60 leading-none"
            style={{ fontSize: `${Math.round(fontSize * 0.65)}px`, fontFamily: `'${font}', sans-serif` }}
          >
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-black border border-black hidden sm:inline-block" style={{ background: itemAccent }} />
              {item.label || item.platform}
            </span>
          </span>
        )}
        {showHandle && (
          <span
            className="font-black tracking-tight leading-none truncate text-black uppercase"
            style={{ fontSize: `${fontSize}px`, marginTop: showLabel ? 2 : 0 }}
          >
            {item.handle}
          </span>
        )}
      </div>

        {/* brutalist right badge */}
        <span className="relative hidden sm:inline-flex ml-1 w-6 h-6 items-center justify-center bg-black text-white border-[2px] border-black shrink-0 shadow-[2px_2px_0_#000] text-[10px] font-black">
          {String(index + 1).padStart(1, '0')}
        </span>
      </div>
    </>
  );
}
