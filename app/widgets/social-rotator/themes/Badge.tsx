import type { SocialRotatorThemeProps } from './types';
import { resolveBg, autoTextOn, contrastText } from '../../_shared/utils/color';
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
  // Pill ganjil = putih → teks default putih tidak terbaca di atasnya (bug low-contrast).
  // autoTextOn: custom textColor dihormati, default putih otomatis jadi gelap di bg terang.
  const pillSolid = bg && bg !== 'transparent' ? bg : (isEven ? '#2e2b4a' : '#ffffff');
  const pillBg = resolveBg(bg, undefined, isEven ? '#2e2b4a' : '#ffffff', bgOpacity);
  const pillColor = autoTextOn(pillSolid, textColor);
  // Bubble: pakai item.accent || accent jika ada, else fallback light/dark sesuai HTML.
  // Glyph di atas bubble custom harus ikut kontras (aksen terang → glyph gelap).
  const bubbleBg = item.accent || accent;
  const bubbleIsCustom = !!bubbleBg && bubbleBg !== '#8b5cf6' && bubbleBg !== 'transparent';
  const bubbleFg = bubbleIsCustom ? contrastText(bubbleBg) : undefined;
  const bubbleClassBase = isEven ? 'light' : 'dark';
  // Tail (::after) warnanya dari CSS dan tidak bisa ngikutin aksen custom → sembunyikan saat custom.
  const bubbleClass = isKick || bubbleIsCustom ? `icon-bubble ${bubbleClassBase}` : `icon-bubble ${bubbleClassBase} speech-tail`;
  const bubbleStyle: any = bubbleIsCustom ? { background: bubbleBg, color: bubbleFg, fontSize: 20 } : { fontSize: 20 };

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
