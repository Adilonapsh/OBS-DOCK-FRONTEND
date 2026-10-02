'use client';
import { useEffect, useRef, useState } from 'react';
import { DEMO_CHATS } from '../config';
import type { ChatItem } from './types';

// Pool data dummy untuk simulasi preview — mengalir seperti chat real
// (satu per satu masuk dengan animasi, lalu keluar dengan animasi).
// TikTok chat real tetap dari event `tiktok-chat`; ini hanya untuk ?simulate=1.
type DummyBase = Omit<ChatItem, 'id' | 'timestamp'>;

const EXTRA_DUMMIES: DummyBase[] = [
  {
    nickname: 'KickRider',
    comment: 'Pindah dari Kick nih, rame juga sini',
    profilePictureUrl: 'https://ui-avatars.com/api/?name=Kick&background=53fc18&color=000',
    platform: 'kick',
    badges: ['vip'],
  },
  {
    nickname: 'DewiYT',
    comment: 'wajib nonton guys https://youtu.be/dQw4w9WgXcQ',
    profilePictureUrl: 'https://ui-avatars.com/api/?name=Dewi&background=ff0000&color=fff',
    platform: 'youtube',
  },
  {
    nickname: 'MemeLord',
    comment: '!song Judul Lagu Favorit',
    profilePictureUrl: 'https://ui-avatars.com/api/?name=Meme&background=222&color=fff',
    platform: 'tiktok',
  },
  {
    nickname: 'ArtViewer',
    comment: 'Lihat meme ini https://i.imgur.com/example.png wkwk',
    profilePictureUrl: 'https://ui-avatars.com/api/?name=Art&background=9146ff&color=fff',
    platform: 'twitch',
  },
  {
    nickname: 'SariLive',
    comment: '@streamer kapan mabar bareng?',
    profilePictureUrl: 'https://ui-avatars.com/api/?name=Sari&background=FE2C55&color=fff',
    platform: 'tiktok',
  },
];

export const SIM_DUMMY_POOL: DummyBase[] = [
  ...DEMO_CHATS.map(({ id: _id, timestamp: _ts, ...rest }) => rest),
  ...EXTRA_DUMMIES,
];

function makeId(): string {
  return `sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Simulasi chat live dari data dummy.
 * - Pesan masuk satu per satu tiap `intervalMs` (animasi masuk = anim tema).
 * - Tiap pesan bertahan `holdMs` lalu keluar pakai animasi (`hideDur`), persis jalur real.
 * - `filter` dipakai agar preview akurat saat filter platform/commands/ignore aktif.
 */
export function useDummyChatSimulation(opts: {
  enabled: boolean;
  maxMessages: number;
  holdMs: number;
  hideDur: number;
  intervalMs?: number;
  filter?: (c: ChatItem) => boolean;
}): { chats: ChatItem[]; exitingIds: Set<string> } {
  const { enabled, maxMessages, holdMs, hideDur, intervalMs = 2400 } = opts;
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const cfgRef = useRef({ maxMessages, holdMs, hideDur, intervalMs, filter: opts.filter });
  cfgRef.current = { maxMessages, holdMs, hideDur, intervalMs, filter: opts.filter };
  const idxRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timers.delete(t);
        if (alive) fn();
      }, ms);
      timers.add(t);
    };
    const push = () => {
      if (!alive) return;
      const cfg = cfgRef.current;
      // Lewati dummy yang kefilter (max 1 putaran pool) agar ritme tetap jalan
      for (let k = 0; k < SIM_DUMMY_POOL.length; k++) {
        const base = SIM_DUMMY_POOL[idxRef.current % SIM_DUMMY_POOL.length];
        idxRef.current += 1;
        const item: ChatItem = { ...base, id: makeId(), timestamp: Date.now() };
        if (cfg.filter && !cfg.filter(item)) continue;
        setChats((prev) => [...prev, item].slice(-cfg.maxMessages));
        later(() => {
          setExitingIds((prev) => new Set(prev).add(item.id));
          later(() => {
            setChats((prev) => prev.filter((c) => c.id !== item.id));
            setExitingIds((prev) => {
              const n = new Set(prev);
              n.delete(item.id);
              return n;
            });
          }, cfg.hideDur);
        }, cfg.holdMs);
        break;
      }
      later(push, cfg.intervalMs);
    };
    later(push, 600);
    return () => {
      alive = false;
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, [enabled]);

  return { chats, exitingIds };
}
