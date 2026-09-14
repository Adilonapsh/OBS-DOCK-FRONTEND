import type { SocialRotatorThemeProps } from './types';
import { resolveBg, resolveTextColor } from '../../_shared/utils/color';
import { platformLogo, platformGlyph } from '../../_shared/utils/platform';
import './Badge.css';

function platformBadge(platform: string) {
  const logo = platformLogo(platform);
  if (logo) return <img src={logo} alt={platform} className="badge-logo" />;
  if (platform.toLowerCase() === 'kick') return <span className="kick-icon">K</span>;
  return <span>{platformGlyph(platform)}</span>;
}

export default function BadgeTheme({ socials, index, font, fontSize, accent, bg, bgOpacity, textColor, showIcon, showHandle, anim }: SocialRotatorThemeProps) {
  const item = socials[index % socials.length];
  if (!item) return null;
  const eff = anim || 'elegantIn';
  const isEven = index % 2 === 0;
  const isKick = item.platform.toLowerCase() === 'kick';
  // Respect settings: bg untuk pill, accent per-item untuk bubble, textColor untuk pill text, fontSize & font
  const pillBg = isEven ? resolveBg(bg, undefined, '#2e2b4a', bgOpacity) : resolveBg(bg, undefined, '#ffffff', bgOpacity);
  const pillColor = isEven ? resolveTextColor(textColor, '#ffffff') : resolveTextColor(textColor, '#2e2b4a');
  // Bubble: pakai item.accent || accent jika ada, else fallback light/dark sesuai HTML
  const bubbleBg = item.accent || accent;
  const bubbleIsCustom = !!bubbleBg && bubbleBg !== '#8b5cf6' && bubbleBg !== 'transparent';
  const bubbleClassBase = isEven ? 'light' : 'dark';
  const bubbleClass = isKick ? `icon-bubble ${bubbleClassBase}` : `icon-bubble ${bubbleClassBase} speech-tail`;
  const bubbleStyle: any = bubbleIsCustom ? { background: bubbleBg, color: isEven ? '#ffffff' : '#ffffff', fontSize: 20 } : { fontSize: 20 };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@700&display=swap" rel="stylesheet" />
      <div
        key={`${item.id}-${index}`}
        className="social-item"
        style={{ fontFamily: `'${font}', 'Space Mono', monospace`, animation: `${eff} 0.52s cubic-bezier(0.16,1,0.3,1) both` } as any}
      >
        {showIcon !== false && <div className={bubbleClass} style={bubbleStyle}>{platformBadge(item.platform)}</div>}
        {showHandle !== false && (
          <div className="pill-button" style={{ background: pillBg, color: pillColor, fontSize: `${fontSize}px` }}>
            <span>→</span>
            <span>{item.handle}</span>
          </div>
        )}
      </div>
    </>
  );
}
