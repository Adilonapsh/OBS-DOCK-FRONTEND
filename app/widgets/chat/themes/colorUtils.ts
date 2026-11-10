// Util warna shared untuk tema chat.

export function parseColorToRgb(color: string): [number, number, number] | null {
  const c = color.trim().toLowerCase();
  if (!c || c === 'transparent') return null;
  const hex = c.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((ch) => ch + ch).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return [r, g, b];
  }
  const rgb = c.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgb) {
    const r = Number(rgb[1]);
    const g = Number(rgb[2]);
    const b = Number(rgb[3]);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return [r, g, b];
  }
  return null;
}

/** Brightness 0–100 (persepsi: 0.299R + 0.587G + 0.114B). null = tidak bisa diparse. */
export function bgBrightness(color: string): number | null {
  const rgb = parseColorToRgb(color);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) * 100;
}
