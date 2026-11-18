'use client';

/**
 * useDockControls - satu koneksi Socket.IO untuk semua Dock Control.
 *
 * Reusable: cukup berikan `room` (private key / room BGM), lalu semua state
 * Poll, Task, Pinned Chat, Timer, Games, dan Chat Feed siap dipakai komponen.
 * Backend broadcast sebagian event ke semua socket, jadi tiap handler memfilter
 * `room` agar dock tidak menampilkan data milik streamer lain.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getSocketUrl } from '@/app/widgets/_shared/utils/socket';
import type {
  ChatFeedItem,
  DockControlsApi,
  GameStatus,
  PinnedChat,
  PollState,
  TaskState,
  TimerState,
} from './types';

const REFRESH_MS = 5000;
const CHAT_LIMIT = 80;
const SPEAK_BANNER_MS = 45000;

function readSpeakVoiceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const settings = JSON.parse(localStorage.getItem('speak-settings') || '{}') as { voiceId?: unknown };
    return typeof settings.voiceId === 'string' ? settings.voiceId.slice(0, 80) : '';
  } catch {
    return '';
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** Cocokkan room event dengan room dock (event global selalu diterima). */
function sameRoom(incoming: unknown, room: string): boolean {
  const r = String(incoming ?? '').trim();
  if (!r || r === 'global') return true;
  return r === room;
}

function normalizePinned(raw: unknown): PinnedChat | null {
  const data = asRecord(raw);
  const chat = asRecord(data.chat ?? raw);
  const text = String(chat.comment ?? chat.text ?? chat.message ?? '').trim();
  if (!text) return null;
  return {
    user: String(chat.nickname ?? chat.user ?? chat.uniqueId ?? 'Pinned'),
    text,
    platform: String(chat.platform ?? 'tiktok'),
    avatar: (chat.profilePictureUrl ?? chat.avatar) as string | undefined,
  };
}

function normalizeChat(raw: unknown, seq: number): ChatFeedItem | null {
  const data = asRecord(raw);
  const text = String(data.comment ?? data.text ?? data.message ?? '').trim();
  if (!text) return null;
  return {
    id: `${String(data.id ?? data.msgId ?? data.createTime ?? Date.now())}-${seq}`,
    user: String(data.nickname ?? data.user ?? data.uniqueId ?? 'User'),
    text,
    platform: String(data.platform ?? 'tiktok'),
    avatar: (data.profilePictureUrl ?? data.avatar) as string | undefined,
    color: typeof data.color === 'string' ? data.color : undefined,
    at: Date.now(),
  };
}

