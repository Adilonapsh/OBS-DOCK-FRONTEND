// Palet pastel per tier untuk skin pastel (cute card).
// Background card ngikut base rank, border slate tetap.
export const PASTEL_BORDER = '#444b58';

const PASTEL: Array<{ match: string; bg: string }> = [
  { match: 'unranked', bg: '#e2e8f0' },
  { match: 'iron', bg: '#d1d5db' },
  { match: 'bronze', bg: '#e6d5c3' },
  { match: 'silver', bg: '#e2e8f0' },
  { match: 'gold', bg: '#fce9a4' },
  { match: 'platinum', bg: '#bfe5eb' },
  { match: 'diamond', bg: '#c9bcf0' },
  { match: 'ascendant', bg: '#bdf0d4' },
  { match: 'immortal', bg: '#f0bcbc' },
  { match: 'radiant', bg: '#fffae6' },
];

export function pastelForTier(tierName: string): { bg: string } {
  const base = tierName.trim().split(/\s+/)[0]?.toLowerCase() || '';
  const hit = PASTEL.find((t) => t.match === base);
  return { bg: hit ? hit.bg : '#e2e8f0' };
}

// Sumber warna pastel: 'tier' = otomatis ngikut base rank,
// 'custom' = pakai warna pilihan user (fallback ke tier bila invalid).
export function pastelBgFor(tierName: string, mode: string, custom: string): string {
  if (mode === 'custom' && /^#[0-9a-fA-F]{6}$/.test((custom || '').trim())) return custom.trim();
  return pastelForTier(tierName).bg;
}
