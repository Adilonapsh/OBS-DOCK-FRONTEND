// Helper filter & format chat - kompatibel nutty.gg multichat-overlay.
// TikTok chat tetap dari event `tiktok-chat` seperti sekarang; helper ini murni
// filtering/tampilan di sisi overlay agar URL nutty bisa di-load langsung.

import type { ChatItem } from './types';

export type TimeFormat = '12-hour' | '24-hour';

export function formatChatTime(ts: number | undefined, fmt: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  const h24 = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  if (fmt === '12-hour') {
    const suffix = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${m} ${suffix}`;
  }
  return `${String(h24).padStart(2, '0')}:${m}`;
}

export function parseIgnoreList(raw: string): string[] {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function platformOf(c: ChatItem): string {
  return String(c.platform || 'tiktok').toLowerCase();
}

function isTikTok(c: ChatItem): boolean {
  const p = platformOf(c);
  return p.includes('tiktok') || p === 'tt';
}
function isTwitch(c: ChatItem): boolean {
  return platformOf(c).includes('twitch');
}
function isYouTube(c: ChatItem): boolean {
  const p = platformOf(c);
  return p.includes('youtube') || p === 'yt';
}
function isKick(c: ChatItem): boolean {
  return platformOf(c).includes('kick');
}

export type PlatformFilterOpts = {
  showTwitchMessages: boolean;
  showYouTubeMessages: boolean;
  showKickMessages: boolean;
  showTikTokMessages: boolean;
  enableTikTokSupport: boolean;
};

export function passPlatformFilter(c: ChatItem, f: PlatformFilterOpts): boolean {
  if (isTwitch(c)) return f.showTwitchMessages;
  if (isYouTube(c)) return f.showYouTubeMessages;
  if (isKick(c)) return f.showKickMessages;
  if (isTikTok(c)) {
    if (!f.enableTikTokSupport) return false;
    return f.showTikTokMessages;
  }
  // Platform lain (donasi/alert yg nyasar ke chat): tampilkan agar perilaku sama seperti sekarang.
  return true;
}

export function passCommandFilter(c: ChatItem, excludeCommands: boolean): boolean {
  if (!excludeCommands) return true;
  return !String(c.comment || '').trimStart().startsWith('!');
}

// Command music widget (!song / !skip / custom) - selalu disembunyikan dari widget chat
// agar request lagu tidak mengotori overlay chat. Dipakai terpisah dari excludeCommands.
export function isSongCommand(comment: string, customCmd = '!song'): boolean {
  const t = String(comment || '').trim().toLowerCase();
  if (!t.startsWith('!')) return false;
  const cmds = new Set(['!song', '!skip', String(customCmd || '!song').trim().toLowerCase()]);
  for (const c of cmds) {
    if (!c) continue;
    if (t === c || t.startsWith(`${c} `) || t.startsWith(`${c}:`)) return true;
  }
  return false;
}

export function passSongCommandFilter(c: ChatItem, customCmd = '!song'): boolean {
  return !isSongCommand(c.comment, customCmd);
}

export function passIgnoreFilter(c: ChatItem, ignoreList: string[]): boolean {
  if (ignoreList.length === 0) return true;
  const nick = String(c.nickname || '').toLowerCase();
  return !ignoreList.includes(nick);
}

export function isMentionMessage(comment: string): boolean {
  return /@[\w._-]+/.test(String(comment || ''));
}

// Level privilege: viewer 10 < sub/member 15 < vip 20 < mod 30 < broadcaster/owner 40.
// imageEmbedPermissionLevel nutty: 10 Everyone, 15 Subs+, 20 VIPs+, 30 Mods+, 40 Broadcaster, 69420 Nobody.
export function userPrivilegeLevel(c: ChatItem): number {
  const badges = Array.isArray(c.badges) ? c.badges.map((b) => String(b).toLowerCase()) : [];
  if (badges.includes('broadcaster') || badges.includes('owner')) return 40;
  if (badges.includes('mod')) return 30;
  if (badges.includes('vip')) return 20;
  if (badges.includes('sub') || badges.includes('member') || badges.includes('verified')) return 15;
  return 10;
}

export function canEmbedImages(c: ChatItem, permissionLevel: string | number): boolean {
  const lvl = Number(permissionLevel);
  if (!Number.isFinite(lvl) || lvl >= 69420) return false;
  return userPrivilegeLevel(c) >= lvl;
}

const IMAGE_URL_RE = /https?:\/\/[^\s)]+?\.(?:png|jpe?g|gif|webp)(?:\?[^\s)]*)?/gi;

export function extractImageUrls(text: string): string[] {
  const out: string[] = [];
  const src = String(text || '');
  let m: RegExpExecArray | null;
  IMAGE_URL_RE.lastIndex = 0;
  while ((m = IMAGE_URL_RE.exec(src)) !== null) {
    if (!out.includes(m[0])) out.push(m[0]);
    if (out.length >= 3) break;
  }
  return out;
}

export function extractYouTubeVideoId(text: string): string | null {
  const src = String(text || '');
  const m =
    src.match(/(?:youtube\.com\/(?:watch\?[^#\s]*v=|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  return m ? m[1] : null;
}

export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

// Group consecutive: true jika pesan ini dari user yg sama dengan pesan sebelumnya
// (dipakai tema untuk menyembunyikan header username). Diabaikan saat reversed.
export function isGroupedWithPrev(list: ChatItem[], index: number): boolean {
  if (index <= 0) return false;
  const cur = list[index];
  const prev = list[index - 1];
  if (!cur || !prev) return false;
  return (
    String(cur.nickname || '').toLowerCase() === String(prev.nickname || '').toLowerCase() &&
    String(cur.platform || '') === String(prev.platform || '')
  );
}

function hexToRgb(hex: string): [number, number, number] | null {
  const h = String(hex || '').trim().replace('#', '');
  if (/^[0-9a-f]{3}$/i.test(h)) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return [r, g, b];
  }
  if (/^[0-9a-f]{6}$/i.test(h)) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return null;
}

// Background bubble nutty: bubbleColor + bubbleOpacity (0-1) -> rgba string.
export function bubbleBg(color: string, opacity: number, fallback: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return fallback;
  const a = Math.max(0, Math.min(1, Number(opacity)));
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}
