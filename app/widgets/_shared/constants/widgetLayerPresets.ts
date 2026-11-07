// Katalog widget yang bisa dipakai sebagai layer di Custom Overlay.
// Tiap layer di-render sebagai iframe ke halaman display widget aslinya, jadi
// tampilan & datanya 100% sama dengan widget standalone.
//
// `params` = nilai awal query yang dikirim ke display. Sengaja hanya berisi
// setting penting; sisanya mengikuti default widget masing-masing. User bisa
// menambah/menimpa param lain lewat panel "Advanced params" di editor.

import { WIDGET_CATEGORY_ORDER, type WidgetCategory, type WidgetKey } from '@/lib/auth/widgets';
import { WIDGET_FONTS } from './fonts';
import { WIDGET_POSITIONS } from './positions';

export type WidgetLayerKey = Exclude<WidgetKey, 'custom'>;

export type WidgetFieldOption = { value: string; label: string };

export type WidgetField =
  | { key: string; label: string; type: 'text' | 'color'; placeholder?: string }
  | { key: string; label: string; type: 'number'; min?: number; max?: number; step?: number }
  | { key: string; label: string; type: 'bool' }
  | { key: string; label: string; type: 'select'; options: WidgetFieldOption[] };

export type WidgetLayerPreset = {
  key: WidgetLayerKey;
  title: string;
  category: WidgetCategory;
  /** Path display widget (iframe target). */
  path: string;
  /** Ukuran awal layer (% dari canvas 1920x1080). */
  size: { w: number; h: number };
  /** Query awal (string, biar gampang di-serialize ke URL). */
  params: Record<string, string>;
  fields: WidgetField[];
};

const o = (value: string, label: string): WidgetFieldOption => ({ value, label });

const themes = (list: [string, string][]): WidgetField => ({
  key: 'theme',
  label: 'Tema',
  type: 'select',
  options: list.map(([value, label]) => o(value, label)),
});

const pos = (): WidgetField => ({
  key: 'pos',
  label: 'Posisi di layer',
  type: 'select',
  options: WIDGET_POSITIONS.map((p) => o(p.value, p.label)),
});

const font = (): WidgetField => ({
  key: 'font',
  label: 'Font',
  type: 'select',
  options: WIDGET_FONTS.map((f) => o(f, f)),
});

const fontSize = (min = 10, max = 72): WidgetField => ({ key: 'fontSize', label: 'Font size', type: 'number', min, max });

const accent = (): WidgetField => ({ key: 'accent', label: 'Accent', type: 'color' });

const bool = (key: string, label: string): WidgetField => ({ key, label, type: 'bool' });
const num = (key: string, label: string, min?: number, max?: number, step?: number): WidgetField => ({ key, label, type: 'number', min, max, step });
const text = (key: string, label: string, placeholder?: string): WidgetField => ({ key, label, type: 'text', placeholder });
const select = (key: string, label: string, options: WidgetFieldOption[]): WidgetField => ({ key, label, type: 'select', options });

const CHAT_THEMES: [string, string][] = [
  ['standard', 'Standard - Dark Glass'],
  ['boxed', 'Boxed - Card dengan Header'],
  ['bubble', 'Bubble - Putih WA-style'],
  ['clean', 'Clean - Baris Minimalis'],
  ['cute', 'Cute - Lavender Pastel'],
  ['perchar', 'Per-Char - Bubble + Huruf Mengetik'],
  ['plain', 'Plain'],
  ['brutalist', 'Brutalist'],
];

const TIMER_THEMES: [string, string][] = [
  ['focus', 'Focus'], ['subathon', 'Subathon'], ['glass', 'Glass'], ['minimal', 'Minimal'],
  ['plain', 'Plain'], ['brutalist', 'Brutalist'], ['flatline', 'Flatline - Sticker'],
];

