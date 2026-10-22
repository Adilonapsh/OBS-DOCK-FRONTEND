// Shared color helpers - agar semua tema konsisten respect accent/bg/textColor + bgOpacity
// Fix bug lama: jangan pakai opacity di container (ikut memudarkan text), tapi rgba di background

export function hexToRgba(hex: string, opacityPercent: number): string {
  const o = Math.max(0, Math.min(100, opacityPercent)) / 100;
  if (!hex || hex === 'transparent') return 'transparent';
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${o})`;
}

// Background efektif: jika bg === transparent pakai fallback (accent atau default), lalu apply opacity
export function resolveBg(bg: string | undefined, accent: string | undefined, fallback: string, bgOpacity: number): string {
  const raw = bg && bg !== 'transparent' ? bg : (accent || fallback);
  if (!raw || raw === 'transparent') return 'transparent';
  return hexToRgba(raw, bgOpacity);
}

// Text color efektif dengan fallback
export function resolveTextColor(textColor: string | undefined, fallback = '#ffffff'): string {
  return textColor && textColor !== '' ? textColor : fallback;
}

// Luminansi relatif WCAG (0 = hitam, 1 = putih). null bila bukan hex valid.
export function luminance(hex: string | undefined): number | null {
  if (!hex || hex === 'transparent') return null;
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return null;
  const lin = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = lin(parseInt(h.slice(0, 2), 16));
  const g = lin(parseInt(h.slice(2, 4), 16));
  const b = lin(parseInt(h.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// true bila background terang (teks gelap lebih terbaca di atasnya).
export function isLightBg(hex: string | undefined): boolean {
  const l = luminance(hex);
  return l !== null && l > 0.35;
}

// Pilih teks terang/gelap yang terbaca di atas background solid.
export function contrastText(bgHex: string | undefined, light = '#ffffff', dark = '#14141c'): string {
  return isLightBg(bgHex) ? dark : light;
}

// Rasio kontras WCAG antara warna teks & background (1–21).
// 4.5 = batas minimum teks normal, 3 = teks besar / elemen non-teks.
export function contrastRatio(fg: string | undefined, bg: string | undefined): number {
  const a = luminance(fg);
  const b = luminance(bg);
  if (a === null || b === null) return 0;
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

// Pakai `preferred` kalau kontrasnya cukup; kalau tidak, jatuh ke putih/hitam
// yang paling terbaca di atas background. Dipakai judul/artis/requester supaya
// teks tetap kebaca walau warna aksen dari thumbnail gelap/terang.
export function readableOn(
  bgHex: string | undefined,
  preferred: string | undefined,
  minRatio = 4.5,
  light = '#ffffff',
  dark = '#14141c',
): string {
  if (bgHex && bgHex !== 'transparent') {
    if (preferred && contrastRatio(preferred, bgHex) >= minRatio) return preferred;
    return contrastText(bgHex, light, dark);
  }
  return preferred || light;
}

// Teks otomatis anti low-contrast: kalau user masih pakai warna default
// (putih) tapi background-nya terang (aksen kuning/cyan, pill putih, ...),
// paksa ke warna yang terbaca. Warna custom user selalu dihormati.
export function autoTextOn(bgSolidHex: string | undefined, userColor: string | undefined, defaultColor = '#ffffff'): string {
  const custom = userColor && userColor !== '' && userColor.toLowerCase() !== defaultColor.toLowerCase();
  if (custom) return userColor as string;
  if (bgSolidHex && bgSolidHex !== 'transparent') return contrastText(bgSolidHex);
  return defaultColor;
}

// Shadow teks agar terbaca di atas video/stream tanpa background.
export const READABLE_SHADOW = '0 1px 10px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.9)';

// Turunkan brightness warna hex (ratio 0..1). Dipakai tema yang butuh
// variasi gelap dari satu warna (mis. shadow berlapis ala cartridge 8-bit).
export function shadeHex(hex: string | undefined, ratio: number): string {
  let h = (hex || '').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return '#1e1642';
  const r = Math.round(parseInt(h.slice(0, 2), 16) * ratio);
  const g = Math.round(parseInt(h.slice(2, 4), 16) * ratio);
  const b = Math.round(parseInt(h.slice(4, 6), 16) * ratio);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// Untuk border/glow yang butuh versi pudar dari accent
export function accentSoft(accent: string, alpha = 0.15): string {
  return hexToRgba(accent, alpha * 100);
}
