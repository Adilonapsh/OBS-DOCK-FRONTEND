import type { SocialRotatorThemeProps } from './types';
import { resolveBg, resolveTextColor } from '../../_shared/utils/color';
import './Boxed.css';

export default function BoxedTheme({ socials, index, font, fontSize, accent, bg, bgOpacity, textColor, anim }: SocialRotatorThemeProps) {
  const item = socials[index % socials.length];
  if (!item) return null;
  const bgColor = resolveBg(bg, accent, '#1e1e1e', bgOpacity);
  const color = resolveTextColor(textColor, '#ffffff');
  const eff = anim || 'elegantIn';
  return (
    <div key={`${item.id}-${index}`} className="social-boxed w-[260px] rounded-[18px] border overflow-hidden will-change-transform" style={{ fontFamily: `'${font}', sans-serif`, background: bgColor, borderColor: `${color}1A`, animation: `${eff} 0.52s cubic-bezier(0.16,1,0.3,1) both` } as any}>
      <div className="h-1 w-full" style={{ background: item.accent || accent }} />
      <div className="p-3.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${color}99` }}>{item.label || item.platform}</div>
          <div className="font-black truncate" style={{ color, fontSize: `${fontSize}px` }}>{item.handle}</div>
        </div>
        <div className="w-2 h-2 rounded-full" style={{ background: item.accent || accent }} />
      </div>
    </div>
  );
}
