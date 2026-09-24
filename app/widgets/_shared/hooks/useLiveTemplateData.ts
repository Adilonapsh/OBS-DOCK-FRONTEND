'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../utils/socket';
import type { TemplateData } from '../utils/template';

export type LiveTemplateOptions = {
  privateKey?: string;
  /** kalau true: tidak connect socket, hanya demo + jam berjalan */
  simulate?: boolean;
  /** SMTC bridge (media-player/lyrics) — kalau diisi, {{title}}/{{artist}}/{{cover}} ikut Now Playing asli */
  smtcAddress?: string;
  smtcPort?: string;
};

function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function fmtShort(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function fmtCompact(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.floor(n));
}

function ytThumb(videoId?: string): string {
  if (!videoId) return '';
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

function str(v: unknown, fb = ''): string {
  if (v === null || v === undefined) return fb;
  const s = String(v);
  return s === '' ? fb : s;
}

/**
 * Satu koneksi socket untuk Custom Overlay — sync SEMUA fungsi widget
 * ke {{variable}} template, sesuai perilaku widget aslinya:
 * - chat (tiktok-chat) → {{username}} {{message}} {{avatar}} {{platform}}
 * - event/gift/like/member/follow → {{giftName}} {{giftCount}} {{diamonds}} {{likeCount}} {{joinUsername}} {{followUsername}} ...
 * - music (song-update) → {{title}} {{requestedBy}} {{cover}} = thumbnail YT asli, {{progress}} {{status}} {{queueCount}} ...
 * - timer (timer-update) → {{timer}} = sisa real (mm:ss), {{timerSeconds}} {{timerRunning}} {{session}} ...
 * - poll (poll-update) → {{question}} {{polls}} {{pollTotal}} {{opt1}} {{pct1}} ...
 * - pinned (pinned-chat) → {{pinnedUsername}} {{pinnedMessage}} ...
 * - counter (tiktok-roomUser/sb-viewers) → {{viewers}} {{totalViewers}} {{tiktokViewers}} ...
 * - SMTC (opsional) → {{title}} {{artist}} {{cover}} {{status}} dari /now-playing asli
 */
export function useLiveTemplateData(opts: LiveTemplateOptions = {}): { data: TemplateData; connected: boolean } {
  const { privateKey = '', simulate = false, smtcAddress = '', smtcPort = '' } = opts;
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);

  const [chat, setChat] = useState<Record<string, any> | null>(null);
  const [gift, setGift] = useState<Record<string, any> | null>(null);
  const [like, setLike] = useState<Record<string, any> | null>(null);
  const [join, setJoin] = useState<Record<string, any> | null>(null);
  const [follow, setFollow] = useState<Record<string, any> | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [song, setSong] = useState<Record<string, any> | null>(null);
  const [timer, setTimer] = useState<Record<string, any> | null>(null);
  const [poll, setPoll] = useState<Record<string, any> | null>(null);
  const [pinned, setPinned] = useState<Record<string, any> | null>(null);
  const [smtc, setSmtc] = useState<Record<string, any> | null>(null);

  const room = privateKey || 'global';

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (simulate) return;
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const onConnect = () => {
      setConnected(true);
      socket.emit('join-room', room);
      socket.emit('poll-get', { privateKey: room });
      socket.emit('timer-get', { privateKey: room });
      socket.emit('song-get', { key: privateKey, privateKey, room });
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', () => setConnected(false));

    socket.on('tiktok-chat', (d: any) => {
      if (!d) return;
      const comment = str(d.comment || d.message);
      if (!comment) return;
      setChat({
        username: str(d.nickname || d.uniqueId || d.displayName || 'User'),
        message: comment,
        avatar: str(d.profilePictureUrl || d.avatar),
        platform: str(d.platform || (d.fromStreamerBot ? 'twitch' : 'tiktok'), 'tiktok'),
        timestamp: Date.now(),
      });
    });
    socket.on('tiktok-member', (d: any) => {
      if (!d) return;
      setJoin({ joinUsername: str(d.nickname || d.uniqueId || 'Someone'), joinAvatar: str(d.profilePictureUrl), joinPlatform: str(d.platform || 'tiktok') });
    });
    socket.on('tiktok-gift', (d: any) => {
      if (!d) return;
      setGift({
        giftUsername: str(d.nickname || d.uniqueId || 'Someone'),
        giftName: str(d.giftName || d.gift || 'Gift'),
        giftCount: Number(d.repeatCount ?? d.count ?? 1) || 1,
        diamonds: Number(d.diamondCount ?? d.diamonds ?? 0) || 0,
        giftPicture: str(d.giftPictureUrl || d.giftPicture),
        giftAvatar: str(d.profilePictureUrl),
      });
    });
    socket.on('tiktok-like', (d: any) => {
      if (!d) return;
      setLike({ likeUsername: str(d.nickname || d.uniqueId || 'Someone'), likeCount: Number(d.likeCount ?? d.count ?? 1) || 1 });
    });
    const onFollow = (d: any) => {
      if (!d) return;
      setFollow({
        followUsername: str(d.nickname || d.uniqueId || d.displayName || 'Someone'),
        followLabel: str(d.label),
        followPlatform: str(d.platform || 'tiktok'),
        followAvatar: str(d.profilePictureUrl),
      });
    };
    socket.on('tiktok-follow', onFollow);
    socket.on('tiktok-social', (d: any) => {
      const t = str(d?.displayType || d?.label || '').toLowerCase();
      if (t.includes('follow')) onFollow(d);
    });

    socket.on('tiktok-roomUser', (d: any) => {
      const n = Number(d?.viewerCount ?? d?.totalUser);
      if (!Number.isNaN(n)) setCounts(prev => ({ ...prev, tiktok: n }));
    });
    socket.on('sb-viewers', (d: any) => {
      const n = Number(d?.viewers);
      if (Number.isNaN(n)) return;
      const p = str(d?.platform || '').toLowerCase();
      const key = p.includes('twitch') ? 'twitch' : p.includes('youtube') || p === 'yt' ? 'youtube' : p.includes('kick') ? 'kick' : 'twitch';
      setCounts(prev => ({ ...prev, [key]: n }));
    });

    socket.on('song-update', (d: any) => {
      if (!d) return;
      if (d.room && d.room !== room) return;
      const q = Array.isArray(d.queue) ? d.queue : [];
      const idx = typeof d.currentIndex === 'number' ? Math.max(0, Math.min(d.currentIndex, Math.max(0, q.length - 1))) : 0;
      const cur = q.length ? q[idx] : null;
      setSong({
        title: str(cur?.title),
        requestedBy: str(cur?.requestedBy),
        url: str(cur?.url),
        videoId: str(cur?.videoId),
        cover: ytThumb(cur?.videoId) || str(cur?.cover),
        platform: str(cur?.platform),
        position: typeof d.position === 'number' ? d.position : 0,
        durationSec: typeof d.duration === 'number' ? d.duration : 0,
        isPlaying: !!d.isPlaying,
        queueCount: q.length,
        currentIndex: idx,
      });
    });

    socket.on('timer-update', (d: any) => {
      if (!d) return;
      const now = Date.now();
      const updatedAt = typeof d.updatedAt === 'number' ? d.updatedAt : now;
      const base = typeof d.totalSeconds === 'number' ? d.totalSeconds : 0;
      let sec = base;
      if (d.isRunning) sec = Math.max(0, base - Math.floor((now - updatedAt) / 1000));
      setTimer({
        timerSeconds: sec,
        timerRunning: !!d.isRunning,
        session: typeof d.currentSession === 'number' ? d.currentSession : 1,
        focusMinutes: typeof d.focusMinutes === 'number' ? d.focusMinutes : undefined,
        totalSessions: typeof d.totalSessions === 'number' ? d.totalSessions : undefined,
        subathonMode: str(d.subathonMode || d.mode),
      });
    });

    socket.on('poll-update', (p: any) => {
      if (!p) return;
      if (p.room && p.room !== room && p.room !== 'global' && room !== 'global') return;
      setPoll(p);
    });
    socket.on('poll-clear', () => setPoll(null));

    socket.on('pinned-chat', (d: any) => {
      const c = d?.chat || d;
      if (!c) return;
      const comment = str(c.comment || c.text || c.message);
      if (!comment) return;
      setPinned({
        pinnedUsername: str(c.nickname || c.user || c.uniqueId || 'Pinned'),
        pinnedMessage: comment,
        pinnedAvatar: str(c.profilePictureUrl || c.avatar),
        pinnedPlatform: str(c.platform || 'tiktok'),
      });
    });
    socket.on('unpin-chat', () => setPinned(null));

    return () => { socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, simulate]);

  // SMTC Now Playing asli (media-player/lyrics) — opsional via addr/port
  useEffect(() => {
    if (simulate || !smtcAddress) return;
    let cancelled = false;
    const url = `http://${smtcAddress}:${smtcPort || '5000'}/now-playing`;
    const fetchOnce = async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (cancelled) return;
        // Bentuk umum: { track, artist, art, progressMs, durationMs, status }
        setSmtc({
          title: str(j.track || j.title),
          artist: str(j.artist),
          album: str(j.album),
          cover: str(j.art || j.cover || j.thumbnail),
          status: str(j.status || (j.isPlaying === false ? 'paused' : 'playing'), 'playing'),
          position: typeof j.position === 'number' ? j.position : (typeof j.progressMs === 'number' ? j.progressMs / 1000 : 0),
          durationSec: typeof j.duration === 'number' ? j.duration : (typeof j.durationMs === 'number' ? j.durationMs / 1000 : 0),
        });
      } catch { /* bridge offline — tetap pakai song-update */ }
    };
    fetchOnce();
    const id = setInterval(fetchOnce, 2000);
    return () => { cancelled = true; clearInterval(id); };
  }, [simulate, smtcAddress, smtcPort]);

  const data = useMemo<TemplateData>(() => {
    void tick;
    const now = new Date();
    const total = Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0);

    // Poll summary sesuai fungsi poll widget
    let pollsSummary = '';
    let pollWinner = '';
    let pollTotal = 0;
    const extra: TemplateData = {};
    if (poll && Array.isArray((poll as any).options)) {
      const p: any = poll;
      const opts: string[] = p.options;
      const votes: number[] = Array.isArray(p.votes) ? p.votes : opts.map(() => 0);
      pollTotal = typeof p.total === 'number' ? p.total : votes.reduce((a, b) => a + b, 0);
      const top = votes.indexOf(Math.max(...votes, 0));
      pollWinner = top >= 0 ? str(opts[top]) : '';
      pollsSummary = `${str(p.question)}${pollTotal ? ` • ${pollTotal} votes` : ''}${pollWinner ? ` • ${pollWinner} memimpin` : ''}`;
      opts.slice(0, 6).forEach((o, i) => {
        extra[`opt${i + 1}`] = o;
        extra[`count${i + 1}`] = votes[i] ?? 0;
        extra[`pct${i + 1}`] = pollTotal > 0 ? Math.round(((votes[i] ?? 0) / pollTotal) * 100) : 0;
      });
    }

    const songTitle = str(smtc?.title || song?.title);
    const songCover = str(smtc?.cover || song?.cover);
    const songPos = Number(smtc?.position ?? song?.position ?? 0) || 0;
    const songDur = Number(smtc?.durationSec ?? song?.durationSec ?? 0) || 0;
    const playing = smtc ? str(smtc.status) !== 'paused' : !!song?.isPlaying;

    const timerSec = typeof timer?.timerSeconds === 'number' ? timer.timerSeconds : null;

    return {
      // jam live
      date: now.toLocaleDateString('id-ID'),
      time: now.toLocaleTimeString('id-ID'),
      clock: now.toLocaleTimeString('id-ID'),
      // chat terakhir (fungsi chat widget)
      username: str(chat?.username),
      message: str(chat?.message),
      avatar: str(chat?.avatar),
      // event terakhir (fungsi event/follow widget)
      joinUsername: str(join?.joinUsername),
      followUsername: str(follow?.followUsername),
      followLabel: str(follow?.followLabel),
      giftUsername: str(gift?.giftUsername),
      giftName: str(gift?.giftName),
      giftCount: gift?.giftCount ?? '',
      diamonds: gift?.diamonds ?? '',
      giftPicture: str(gift?.giftPicture),
      likeUsername: str(like?.likeUsername),
      likeCount: like?.likeCount ?? '',
      handle: str(follow?.followUsername ? `@${follow.followUsername}` : chat?.username ? `@${chat.username}` : ''),
      platform: str(chat?.platform || follow?.followPlatform || join?.joinPlatform || 'tiktok'),
      // music real (fungsi music widget) — cover = thumbnail YT asli / SMTC art
      title: songTitle,
      artist: str(smtc?.artist || song?.requestedBy),
      requestedBy: str(song?.requestedBy),
      album: str(smtc?.album),
      cover: songCover,
      thumb: songCover,
      url: str(song?.url),
      videoId: str(song?.videoId),
      progress: songDur > 0 || songPos > 0 ? fmtShort(songPos) : '',
      progressSec: songPos,
      durationSec: songDur,
      durationFmt: songDur > 0 ? fmtShort(songDur) : '',
      status: songTitle ? (playing ? 'playing' : 'paused') : '',
      isPlaying: playing,
      queueCount: song?.queueCount ?? '',
      currentIndex: song?.currentIndex ?? '',
      // timer real (fungsi timer widget)
      timer: timerSec !== null ? fmtClock(timerSec) : '',
      timerSeconds: timerSec ?? '',
      timerRunning: timer ? !!timer.timerRunning : '',
      session: timer?.session ?? '',
      focusMinutes: timer?.focusMinutes ?? '',
      totalSessions: timer?.totalSessions ?? '',
      subathonMode: str(timer?.subathonMode),
      // poll real (fungsi poll widget)
      question: str((poll as any)?.question),
      q: str((poll as any)?.question),
      polls: pollsSummary,
      pollTotal: pollTotal || '',
      pollWinner,
      ...extra,
      // pinned real (fungsi pinned widget)
      pinnedUsername: str(pinned?.pinnedUsername),
      pinnedMessage: str(pinned?.pinnedMessage),
      pinnedAvatar: str(pinned?.pinnedAvatar),
      pinnedPlatform: str(pinned?.pinnedPlatform),
      // counter real (fungsi view-counter widget)
      viewers: total > 0 ? fmtCompact(total) : '',
      totalViewers: total || '',
      tiktokViewers: counts.tiktok ?? '',
      twitchViewers: counts.twitch ?? '',
      youtubeViewers: counts.youtube ?? '',
      kickViewers: counts.kick ?? '',
    };
  }, [tick, chat, gift, like, join, follow, counts, song, timer, poll, pinned, smtc]);

  return { data, connected };
}

