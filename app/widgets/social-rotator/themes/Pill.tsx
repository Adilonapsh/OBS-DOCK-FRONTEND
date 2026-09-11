import type { SocialRotatorThemeProps } from './types';
import { resolveBg, resolveTextColor } from '../../_shared/utils/color';
import './Pill.css';

function platformIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p === 'tiktok') return '♪';
  if (p === 'instagram') return '◎';
  if (p === 'youtube') return '▶';
  if (p === 'twitch') return '⬢';
  if (p === 'twitter' || p === 'x') return '𝕏';
  if (p === 'discord') return '◈';
  if (p === 'facebook') return 'f';
  return '@';
}

export default function PillTheme({ socials, index, font, fontSize, accent, bg, bgOpacity, textColor, showIcon, showHandle, showLabel, anim }: SocialRotatorThemeProps) {
  const item = socials[index % socials.length];
  if (!item) return null;
  const bgColor = resolveBg(bg, item.accent || accent, '#121212', bgOpacity);
  const color = resolveTextColor(textColor, '#ffffff');
  const eff = anim || 'elegantIn';
  return (
    <div key={`${item.id}-${index}`} className="social-pill flex items-center gap-2.5 px-4 py-2.5 rounded-full border shadow-lg will-change-transform" style={{ fontFamily: `'${font}', sans-serif`, background: bgColor, borderColor: `${color}1A`, animation: `${eff} 0.52s cubic-bezier(0.16,1,0.3,1) both` } as any}>
      {showIcon && (
        <div className="w-8 h-8 rounded-full grid place-items-center text-[13px] font-black shrink-0" style={{ background: item.accent || accent, color: '#fff' }}>
          {platformIcon(item.platform)}
        </div>
      )}
      <div className="flex flex-col min-w-0 leading-none">
        {showLabel && <span className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color, fontSize: `${Math.round(fontSize * 0.7)}px` }}>{item.label || item.platform}</span>}
        {showHandle && <span className="font-black text-[13px] truncate" style={{ color, fontSize: `${fontSize}px` }}>{item.handle}</span>}
      </div>
    </div>
  );
}