const POLL_THEMES: [string, string][] = [
  ['bar', 'Bar Horizontal'], ['card', 'Cards'], ['donut', 'Donut'], ['minimal', 'Minimal'],
  ['anime', 'Anime'], ['flower', 'Flower Timer'], ['editorial', 'Editorial'],
  ['plain', 'Plain'], ['brutalist', 'Brutalist'], ['esports', 'Esports - Audience Poll'],
];

const MEDIA_THEMES: [string, string][] = [
  ['standard', 'Standard'], ['matte', 'Matte (Light)'], ['matte-dark', 'Matte (Dark)'],
  ['compact', 'Compact'], ['compact-inverted', 'Compact (Inverted)'], ['simple', 'Simple'],
  ['classic', 'Classic'], ['card', 'Card'], ['album-art', 'Album Art'],
  ['large-album-art', 'Large Album Art'], ['vinyl', 'Vinyl'], ['vinyl-disc', 'Vinyl Disc'],
  ['color-palette', 'Color Palette'], ['plain', 'Plain'], ['brutalist', 'Brutalist'], ['retro8bit', 'Retro 8-Bit'],
];

const LYRICS_THEMES: [string, string][] = [
  ['standard', 'Standard'], ['matte', 'Matte (Light)'], ['matte-dark', 'Matte (Dark)'],
  ['compact', 'Compact'], ['compact-inverted', 'Compact (Inverted)'], ['simple', 'Simple'],
  ['classic', 'Classic'], ['card', 'Card'], ['album-art', 'Album Art'], ['vinyl', 'Vinyl'],
  ['color-palette', 'Color Palette'], ['plain', 'Plain'], ['brutalist', 'Brutalist'],
];

const MUSIC_THEMES: [string, string][] = [
  ['standard', 'Standard - Now Playing'], ['minimal', 'Minimal - Judul Saja'], ['classic', 'Classic'],
  ['matte', 'Matte'], ['mattedark', 'Matte Dark'], ['compact', 'Compact'],
  ['compactinverted', 'Compact Inverted'], ['simple', 'Simple'], ['card', 'Card'],
  ['vinyl', 'Vinyl'], ['vinyl-disc', 'Vinyl Disc'], ['color-palette', 'Color Palette'],
  ['brutalist', 'Brutalist'], ['retro8bit', 'Retro 8-Bit'],
];

