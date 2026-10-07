// Helper role + warna akun shared untuk semua tema chat.
// Data asli dari Streamer.bot (diteruskan dock → backend bridge):
// - Twitch: broadcaster/mod/vip/sub (+ color hex akun)
// - YouTube: owner/mod/member(+verified) - color fallback stabil per akun dari dock
import type { ChatItem, ChatRole } from './types';

const KNOWN: ChatRole[] = ['broadcaster', 'mod', 'vip', 'sub', 'owner', 'member', 'verified'];

/** Ambil daftar role valid dari ChatItem (sudah dinormalisasi backend). */
export function chatRoles(c: Pick<ChatItem, 'badges'>): ChatRole[] {
  if (!Array.isArray(c.badges)) return [];
  const out: ChatRole[] = [];
  for (const b of c.badges) {
    const v = String(b || '').toLowerCase() as ChatRole;
    if ((KNOWN as string[]).includes(v) && !out.includes(v)) out.push(v);
  }
  return out;
}

/** Label badge yang tampil. */
export function chatRoleLabel(r: ChatRole): string {
  if (r === 'broadcaster') return 'Broadcaster';
  if (r === 'mod') return 'Mod';
  if (r === 'vip') return 'VIP';
  if (r === 'sub') return 'Sub';
  if (r === 'owner') return 'Owner';
  if (r === 'member') return 'Member';
  return '✔';
}

/** Class warna pill badge - mengikuti warna khas tiap platform/akun. */
export function chatRolePill(platform: string | undefined, r: ChatRole): string {
  const p = (platform || '').toLowerCase();
  if (r === 'broadcaster' || r === 'owner') return 'bg-red-500/20 text-red-300';
  if (r === 'mod') return p.includes('youtube') || p === 'yt' ? 'bg-slate-500/25 text-slate-200' : 'bg-green-500/20 text-green-300';
  if (r === 'vip') return 'bg-pink-500/20 text-pink-300';
  if (r === 'sub') return 'bg-purple-500/20 text-purple-300';
  if (r === 'member') return 'bg-green-500/20 text-green-300';
  return 'bg-white/10 text-gray-300';
}

/** Warna teks solid per role (terbaca di bg terang maupun gelap). */
export function chatRoleColor(r: ChatRole): string {
  if (r === 'broadcaster' || r === 'owner') return '#ef4444';
  if (r === 'mod') return '#16a34a';
  if (r === 'vip') return '#ec4899';
  if (r === 'sub') return '#8b5cf6';
  if (r === 'member') return '#16a34a';
  return '#6b7280';
}

/** Warna nama: pakai warna akun kalau ada, kalau tidak pakai fallback tema. */
export function chatNameColor(c: Pick<ChatItem, 'color'>, fallback: string): string {
  return c.color || fallback;
}