export function getLiveDemoData(): TemplateData {
  return {
    username: 'Rizky_JR',
    message: 'Gass keun bang! 🔥',
    avatar: 'https://ui-avatars.com/api/?name=Rizky&background=8b5cf6&color=fff',
    platform: 'tiktok',
    handle: '@Rizky_JR',
    joinUsername: 'BudiSantuy',
    followUsername: 'SitiPlay',
    followLabel: 'followed you',
    giftUsername: 'SitiPlay',
    giftName: 'Rose',
    giftCount: 5,
    diamonds: 5,
    giftPicture: 'https://cdn.../rose.png',
    likeUsername: 'Andi',
    likeCount: 12,
    title: 'Demo Song — Never Gonna Give You Up',
    artist: 'Penonton_A',
    requestedBy: 'Penonton_A',
    cover: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    thumb: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    videoId: 'dQw4w9WgXcQ',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    progress: '1:24',
    progressSec: 84,
    durationSec: 214,
    durationFmt: '3:34',
    status: 'playing',
    isPlaying: true,
    queueCount: 2,
    currentIndex: 0,
    timer: '13:20',
    timerSeconds: 800,
    timerRunning: true,
    session: 1,
    focusMinutes: 50,
    totalSessions: 3,
    subathonMode: 'powerup',
    question: 'Mana turnamen selanjutnya?',
    q: 'Mana turnamen selanjutnya?',
    polls: 'Mana turnamen selanjutnya? • 100 votes • Mobile Legends memimpin',
    pollTotal: 100,
    pollWinner: 'Mobile Legends',
    opt1: 'Mobile Legends',
    opt2: 'Valorant',
    count1: 42,
    count2: 28,
    pct1: 42,
    pct2: 28,
    pinnedUsername: 'Rizky_JR',
    pinnedMessage: 'Gass keun bang, semangat live-nya!',
    pinnedAvatar: 'https://ui-avatars.com/api/?name=Rizky&background=8b5cf6&color=fff',
    pinnedPlatform: 'tiktok',
    viewers: '2.1K',
    totalViewers: 2143,
    tiktokViewers: 1284,
    twitchViewers: 342,
    youtubeViewers: 517,
    kickViewers: 0,
    date: new Date().toLocaleDateString('id-ID'),
    time: new Date().toLocaleTimeString('id-ID'),
    clock: new Date().toLocaleTimeString('id-ID'),
  };
}