export const WIDGET_LAYER_PRESETS: WidgetLayerPreset[] = [
  {
    key: 'chat', title: 'Chat Overlay', category: 'chat', path: '/widgets/chat/display',
    size: { w: 28, h: 42 },
    params: { theme: 'standard', pos: 'center', maxMessages: '8', fontSize: '14' },
    fields: [themes(CHAT_THEMES), font(), fontSize(), accent(), num('maxMessages', 'Max pesan', 1, 30), bool('showAvatar', 'Avatar'), bool('showPlatform', 'Platform'), bool('showTimestamp', 'Timestamp'), bool('showBadges', 'Badges'), pos()],
  },
  {
    key: 'pinned', title: 'Pinned Chat', category: 'chat', path: '/widgets/pinned/display',
    size: { w: 30, h: 14 },
    params: { theme: 'standard', pos: 'center', fontSize: '15' },
    fields: [themes([['standard', 'Standard - Dark Glass'], ['minimal', 'Minimal'], ['perchar', 'Per-Char'], ['monkey', 'Monkey - Keyboard'], ['island', 'Island - Dynamic Island'], ['plain', 'Plain'], ['brutalist', 'Brutalist']]), font(), fontSize(), accent(), bool('showAvatar', 'Avatar'), bool('showPlatform', 'Platform'), pos()],
  },
  {
    key: 'speak', title: 'Speak AI', category: 'chat', path: '/widgets/speak/display',
    size: { w: 30, h: 16 },
    params: { theme: 'standard', pos: 'center', fontSize: '15' },
    fields: [themes([['standard', 'Standard - Dark Glass'], ['minimal', 'Minimal'], ['perchar', 'Per-Char'], ['monkey', 'Monkey - Keyboard'], ['island', 'Island - Dynamic Island'], ['plain', 'Plain'], ['brutalist', 'Brutalist']]), font(), fontSize(), accent(), bool('showAvatar', 'Avatar'), bool('showPlatform', 'Platform'), pos()],
  },
  {
    key: 'event', title: 'Event Overlay', category: 'alert', path: '/widgets/event/display',
    size: { w: 30, h: 22 },
    params: { theme: 'standard', pos: 'center', fontSize: '14' },
    fields: [themes([['standard', 'Standard - Card'], ['minimal', 'Minimal - Pill'], ['cute', 'Cute - Lavender Pastel'], ['perchar', 'Per-Char'], ['plain', 'Plain'], ['brutalist', 'Brutalist'], ['alert', 'Alert - Twitch Wipe']]), font(), fontSize(), accent(), select('anim', 'Animasi masuk', [o('elegant', 'Elegant'), o('softPop', 'Soft Pop'), o('blur', 'Blur In'), o('luxe', 'Luxe'), o('slideUp', 'Slide Up'), o('slideLeft', 'Slide Left'), o('slideRight', 'Slide Right'), o('pop', 'Pop'), o('fade', 'Fade'), o('flip', 'Flip')]), pos()],
  },
  {
    key: 'follow', title: 'Follow Overlay', category: 'alert', path: '/widgets/follow/display',
    size: { w: 30, h: 22 },
    params: { theme: 'standard', pos: 'center', fontSize: '14' },
    fields: [themes([['standard', 'Standard'], ['minimal', 'Minimal'], ['cute', 'Cute'], ['plain', 'Plain'], ['brutalist', 'Brutalist'], ['alert', 'Alert - Twitch Wipe']]), font(), fontSize(), accent(), select('anim', 'Animasi masuk', [o('elegant', 'Elegant'), o('softPop', 'Soft Pop'), o('blur', 'Blur In'), o('luxe', 'Luxe'), o('slideUp', 'Slide Up'), o('slideLeft', 'Slide Left'), o('slideRight', 'Slide Right'), o('pop', 'Pop'), o('fade', 'Fade'), o('flip', 'Flip')]), pos()],
  },
  {
    key: 'timer', title: 'Timer', category: 'progress', path: '/widgets/timer/display',
    size: { w: 22, h: 12 },
    params: { theme: 'focus', pos: 'center', fontSize: '14' },
    fields: [themes(TIMER_THEMES), font(), fontSize(), accent(), bool('showProgress', 'Progress bar'), pos()],
  },
  {
    key: 'task', title: 'Task List', category: 'progress', path: '/widgets/task/display',
    size: { w: 28, h: 32 },
    params: { theme: 'focus', pos: 'center', fontSize: '14' },
    fields: [themes([['focus', 'Focus'], ['glass', 'Glass'], ['minimal', 'Minimal'], ['plain', 'Plain'], ['brutalist', 'Brutalist'], ['flatline', 'Flatline - Pill']]), font(), fontSize(), accent(), pos()],
  },
  {
    key: 'poll', title: 'Poll Widget', category: 'progress', path: '/widgets/poll/display',
    size: { w: 30, h: 26 },
    params: { theme: 'bar', pos: 'center', accent: '#8b5cf6' },
    fields: [themes(POLL_THEMES), font(), accent(), bool('showPercent', 'Persen'), bool('showCount', 'Jumlah vote'), bool('showTotal', 'Total vote'), bool('showTimer', 'Timer'), pos()],
  },
  {
    key: 'games', title: 'Games - Trivia', category: 'progress', path: '/widgets/games/display',
    size: { w: 42, h: 32 },
    params: { pos: 'center', lang: 'auto', topic: 'BENDERA', questionSec: '15', totalQuestions: '10' },
    fields: [
      text('topic', 'Topik', 'BENDERA / SEJARAH / DUNIA'),
      select('lang', 'Bahasa', [o('auto', 'Auto'), o('id', 'Indonesia'), o('en', 'English')]),
      accent(), font(), num('questionSec', 'Detik per soal', 5, 120), num('totalQuestions', 'Total soal', 1, 50), num('maxGuesses', 'Max tebakan', 1, 10), bool('topicVote', 'Vote topik'), bool('showFacts', 'Fakta'), bool('showPercent', 'Persen'), bool('showLiveBoard', 'Live board'), pos(),
    ],
  },
  {
    key: 'goals', title: 'Goals', category: 'progress', path: '/widgets/goals/display',
    size: { w: 30, h: 20 },
    params: { theme: 'standard', pos: 'center', fontSize: '16', goalType: 'follow' },
    fields: [
      themes([['standard', 'Standard - Card'], ['minimal', 'Minimal - Bar'], ['plain', 'Plain'], ['passion', 'Passion'], ['brutalist', 'Brutalist'], ['neonbar', 'Neon Bar']]),
      select('goalType', 'Tipe goal', [o('follow', 'Followers'), o('subs', 'Subscribers'), o('like', 'Likes'), o('donation', 'Donasi (Rp)')]),
      font(), fontSize(), accent(), num('target', 'Target', 0), num('current', 'Progress awal', 0), pos(),
    ],
  },
  {
    key: 'donation-leaderboard', title: 'Donation Leaderboard', category: 'progress', path: '/widgets/donation-leaderboard/display',
    size: { w: 30, h: 32 },
    params: { theme: 'standard', pos: 'center', fontSize: '16', limit: '5' },
    fields: [
      themes([['standard', 'Standard - List Card'], ['minimal', 'Minimal - Bar'], ['brutalist', 'Brutalist']]),
      text('title', 'Judul'), font(), fontSize(), accent(), num('limit', 'Jumlah baris', 1, 20),
      select('period', 'Periode', [o('today', 'Hari ini'), o('week', 'Minggu ini'), o('month', 'Bulan ini'), o('all', 'Semua')]),
      bool('showAmount', 'Nominal'), bool('showPlatform', 'Platform'), bool('showAvatar', 'Avatar'), pos(),
    ],
  },
  {
    key: 'clock', title: 'Clock Widget', category: 'info', path: '/widgets/clock/display',
    size: { w: 22, h: 12 },
    params: { theme: 'standard', pos: 'center', accent: '#FFE600' },
    fields: [themes([['standard', 'Standard - Clean'], ['brutalist', 'Brutalist']]), font(), accent(), text('tz', 'Timezone', 'Asia/Jakarta'), pos()],
  },
  {
    key: 'media-player', title: 'Media Player', category: 'info', path: '/widgets/media-player/display',
    size: { w: 34, h: 20 },
    params: { theme: 'classic', pos: 'center', fontSize: '20', maxWidth: '500' },
    fields: [
      themes(MEDIA_THEMES), font(), fontSize(), num('maxWidth', 'Max width (px, 0 = full)', 0, 1920),
      bool('showAlbumArt', 'Album art'), bool('showProgressBar', 'Progress bar'), bool('swapArtistTrack', 'Tukar artis/judul'),
      text('smtcBridgeAddress', 'SMTC bridge address', '127.0.0.1'), text('smtcBridgePort', 'SMTC bridge port', '5000'), pos(),
    ],
  },
  {
    key: 'lyrics', title: 'Lyrics', category: 'info', path: '/widgets/lyrics/display',
    size: { w: 38, h: 24 },
    params: { theme: 'standard', pos: 'center', source: 'music', maxLyricsLines: '3' },
    fields: [
      themes(LYRICS_THEMES),
      select('source', 'Sumber', [o('music', 'Song Request (socket)'), o('smtc', 'Media Player (SMTC)')]),
      font(), num('lyricsFontSize', 'Font lirik', 10, 72), num('maxLyricsLines', 'Max baris', 1, 12),
      select('lyricsAlign', 'Rata teks', [o('left', 'Left'), o('center', 'Center'), o('right', 'Right')]),
      bool('lrclibEnabled', 'Ambil dari LRCLIB'), pos(),
    ],
  },
  {
    key: 'info-slides', title: 'Info Slides', category: 'info', path: '/widgets/info-slides/display',
    size: { w: 34, h: 24 },
    params: { theme: 'clean', pos: 'center', fontSize: '14', duration: '6' },
    fields: [themes([['clean', 'Clean'], ['boxed', 'Boxed'], ['glass', 'Glass'], ['timer-glass', 'Timer Glass'], ['plain', 'Plain'], ['brutalist', 'Brutalist'], ['esports', 'Esports - Gold Panel']]), font(), fontSize(), accent(), num('duration', 'Durasi slide (detik)', 2, 60), bool('autoRotate', 'Auto rotate'), bool('showProgress', 'Progress'), pos()],
  },
  {
    key: 'ticker', title: 'Ticker', category: 'info', path: '/widgets/ticker/display',
    size: { w: 70, h: 9 },
    params: { theme: 'standard', pos: 'center', direction: 'left', speed: '20' },
    fields: [
      themes([['standard', 'Standard'], ['clean', 'Clean'], ['neon', 'Neon'], ['brutalist', 'Brutalist']]),
      font(), fontSize(), accent(),
      select('direction', 'Arah', [o('left', 'Kiri'), o('right', 'Kanan')]),
      num('speed', 'Kecepatan (detik/putaran)', 5, 120),
      text('items', 'Teks (pisahkan dengan \\n)'), bool('showBadge', 'Badge'), text('badgeText', 'Teks badge'), pos(),
    ],
  },
  {
    key: 'social-rotator', title: 'Social Rotator', category: 'info', path: '/widgets/social-rotator/display',
    size: { w: 32, h: 10 },
    params: { theme: 'pill', pos: 'center', fontSize: '14', duration: '4' },
    fields: [themes([['pill', 'Pill'], ['clean', 'Clean'], ['glass', 'Glass'], ['boxed', 'Boxed'], ['badge', 'Badge'], ['plain', 'Plain'], ['brutalist', 'Brutalist'], ['esports', 'Esports']]), font(), fontSize(), accent(), num('duration', 'Durasi per sosial (detik)', 1, 60), pos()],
  },
  {
    key: 'view-counter', title: 'View Counter', category: 'info', path: '/widgets/view-counter/display',
    size: { w: 22, h: 10 },
    params: { theme: 'standard', pos: 'center', fontSize: '28' },
    fields: [themes([['standard', 'Standard - Card'], ['minimal', 'Minimal'], ['cute', 'Cute'], ['music', 'Music - Viewers + Queue'], ['brutalist', 'Brutalist']]), font(), fontSize(), accent(), bool('showLabel', 'Label'), bool('showBreakdown', 'Breakdown platform'), bool('inline', 'Inline'), pos()],
  },
  {
    key: 'music', title: 'Music / Song Request', category: 'info', path: '/widgets/music/display',
    size: { w: 36, h: 20 },
    params: { theme: 'standard', pos: 'center', showQueue: '1', showProgress: '1', maxQueue: '5', queuePos: 'bottom' },
    fields: [
      themes(MUSIC_THEMES), font(), fontSize(), accent(),
      bool('showQueue', 'Queue'), num('maxQueue', 'Max queue', 1, 10), bool('showProgress', 'Progress bar'),
      select('queuePos', 'Posisi queue', [o('bottom', 'Bawah'), o('top', 'Atas'), o('left', 'Kiri'), o('right', 'Kanan')]),
      bool('autoColor', 'Auto color dari thumbnail'), bool('colorText', 'Judul ikut accent'), bool('paletteLabels', 'Label palette'), pos(),
    ],
  },
  {
    key: 'qr', title: 'QR Code', category: 'info', path: '/widgets/qr/display',
    size: { w: 16, h: 26 },
    params: { theme: 'standard', pos: 'center', fontSize: '16', size: '200' },
    fields: [themes([['standard', 'Standard - Card'], ['bubble', 'Bubble'], ['clean', 'Clean'], ['boxed', 'Boxed'], ['minimal', 'Minimal'], ['cute', 'Cute'], ['plain', 'Plain'], ['brutalist', 'Brutalist']]), text('value', 'Isi QR / URL'), text('label', 'Label'), font(), fontSize(), accent(), num('size', 'Ukuran QR (px)', 80, 600), bool('showLabel', 'Tampilkan label'), pos()],
  },
  {
    key: 'heartrate', title: 'Heartrate', category: 'info', path: '/widgets/heartrate/display',
    size: { w: 20, h: 10 },
    params: { theme: 'standard', pos: 'center', fontSize: '32' },
    fields: [themes([['standard', 'Standard - Card'], ['minimal', 'Minimal'], ['pill', 'Pill'], ['bar', 'Bar'], ['brutalist', 'Brutalist'], ['glass', 'Glass']]), font(), fontSize(), accent(), pos()],
  },
  {
    key: 'valorant', title: 'Valorant Rank', category: 'info', path: '/widgets/valorant/display',
    size: { w: 26, h: 20 },
    params: { theme: 'auto', pos: 'center' },
    fields: [
      themes([['auto', 'Auto - ikut warna rank'], ['custom', 'Custom - pakai accent'], ['brutalist', 'Brutalist'], ['pastel', 'Pastel']]),
      text('username', 'Riot ID'), text('tag', 'Tagline'), text('region', 'Region', 'ap'),
      select('platform', 'Platform', [o('pc', 'PC'), o('console', 'Console')]),
      select('view', 'Tampilan', [o('regular', 'Regular'), o('mini', 'Mini'), o('circle', 'Circle')]),
      font(), accent(), num('refresh', 'Refresh (detik)', 0, 600), pos(),
    ],
  },
];

