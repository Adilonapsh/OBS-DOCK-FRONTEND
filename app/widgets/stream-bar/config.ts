import { WIDGET_FONTS } from '../_shared/constants/fonts';
import type { StreamBarGoal, StreamBarRule } from './themes/types';

// AUTO-REGISTER: daftar theme dibaca dari themes/registry.tsx (generated).
// Tambah theme baru cukup buat file themes/NamaTema.tsx + themeMeta.
export { STREAM_BAR_THEME_OPTIONS as STREAM_BAR_THEMES } from './themes/registry';

export const STREAM_BAR_FONTS = WIDGET_FONTS;

export const STREAM_BAR_ACTIVITY_PRESETS = [
  { value: 'chatting', label: 'Just Chatting' },
  { value: 'sketch', label: 'Sketch / Art' },
  { value: 'building', label: 'Building / Dev' },
  { value: 'study', label: 'Study' },
  { value: 'music', label: 'Music Production' },
  { value: 'irl', label: 'IRL' },
  { value: 'variety', label: 'Variety' },
] as const;

export const STREAM_BAR_RULE_ICONS = [
  { value: 'none', label: 'Tanpa ikon' },
  { value: 'follow', label: 'Follow' },
  { value: 'shield', label: 'Shield / Rules' },
  { value: 'heart', label: 'Heart' },
] as const;

export const STREAM_BAR_GOAL_KINDS = [
  { value: 'follow', label: 'Followers (live)' },
  { value: 'subs', label: 'Subscribers (live)' },
  { value: 'likes', label: 'Likes (live)' },
  { value: 'donation', label: 'Donasi (live)' },
  { value: 'custom', label: 'Manual / statis' },
] as const;

export const STREAM_BAR_GOAL_FORMATS = [
  { value: 'num', label: 'Angka (1.000)' },
  { value: 'rp', label: 'Rupiah (Rp 1.000)' },
] as const;

export const STREAM_BAR_DEFAULT_RULES: StreamBarRule[] = [
  { icon: 'none', html: 'Stay comfy' },
  { icon: 'follow', html: 'New here? Hit <b>follow</b> so you never miss a stream' },
  { icon: 'shield', html: 'Be kind, have fun, no spoilers please' },
  { icon: 'heart', html: 'Thanks for hanging out with us!' },
];

export const STREAM_BAR_DEFAULT_GOALS: StreamBarGoal[] = [
  { label: 'Follower goal', current: 0, target: 25, next: 50, unit: 'followers', fmt: 'num', kind: 'follow' },
  { label: 'Donation goal', current: 0, target: 500000, next: 1000000, unit: '', fmt: 'rp', kind: 'donation' },
  { label: 'Subscribe goal', current: 0, target: 10, next: 25, unit: 'subs', fmt: 'num', kind: 'subs' },
];

export type StreamBarSettings = {
  pos: string;
  theme: string;
  font: string;
  accent: string;

  welcomeLabel: string;
  welcomeTitle: string;
  welcomeSub: string;
  rules: StreamBarRule[];

  activityPreset: string;
  activityTitle: string;
  activitySub: string;
  activityImage: string;

  gameActive: boolean;
  gameName: string;
  gameGenre: string;
  gameCover: string;

  // Kosong = ikut durasi OBS dari dock (fallback: sejak overlay dibuka).
  start: string;
  viewers: number;

  goalStyle: 'radial' | 'bar';
  goalRotateMs: number;
  goals: StreamBarGoal[];

  alertMs: number;
  demo: boolean;
};

export const STREAM_BAR_DEFAULTS: StreamBarSettings = {
  pos: 'center',
  theme: 'standard',
  font: 'Outfit',
  accent: '#3fe0c8',

  welcomeLabel: 'Welcome',
  welcomeTitle: 'Welcome in!',
  welcomeSub: 'Grab a drink and make yourself at home',
  rules: STREAM_BAR_DEFAULT_RULES,

  activityPreset: 'chatting',
  activityTitle: '',
  activitySub: '',
  activityImage: '',

  gameActive: false,
  gameName: 'Valorant',
  gameGenre: 'Tactical shooter',
  gameCover: 'https://static-cdn.jtvnw.net/ttv-boxart/516575-144x192.jpg',

  start: '',
  viewers: 0,

  goalStyle: 'radial',
  goalRotateMs: 6000,
  goals: STREAM_BAR_DEFAULT_GOALS,

  alertMs: 7000,
  demo: false,
};

export function parseStreamBarRules(raw: string | null | undefined): StreamBarRule[] {
  if (!raw) return STREAM_BAR_DEFAULT_RULES;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return STREAM_BAR_DEFAULT_RULES;
    const rows = parsed
      .map((row) => row as Partial<StreamBarRule>)
      .filter((row) => typeof row.html === 'string' && row.html.trim() !== '')
      .map((row) => ({
        icon: (['none', 'follow', 'shield', 'heart'].includes(String(row.icon)) ? row.icon : 'none') as StreamBarRule['icon'],
        html: String(row.html),
      }));
    // Daftar kosong yang dikirim eksplisit (mis. user menghapus semua rule)
    // tetap dihormati; default hanya dipakai kalau param tidak ada.
    return rows;
  } catch {
    return STREAM_BAR_DEFAULT_RULES;
  }
}

export function parseStreamBarGoals(raw: string | null | undefined): StreamBarGoal[] {
  if (!raw) return STREAM_BAR_DEFAULT_GOALS;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return STREAM_BAR_DEFAULT_GOALS;
    const kinds = ['follow', 'subs', 'likes', 'donation', 'custom'];
    const rows = parsed
      .map((row) => row as Partial<StreamBarGoal>)
      .filter((row) => typeof row.label === 'string' && row.label.trim() !== '')
      .map((row) => ({
        label: String(row.label),
        current: Math.max(0, Math.floor(Number(row.current) || 0)),
        target: Math.max(1, Math.floor(Number(row.target) || 1)),
        next: Math.max(0, Math.floor(Number(row.next) || 0)),
        unit: String(row.unit || ''),
        fmt: (row.fmt === 'rp' ? 'rp' : 'num') as StreamBarGoal['fmt'],
        kind: (kinds.includes(String(row.kind)) ? row.kind : 'custom') as StreamBarGoal['kind'],
      }));
    return rows;
  } catch {
    return STREAM_BAR_DEFAULT_GOALS;
  }
}

export function buildStreamBarUrl(base: string, s: StreamBarSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('accent', s.accent);
  p.set('pos', s.pos || 'center');

  p.set('welcomeLabel', s.welcomeLabel);
  p.set('welcomeTitle', s.welcomeTitle);
  p.set('welcomeSub', s.welcomeSub);
  p.set('rules', JSON.stringify(s.rules));

  p.set('activity', s.activityPreset);
  if (s.activityTitle) p.set('activityTitle', s.activityTitle);
  if (s.activitySub) p.set('activitySub', s.activitySub);
  if (s.activityImage) p.set('activityImage', s.activityImage);

  p.set('gameActive', s.gameActive ? '1' : '0');
  p.set('gameName', s.gameName);
  if (s.gameGenre) p.set('gameGenre', s.gameGenre);
  if (s.gameCover) p.set('gameCover', s.gameCover);

  if (s.start) p.set('start', s.start);
  p.set('viewers', String(s.viewers));

  p.set('goalStyle', s.goalStyle);
  p.set('goalRotateMs', String(s.goalRotateMs));
  p.set('goals', JSON.stringify(s.goals));

  p.set('alertMs', String(s.alertMs));
  p.set('demo', s.demo ? '1' : '0');
  return `${base}?${p.toString()}`;
}
