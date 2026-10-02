'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { sanitizeParams } from './sbArgs';

// Event per widget yang bisa memicu DoAction di Streamer.bot.
// Hanya widget dengan event server (poll/task/timer/music/pinned).
// Widget lain (chat/event/follow/view-counter) sudah dicover mapping TikTok,
// sisanya (clock/qr/media-player/lyrics/dll) client-only tanpa event server.
export type WidgetSbEventKey =
  | 'poll_started'
  | 'poll_ended'
  | 'task_added'
  | 'task_done'
  | 'task_cleared'
  | 'timer_started'
  | 'timer_finished'
  | 'timer_extended'
  | 'timer_reduced'
  | 'song_requested'
  | 'song_next'
  | 'chat_pinned'
  | 'chat_unpinned';

export type WidgetSbEntry = { enabled: boolean; action: string; params: Record<string, string> };
export type WidgetSbMap = Record<WidgetSbEventKey, WidgetSbEntry>;

export const WIDGET_SB_GROUPS: Array<{
  widget: string;
  title: string;
  desc: string;
  events: Array<{ key: WidgetSbEventKey; label: string; hint: string }>;
}> = [
  {
    widget: 'poll',
    title: 'Poll',
    desc: 'Polling interaktif (vote via chat)',
    events: [
      { key: 'poll_started', label: 'Poll Started', hint: 'pollId, question, options, duration' },
      { key: 'poll_ended', label: 'Poll Ended', hint: 'question, votes, winner, platforms' },
    ],
  },
  {
    widget: 'task',
    title: 'Task List',
    desc: 'Task list / todo',
    events: [
      { key: 'task_added', label: 'Task Added', hint: 'taskId, text, user, total' },
      { key: 'task_done', label: 'Task Done', hint: 'taskId, text, user, doneCount' },
      { key: 'task_cleared', label: 'Tasks Cleared', hint: 'count' },
    ],
  },
  {
    widget: 'timer',
    title: 'Timer',
    desc: 'Pomodoro / countdown',
    events: [
      { key: 'timer_started', label: 'Timer Started', hint: 'totalSeconds, mode, session' },
      { key: 'timer_finished', label: 'Timer Finished', hint: 'mode, session' },
      { key: 'timer_extended', label: 'Timer Extended (+5m)', hint: 'addedSeconds, totalSeconds, mode' },
      { key: 'timer_reduced', label: 'Timer Reduced (−5m)', hint: 'reducedSeconds, totalSeconds, mode' },
    ],
  },
  {
    widget: 'music',
    title: 'Music Request',
    desc: 'Song request via !song',
    events: [
      { key: 'song_requested', label: 'Song Requested', hint: 'title, url, requestedBy, platform' },
      { key: 'song_next', label: 'Song Next / Skip', hint: 'title, url, requestedBy' },
    ],
  },
  {
    widget: 'pinned',
    title: 'Pinned Chat',
    desc: 'Chat yang di-pin dari dock',
    events: [
      { key: 'chat_pinned', label: 'Chat Pinned', hint: 'nickname, comment, platform' },
      { key: 'chat_unpinned', label: 'Chat Unpinned', hint: 'platform' },
    ],
  },
];

export const WIDGET_SB_KEYS: WidgetSbEventKey[] = WIDGET_SB_GROUPS.flatMap((g) =>
  g.events.map((e) => e.key),
);

const toDefaultAction = (key: WidgetSbEventKey): string =>
  'Widget_' + key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('_');

export const WIDGET_SB_DEFAULTS: WidgetSbMap = Object.fromEntries(
  WIDGET_SB_KEYS.map((k) => [k, { enabled: false, action: toDefaultAction(k), params: {} }]),
) as WidgetSbMap;

