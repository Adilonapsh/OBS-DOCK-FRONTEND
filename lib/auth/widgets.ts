import type { Role } from './roles';

/**
 * Katalog widget = daftar widget yang bisa diatur aksesnya per user.
 * Key harus sama dengan folder di `app/widgets/<key>` dan `id` di halaman
 * daftar widget.
 */
export const WIDGET_CATALOG = [
  { key: 'chat', title: 'Chat Overlay', category: 'chat' },
  { key: 'pinned', title: 'Pinned Chat', category: 'chat' },
  { key: 'speak', title: 'Speak AI', category: 'chat' },
  { key: 'event', title: 'Event Overlay', category: 'alert' },
  { key: 'follow', title: 'Follow Overlay', category: 'alert' },
  { key: 'timer', title: 'Timer', category: 'progress' },
  { key: 'task', title: 'Task List', category: 'progress' },
  { key: 'poll', title: 'Poll Widget', category: 'progress' },
  { key: 'games', title: 'Games - Trivia', category: 'progress' },
  { key: 'goals', title: 'Goals', category: 'progress' },
  { key: 'donation-leaderboard', title: 'Donation Leaderboard', category: 'progress' },
  { key: 'clock', title: 'Clock Widget', category: 'info' },
  { key: 'media-player', title: 'Media Player', category: 'info' },
  { key: 'lyrics', title: 'Lyrics', category: 'info' },
  { key: 'info-slides', title: 'Info Slides', category: 'info' },
  { key: 'ticker', title: 'Ticker', category: 'info' },
  { key: 'social-rotator', title: 'Social Rotator', category: 'info' },
  { key: 'view-counter', title: 'View Counter', category: 'info' },
  { key: 'music', title: 'Music Request', category: 'info' },
  { key: 'qr', title: 'QR Code', category: 'info' },
  { key: 'heartrate', title: 'Heartrate', category: 'info' },
  { key: 'valorant', title: 'Valorant Rank', category: 'info' },
  { key: 'custom', title: 'Custom Overlay', category: 'minimal' },
] as const;

export type WidgetKey = (typeof WIDGET_CATALOG)[number]['key'];
export type WidgetCategory = (typeof WIDGET_CATALOG)[number]['category'];

export const WIDGET_KEYS: readonly WidgetKey[] = WIDGET_CATALOG.map(
  (widget) => widget.key
);

export const WIDGET_CATEGORY_LABELS: Record<WidgetCategory, string> = {
  chat: 'Chat & Interaksi',
  alert: 'Alert',
  progress: 'Progress & Games',
  info: 'Informasi',
  minimal: 'Custom',
};

export const WIDGET_CATEGORY_ORDER: readonly WidgetCategory[] = [
  'chat',
  'alert',
  'progress',
  'info',
  'minimal',
];

/** Override per user dari tabel `user_widget_permissions`. */
export type WidgetOverrides = Partial<Record<WidgetKey, boolean>>;

/** Hasil akhir akses widget setelah role default + override. */
export type WidgetAccessMap = Record<WidgetKey, boolean>;

export function isWidgetKey(value: unknown): value is WidgetKey {
  return (
    typeof value === 'string' &&
    (WIDGET_KEYS as readonly string[]).includes(value)
  );
}

export function getWidget(key: WidgetKey) {
  return WIDGET_CATALOG.find((widget) => widget.key === key);
}

/**
 * Default akses widget per role:
 * - admin & user: semua widget boleh
 * - guest: tidak punya akses widget settings sama sekali
 */
export const DEFAULT_WIDGET_ACCESS_BY_ROLE: Record<Role, boolean> = {
  guest: false,
  user: true,
  admin: true,
};

export function defaultWidgetAccess(role: Role): boolean {
  return DEFAULT_WIDGET_ACCESS_BY_ROLE[role];
}

/**
 * Gabungkan default role dengan override per user.
 * Admin selalu mendapat semua widget (tidak bisa dibatasi, mencegah lockout).
 * Override yang tidak ada berarti warisi default role.
 */
export function resolveWidgetAccess(
  role: Role,
  overrides: WidgetOverrides = {}
): WidgetAccessMap {
  const map = {} as WidgetAccessMap;

  for (const key of WIDGET_KEYS) {
    map[key] =
      role === 'admin'
        ? true
        : typeof overrides[key] === 'boolean'
          ? (overrides[key] as boolean)
          : defaultWidgetAccess(role);
  }

  return map;
}

export function canAccessWidget(
  role: Role,
  overrides: WidgetOverrides,
  key: WidgetKey
): boolean {
  return resolveWidgetAccess(role, overrides)[key] ?? false;
}

/**
 * Ambil key widget dari path settings, mis. `/widgets/chat`.
 * Sub-route `/widgets/chat/display` TIDAK termasuk (itu overlay publik).
 */
export function getWidgetSettingsKey(pathname: string): WidgetKey | null {
  const match = pathname.match(/^\/widgets\/([^/]+)\/?$/);
  const key = match?.[1];

  return key && isWidgetKey(key) ? key : null;
}
