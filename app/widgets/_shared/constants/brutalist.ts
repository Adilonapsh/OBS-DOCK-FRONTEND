export const BRUTALIST_DEFAULTS = {
  brutalistBg: '#FFFFFF' as string,
  brutalistTextColor: '#000000' as string,
  brutalistBadgeBg: '#FFFFFF' as string,
  brutalistBorderColor: '#000000' as string,
  brutalistShadow: 6 as number,
  brutalistHalftone: true as boolean,
  brutalistTail: true as boolean,
  brutalistItalic: true as boolean,
  brutalistUppercase: true as boolean,
  brutalistInline: false as boolean,
} as const;

export type BrutalistSettings = typeof BRUTALIST_DEFAULTS;

export const BRUTALIST_PRESETS = [
  { label: 'Classic White', bg: '#FFFFFF', text: '#000000', badge: '#FFFFFF', border: '#000000' },
  { label: 'Cyber Yellow', bg: '#FFE600', text: '#000000', badge: '#00E5FF', border: '#000000' },
  { label: 'Pop Pink', bg: '#FF6B8B', text: '#FFFFFF', badge: '#000000', border: '#000000' },
  { label: 'Manga Dark', bg: '#18181B', text: '#FFFFFF', badge: '#FFE600', border: '#000000' },
  { label: 'Vibrant Mint', bg: '#00F5D4', text: '#000000', badge: '#FFFFFF', border: '#000000' },
  { label: 'Neo Violet', bg: '#9D4EDD', text: '#FFFFFF', badge: '#00E5FF', border: '#000000' },
] as const;

export function appendBrutalistParams(p: URLSearchParams, s: Record<string, unknown>) {
  p.set('brutalistBg', (s.brutalistBg as string) || BRUTALIST_DEFAULTS.brutalistBg);
  p.set('brutalistTextColor', (s.brutalistTextColor as string) || BRUTALIST_DEFAULTS.brutalistTextColor);
  p.set('brutalistBadgeBg', (s.brutalistBadgeBg as string) || BRUTALIST_DEFAULTS.brutalistBadgeBg);
  p.set('brutalistBorderColor', (s.brutalistBorderColor as string) || BRUTALIST_DEFAULTS.brutalistBorderColor);
  p.set('brutalistShadow', String((s.brutalistShadow as number) ?? BRUTALIST_DEFAULTS.brutalistShadow));
  p.set('brutalistHalftone', (s.brutalistHalftone as boolean) ? '1' : '0');
  p.set('brutalistTail', (s.brutalistTail as boolean) ? '1' : '0');
  p.set('brutalistItalic', (s.brutalistItalic as boolean) ? '1' : '0');
  p.set('brutalistUppercase', (s.brutalistUppercase as boolean) ? '1' : '0');
  p.set('brutalistInline', (s.brutalistInline as boolean) ? '1' : '0');
}

export function parseBrutalistParams(get: (k: string) => string | null): BrutalistSettings {
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
    brutalistBg: pick('brutalistBg', BRUTALIST_DEFAULTS.brutalistBg),
    brutalistTextColor: pick('brutalistTextColor', BRUTALIST_DEFAULTS.brutalistTextColor),
    brutalistBadgeBg: pick('brutalistBadgeBg', BRUTALIST_DEFAULTS.brutalistBadgeBg),
    brutalistBorderColor: pick('brutalistBorderColor', BRUTALIST_DEFAULTS.brutalistBorderColor),
    brutalistShadow: pickNum('brutalistShadow', BRUTALIST_DEFAULTS.brutalistShadow),
    brutalistHalftone: pickBool('brutalistHalftone', BRUTALIST_DEFAULTS.brutalistHalftone),
    brutalistTail: pickBool('brutalistTail', BRUTALIST_DEFAULTS.brutalistTail),
    brutalistItalic: pickBool('brutalistItalic', BRUTALIST_DEFAULTS.brutalistItalic),
    brutalistUppercase: pickBool('brutalistUppercase', BRUTALIST_DEFAULTS.brutalistUppercase),
    brutalistInline: pickBool('brutalistInline', BRUTALIST_DEFAULTS.brutalistInline),
  };
}
