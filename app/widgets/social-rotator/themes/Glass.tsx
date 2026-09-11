import type { SocialRotatorThemeProps } from './types';
import { hexToRgba, resolveTextColor } from '../../_shared/utils/color';
import './Glass.css';

function platformIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes('tiktok')) return '♪';
  if (p.includes('instagram')) return '◎';
  if (p.includes('youtube')) return '▶';
  if (p.includes('twitch')) return '⬢';
  if (p.includes('twitter') || p === 'x') return '𝕏';
  if (p.includes('discord')) return '◈';
  return '@';
}

export default function GlassTheme({ socials, index, font, fontSize, accent, bg, bgOpacity, textColor, showIcon, showHandle, anim }: SocialRotatorThemeProps) {
  const item = socials[index % socials.length];
  if (!item) return null;
  const color = resolveTextColor(textColor, '#ffffff');
  const glassBg = bg && bg !== 'transparent' ? hexToRgba(bg, bgOpacity) : hexToRgba(item.accent || accent || '#8b5cf6', Math.round(bgOpacity * 0.55));
  const eff = anim || 'elegantIn';
  return (
    <div key={`${item.id}-${index}`} className="social-glass flex items-center gap-3 px-5 py-3 rounded-[18px] border shadow-xl will-change-transform" style={{ fontFamily: `'${font}', sans-serif`, background: glassBg, borderColor: `${color}33`, animation: `${eff} 0.52s cubic-bezier(0.16,1,0.3,1) both`, backdropFilter: 'blur(12px)' } as any}>
      {showIcon && <div className="w-9 h-9 rounded-xl grid place-items-center text-white font-black" style={{ background: item.accent || accent }}>{platformIcon(item.platform)}</div>}
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-70" style={{ color }}>{item.platform}</span>
        {showHandle && <span className="font-black" style={{ color, fontSize: `${fontSize+1}px` }}>{item.handle}</span>}
      </div>
    </div>
  );
}
