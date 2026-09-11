import { WIDGET_FONTS } from '../_shared/constants/fonts';

export const INFO_SLIDES_THEMES = [
  { value: 'clean', label: 'Clean - Minimal Transparan' },
  { value: 'boxed', label: 'Boxed - Card Sponsor' },
  { value: 'glass', label: 'Glass - Blur Premium' },
  { value: 'timer-glass', label: 'Timer Glass - Ala Timer (Recommended)' },
] as const;

export const INFO_SLIDES_ANIMS = [
  { value: 'elegant', label: 'Elegant (Recommended)' },
  { value: 'softPop', label: 'Soft Pop' },
  { value: 'blur', label: 'Blur In' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'fade', label: 'Fade' },
] as const;

export const INFO_SLIDES_FONTS = WIDGET_FONTS;

export type InfoSlide = {
  id: string;
  badge?: string;
  title: string;
  desc: string;
  accent?: string;
  image?: string; // url http/https/data: - logo sponsor / QR / ilustrasi
};

export const DEFAULT_SLIDES: InfoSlide[] = [
  { id: 's1', badge: 'SPONSOR', title: 'TrueNAP', desc: 'Powered by TrueNAP - Ultra Low Latency', accent: '#8b5cf6', image: 'https://ui-avatars.com/api/?name=TrueNAP&background=8b5cf6&color=fff&size=128&font-size=0.35&bold=true' },
  { id: 's2', badge: 'RULES', title: 'No Toxic • No SARA', desc: 'Jaga chat tetap asik & respect semua viewer', accent: '#06b6d4' },
  { id: 's3', badge: 'FOLLOW', title: 'Follow & Nyalakan Lonceng', desc: '@adilonapsh di TikTok • Twitch • YouTube', accent: '#ec4899' },
  { id: 's4', badge: 'SAWERIA', title: 'Dukung via Saweria', desc: 'Scan QR di layar • Setiap dukungan berarti!', accent: '#f59e0b' },
  { id: 's5', badge: 'DISCORD', title: 'Join Discord Community', desc: 'discord.gg/adilonapsh • Info turnamen & event', accent: '#5865F2' },
];

export const INFO_SLIDES_DEFAULTS = {
  theme: 'clean' as string,
  font: 'Outfit',
  fontSize: 14,
  accent: '#8b5cf6',
  bg: 'transparent',
  bgOpacity: 100,
  textColor: '#ffffff',
  duration: 6,
  autoRotate: true,
  showProgress: true,
  showBadge: true,
  showArrows: false,
  anim: 'elegant',
  pos: 'bl' as string,
  slidesJson: JSON.stringify(DEFAULT_SLIDES),
} as const;

export type InfoSlidesSettings = typeof INFO_SLIDES_DEFAULTS;

export function parseSlides(json: string): InfoSlide[] {
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) return arr.filter((s: any) => s && s.title).slice(0, 10).map((s: any) => ({
      id: String(s.id || Math.random().toString(36).slice(2, 6)),
      badge: String(s.badge || '').slice(0, 20),
      title: String(s.title || '').slice(0, 80),
      desc: String(s.desc || '').slice(0, 160),
      accent: String(s.accent || ''),
      image: String(s.image || '').slice(0, 2000).trim() || undefined,
    }));
  } catch {}
  return DEFAULT_SLIDES;
}

export function buildInfoSlidesUrl(base: string, s: InfoSlidesSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('bgOpacity', String(s.bgOpacity));
  p.set('textColor', s.textColor);
  p.set('duration', String(s.duration));
  p.set('autoRotate', s.autoRotate ? '1' : '0');
  p.set('showProgress', s.showProgress ? '1' : '0');
  p.set('showBadge', s.showBadge ? '1' : '0');
  p.set('showArrows', s.showArrows ? '1' : '0');
  p.set('anim', s.anim);
  p.set('pos', (s as unknown as { pos: string }).pos || 'bl');
  // slides di-compress via encodeURIComponent biar URL tetap shareable, tapi fallback ke storage jika kepanjangan
  try {
    const slides = parseSlides(s.slidesJson);
    p.set('slides', encodeURIComponent(JSON.stringify(slides)));
  } catch {}
  return `${base}?${p.toString()}`;
}
