import { BRUTALIST_DEFAULTS, appendBrutalistParams } from '../_shared/constants/brutalist';

export const CLOCK_THEMES = [
  { value: 'standard', label: 'Standard - Clean' },
  { value: 'brutalist', label: 'Brutalist - Neo Brutalism' },
] as const;

export const CLOCK_DEFAULTS = {
  theme: 'standard' as string,
  font: 'Outfit',
  accent: '#FFE600',
  ...BRUTALIST_DEFAULTS,
} as const;

export type ClockSettings = typeof CLOCK_DEFAULTS & {
  tz: string;
  l1: string; s1: number; w1: string; c1: string; o1: number; t1: string; a1: string; v1: boolean;
  l2: string; s2: number; w2: string; c2: string; o2: number; t2: string; a2: string; v2: boolean;
  l3: string; s3: number; w3: string; c3: string; o3: number; t3: string; a3: string; v3: boolean;
  gap: number;
  bg: string;
  pos: string;
};

export function buildClockUrl(base: string, s: Record<string, unknown>): string {
  const p = new URLSearchParams();
  p.set('font', (s.font as string) || 'Outfit');
  p.set('tz', (s.tz as string) || 'Asia/Jakarta');
  p.set('theme', (s.theme as string) || 'standard');
  p.set('accent', (s.accent as string) || '#FFE600');
  p.set('l1', s.l1 as string); p.set('s1', String(s.s1)); p.set('w1', s.w1 as string); p.set('c1', s.c1 as string); p.set('o1', String(s.o1)); p.set('t1', s.t1 as string); p.set('a1', s.a1 as string); p.set('v1', (s.v1 as boolean) ? '1' : '0');
  p.set('l2', s.l2 as string); p.set('s2', String(s.s2)); p.set('w2', s.w2 as string); p.set('c2', s.c2 as string); p.set('o2', String(s.o2)); p.set('t2', s.t2 as string); p.set('a2', s.a2 as string); p.set('v2', (s.v2 as boolean) ? '1' : '0');
  p.set('l3', s.l3 as string); p.set('s3', String(s.s3)); p.set('w3', s.w3 as string); p.set('c3', s.c3 as string); p.set('o3', String(s.o3)); p.set('t3', s.t3 as string); p.set('a3', s.a3 as string); p.set('v3', (s.v3 as boolean) ? '1' : '0');
  p.set('gap', String(s.gap));
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg as string);
  p.set('pos', (s.pos as string) || 'center');
  appendBrutalistParams(p, s);
  return `${base}?${p.toString()}`;
}
