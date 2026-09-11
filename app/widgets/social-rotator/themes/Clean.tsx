import type { SocialRotatorThemeProps } from './types';
import { resolveTextColor } from '../../_shared/utils/color';
import './Clean.css';

function platformIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p === 'tiktok') return '♪';
  if (p === 'instagram') return '◎';
  if (p === 'youtube') return '▶';
  if (p === 'twitch') return '⬢';
  if (p === 'twitter' || p === 'x') return '𝕏';
  if (p === 'discord') return '◈';
  return '@';
}

export default function CleanTheme({ socials, index, font, fontSize, accent, textColor, showIcon, showHandle, showLabel, anim }: SocialRotatorThemeProps) {
  const item = socials[index % socials.length];
  if (!item) return null;
  const color = resolveTextColor(textColor, '#ffffff');
  const eff = anim || 'elegantIn';
  return (
    <div key={`${item.id}-${index}`} className="flex items-center gap-3 will-change-transform" style={{ fontFamily: `'${font}', sans-serif`, animation: `${eff} 0.52s cubic-bezier(0.16,1,0.3,1) both` } as any}>
      {showIcon && <span className="text-[16px] font-black" style={{ color: item.accent || accent }}>{platformIcon(item.platform)}</span>}
      {showLabel && <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: `${color}99`, fontSize: `${Math.round(fontSize*0.7)}px` }}>{item.label || item.platform}</span>}
      {showHandle && <span className="font-black" style={{ color, fontSize: `${fontSize}px` }}>{item.handle}</span>}
    </div>
  );
}