export function useDockControls(room: string): DockControlsApi {
  const [connected, setConnected] = useState(false);
  const [poll, setPoll] = useState<PollState | null>(null);
  const [tasks, setTasks] = useState<TaskState | null>(null);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [pinnedChat, setPinnedChat] = useState<PinnedChat | null>(null);
  const [speaking, setSpeaking] = useState<PinnedChat | null>(null);
  const [game, setGame] = useState<GameStatus | null>(null);
  const [chat, setChat] = useState<ChatFeedItem[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const chatSeq = useRef(0);
  const speakClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectiveRoom = room.trim() || 'global';

  const emit = useCallback((event: string, payload: Record<string, unknown>) => {
    const s = socketRef.current;
    if (s?.connected) s.emit(event, { privateKey: effectiveRoom, ...payload });
  }, [effectiveRoom]);

  useEffect(() => {
    if (!room.trim()) return;

    const s = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 900,
      reconnectionDelayMax: 6000,
    });
    socketRef.current = s;

    const requestAll = () => {
      s.emit('join-room', effectiveRoom);
      s.emit('poll-get', { privateKey: effectiveRoom });
      s.emit('task-get', { privateKey: effectiveRoom });
      s.emit('timer-get', { privateKey: effectiveRoom });
      s.emit('pin-get', { privateKey: effectiveRoom });
      s.emit('game-get', { privateKey: effectiveRoom, gameId: 'trivia' });
    };

    const onConnect = () => {
      setConnected(true);
      requestAll();
    };
    const onDisconnect = () => setConnected(false);

    const onPoll = (payload: unknown) => {
      const p = asRecord(payload);
      if (!sameRoom(p.room, effectiveRoom)) return;
      setPoll({
        id: String(p.id ?? ''),
        room: p.room ? String(p.room) : undefined,
        question: String(p.question ?? ''),
        options: Array.isArray(p.options) ? p.options.map(String) : [],
        votes: Array.isArray(p.votes) ? p.votes.map((v) => Number(v) || 0) : [],
        total: Number(p.total) || 0,
        duration: Number(p.duration) || 0,
        createdAt: Number(p.createdAt) || Date.now(),
        ended: !!p.ended,
        paused: !!p.paused,
        visible: typeof p.visible === 'boolean' ? p.visible : true,
        theme: p.theme ? String(p.theme) : undefined,
        voterPlatform: p.voterPlatform && typeof p.voterPlatform === 'object'
          ? (p.voterPlatform as Record<string, string>)
          : undefined,
      });
    };

    const onTask = (payload: unknown) => {
      const data = asRecord(payload);
      if (!sameRoom(data.room, effectiveRoom)) return;
      const items = Array.isArray(data.items) ? data.items : [];
      setTasks({
        room: data.room ? String(data.room) : undefined,
        updatedAt: Number(data.updatedAt) || undefined,
        items: items.map((raw) => {
          const item = asRecord(raw);
          return {
            id: String(item.id ?? ''),
            text: String(item.text ?? ''),
            completed: !!item.completed,
            user: item.user ? String(item.user) : undefined,
          };
        }),
      });
    };

    const onTimer = (payload: unknown) => {
      const data = asRecord(payload);
      if (!sameRoom(data.room, effectiveRoom)) return;
      setTimer({
        room: data.room ? String(data.room) : undefined,
        focusMinutes: Number(data.focusMinutes) || undefined,
        totalSessions: Number(data.totalSessions) || undefined,
        totalSeconds: Number(data.totalSeconds) || 0,
        isRunning: !!data.isRunning,
        currentSession: Number(data.currentSession) || 1,
        mode: data.mode ? String(data.mode) : undefined,
        updatedAt: Number(data.updatedAt) || undefined,
        addedSeconds: Number(data.addedSeconds) || undefined,
      });
    };

    const onPinned = (payload: unknown) => {
      const next = normalizePinned(payload);
      if (next) setPinnedChat(next);
    };
    const onUnpinned = () => setPinnedChat(null);

    // Speak: backend broadcast `speak-chat` / `speak-stop` ke room + global.
    // Banner di tab Chat mengikuti event ini, sama seperti dock desktop.
    const clearSpeakTimer = () => {
      if (speakClearTimer.current) {
        clearTimeout(speakClearTimer.current);
        speakClearTimer.current = null;
      }
    };
    const onSpeak = (payload: unknown) => {
      const next = normalizePinned(payload);
      if (!next) return;
      clearSpeakTimer();
      setSpeaking(next);
      speakClearTimer.current = setTimeout(() => {
        setSpeaking(null);
        speakClearTimer.current = null;
      }, SPEAK_BANNER_MS);
    };
    const onSpeakStop = () => {
      clearSpeakTimer();
      setSpeaking(null);
    };

    const onGame = (payload: unknown) => {
      const data = asRecord(payload);
      if (String(data.gameId ?? 'trivia') !== 'trivia') return;
      setGame({
        gameId: 'trivia',
        phase: data.phase ? String(data.phase) : undefined,
        topic: data.topic ? String(data.topic) : undefined,
        round: Number(data.round) || undefined,
        qIndex: Number(data.qIndex) || 0,
        total: Number(data.total) || 0,
        players: Number(data.players) || 0,
        question: data.question ? String(data.question) : undefined,
        leaderboard: Array.isArray(data.leaderboard)
          ? (data.leaderboard as Array<{ username: string; score: number }>)
          : undefined,
        at: Number(data.at) || undefined,
      });
    };

    const onChat = (payload: unknown) => {
      chatSeq.current += 1;
      const item = normalizeChat(payload, chatSeq.current);
      if (!item) return;
      setChat((prev) => {
        const last = prev[0];
        if (last && last.user === item.user && last.text === item.text && item.at - last.at < 1200) {
          return prev;
        }
        return [item, ...prev].slice(0, CHAT_LIMIT);
      });
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('poll-update', onPoll);
    s.on('poll-clear', () => setPoll(null));
    s.on('task-update', onTask);
    s.on('task-clear', () => setTasks(null));
    s.on('timer-update', onTimer);
    s.on('pinned-chat', onPinned);
    s.on('unpin-chat', onUnpinned);
    s.on('speak-chat', onSpeak);
    s.on('speak-stop', onSpeakStop);
    s.on('game-status', onGame);
    s.on('tiktok-chat', onChat);

    // Polling ringan sebagai fallback bila event awal terlewat / socket reconnect.
    const refresh = setInterval(() => {
      if (!s.connected) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      s.emit('poll-get', { privateKey: effectiveRoom });
      s.emit('task-get', { privateKey: effectiveRoom });
      s.emit('timer-get', { privateKey: effectiveRoom });
      s.emit('pin-get', { privateKey: effectiveRoom });
      s.emit('game-get', { privateKey: effectiveRoom, gameId: 'trivia' });
    }, REFRESH_MS);

    return () => {
      clearInterval(refresh);
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('poll-update', onPoll);
      s.off('task-update', onTask);
      s.off('timer-update', onTimer);
      s.off('pinned-chat', onPinned);
      s.off('speak-chat', onSpeak);
      s.off('speak-stop', onSpeakStop);
      s.off('game-status', onGame);
      s.off('tiktok-chat', onChat);
      clearSpeakTimer();
      s.disconnect();
      if (socketRef.current === s) socketRef.current = null;
      setConnected(false);
    };
  }, [room, effectiveRoom]);

  return useMemo<DockControlsApi>(() => ({
    connected: connected && !!room.trim(),
    poll,
    tasks,
    timer,
    pinnedChat,
    speaking,
    game,
    chat,
    pollActions: {
      create: (question, options, duration) => emit('poll-create', { question, options, duration, theme: 'bar', visible: true }),
      end: () => emit('poll-end', {}),
      pause: () => emit('poll-pause', {}),
      resume: () => emit('poll-resume', {}),
      clear: () => emit('poll-clear', {}),
      setVisible: (visible) => emit('poll-visibility', { visible }),
    },
    taskActions: {
      add: (text) => emit('task-add', { text }),
      toggle: (id) => emit('task-toggle', { id }),
      remove: (id) => emit('task-remove', { id }),
      move: (from, to) => emit('task-move', { from, to }),
      clear: () => emit('task-clear', {}),
    },
    pinActions: {
      pin: (item) => emit('pin-chat', {
        chat: {
          nickname: item.user,
          comment: item.text,
          profilePictureUrl: item.avatar ?? '',
          platform: item.platform ?? 'tiktok',
        },
      }),
      unpin: () => emit('unpin-chat', {}),
      refresh: () => emit('pin-get', {}),
    },
    speakActions: {
      speak: (item) => emit('speak-chat', {
        voiceId: readSpeakVoiceId(),
        chat: {
          nickname: item.user,
          comment: item.text,
          profilePictureUrl: item.avatar ?? '',
          platform: item.platform ?? 'tiktok',
        },
      }),
      stop: () => emit('speak-stop', {}),
    },
    gameActions: {
      start: () => emit('game-command', { gameId: 'trivia', action: 'start' }),
      stop: () => emit('game-command', { gameId: 'trivia', action: 'stop' }),
      skip: () => emit('game-command', { gameId: 'trivia', action: 'skip' }),
      reset: () => emit('game-command', { gameId: 'trivia', action: 'reset' }),
      refresh: () => emit('game-get', { gameId: 'trivia' }),
    },
    timerActions: {
      control: (action, extra) => emit('timer-control', { action, ...(extra ?? {}) }),
      refresh: () => emit('timer-get', {}),
    },
  }), [connected, room, poll, tasks, timer, pinnedChat, speaking, game, chat, emit]);
}