const PRESET_MAP = new Map(WIDGET_LAYER_PRESETS.map((p) => [p.key, p]));

/**
 * localStorage key tempat halaman setting tiap widget menyimpan state-nya.
 * Dipakai untuk menyamakan layer dengan setting widget aslinya (tanpa rebuild UI).
 */
export const WIDGET_SETTINGS_KEYS: Record<WidgetLayerKey, string> = {
  chat: 'chat-settings',
  pinned: 'pinned-settings',
  speak: 'speak-settings',
  event: 'event-settings',
  follow: 'follow-settings',
  timer: 'timer-settings',
  task: 'task-settings',
  poll: 'poll-settings',
  games: 'games-settings',
  goals: 'goals-settings',
  'donation-leaderboard': 'donation-leaderboard-settings',
  clock: 'clock-settings',
  'media-player': 'media-player-settings',
  lyrics: 'lyrics-settings',
  'info-slides': 'info-slides-settings',
  ticker: 'ticker-settings',
  'social-rotator': 'social-rotator-settings',
  'view-counter': 'view-counter-settings',
  music: 'music-settings',
  qr: 'qr-settings',
  heartrate: 'heartrate-settings',
  valorant: 'valorant-settings',
};

export function getWidgetSettingsKey(key: string | undefined | null): string | null {
  if (!key) return null;
  return WIDGET_SETTINGS_KEYS[key as WidgetLayerKey] || null;
}

