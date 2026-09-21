import { WIDGET_FONTS } from '../_shared/constants/fonts';

export const QR_THEMES = [
  { value: 'standard', label: 'Standard - Card' },
  { value: 'bubble', label: 'Bubble - Putih' },
  { value: 'clean', label: 'Clean - Garis Aksen' },
  { value: 'boxed', label: 'Boxed - Header' },
  { value: 'minimal', label: 'Minimal - QR Saja' },
  { value: 'cute', label: 'Cute - Pastel' },
  { value: 'plain', label: 'Plain - Transparan' },
] as const;

export const QR_LEVELS = [
  { value: 'L', label: 'L - Rendah (kapasitas besar)' },
  { value: 'M', label: 'M - Sedang' },
  { value: 'Q', label: 'Q - Tinggi' },
  { value: 'H', label: 'H - Maksimal (tahan rusak/logo)' },
] as const;

export const QR_FONTS = WIDGET_FONTS;

export const QR_DEFAULTS = {
  pos: 'center' as string,
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 16,
  value: 'https://saweria.co/username',
  label: 'SCAN UNTUK DONASI',
  showLabel: true,
  size: 200,
  fg: '#000000' as string,
  qrBg: '#ffffff' as string,
  bg: '#000000' as string,
  accent: '#8b5cf6',
  level: 'M' as string,
  logo: '' as string,
  showLogo: true,
} as const;

export type QrSettings = typeof QR_DEFAULTS;

export function buildQrUrl(base: string, s: QrSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('value', s.value);
  if (s.label) p.set('label', s.label);
  p.set('showLabel', s.showLabel ? '1' : '0');
  p.set('size', String(s.size));
  p.set('fg', s.fg);
  p.set('qrBg', s.qrBg);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('accent', s.accent);
  if (s.level && s.level !== 'M') p.set('level', s.level);
  if (s.showLogo && s.logo) p.set('logo', s.logo);
  p.set('pos', (s as unknown as { pos: string }).pos || 'center');
  const q = p.toString();
  return q ? `${base}?${q}` : base;
}
