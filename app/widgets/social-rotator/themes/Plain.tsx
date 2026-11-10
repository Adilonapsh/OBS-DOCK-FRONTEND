import type { SocialRotatorThemeProps } from './types';
import { resolveTextColor, READABLE_SHADOW } from '../../_shared/utils/color';
import { platformGlyph } from '../../_shared/utils/platform';

export default function PlainTheme({ socials, index, font, fontSize, accent, textColor, showIcon, showHandle, showLabel }: SocialRotatorThemeProps) {
  const item = socials[index % socials.length];
  if (!item) return null;
  const color = resolveTextColor(textColor, '#ffffff');
  const itemAccent = item.accent || accent;

  return (
    <div key={`${item.id}-${index}`} className="flex items-baseline gap-2" style={{ fontFamily: `'${font}', sans-serif`, animation: 'fadeIn 0.4s ease both', textShadow: READABLE_SHADOW }}>
      {showIcon && <span className="font-black shrink-0" style={{ color: itemAccent, fontSize }}>{platformGlyph(item.platform)}</span>}
      {showLabel && <span className="font-black uppercase tracking-widest shrink-0" style={{ color: itemAccent, fontSize: Math.round(fontSize * 0.7) }}>{item.label || item.platform}</span>}
      {showHandle && <span className="font-black truncate" style={{ color, fontSize }}>{item.handle}</span>}
    </div>
  );
}
