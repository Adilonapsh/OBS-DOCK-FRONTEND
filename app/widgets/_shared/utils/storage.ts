// Shared localStorage + privateKey helpers

export function loadSettings<T>(key: string, defaults: T): T {
  if (typeof window === 'undefined') return defaults;
  const saved = localStorage.getItem(key);
  if (!saved) return defaults;
  try {
    return { ...defaults, ...JSON.parse(saved) };
  } catch {
    return defaults;
  }
}

export function saveSettings<T>(key: string, state: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(state));
}

export function resolvePrivateKey(searchParams: URLSearchParams): string {
  return (
    searchParams.get('key') ||
    searchParams.get('privateKey') ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('dock_private_verified') || '' : '') ||
    ''
  );
}
