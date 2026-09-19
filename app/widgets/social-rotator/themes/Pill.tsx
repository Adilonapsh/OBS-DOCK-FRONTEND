import type { SocialRotatorThemeProps } from './types';
import { resolveBg, autoTextOn } from '../../_shared/utils/color';
import { platformLogo, platformGlyph } from '../../_shared/utils/platform';
import './Pill.css';

export default function PillTheme({ socials, index, font, fontSize, accent, bg, bgOpacity, textColor, showIcon, showHandle, showLabel, anim }: SocialRotatorThemeProps) {
  const item = socials[index % socials.length];
  if (!item) return null;
  // Background solid (tanpa opacity) untuk hitung kontras teks.
  const bgSolid = bg && bg !== 'transparent' ? bg : (item.accent || accent || '#121212');
  const bgColor = resolveBg(bg, item.accent || accent, '#121212', bgOpacity);
  // Putih default di atas aksen terang (kuning/cyan/putih) tidak terbaca → otomatis gelap.
  const color = autoTextOn(bgSolid, textColor);
  const eff = anim || 'elegantIn';
  const logo = platformLogo(item.platform);
  return (
    <div key={`${item.id}-${index}`} className="social-pill flex items-center gap-2.5 px-4 py-2.5 rounded-full border shadow-lg will-change-transform" style={{ fontFamily: `'${font}', sans-serif`, background: bgColor, borderColor: `${color}1A`, animation: `${eff} 0.52s cubic-bezier(0.16,1,0.3,1) both` } as any}>
      {showIcon && (
        logo ? (
          <img src={logo} alt={item.platform} className="w-8 h-8 rounded-full object-contain bg-white p-1 shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full grid place-items-center text-[13px] font-black shrink-0" style={{ background: item.accent || accent, color: '#fff' }}>
            {platformGlyph(item.platform)}
          </div>
        )
      )}
      <div className="flex flex-col min-w-0 leading-none">
        {showLabel && <span className="text-[10px] font-black uppercase tracking-widest" style={{ color, opacity: 0.75, fontSize: `${Math.round(fontSize * 0.7)}px` }}>{item.label || item.platform}</span>}
        {showHandle && <span className="font-black text-[13px] truncate" style={{ color, fontSize: `${fontSize}px` }}>{item.handle}</span>}
      </div>
    </div>
  );
}