/** localStorage key per layer (namespace) - dua layer widget sama tetap beda setting. */
export function layerSettingsKey(widgetKey: string | undefined | null, layerId?: string | null): string | null {
  const base = getWidgetSettingsKey(widgetKey);
  if (!base) return null;
  return layerId ? `${base}::${layerId}` : base;
}

/**
 * Salin setting widget global ke namespace layer saat layer pertama dibuat.
 * Jadi layer baru mulai dari tampilan widget yang sekarang, lalu bisa beda sendiri.
 */
export function seedWidgetLayerSettings(widgetKey: string | undefined | null, layerId: string | undefined | null): void {
  if (typeof window === 'undefined' || !layerId) return;
  const base = getWidgetSettingsKey(widgetKey);
  const target = layerSettingsKey(widgetKey, layerId);
  if (!base || !target) return;
  try {
    if (localStorage.getItem(target) !== null) return;
    const raw = localStorage.getItem(base);
    if (raw !== null) localStorage.setItem(target, raw);
  } catch {}
}

/**
 * Ubah state setting widget (object dari localStorage) jadi query params.
 * Scalar saja: boolean → 1/0, number/string apa adanya. Object/array dilewati
 * karena display widget tidak menerimanya lewat URL.
 */
export function settingsToParams(state: unknown): Record<string, string> {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(state as Record<string, unknown>)) {
    if (v === null || v === undefined || v === '') continue;
    const t = typeof v;
    if (t === 'string') out[k] = v as string;
    else if (t === 'number') out[k] = String(v);
    else if (t === 'boolean') out[k] = v ? '1' : '0';
  }
  return out;
}

