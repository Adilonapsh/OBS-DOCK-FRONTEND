export function hexToRgb(hex: string): [number, number, number] {
  let c = hex.startsWith('#') ? hex : `#${hex}`;
  if (c.length > 7) c = c.substring(0, 7);
  const r = parseInt(c.substring(1, 3), 16);
  const g = parseInt(c.substring(3, 5), 16);
  const b = parseInt(c.substring(5, 7), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return [255, 70, 85];
  return [r, g, b];
}
