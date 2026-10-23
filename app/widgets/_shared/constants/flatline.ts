// Flatline (Sticker Cards) theme settings - pola sama seperti brutalist.ts
// Tema port dari HTML user: back-card miring + front-card + bubble 2X TIME & +10s
// Semua warna bisa diubah via settings & ikut ke URL OBS.

export const FLATLINE_DEFAULTS = {
  flatlineCard: '#24283b' as string,
  flatlineHours: '#ffb5f0' as string,
  flatlineMinutes: '#baa9ff' as string,
  flatlineDays: '#ffd166' as string,
  flatlineSeconds: '#a7f3d0' as string,
  flatlineBubble: '#f4d3a1' as string,
  flatlineBadge: '#1a1d2d' as string,
  flatlineBackText: '#dda5d0' as string,
  flatlinePageBg: '#8c90d5' as string,
  flatlineShowBubbles: true as boolean,
  flatlineShowBack: true as boolean,
  flatlineTilt: 8 as number,
  flatlineLayout: 'vertical' as string,
} as const;

export type FlatlineSettings = typeof FLATLINE_DEFAULTS;

export const FLATLINE_PRESETS = [
  { label: 'Default Lilac', card: '#24283b', hours: '#ffb5f0', minutes: '#baa9ff', days: '#ffd166', seconds: '#a7f3d0', bubble: '#f4d3a1', badge: '#1a1d2d', backText: '#dda5d0', page: '#8c90d5' },
  { label: 'Midnight Pop', card: '#14141c', hours: '#ff7ad9', minutes: '#8b88ff', days: '#ffe600', seconds: '#00f5d4', bubble: '#ffe9c4', badge: '#000000', backText: '#ff7ad9', page: '#5b5fc7' },
  { label: 'Peach Cream', card: '#2e2a33', hours: '#ffd6e8', minutes: '#d3c2ff', days: '#fff3b0', seconds: '#b9f5db', bubble: '#ffcf87', badge: '#1a1d2d', backText: '#ffcf87', page: '#c9a6ff' },
  { label: 'Mint Dark', card: '#1d2b2a', hours: '#a7f3d0', minutes: '#7dd3fc', days: '#fef08a', seconds: '#ffffff', bubble: '#fef3c7', badge: '#0f172a', backText: '#6ee7b7', page: '#5eead4' },
  { label: 'Mono Ink', card: '#111111', hours: '#ffffff', minutes: '#d4d4d4', days: '#e5e5e5', seconds: '#a3a3a3', bubble: '#ffffff', badge: '#000000', backText: '#a3a3a3', page: '#71717a' },
  { label: 'Sunset Punch', card: '#311d33', hours: '#ff9ecf', minutes: '#ffb35c', days: '#fde68a', seconds: '#7dd3fc', bubble: '#fff1c9', badge: '#1c1020', backText: '#ff9ecf', page: '#f472b6' },
] as const;

export function appendFlatlineParams(p: URLSearchParams, s: Record<string, unknown>) {
  p.set('flatlineCard', (s.flatlineCard as string) || FLATLINE_DEFAULTS.flatlineCard);
  p.set('flatlineHours', (s.flatlineHours as string) || FLATLINE_DEFAULTS.flatlineHours);
  p.set('flatlineMinutes', (s.flatlineMinutes as string) || FLATLINE_DEFAULTS.flatlineMinutes);
  p.set('flatlineDays', (s.flatlineDays as string) || FLATLINE_DEFAULTS.flatlineDays);
  p.set('flatlineSeconds', (s.flatlineSeconds as string) || FLATLINE_DEFAULTS.flatlineSeconds);
  p.set('flatlineBubble', (s.flatlineBubble as string) || FLATLINE_DEFAULTS.flatlineBubble);
  p.set('flatlineBadge', (s.flatlineBadge as string) || FLATLINE_DEFAULTS.flatlineBadge);
  p.set('flatlineBackText', (s.flatlineBackText as string) || FLATLINE_DEFAULTS.flatlineBackText);
  p.set('flatlinePageBg', (s.flatlinePageBg as string) || FLATLINE_DEFAULTS.flatlinePageBg);
  p.set('flatlineShowBubbles', (s.flatlineShowBubbles as boolean) ? '1' : '0');
  p.set('flatlineShowBack', (s.flatlineShowBack as boolean) ? '1' : '0');
  p.set('flatlineTilt', String((s.flatlineTilt as number) ?? FLATLINE_DEFAULTS.flatlineTilt));
  p.set('flatlineLayout', (s.flatlineLayout as string) || FLATLINE_DEFAULTS.flatlineLayout);
}

export function parseFlatlineParams(get: (k: string) => string | null): FlatlineSettings {
  const pick = (k: string, d: string) => get(k) ?? d;
  const pickBool = (k: string, d: boolean) => {
    const v = get(k);
    if (v === null) return d;
    return v === '1' || v === 'true';
  };
  const pickNum = (k: string, d: number) => {
    const v = get(k);
    if (v === null) return d;
    const n = parseInt(v, 10);
    return isNaN(n) ? d : n;
  };
  return {
    flatlineCard: pick('flatlineCard', FLATLINE_DEFAULTS.flatlineCard),
    flatlineHours: pick('flatlineHours', FLATLINE_DEFAULTS.flatlineHours),
    flatlineMinutes: pick('flatlineMinutes', FLATLINE_DEFAULTS.flatlineMinutes),
    flatlineDays: pick('flatlineDays', FLATLINE_DEFAULTS.flatlineDays),
    flatlineSeconds: pick('flatlineSeconds', FLATLINE_DEFAULTS.flatlineSeconds),
    flatlineBubble: pick('flatlineBubble', FLATLINE_DEFAULTS.flatlineBubble),
    flatlineBadge: pick('flatlineBadge', FLATLINE_DEFAULTS.flatlineBadge),
    flatlineBackText: pick('flatlineBackText', FLATLINE_DEFAULTS.flatlineBackText),
    flatlinePageBg: pick('flatlinePageBg', FLATLINE_DEFAULTS.flatlinePageBg),
    flatlineShowBubbles: pickBool('flatlineShowBubbles', FLATLINE_DEFAULTS.flatlineShowBubbles),
    flatlineShowBack: pickBool('flatlineShowBack', FLATLINE_DEFAULTS.flatlineShowBack),
    flatlineTilt: Math.max(0, Math.min(16, pickNum('flatlineTilt', FLATLINE_DEFAULTS.flatlineTilt))),
    flatlineLayout: pick('flatlineLayout', FLATLINE_DEFAULTS.flatlineLayout) === 'horizontal' ? 'horizontal' : 'vertical',
  };
}