export const WIDGET_SB_TEST_ARGS: Record<WidgetSbEventKey, Record<string, unknown>> = {
  poll_started: { type: 'poll_started', pollId: '123', question: 'Mana turnamen selanjutnya?', options: 'ML,Valorant', optionsCount: 2, duration: 60, total: 0, platforms: '' },
  poll_ended: { type: 'poll_ended', pollId: '123', question: 'Mana turnamen selanjutnya?', options: 'ML,Valorant', optionsCount: 2, votes: '9,3', results: 'ML: 9, Valorant: 3', total: 12, winner: 'ML', winnerVotes: 9, duration: 60, platforms: 'tiktok,twitch', platformVotes: 'tiktok: 9, twitch: 3' },
  task_added: { type: 'task_added', taskId: '1', text: 'Push rank (tes)', user: '', total: 4 },
  task_done: { type: 'task_done', taskId: '1', text: 'Push rank (tes)', user: '', total: 4, doneCount: 2 },
  task_cleared: { type: 'task_cleared', count: 3 },
  timer_started: { type: 'timer_started', totalSeconds: 3000, mode: 'powerup', session: 1, totalSessions: 3 },
  timer_finished: { type: 'timer_finished', totalSeconds: 0, mode: 'powerup', session: 1, totalSessions: 3 },
  timer_extended: { type: 'timer_extended', addedSeconds: 300, totalSeconds: 3300, mode: 'powerup', session: 1, totalSessions: 3 },
  timer_reduced: { type: 'timer_reduced', reducedSeconds: 300, totalSeconds: 2700, mode: 'powerup', session: 1, totalSessions: 3 },
  song_requested: { type: 'song_requested', songId: '1', title: 'Test Song', url: 'https://youtu.be/dQw4w9WgXcQ', videoId: 'dQw4w9WgXcQ', kind: 'youtube', requestedBy: 'TestUser', platform: 'tiktok', queueLength: 2 },
  song_next: { type: 'song_next', songId: '2', title: 'Test Song (next)', url: 'https://youtu.be/dQw4w9WgXcQ', videoId: 'dQw4w9WgXcQ', kind: 'youtube', requestedBy: 'TestUser', platform: 'tiktok', queueLength: 1 },
  chat_pinned: { type: 'chat_pinned', nickname: 'TestUser', comment: 'Gass keun bang! (tes)', profilePictureUrl: '', platform: 'tiktok' },
  chat_unpinned: { type: 'chat_unpinned', platform: 'tiktok' },
};

// Variabel yang tersedia per event widget (kunci TEST_ARGS minus `type`).
export const WIDGET_SB_PARAMS: Record<WidgetSbEventKey, string[]> = Object.fromEntries(
  WIDGET_SB_KEYS.map((k) => [k, Object.keys(WIDGET_SB_TEST_ARGS[k]).filter((f) => f !== 'type')]),
) as Record<WidgetSbEventKey, string[]>;

const STORAGE_KEY = 'widget-sb-map';

function sanitize(raw: unknown): WidgetSbMap {
  const out = Object.fromEntries(
    WIDGET_SB_KEYS.map((k) => [k, { ...WIDGET_SB_DEFAULTS[k], params: {} }]),
  ) as WidgetSbMap;
  if (raw && typeof raw === 'object') {
    for (const k of WIDGET_SB_KEYS) {
      const e = (raw as Record<string, unknown>)[k];
      if (e && typeof e === 'object') {
        const entry = e as Record<string, unknown>;
        out[k] = {
          enabled: entry.enabled === true,
          action: typeof entry.action === 'string' ? entry.action : WIDGET_SB_DEFAULTS[k].action,
          params: sanitizeParams(entry.params),
        };
      }
    }
  }
  return out;
}

function loadCache(): WidgetSbMap {
  if (typeof window === 'undefined') return { ...WIDGET_SB_DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...WIDGET_SB_DEFAULTS };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...WIDGET_SB_DEFAULTS };
  }
}

function saveCache(map: WidgetSbMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

// Shared hook - dipakai dock (eksekutor) + halaman /integrations (manager).
// Sumber utama: database kolom widget_sb_map (per user). localStorage cache + sinkron antar tab.
export function useWidgetSbMap() {
  const supabase = createClient();
  const [map, setMapState] = useState<WidgetSbMap>(() => loadCache());
  const [userId, setUserId] = useState<string | null>(null);
  const loadedFromDb = useRef(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (!uid) return;
      try {
        const { data: row } = await supabase
          .from('integration_settings')
          .select('widget_sb_map')
          .eq('user_id', uid)
          .single();
        const dbMap = (row as { widget_sb_map?: unknown } | null)?.widget_sb_map;
        if (cancelled) return;
        if (dbMap) {
          const clean = sanitize(dbMap);
          loadedFromDb.current = true;
          saveCache(clean);
          setMapState(clean);
        } else {
          loadedFromDb.current = true;
        }
      } catch {
        if (!cancelled) loadedFromDb.current = true;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setMapState(loadCache());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback(
    (next: WidgetSbMap, uid: string | null) => {
      saveCache(next);
      if (!uid) return;
      supabase
        .from('integration_settings')
        .upsert({ user_id: uid, widget_sb_map: next, updated_at: new Date().toISOString() } as any, {
          onConflict: 'user_id',
        })
        .then(({ error }) => {
          if (error) console.error('Gagal simpan widget mapping ke database:', error.message);
        });
    },
    [supabase],
  );

  const setMap = useCallback(
    (next: WidgetSbMap) => {
      setMapState(next);
      persist(next, userId);
    },
    [persist, userId],
  );

  const updateEntry = useCallback(
    (key: WidgetSbEventKey, patch: Partial<WidgetSbEntry>) => {
      setMapState((prev) => {
        const next = { ...prev, [key]: { ...prev[key], ...patch } };
        persist(next, userId);
        return next;
      });
    },
    [persist, userId],
  );

  return { map, setMap, updateEntry, userId };
}
