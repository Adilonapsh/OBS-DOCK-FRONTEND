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

// Untuk border/glow yang butuh versi pudar dari accent
export function accentSoft(accent: string, alpha = 0.15): string {
  return hexToRgba(accent, alpha * 100);
}