/** Snapshot setting widget yang tersimpan di browser (null kalau belum pernah disimpan).
 *  Kalau `layerId` diisi: pakai namespace layer, fallback ke setting global widget. */
export function readWidgetSettingsParams(
  key: string | undefined | null,
  layerId?: string | null,
): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  const baseKey = getWidgetSettingsKey(key);
  if (!baseKey) return null;
  const layerKey = layerSettingsKey(key, layerId);
  try {
    const raw = (layerKey ? localStorage.getItem(layerKey) : null) ?? localStorage.getItem(baseKey);
    if (!raw) return null;
    return settingsToParams(JSON.parse(raw));
  } catch {
    return null;
  }
}


export function getWidgetLayerPreset(key: string | undefined | null): WidgetLayerPreset | null {
  if (!key) return null;
  return PRESET_MAP.get(key as WidgetLayerKey) || null;
}

export function getWidgetsByCategory(): { category: WidgetCategory; items: WidgetLayerPreset[] }[] {
  return WIDGET_CATEGORY_ORDER.map((category) => ({
    category,
    items: WIDGET_LAYER_PRESETS.filter((p) => p.category === category),
  })).filter((g) => g.items.length > 0);
}

/** Hanya param yang berbeda dari preset (biar URL OBS tetap pendek). */
export function compactWidgetParams(key: string, params: Record<string, string> | undefined): Record<string, string> {
  const preset = getWidgetLayerPreset(key);
  if (!preset || !params) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === '' || v === undefined || v === null) continue;
    if (preset.params[k] === v) continue;
    out[k] = v;
  }
  return out;
}

/**
 * URL iframe untuk satu widget layer.
 * - merged: preset.params (default) ditimpa `params` layer.
 * - privateKey: room socket (key widget) supaya data live masuk.
 * - obs: transparan + siap untuk OBS.
 * - muted: bisukan audio (dipakai di editor agar tidak kaget).
 * - simulate: tampilkan data demo (untuk layout di editor).
 */
export function buildWidgetLayerSrc(
  key: string,
  params: Record<string, string> | undefined,
  opts: { privateKey?: string; obs?: boolean; muted?: boolean; simulate?: boolean } = {},
): string {
  const preset = getWidgetLayerPreset(key);
  if (!preset) return 'about:blank';
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(preset.params)) {
    if (v !== '') q.set(k, v);
  }
  for (const [k, v] of Object.entries(params || {})) {
    if (v === '' || v === undefined || v === null) continue;
    q.set(k, String(v));
  }
  if (opts.privateKey) q.set('key', opts.privateKey);
  if (opts.obs) q.set('obs', '1');
  if (opts.muted) q.set('muted', '1');
  if (opts.simulate) q.set('simulate', '1');
  return `${preset.path}?${q.toString()}`;
}
