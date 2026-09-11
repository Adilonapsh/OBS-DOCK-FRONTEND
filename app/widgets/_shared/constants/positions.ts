// Global widget position - shared across all widgets (timer, chat, poll, media, etc.)
// Align: t,l,b,r, center, tl,tr,bl,br + aliases (top, bottom, left, right, top-left, etc.)
// Live preview langsung mensimulasikan posisi via flex alignment (items-*, justify-*)

export const WIDGET_POSITIONS = [
  { value: 'tl', label: 'Top Left' },
  { value: 't', label: 'Top' },
  { value: 'tr', label: 'Top Right' },
  { value: 'l', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'r', label: 'Right' },
  { value: 'bl', label: 'Bottom Left' },
  { value: 'b', label: 'Bottom' },
  { value: 'br', label: 'Bottom Right' },
] as const;

export type WidgetPosition = typeof WIDGET_POSITIONS[number]['value'];

// Aliases for backward compat - support hyphen, underscore, space
const ALIASES: Record<string, WidgetPosition> = {
  'top-left': 'tl', 'top_left': 'tl', 'top left': 'tl',
  'top-right': 'tr', 'top_right': 'tr', 'top right': 'tr',
  'bottom-left': 'bl', 'bottom_left': 'bl', 'bottom left': 'bl',
  'bottom-right': 'br', 'bottom_right': 'br', 'bottom right': 'br',
  'top': 't', 'bottom': 'b', 'left': 'l', 'right': 'r',
  'top-center': 't', 'top_center': 't', 'top center': 't',
  'bottom-center': 'b', 'bottom_center': 'b', 'bottom center': 'b',
  'center': 'center', 'c': 'center', 'middle': 'center',
  'tl': 'tl', 'tr': 'tr', 'bl': 'bl', 'br': 'br',
  't': 't', 'b': 'b', 'l': 'l', 'r': 'r',
};

export function normalizePosition(pos: string | undefined): WidgetPosition {
  if (!pos) return 'center';
  const key = pos.toLowerCase().trim();
  return (ALIASES[key] as WidgetPosition) || 'center';
}

// 1-line align + justify - pakai flex alignItems/justifyContent biar 1 line
// Contoh: style={getPositionStyle(pos)} → {display:'flex', alignItems:'flex-end', justifyContent:'flex-start'} untuk bl
export function getPositionStyle(pos: string | undefined): React.CSSProperties {
  const p = normalizePosition(pos);
  const map: Record<WidgetPosition, { alignItems: string; justifyContent: string }> = {
    tl: { alignItems: 'flex-start', justifyContent: 'flex-start' },
    t: { alignItems: 'flex-start', justifyContent: 'center' },
    tr: { alignItems: 'flex-start', justifyContent: 'flex-end' },
    l: { alignItems: 'center', justifyContent: 'flex-start' },
    center: { alignItems: 'center', justifyContent: 'center' },
    r: { alignItems: 'center', justifyContent: 'flex-end' },
    bl: { alignItems: 'flex-end', justifyContent: 'flex-start' },
    b: { alignItems: 'flex-end', justifyContent: 'center' },
    br: { alignItems: 'flex-end', justifyContent: 'flex-end' },
  };
  const v = map[p] || map.center;
  return { display: 'flex', alignItems: v.alignItems as any, justifyContent: v.justifyContent as any };
}

// Legacy - tetap export biar tidak breaking, tapi prefer getPositionStyle biar 1 line
export function getPositionClasses(pos: string | undefined): string {
  const p = normalizePosition(pos);
  switch (p) {
    case 'tl': return 'items-start justify-start';
    case 't': return 'items-start justify-center';
    case 'tr': return 'items-start justify-end';
    case 'l': return 'items-center justify-start';
    case 'r': return 'items-center justify-end';
    case 'bl': return 'items-end justify-start';
    case 'b': return 'items-end justify-center';
    case 'br': return 'items-end justify-end';
    case 'center':
    default: return 'items-center justify-center';
  }
}

// For grid picker UI - returns if cell is active
export function isPositionActive(current: string | undefined, cell: WidgetPosition): boolean {
  return normalizePosition(current) === cell;
}
