// Shared URL param helpers - replaces duplicated getParam/getIntParam/getBoolParam in 5 widgets

export function getStringParam(params: URLSearchParams, key: string, fallback: string): string {
  const v = params.get(key);
  return v === null || v === '' ? fallback : v;
}

export function getIntParam(params: URLSearchParams, key: string, fallback: number): number {
  const v = params.get(key);
  if (v === null || v === '') return fallback;
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

export function getBoolParam(params: URLSearchParams, key: string, fallback: boolean): boolean {
  const v = params.get(key);
  if (v === null) return fallback;
  return v === 'true' || v === '1';
}

// Build widget URL from state + camelCase keys → query string
// Keeps each widget's buildUrl thin: just declare its keys
export function buildWidgetUrl(base: string, state: Record<string, unknown>, stringKeys: string[] = [], boolKeys: string[] = [], intKeys: string[] = [], transparentKeys: string[] = []): string {
  const p = new URLSearchParams();
  for (const k of stringKeys) {
    const v = state[k];
    if (v !== undefined && v !== null && String(v) !== '') p.set(k, String(v));
  }
  for (const k of boolKeys) p.set(k, state[k] ? '1' : '0');
  for (const k of intKeys) p.set(k, String(state[k] ?? 0));
  for (const k of transparentKeys) {
    const v = state[k];
    if (v && v !== 'transparent') p.set(k, String(v));
  }
  return `${base}?${p.toString()}`;
}

export function maskPrivateKey(url: string): string {
  return url.replace(/key=[^&]+/, 'key=••••••••••••••••');
}
