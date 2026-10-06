import { WIDGET_FONTS } from '../_shared/constants/fonts';

export const MUSIC_THEMES = [
  { value: 'standard', label: 'Standard - Now Playing' },
  { value: 'minimal', label: 'Minimal - Judul Saja' },
  { value: 'classic', label: 'Classic' },
  { value: 'matte', label: 'Matte' },
  { value: 'mattedark', label: 'Matte Dark' },
  { value: 'compact', label: 'Compact' },
  { value: 'compactinverted', label: 'Compact Inverted' },
  { value: 'simple', label: 'Simple' },
  { value: 'card', label: 'Card' },
  { value: 'vinyl', label: 'Vinyl' },
  { value: 'brutalist', label: 'Brutalist - White Hard Shadow + Halftone' },
] as const;

export const MUSIC_FONTS = WIDGET_FONTS;

export const MUSIC_QUEUE_POS = [
  { value: 'bottom', label: 'Bawah' },
  { value: 'top', label: 'Atas' },
  { value: 'left', label: 'Kiri' },
  { value: 'right', label: 'Kanan' },
] as const;

export const SONG_ROLES = [
  { value: 'all', label: 'Semua User' },
  { value: 'broadcaster', label: 'Broadcaster / Owner' },
  { value: 'mod', label: 'Moderator' },
  { value: 'vip', label: 'VIP' },
  { value: 'sub', label: 'Subscriber / Member' },
  { value: 'follower', label: 'Follower' },
] as const;

export const MUSIC_DEFAULTS = {
  pos: 'bl' as string,
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 16,
  accent: '#22c55e',
  showQueue: true,
  maxQueue: 5,
  showProgress: true,
  command: '!song',
  nsfwFilter: true,
  songBlacklist: '',
  songAllowedRoles: ['all'] as string[],
  queuePos: 'bottom' as string,
  maxWidth: 500,
  verticalAlignment: 'align-to-center' as string,
  textAlignment: 'left' as string,
  useCustomColors: false,
  color1: '#ffffff',
  color2: '#1d1d1d',
  autoHide: false,
  showWhilePaused: true,
  swapArtistTrack: false,
  showPrimary: true,
  showSecondary: true,
  displayDuration: 5,
  showAnimation: 'slide-in-from-bottom' as string,
  hideAnimation: 'slide-out-bottom' as string,
  // Auto color dari thumbnail (ala media-player via node-vibrant).
  autoColor: true as boolean,
  // Judul lagu ikut warna aksen (bukan putih polos).
  colorText: true as boolean,
  // Fade-out saat queue habis (visual + volume audio).
  fadeOut: true as boolean,
  fadeOutMs: 800 as number,
} as const;

export type MusicSettings = typeof MUSIC_DEFAULTS;

export function buildMusicUrl(base: string, s: MusicSettings): string {
  const p = new URLSearchParams();
  p.set('pos', s.pos || 'bl');
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  p.set('showQueue', s.showQueue ? '1' : '0');
  p.set('maxQueue', String(s.maxQueue));
  p.set('showProgress', s.showProgress ? '1' : '0');
  p.set('queuePos', (s as unknown as { queuePos: string }).queuePos || 'bottom');
  p.set('maxWidth', String((s as unknown as { maxWidth: number }).maxWidth ?? 500));
  p.set('verticalAlignment', (s as unknown as { verticalAlignment: string }).verticalAlignment || 'align-to-center');
  p.set('textAlignment', (s as unknown as { textAlignment: string }).textAlignment || 'left');
  p.set('useCustomColors', (s as unknown as { useCustomColors: boolean }).useCustomColors ? '1' : '0');
  if ((s as unknown as { color1: string }).color1) p.set('color1', (s as unknown as { color1: string }).color1);
  if ((s as unknown as { color2: string }).color2) p.set('color2', (s as unknown as { color2: string }).color2);
  p.set('autoHide', (s as unknown as { autoHide: boolean }).autoHide ? '1' : '0');
  p.set('showWhilePaused', (s as unknown as { showWhilePaused: boolean }).showWhilePaused === false ? '0' : '1');
  p.set('swapArtistTrack', (s as unknown as { swapArtistTrack: boolean }).swapArtistTrack ? '1' : '0');
  p.set('showPrimary', (s as unknown as { showPrimary: boolean }).showPrimary === false ? '0' : '1');
  p.set('showSecondary', (s as unknown as { showSecondary: boolean }).showSecondary === false ? '0' : '1');
  p.set('displayDuration', String((s as unknown as { displayDuration: number }).displayDuration ?? 5));
  p.set('showAnimation', (s as unknown as { showAnimation: string }).showAnimation || 'slide-in-from-bottom');
  p.set('hideAnimation', (s as unknown as { hideAnimation: string }).hideAnimation || 'slide-out-bottom');
  if ((s as unknown as { autoColor?: boolean }).autoColor === false) p.set('autoColor', '0');
  else p.set('autoColor', '1');
  p.set('colorText', (s as unknown as { colorText?: boolean }).colorText === false ? '0' : '1');
  p.set('fadeOut', (s as unknown as { fadeOut?: boolean }).fadeOut === false ? '0' : '1');
  p.set('fadeOutMs', String((s as unknown as { fadeOutMs?: number }).fadeOutMs ?? 800));
  const q = p.toString();
  return q ? `${base}?${q}` : base;
}
