import type { SocialRotatorThemeProps } from './types';
import { resolveBg, resolveTextColor } from '../../_shared/utils/color';
import './Badge.css';

function platformIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p === 'twitch') return <i className="fa-brands fa-twitch" />;
  if (p === 'youtube') return <i className="fa-solid fa-circle-play" />;
  if (p === 'kick') return <span className="kick-icon">K</span>;
  if (p === 'instagram') return <i className="fa-brands fa-instagram" />;
  if (p === 'tiktok') return <i className="fa-brands fa-tiktok" />;
  if (p === 'twitter' || p === 'x') return <i className="fa-brands fa-x-twitter" />;
  if (p === 'discord') return <i className="fa-brands fa-discord" />;
  if (p === 'facebook') return <i className="fa-brands fa-facebook" />;
  // kofi / coffee
  if (p.includes('kofi') || p.includes('coffee') || p === 'custom') return <i className="fa-solid fa-mug-hot" />;
  return <i className="fa-solid fa-link" />;
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
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <div
        key={`${item.id}-${index}`}
        className="social-item"
        style={{ fontFamily: `'${font}', 'Space Mono', monospace`, animation: `${eff} 0.52s cubic-bezier(0.16,1,0.3,1) both` } as any}
      >
        {showIcon !== false && <div className={bubbleClass} style={bubbleStyle}>{platformIcon(item.platform)}</div>}
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
