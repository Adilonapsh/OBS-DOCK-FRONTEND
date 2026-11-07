'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { AutoScale } from '../../_shared/components/AutoScale';
import { getPositionStyle } from '../../_shared/constants/positions';
import { getBoolParam, getIntParam, getStringParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getSocketUrl } from '../../_shared/utils/socket';
import {
  DEFAULT_GAME_SETTINGS,
  DIFF_LABEL,
  FACTS_MS,
  GAME_TOPICS,
  getTopicsForRound,
  INTRO_MS,
  LEADERBOARD_MS,
  POINTS,
  REVEAL_MS,
  correctGotMajority,
  fetchTriviaQuestions,
  formatClock,
  getTopicById,
  isAnswerCorrect,
  normalizeText,
  parseGameSettings,
  TRIVIA_GAME_ID,
  voteIndexFor,
  voterPercents,
  type GamePhase,
  type GamePlayer,
  type GameQuestion,
  type GameResult,
  type GameSettings,
  type GameTopic,
} from '../shared';

type Engine = {
  phase: GamePhase;
  questions: GameQuestion[];
  qIndex: number;
  round: number;
  topic: string;
  lang: string;
  questionSec: number;
  maxGuesses: number;
  totalQuestions: number;
  q: GameQuestion | null;
  open: boolean;
  startedAt: number;
  results: GameResult[];
  votes: number[];
  players: Map<string, GamePlayer>;
  seenJoin: Map<string, number>;
  bonusThisQ: Map<string, number>;
  likeProgress: Map<string, number>;
  timers: Set<ReturnType<typeof setTimeout>>;
  interval: ReturnType<typeof setInterval> | null;
  run: number;
};

type ChatPayload = {
  nickname?: string;
  uniqueId?: string;
  comment?: string;
  message?: string;
  profilePictureUrl?: string;
  platform?: string;
  badges?: unknown;
  likeCount?: number;
  repeatCount?: number;
  diamondCount?: number;
  amount?: number;
  donorName?: string;
  donor_name?: string;
  name?: string;
};

type LivePlayerProps = {
  player: GamePlayer;
  rank: number;
  metric: 'total' | 'round';
  showAvatar?: boolean;
};

type SfxKind = 'intro' | 'correct' | 'point' | 'fact';
const CHAMPION_MS = 8000;

// Semua SFX diambil dari FRONTEND/public/games/trivia.
const SFX_FILES: Record<SfxKind, string> = {
  intro: '/games/trivia/intro.mp3',
  correct: '/games/trivia/correct.wav',
  point: '/games/trivia/point_up.wav',
  fact: '/games/trivia/info.wav',
};

/* ============ ACCENT CONTRAST HELPERS ============ */
// Accent bisa dipilih bebas oleh user (termasuk biru gelap). Teks accent perlu
// dicerahkan agar tetap terbaca di background gelap, sedangkan teks di atas
// accent-bg perlu otomatis hitam/putih sesuai kecerahan warna.
type Rgb = { r: number; g: number; b: number };

function hexToRgb(input: string): Rgb | null {
  const raw = String(input || '').trim().replace('#', '');
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)) return null;
  const hex = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function rgbLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function rgbToHex({ r, g, b }: Rgb): string {
  const part = (value: number) => Math.round(value).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

function mixWithWhite(rgb: Rgb, amount: number): Rgb {
  const t = Math.max(0, Math.min(1, amount));
  return {
    r: rgb.r + (255 - rgb.r) * t,
    g: rgb.g + (255 - rgb.g) * t,
    b: rgb.b + (255 - rgb.b) * t,
  };
}

// Warna accent untuk teks di atas background gelap (#050508).
function readableAccent(accent: string): string {
  const rgb = hexToRgb(accent);
  if (!rgb) return accent;
  if (rgbLuminance(rgb) >= 0.25) return accent;
  for (let amount = 0.1; amount <= 0.9; amount += 0.05) {
    const candidate = mixWithWhite(rgb, amount);
    if (rgbLuminance(candidate) >= 0.25) return rgbToHex(candidate);
  }
  return '#ffffff';
}

// Warna teks di atas background accent (badge/chip).
function accentForeground(accent: string): string {
  const rgb = hexToRgb(accent);
  if (!rgb) return '#000000';
  return rgbLuminance(rgb) > 0.179 ? '#000000' : '#ffffff';
}

const TOPIC_VOTE_ALIASES: Record<string, string> = {
  bendera: 'BENDERA',
  flag: 'BENDERA',
  flags: 'BENDERA',
  sejarah: 'SEJARAH',
  history: 'SEJARAH',
  dunia: 'DUNIA',
  world: 'DUNIA',
  geografi: 'DUNIA',
  mitos: 'MITOS',
  myth: 'MITOS',
  fakta: 'MITOS',
  benar: 'MITOS',
  'benar mitos': 'MITOS',
  'fakta mitos': 'MITOS',
};

const DEMO_NAMES = [
  'Jekk', 'aghaaa', 'peeano', 'restufm_', 'rell', 'putrasitanggang', 'Day_17', 'je',
  'Math is Me', 'nadiaa', 'siti', 'bimaa_', 'sari.k', 'kevin88', 'dimas_r', 'putri.ay', 'rizky',
  'anisa', 'fajar99', 'lina_m', 'galih', 'yoga', 'maya', 'dewi_s', 'andi', 'rafi', 'tika',
  'bayu', 'citra', 'eko', 'farhan', 'salsa', 'arga', 'nova', 'hendra', 'wulan', 'reza',
  'intan', 'dika', 'mira', 'zaki',
];

const DEMO_PLATFORMS = ['tiktok', 'youtube', 'twitch', 'kick'] as const;

const PLATFORM_META: Record<string, { src: string; label: string }> = {
  tiktok: { src: '/assets/logo/tik-tok.png', label: 'TikTok' },
  youtube: { src: '/assets/logo/youtube.png', label: 'YouTube' },
  yt: { src: '/assets/logo/youtube.png', label: 'YouTube' },
  twitch: { src: '/assets/logo/twitch.png', label: 'Twitch' },
  kick: { src: '/assets/logo/kick.png', label: 'Kick' },
};

function platformMeta(platform?: string): { src: string; label: string } | null {
  const key = String(platform || '').toLowerCase().trim();
  if (!key) return null;
  if (PLATFORM_META[key]) return PLATFORM_META[key];
  if (key.includes('tiktok')) return PLATFORM_META.tiktok;
  if (key.includes('youtube')) return PLATFORM_META.youtube;
  if (key.includes('twitch')) return PLATFORM_META.twitch;
  if (key.includes('kick')) return PLATFORM_META.kick;
  return null;
}

function keyOf(name: string): string {
  return String(name || '').trim().toLowerCase();
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function Avatar({
  name,
  url,
  size,
  className = '',
  fill = false,
}: {
  name: string;
  url?: string;
  size: number;
  className?: string;
  fill?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const initial = ([...String(name || '?')][0] || '?').toUpperCase();
  return (
    <div
      className={`${fill ? 'rounded-none' : 'rounded-full border border-gray-600'} overflow-hidden bg-gray-700 flex items-center justify-center shrink-0 font-bold text-white ${className}`}
      style={{ width: fill ? '100%' : size, height: fill ? '100%' : size, fontSize: Math.round(size * 0.45) }}
    >
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

function PlatformBadge({
  platform,
  size = 14,
  className = '',
}: {
  platform?: string;
  size?: number;
  className?: string;
}) {
  const meta = platformMeta(platform);
  if (!meta) return null;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={meta.src}
      alt={meta.label}
      title={meta.label}
      aria-label={meta.label}
      className={`object-contain shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        filter: 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.85))',
      }}
    />
  );
}

function AnimatedScore({
  value,
  prefix = '',
  className = '',
}: {
  value: number;
  prefix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) {
      setDisplay(value);
      return;
    }
    const from = prev.current;
    const to = value;
    prev.current = value;
    const started = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / 850);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span className={className}>
      {prefix}
      {display.toLocaleString('id-ID')}
    </span>
  );
}

function CountUp({
  value,
  prefix = '',
  delay = 0,
  className = '',
}: {
  value: number;
  prefix?: string;
  delay?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    let started = 0;
    const timer = window.setTimeout(() => {
      const step = (now: number) => {
        if (!started) started = now;
        const p = Math.min(1, (now - started) / 900);
        const ease = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(value * ease));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, delay]);
  return (
    <span className={className}>
      {prefix}
      {display.toLocaleString('id-ID')}
    </span>
  );
}

function LivePlayer({ player, rank, metric, showAvatar = true }: LivePlayerProps) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-0 z-10">
      <div className="flex items-center gap-2">
        <span className={`g-mono text-[11px] font-bold ${rank === 0 ? 'g-accent-on-dark' : 'text-gray-300'}`}>
          {String(rank + 1).padStart(2, '0')}
        </span>
        {showAvatar && <Avatar name={player.username} url={player.avatar} size={44} />}
      </div>
      <span className="flex items-center justify-center gap-1 max-w-full">
        <PlatformBadge platform={player.platform} size={14} />
        <span className="text-xs font-bold truncate">{player.username}</span>
      </span>
      <AnimatedScore value={player[metric]} className="g-mono text-sm font-bold" />
    </div>
  );
}

function GamesInner() {
  const searchParams = useSearchParams();
  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);
  const cfg = useMemo<GameSettings>(() => parseGameSettings(params), [params]);
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const compactLayout =
    viewport.width < 1024 || viewport.height < 760 || viewport.width / viewport.height < 1.2;
  const portraitLayout = viewport.height > viewport.width;
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);
  const pos = getStringParam(params, 'pos', cfg.pos);
  const posStyle = getPositionStyle(pos);

  const initialTopic = useMemo(() => getTopicById(cfg.topic), [cfg.topic]);

  const [phase, setPhase] = useState<GamePhase>('topics');
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [topicKey, setTopicKey] = useState(initialTopic.id);
  const [lang, setLang] = useState(cfg.lang);
  const [questionSec, setQuestionSec] = useState(cfg.questionSec);
  const [timeLeft, setTimeLeft] = useState(cfg.questionSec);
  const [playerList, setPlayerList] = useState<GamePlayer[]>([]);
  const [results, setResults] = useState<GameResult[]>([]);
  const [votes, setVotes] = useState<number[]>([]);
  const [showPercents, setShowPercents] = useState(false);
  const [factsShown, setFactsShown] = useState(false);
  const [rulesStatus, setRulesStatus] = useState('Memuat soal...');
  const [fallback, setFallback] = useState(false);
  const [connected, setConnected] = useState(simulate);
  const [topicVotes, setTopicVotes] = useState<Record<string, number>>({});
  const [topicVoteLeft, setTopicVoteLeft] = useState(0);
  const [topicVoteTotal, setTopicVoteTotal] = useState(0);
  const [topicVoteStarted, setTopicVoteStarted] = useState(false);
  const [topicVoteClosed, setTopicVoteClosed] = useState(false);
  const [topicVoteNonce, setTopicVoteNonce] = useState(0);
  const topicVoteMapRef = useRef<Map<string, string>>(new Map());
  const topicVotesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const accent = cfg.accent || '#ff5500';
  const accentText = useMemo(() => readableAccent(accent), [accent]);
  const accentFg = useMemo(() => accentForeground(accent), [accent]);
  const langRef = useRef(cfg.lang);
  const questionSecRef = useRef(cfg.questionSec);
  const topicRef = useRef(initialTopic.id);
  const totalQuestionsRef = useRef(cfg.totalQuestions);
  const maxGuessesRef = useRef(cfg.maxGuesses);
  const socketRef = useRef<Socket | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const startRef = useRef<(topic?: string, opts?: StartOptions) => Promise<void>>(async () => {});

  const engineRef = useRef<Engine>({
    phase: 'topics',
    questions: [],
    qIndex: 0,
    round: 1,
    topic: initialTopic.id,
    lang: cfg.lang,
    questionSec: cfg.questionSec,
    maxGuesses: cfg.maxGuesses,
    totalQuestions: cfg.totalQuestions,
    q: null,
    open: false,
    startedAt: 0,
    results: [],
    votes: [],
    players: new Map(),
    seenJoin: new Map(),
    bonusThisQ: new Map(),
    likeProgress: new Map(),
    timers: new Set(),
    interval: null,
    run: 0,
  });

  const syncPlayers = useCallback(() => {
    setPlayerList(Array.from(engineRef.current.players.values()).map((p) => ({ ...p })));
  }, []);

  const clearTimers = useCallback(() => {
    const engine = engineRef.current;
    engine.timers.forEach((id) => clearTimeout(id));
    engine.timers.clear();
    if (engine.interval) {
      clearInterval(engine.interval);
      engine.interval = null;
    }
  }, []);

  const resetTopicVote = useCallback(() => {
    topicVoteMapRef.current.clear();
    topicVotesRef.current = {};
    setTopicVotes({});
  }, []);

  const beginTopicVote = useCallback(() => {
    if (!cfgRef.current.topicVote || engineRef.current.phase !== 'topics' || topicVoteStarted) return;
    resetTopicVote();
    setTopicVoteClosed(false);
    setTopicVoteStarted(true);
    setTopicVoteNonce((n) => n + 1);
  }, [resetTopicVote, topicVoteStarted]);

  const sleep = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      const engine = engineRef.current;
      const id = setTimeout(() => {
        engine.timers.delete(id);
        resolve();
      }, ms);
      engine.timers.add(id);
    });
  }, []);

  const schedule = useCallback((run: number, fn: () => void, ms: number) => {
    const engine = engineRef.current;
    const id = setTimeout(() => {
      engine.timers.delete(id);
      if (run !== engine.run) return;
      fn();
    }, ms);
    engine.timers.add(id);
    return id;
  }, []);

  const sfxRef = useRef<Partial<Record<SfxKind, HTMLAudioElement>>>({});

  const playSfx = useCallback((kind: SfxKind) => {
    const conf = cfgRef.current;
    if (!conf.sfx || typeof window === 'undefined') return;
    try {
      let audio = sfxRef.current[kind];
      if (!audio) {
        audio = new Audio(SFX_FILES[kind]);
        audio.preload = 'auto';
        sfxRef.current[kind] = audio;
      }
      audio.volume = Math.max(0, Math.min(1, conf.sfxVolume / 100));
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    } catch {
      // Autoplay bisa diblokir browser; OBS biasanya mengizinkan.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (Object.keys(SFX_FILES) as SfxKind[]).forEach((kind) => {
      if (sfxRef.current[kind]) return;
      const audio = new Audio(SFX_FILES[kind]);
      audio.preload = 'auto';
      audio.load();
      sfxRef.current[kind] = audio;
    });
  }, []);

  const getPlayer = useCallback(
    (username: string, avatar?: string, platform?: string): GamePlayer | null => {
      const engine = engineRef.current;
      const key = keyOf(username);
      if (!key) return null;
      let player = engine.players.get(key);
      if (!player) {
        player = {
          username: String(username).trim() || 'User',
          avatar: avatar || '',
          platform: platform || undefined,
          total: 0,
          round: 0,
          correctAnswers: 0,
          streak: 0,
          guesses: 0,
          extraGuesses: 0,
          answeredQ: false,
          correctQ: false,
          voted: false,
        };
        engine.players.set(key, player);
        syncPlayers();
      } else {
        let changed = false;
        if (avatar && !player.avatar) {
          player.avatar = avatar;
          changed = true;
        }
        if (platform && !player.platform) {
          player.platform = platform;
          changed = true;
        }
        if (changed) syncPlayers();
      }
      return player;
    },
    [syncPlayers],
  );

  const isRoundActive = useCallback(() => {
    const p = engineRef.current.phase;
    return p !== 'topics' && p !== 'rules' && p !== 'champion';
  }, []);

  const awardBonus = useCallback(
    (username: string, avatar: string | undefined, points: number, platform?: string) => {
      const conf = cfgRef.current;
      const engine = engineRef.current;
      if (!isRoundActive()) {
        getPlayer(username, avatar, platform);
        return;
      }
      const player = getPlayer(username, avatar, platform);
      if (!player || points <= 0) return;
      const key = keyOf(player.username);
      const used = engine.bonusThisQ.get(key) || 0;
      const cap = Math.max(0, conf.maxBonusPerQuestion);
      const add = Math.max(0, Math.min(points, cap - used));
      if (!add) return;
      engine.bonusThisQ.set(key, used + add);
      player.total += add;
      player.round += add;
      syncPlayers();
    },
    [getPlayer, isRoundActive, syncPlayers],
  );

  const beginQuestionState = useCallback(() => {
    const engine = engineRef.current;
    engine.results = [];
    engine.votes = [];
    engine.open = false;
    engine.q = null;
    engine.bonusThisQ.clear();
    engine.likeProgress.clear();
    engine.players.forEach((p) => {
      p.guesses = 0;
      p.extraGuesses = 0;
      p.answeredQ = false;
      p.correctQ = false;
      p.voted = false;
    });
    setResults([]);
    setVotes([]);
    setShowPercents(false);
    setFactsShown(false);
    syncPlayers();
  }, [syncPlayers]);

  const recordVote = useCallback((q: GameQuestion, text: string) => {
    if (!q.options.length) return;
    let index = -1;
    if (isAnswerCorrect(q, text)) {
      index = q.options.findIndex((o) => normalizeText(o) === normalizeText(q.correct));
    }
    if (index < 0) index = voteIndexFor(q, text);
    if (index < 0) return;
    const engine = engineRef.current;
    engine.votes[index] = (engine.votes[index] || 0) + 1;
    setVotes([...engine.votes]);
  }, []);

  const submitAnswer = useCallback(
    (username: string, avatar: string | undefined, text: string, platform?: string) => {
      const engine = engineRef.current;
      if (!engine.open || !engine.q) return;
      const player = getPlayer(username, avatar, platform);
      if (!player) return;
      const limit = Math.max(1, engine.maxGuesses + player.extraGuesses);
      if (player.correctQ || player.guesses >= limit) return;

      player.guesses += 1;
      player.answeredQ = true;
      if (!player.voted) {
        player.voted = true;
        recordVote(engine.q, text);
      }

      if (isAnswerCorrect(engine.q, text)) {
        const elapsed = performance.now() - engine.startedAt;
        const left = Math.max(0, 1 - elapsed / (engine.questionSec * 1000));
        const base = POINTS[engine.q.difficulty] || 100;
        const points = base + Math.round(50 * left);
        player.correctQ = true;
        player.correctAnswers += 1;
        player.streak += 1;
        player.total += points;
        player.round += points;
        engine.results.push({
          key: keyOf(player.username),
          username: player.username,
          avatar: player.avatar,
          platform: player.platform,
          time: elapsed,
          points,
          streak: player.streak,
        });
        setResults([...engine.results]);
      }
      syncPlayers();
    },
    [getPlayer, recordVote, syncPlayers],
  );

  const handleLike = useCallback(
    (data: ChatPayload) => {
      const name = data.nickname || data.uniqueId;
      if (!name) return;
      const platform = data.platform || 'tiktok';
      const player = getPlayer(name, data.profilePictureUrl, platform);
      if (!player) return;
      const conf = cfgRef.current;
      const count = Math.max(1, Number(data.likeCount) || 1);
      awardBonus(name, data.profilePictureUrl, conf.likePoints * count, platform);

      if (conf.likeExtraGuessEvery > 0 && engineRef.current.phase === 'question') {
        const engine = engineRef.current;
        const key = keyOf(player.username);
        const total = (engine.likeProgress.get(key) || 0) + count;
        const gained = Math.floor(total / conf.likeExtraGuessEvery);
        if (gained > 0) {
          player.extraGuesses = Math.min(3, player.extraGuesses + gained);
          engine.likeProgress.set(key, total % conf.likeExtraGuessEvery);
          syncPlayers();
        } else {
          engine.likeProgress.set(key, total);
        }
      }
    },
    [awardBonus, getPlayer, syncPlayers],
  );

  const handleFollow = useCallback(
    (data: ChatPayload) => {
      const name = data.nickname || data.uniqueId;
      if (!name) return;
      const engine = engineRef.current;
      const key = keyOf(name);
      const now = Date.now();
      const last = engine.seenJoin.get(key) || 0;
      const platform = data.platform || 'tiktok';
      const player = getPlayer(name, data.profilePictureUrl, platform);
      if (!player) return;
      if (now - last < 8000) return;
      engine.seenJoin.set(key, now);
      if (engine.seenJoin.size > 500) {
        Array.from(engine.seenJoin.entries())
          .filter(([, ts]) => now - ts > 60000)
          .forEach(([k]) => engine.seenJoin.delete(k));
      }
      const conf = cfgRef.current;
      awardBonus(name, data.profilePictureUrl, conf.followPoints, platform);
      if (engine.phase === 'question' && conf.followExtraGuess > 0) {
        player.extraGuesses = Math.min(3, player.extraGuesses + conf.followExtraGuess);
        syncPlayers();
      }
    },
    [awardBonus, getPlayer, syncPlayers],
  );

  const handleGift = useCallback(
    (data: ChatPayload) => {
      const name = data.nickname || data.uniqueId;
      if (!name) return;
      const repeat = Math.max(1, Number(data.repeatCount) || 1);
      const platform = data.platform || 'tiktok';
      awardBonus(name, data.profilePictureUrl, cfgRef.current.giftPoints * repeat, platform);
      getPlayer(name, data.profilePictureUrl, platform);
    },
    [awardBonus, getPlayer],
  );

  const handleDonation = useCallback(
    (data: ChatPayload) => {
      const name = data.nickname || data.uniqueId || data.donorName || data.donor_name || data.name || 'Donatur';
      awardBonus(name, data.profilePictureUrl, cfgRef.current.donationPoints, data.platform);
      getPlayer(name, data.profilePictureUrl, data.platform);
    },
    [awardBonus, getPlayer],
  );

  const startRound = useCallback(
    async (topicId?: string, opts?: StartOptions) => {
      const engine = engineRef.current;
      const conf = cfgRef.current;
      const run = ++engine.run;
      clearTimers();
      setTopicVoteStarted(false);

      const topic = getTopicById(topicId || engine.topic || conf.topic);
      const nextSec = Math.max(5, Math.min(600, Math.round(opts?.questionSec ?? questionSecRef.current ?? conf.questionSec)));
      const nextTotal = Math.max(1, Math.min(30, Math.round(opts?.totalQuestions ?? totalQuestionsRef.current ?? conf.totalQuestions)));
      const nextGuesses = Math.max(1, Math.min(10, Math.round(opts?.maxGuesses ?? maxGuessesRef.current ?? conf.maxGuesses)));
      const nextLang = opts?.lang || langRef.current || conf.lang;

      engine.topic = topic.id;
      engine.lang = nextLang;
      engine.questionSec = nextSec;
      engine.totalQuestions = nextTotal;
      engine.maxGuesses = nextGuesses;
      engine.qIndex = 0;
      engine.questions = [];
      engine.q = null;
      engine.open = false;
      engine.results = [];
      engine.votes = [];
      engine.phase = 'rules';
      topicRef.current = topic.id;
      questionSecRef.current = nextSec;
      totalQuestionsRef.current = nextTotal;
      maxGuessesRef.current = nextGuesses;
      langRef.current = nextLang;

      setTopicKey(topic.id);
      setLang(nextLang);
      setQuestionSec(nextSec);
      setQIndex(0);
      setQuestions([]);
      setResults([]);
      setVotes([]);
      setTimeLeft(nextSec);
      setFactsShown(false);
      setShowPercents(false);
      setRulesStatus('Memuat soal...');
      setPhase('rules');

      engine.players.forEach((p) => {
        p.round = 0;
        p.correctAnswers = 0;
        p.guesses = 0;
        p.extraGuesses = 0;
        p.answeredQ = false;
        p.correctQ = false;
        p.voted = false;
      });
      syncPlayers();

      const data = await fetchTriviaQuestions(topic.id, opts?.mode || topic.mode, nextLang, conf.apiUrl, nextTotal);
      if (run !== engine.run) return;

      engine.questions = data.list;
      setQuestions(data.list);
      setFallback(data.fallback);

      setRulesStatus('Mulai dalam 3...');
      await sleep(1000);
      if (run !== engine.run) return;
      setRulesStatus('Mulai dalam 2...');
      await sleep(1000);
      if (run !== engine.run) return;
      setRulesStatus('Mulai dalam 1...');
      await sleep(1000);
      if (run !== engine.run) return;
      showIntro(run);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearTimers, sleep, syncPlayers],
  );

  const showIntro = useCallback(
    (run: number) => {
      const engine = engineRef.current;
      if (run !== engine.run) return;
      if (engine.qIndex >= engine.questions.length) {
        finishGame(run);
        return;
      }
      const question = engine.questions[engine.qIndex];
      if (!question) {
        finishGame(run);
        return;
      }
      beginQuestionState();
      engine.q = question;
      engine.phase = 'intro';
      setPhase('intro');
      playSfx('intro');
      schedule(run, () => playQuestion(run), INTRO_MS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [beginQuestionState, playSfx, schedule],
  );

  const playQuestion = useCallback(
    (run: number) => {
      const engine = engineRef.current;
      if (run !== engine.run) return;
      const question = engine.q;
      if (!question) return;

      engine.phase = 'question';
      engine.open = true;
      engine.startedAt = performance.now();
      engine.results = [];
      engine.votes = [];
      engine.bonusThisQ.clear();
      engine.likeProgress.clear();
      setPhase('question');
      setResults([]);
      setVotes([]);
      setShowPercents(false);
      setFactsShown(false);
      setTimeLeft(engine.questionSec);
      syncPlayers();

      if (engine.interval) clearInterval(engine.interval);
      let left = engine.questionSec;
      engine.interval = setInterval(() => {
        if (run !== engine.run) {
          if (engine.interval) clearInterval(engine.interval);
          engine.interval = null;
          return;
        }
        left -= 1;
        setTimeLeft(Math.max(0, left));
        if (left <= 0) {
          if (engine.interval) clearInterval(engine.interval);
          engine.interval = null;
          finishQuestion(run);
        }
      }, 1000);

      if (simulate || cfgRef.current.demoPlayers) startDemoTraffic(question, run);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [syncPlayers],
  );

  const showLeaderboard = useCallback(
    (run: number) => {
      const engine = engineRef.current;
      if (run !== engine.run) return;
      engine.phase = 'leaderboard';
      setPhase('leaderboard');
      playSfx('point');
      (async () => {
        await sleep(LEADERBOARD_MS);
        if (run !== engine.run) return;
        engine.qIndex += 1;
        setQIndex(engine.qIndex);
        showIntro(run);
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playSfx, showIntro, sleep],
  );

  const finishQuestion = useCallback(
    (run: number) => {
      const engine = engineRef.current;
      if (run !== engine.run) return;
      if (!engine.open) return;

      engine.open = false;
      if (engine.interval) {
        clearInterval(engine.interval);
        engine.interval = null;
      }
      engine.players.forEach((p) => {
        if (!p.correctQ) p.streak = 0;
      });
      syncPlayers();

      const question = engine.q;
      engine.phase = 'reveal';
      setPhase('reveal');
      setFactsShown(false);

      if (question && cfgRef.current.showPercent) {
        setShowPercents(false);
        schedule(run, () => setShowPercents(true), 800);
      }
      if (question && cfgRef.current.sfx && correctGotMajority(question, engine.votes)) {
        schedule(run, () => playSfx('correct'), 800);
      }

      (async () => {
        await sleep(REVEAL_MS);
        if (run !== engine.run) return;
        if (question && cfgRef.current.showFacts && question.facts) {
          setFactsShown(true);
          playSfx('fact');
          await sleep(FACTS_MS);
          if (run !== engine.run) return;
          setFactsShown(false);
          await sleep(350);
          if (run !== engine.run) return;
        }
        showLeaderboard(run);
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playSfx, schedule, showLeaderboard, sleep, syncPlayers],
  );

  const finishGame = useCallback(
    (run: number) => {
      const engine = engineRef.current;
      if (run !== engine.run) return;
      engine.open = false;
      engine.q = null;
      engine.phase = 'champion';
      setPhase('champion');
      syncPlayers();

      (async () => {
        await sleep(CHAMPION_MS);
        if (run !== engine.run) return;
        engine.phase = 'topics';
        engine.qIndex = 0;
        engine.questions = [];
        engine.round += 1;
        engine.players.forEach((p) => {
          p.round = 0;
          p.correctAnswers = 0;
        });
        setPhase('topics');
        setTopicVoteStarted(false);
        setQIndex(0);
        setQuestions([]);
        setResults([]);
        setVotes([]);
        setFactsShown(false);
        setShowPercents(false);
        setRound(engine.round);
        setTopicVoteClosed(false);
        resetTopicVote();
        syncPlayers();
        if (simulate && !cfgRef.current.topicVote) schedule(run, () => void startRound(), 2500);
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resetTopicVote, schedule, sleep, startRound, syncPlayers],
  );

  const skip = useCallback(() => {
    const engine = engineRef.current;
    const run = ++engine.run;
    clearTimers();
    if (engine.phase === 'question') {
      engine.open = true;
      finishQuestion(run);
      return;
    }
    if (engine.phase === 'intro') {
      playQuestion(run);
      return;
    }
    if (engine.phase === 'reveal' || engine.phase === 'leaderboard') {
      engine.qIndex += 1;
      setQIndex(engine.qIndex);
      showIntro(run);
      return;
    }
    void startRound(engine.topic);
  }, [clearTimers, finishQuestion, playQuestion, showIntro, startRound]);

  const stopGame = useCallback(() => {
    const engine = engineRef.current;
    engine.run += 1;
    clearTimers();
    engine.open = false;
    engine.q = null;
    engine.phase = 'topics';
    engine.qIndex = 0;
    engine.questions = [];
    setPhase('topics');
    setTopicVoteStarted(false);
    setQuestions([]);
    setQIndex(0);
    setResults([]);
    setVotes([]);
    setFactsShown(false);
    setShowPercents(false);
    setTopicVoteClosed(true);
    resetTopicVote();
  }, [clearTimers, resetTopicVote]);

  const resetGame = useCallback(() => {
    stopGame();
    const engine = engineRef.current;
    engine.players.clear();
    engine.seenJoin.clear();
    engine.bonusThisQ.clear();
    engine.likeProgress.clear();
    engine.round = 1;
    setPlayerList([]);
    setRound(1);
    setTopicVoteClosed(false);
    setTopicVoteNonce((n) => n + 1);
  }, [stopGame]);

  const setTopic = useCallback((id: string) => {
    const topic = getTopicById(id);
    engineRef.current.topic = topic.id;
    topicRef.current = topic.id;
    setTopicKey(topic.id);
  }, []);

  const setDuration = useCallback((sec: number) => {
    const value = Math.max(5, Math.min(600, Math.round(sec)));
    questionSecRef.current = value;
    engineRef.current.questionSec = value;
    setQuestionSec(value);
  }, []);

  const setLanguage = useCallback((value: string) => {
    langRef.current = value;
    engineRef.current.lang = value;
    setLang(value);
  }, []);

  const leadingTopicId = useCallback((): string => {
    let best = '';
    let bestCount = 0;
    for (const topic of getTopicsForRound(engineRef.current.round)) {
      const count = topicVotesRef.current[topic.id] || 0;
      if (count > bestCount) {
        best = topic.id;
        bestCount = count;
      }
    }
    return best || getTopicsForRound(engineRef.current.round)[0]?.id || topicRef.current || cfgRef.current.topic;
  }, []);

  const handleTopicVote = useCallback((raw: string, name: string) => {
    if (engineRef.current.phase !== 'topics' || topicVoteClosed || !topicVoteStarted) return;
    const userKey = keyOf(name);
    if (!userKey) return;

    const text = normalizeText(raw);
    if (!text) return;

    let topicId = '';
    const letter = text.match(/^(?:pilih|vote|v)?\s*([a-d])$/);
    if (letter) {
      const visibleTopics = getTopicsForRound(engineRef.current.round);
      topicId = visibleTopics['abcd'.indexOf(letter[1])]?.id || '';
    } else {
      topicId = TOPIC_VOTE_ALIASES[text] || '';
      if (!topicId) {
        const found = getTopicsForRound(engineRef.current.round).find((t) => {
          const id = normalizeText(t.id);
          const label = normalizeText(t.label);
          return text === id || text === label;
        });
        if (found) topicId = found.id;
      }
    }
    if (!getTopicsForRound(engineRef.current.round).some((topic) => topic.id === topicId)) return;
    if (!topicId) return;

    const prev = topicVoteMapRef.current.get(userKey);
    if (prev === topicId) return;

    const counts = { ...topicVotesRef.current };
    if (prev) counts[prev] = Math.max(0, (counts[prev] || 0) - 1);
    counts[topicId] = (counts[topicId] || 0) + 1;
    topicVoteMapRef.current.set(userKey, topicId);
    topicVotesRef.current = counts;
    setTopicVotes(counts);
  }, [topicVoteClosed, topicVoteStarted]);

  const hasPrivilege = useCallback((data: ChatPayload) => {
    const badges = Array.isArray(data.badges)
      ? data.badges.map((b) => String(b).toLowerCase())
      : [];
    return badges.some((b) => ['broadcaster', 'mod', 'owner', 'moderator'].includes(b)) || Boolean((data as { isModerator?: boolean }).isModerator);
  }, []);

  const handleCommand = useCallback(
    (args: string, data: ChatPayload) => {
      const conf = cfgRef.current;
      if (conf.chatControl === 'off') return;
      if (conf.chatControl === 'mods' && !hasPrivilege(data)) return;

      const parts = args.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const first = parts[0] || 'start';
      const engine = engineRef.current;

      if (first === 'start' || first === 'mulai' || first === 'go') {
        if (conf.topicVote && engine.phase === 'topics') {
          beginTopicVote();
          return;
        }
        void startRound(engine.topic);
        return;
      }
      if (first === 'skip' || first === 'next' || first === 'lanjut') {
        skip();
        return;
      }
      if (first === 'stop' || first === 'end' || first === 'berhenti') {
        stopGame();
        return;
      }
      if (first === 'reset' || first === 'ulang') {
        resetGame();
        return;
      }
      if (first === 'topic' || first === 'topik') {
        if (parts[1]) setTopic(parts[1]);
        return;
      }
      const matched = GAME_TOPICS.find(
        (t) => t.id.toLowerCase() === first || t.label.toLowerCase() === first,
      );
      if (matched) {
        if (conf.topicVote && topicVoteStarted && engine.phase === 'topics' && !topicVoteClosed) {
          handleTopicVote(matched.id, data.nickname || data.uniqueId || 'User');
        } else {
          void startRound(matched.id);
        }
      }
    },
    [beginTopicVote, handleTopicVote, hasPrivilege, resetGame, setTopic, skip, startRound, stopGame, topicVoteClosed, topicVoteStarted],
  );

  const handleChat = useCallback(
    (data: ChatPayload) => {
      const text = String(data.comment ?? data.message ?? '').trim();
      if (!text) return;
      const name = data.nickname || data.uniqueId || 'User';
      const command = (cfgRef.current.command || '!trivia').trim().toLowerCase();

      if (text.toLowerCase().startsWith(command)) {
        handleCommand(text.slice(command.length).trim(), data);
        return;
      }
      if (text.startsWith('!')) return; // command lain jangan dianggap jawaban
      if (engineRef.current.phase === 'topics' && cfgRef.current.topicVote && topicVoteStarted) {
        handleTopicVote(text, name);
        return;
      }
      if (engineRef.current.phase === 'question' && engineRef.current.open) {
        submitAnswer(name, data.profilePictureUrl, text, data.platform || 'tiktok');
      }
    },
    [handleCommand, handleTopicVote, submitAnswer, topicVoteStarted],
  );

  const startDemoTraffic = useCallback(
    (question: GameQuestion, run: number) => {
      const engine = engineRef.current;
      const wrongPool =
        question.type === 'image'
          ? ['mars', 'bulan', 'jupiter', 'apel', 'kucing', 'candi']
          : question.options.filter((o) => o !== question.correct);
      const letters = 'abcd';
      const crowd = shuffle(DEMO_NAMES).slice(0, 14 + Math.floor(Math.random() * 24));
      const crowdPlatforms = new Map<string, string>();
      crowd.forEach((name, i) => crowdPlatforms.set(name, DEMO_PLATFORMS[i % DEMO_PLATFORMS.length]));

      const say = (ok: boolean) => {
        if (ok) {
          const letter =
            question.type !== 'image' && question.options.length && Math.random() < 0.3
              ? letters[question.options.indexOf(question.correct)]
              : '';
          return letter || question.correct;
        }
        return wrongPool[Math.floor(Math.random() * wrongPool.length)] || question.correct;
      };

      crowd.forEach((name) => {
        const avatar = `https://i.pravatar.cc/100?u=${encodeURIComponent(name)}`;
        const platform = crowdPlatforms.get(name);
        const firstTry = 800 + Math.random() * Math.max(600, engine.questionSec * 1000 - 2500);
        const good = Math.random() < 0.5;
        schedule(run, () => submitAnswer(name, avatar, say(good), platform), firstTry);
        if (!good && Math.random() < 0.35) {
          const retry = Math.min(firstTry + 1500 + Math.random() * 3000, engine.questionSec * 1000 - 300);
          schedule(run, () => submitAnswer(name, avatar, say(Math.random() < 0.6), platform), Math.max(firstTry + 300, retry));
        }
      });

      const eventNames = crowd.slice(0, 4);
      const makeAvatar = (name: string) => `https://i.pravatar.cc/100?u=${encodeURIComponent(name)}`;
      if (eventNames[0]) {
        schedule(
          run,
          () => handleLike({ nickname: eventNames[0], profilePictureUrl: makeAvatar(eventNames[0]), likeCount: 2, platform: crowdPlatforms.get(eventNames[0]) }),
          Math.min(2200, engine.questionSec * 1000 - 600),
        );
      }
      if (eventNames[1]) {
        schedule(
          run,
          () => handleFollow({ nickname: eventNames[1], profilePictureUrl: makeAvatar(eventNames[1]), platform: crowdPlatforms.get(eventNames[1]) }),
          Math.min(3400, engine.questionSec * 1000 - 600),
        );
      }
      if (eventNames[2]) {
        schedule(
          run,
          () => handleGift({ nickname: eventNames[2], profilePictureUrl: makeAvatar(eventNames[2]), repeatCount: 1, platform: crowdPlatforms.get(eventNames[2]) }),
          Math.min(4600, engine.questionSec * 1000 - 600),
        );
      }
    },
    [handleFollow, handleGift, handleLike, schedule, submitAnswer],
  );

  // Keep latest handlers reachable from the long-lived socket listeners.
  const apiRef = useRef({
    handleChat,
    handleLike,
    handleFollow,
    handleGift,
    handleDonation,
    beginTopicVote,
    startRound,
    skip,
    stopGame,
    resetGame,
    setTopic,
  });
  apiRef.current = {
    handleChat,
    handleLike,
    handleFollow,
    handleGift,
    handleDonation,
    beginTopicVote,
    startRound,
    skip,
    stopGame,
    resetGame,
    setTopic,
  };
  startRef.current = startRound;

  /* ============ FONTS & BGM ============ */
  useEffect(() => {
    loadGoogleFont('Jost', '400;500;600;700;800;900', 'games-jost-font');
    loadGoogleFont(cfg.font, '400;500;600;700;800;900', 'games-font');
    loadGoogleFont(cfg.headingFont, '500;700', 'games-heading-font');
  }, [cfg.font, cfg.headingFont]);

  useEffect(() => {
    if (!cfg.bgmUrl || typeof Audio === 'undefined') return;
    const audio = new Audio(cfg.bgmUrl);
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, cfg.bgmVolume / 100));
    audio.preload = 'auto';
    audio.play().catch(() => {});
    bgmRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
      bgmRef.current = null;
    };
  }, [cfg.bgmUrl, cfg.bgmVolume]);

  /* ============ SOCKET: CHAT + EVENT REWARDS ============ */
  useEffect(() => {
    if (simulate) {
      setConnected(true);
      return;
    }
    const socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    const room = privateKey || 'global';

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', room);
      socket.emit('game-get', { privateKey: room, gameId: TRIVIA_GAME_ID });
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('tiktok-chat', (data: ChatPayload) => apiRef.current.handleChat(data));
    socket.on('tiktok-like', (data: ChatPayload) => apiRef.current.handleLike(data));
    socket.on('tiktok-follow', (data: ChatPayload) => apiRef.current.handleFollow(data));
    socket.on('tiktok-member', (data: ChatPayload) => apiRef.current.handleFollow(data));
    socket.on('tiktok-gift', (data: ChatPayload) => apiRef.current.handleGift(data));
    socket.on('donation', (data: ChatPayload) => apiRef.current.handleDonation(data));

    socket.on('game-command', (data: Record<string, unknown>) => {
      if ((data?.gameId || TRIVIA_GAME_ID) !== TRIVIA_GAME_ID) return;
      const action = String(data?.action || '');
      const engine = engineRef.current;
      if (action === 'start') {
        const requested = String(data?.topic || '');
        if (cfgRef.current.topicVote && !requested && engine.phase === 'topics') {
          apiRef.current.beginTopicVote();
          return;
        }
        const pick = requested || engine.topic;
        const topic = getTopicById(pick);
        void apiRef.current.startRound(topic.id, {
          questionSec: Number(data?.questionSec) || undefined,
          totalQuestions: Number(data?.totalQuestions) || undefined,
          maxGuesses: Number(data?.maxGuesses) || undefined,
          lang: typeof data?.lang === 'string' ? data.lang : undefined,
          mode: topic.mode,
        });
      } else if (action === 'skip') {
        apiRef.current.skip();
      } else if (action === 'stop') {
        apiRef.current.stopGame();
      } else if (action === 'reset') {
        apiRef.current.resetGame();
      } else if (action === 'topic' && typeof data?.topic === 'string') {
        apiRef.current.setTopic(data.topic);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [privateKey, simulate]);

  /* ============ TOPIC VOTING TIMER ============ */
  useEffect(() => {
    if (phase !== 'topics') return;
    const conf = cfgRef.current;
    if (!conf.topicVote || topicVoteClosed || !topicVoteStarted) {
      setTopicVoteLeft(0);
      setTopicVoteTotal(0);
      return;
    }

    const base = Math.max(10, Math.min(300, Math.round(conf.topicVoteSec) || 30));
    // Preview memakai durasi pendek supaya alur game tetap terlihat.
    const seconds = simulate ? Math.min(12, base) : base;
    setTopicVoteTotal(seconds);
    setTopicVoteLeft(seconds);

    const demoTimers: ReturnType<typeof setTimeout>[] = [];
    if (simulate) {
      const voters = shuffle(DEMO_NAMES).slice(0, 36);
      const voteWindow = Math.max(2500, (seconds - 2) * 1000);
      voters.forEach((name) => {
        const at = 250 + Math.random() * voteWindow;
        const visibleTopics = getTopicsForRound(engineRef.current.round);
        const topicPick = visibleTopics[Math.floor(Math.random() * visibleTopics.length)];
        demoTimers.push(
          setTimeout(() => {
            if (engineRef.current.phase === 'topics') handleTopicVote(topicPick.id, name);
          }, at),
        );
      });
    }

    let left = seconds;
    const interval = setInterval(() => {
      left -= 1;
      setTopicVoteLeft(Math.max(0, left));
      if (left <= 0) {
        clearInterval(interval);
        setTopicVoteStarted(false);
        setTopicVoteClosed(true);
        const winner = leadingTopicId();
        void startRef.current(winner);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      demoTimers.forEach((id) => clearTimeout(id));
    };
  }, [handleTopicVote, leadingTopicId, phase, simulate, topicVoteClosed, topicVoteNonce, topicVoteStarted]);

  /* ============ AUTO START / SIMULATION ============ */
  useEffect(() => {
    if (simulate) {
      const timer = setTimeout(() => {
        if (engineRef.current.phase !== 'topics') return;
        if (cfg.topicVote) beginTopicVote();
        else void startRef.current(cfg.topic);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [simulate, cfg.topic, cfg.topicVote, beginTopicVote]);

  /* ============ BROADCAST STATUS TO SETTINGS PAGE ============ */
  useEffect(() => {
    if (simulate) return;
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('game-status', {
      privateKey: privateKey || 'global',
      gameId: TRIVIA_GAME_ID,
      phase,
      topic: topicKey,
      round,
      qIndex: qIndex + 1,
      total: questions.length,
      players: playerList.length,
      question: questions[qIndex]?.question || '',
      leaderboard: [...playerList]
        .sort((a, b) => b.total - a.total)
        .map(({ username, total }) => ({ username, score: total })),
      fallback,
      at: Date.now(),
    });
  }, [phase, topicKey, round, qIndex, questions, playerList, fallback, privateKey, simulate, connected]);

  /* ============ DERIVED RENDER VALUES ============ */
  const topic = getTopicById(topicKey);
  const question = questions[qIndex] || null;
  const totalQuestions = questions.length || totalQuestionsRef.current;
  const points = question ? POINTS[question.difficulty] || 100 : POINTS.medium;
  const diff = question ? DIFF_LABEL[question.difficulty] || String(question.difficulty).toUpperCase() : 'SEDANG';
  const answered = playerList.filter((p) => p.answeredQ);
  const liveTop = [...playerList].filter((p) => p.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);
  const roundTop = [...playerList].filter((p) => p.round > 0).sort((a, b) => b.round - a.round).slice(0, 5);
  const sortedResults = [...results].sort((a, b) => a.time - b.time);
  const resultsByPlayer = new Map(sortedResults.map((result) => [result.key, result]));
  const leaderboardPlayers = playerList
    .map((player) => ({ player, result: resultsByPlayer.get(keyOf(player.username)) }))
    .sort((a, b) => {
      if (a.result && b.result) return a.result.time - b.result.time;
      if (a.result) return -1;
      if (b.result) return 1;
      return b.player.total - a.player.total || a.player.username.localeCompare(b.player.username);
    });
  const roundChampions = [...playerList]
    .filter((player) => player.round > 0)
    .sort((a, b) => b.round - a.round || b.correctAnswers - a.correctAnswers)
    .slice(0, 3);
  const championPodium = [
    { player: roundChampions[1], rank: 2 },
    { player: roundChampions[0], rank: 1 },
    { player: roundChampions[2], rank: 3 },
  ];
  const pcts = question ? voterPercents(question, votes) : [];
  const correctIndex = question
    ? question.options.findIndex((o) => normalizeText(o) === normalizeText(question.correct))
    : -1;
  const questionVisible = phase === 'question' || phase === 'reveal';
  const topicVoteCount = Object.values(topicVotes).reduce((sum, n) => sum + n, 0);
  const roundTopics = getTopicsForRound(round);
  const topicVoteLeader = roundTopics.reduce(
    (best, t) => ((topicVotes[t.id] || 0) > (topicVotes[best] || 0) ? t.id : best),
    '',
  );
  const topicVoteLeaderCount = topicVoteLeader ? topicVotes[topicVoteLeader] || 0 : 0;
  const topicVoteProgress =
    topicVoteTotal > 0 ? Math.min(100, Math.max(0, ((topicVoteTotal - topicVoteLeft) / topicVoteTotal) * 100)) : 0;

  const selectTopicAndStart = (t: GameTopic) => {
    if (cfg.topicVote) return;
    setTopic(t.id);
    void startRound(t.id, { mode: t.mode });
  };

  return (
    <>
      {(obsMode || cfg.bg === 'transparent') && (
        <style
          dangerouslySetInnerHTML={{
            __html:
              'html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}',
          }}
        />
      )}
      <style>{GAME_CSS}</style>
      <div
        className={
          obsMode || compactLayout
            ? 'fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-0'
            : 'w-full min-h-screen bg-[#050508] flex p-4'
        }
        style={{ ...posStyle, background: obsMode || cfg.bg === 'transparent' ? 'transparent' : '#050508' } as React.CSSProperties}
      >
        <AutoScale
          defaultBase={viewport.width}
          baseWidth={viewport.width}
        >
          <div
            className={`g-stage ${compactLayout ? 'g-compact' : ''} ${portraitLayout ? 'g-portrait' : ''}`}
            style={
              {
                width: viewport.width,
                height: viewport.height,
                '--g-accent': accent,
                '--g-accent-text': accentText,
                '--g-accent-fg': accentFg,
                '--g-font': `'${cfg.font}', sans-serif`,
                '--g-heading-font': `'${cfg.headingFont}', sans-serif`,
                background: cfg.bg === 'transparent' ? 'transparent' : cfg.bg,
              } as React.CSSProperties
            }
          >
            {/* ================= SCREEN 1: PILIH TOPIK ================= */}
            <div id="g-screen-topics" className={`g-screen ${phase === 'topics' ? 'active' : ''} pt-14 px-12 items-center`}>
              <h1 className="g-anim-item g-heading text-7xl uppercase tracking-wide mb-2 drop-shadow-lg" style={{ transitionDelay: '.1s' }}>
                Pilih <span className="g-accent-on-dark">Topik</span>
              </h1>
              <p className="g-anim-item g-mono text-gray-300 tracking-widest text-sm mb-6 uppercase" style={{ transitionDelay: '.2s' }}>
                Ronde <span>{round}</span> &nbsp;•&nbsp;{' '}
                {cfg.topicVote ? (topicVoteStarted ? `Ketik A-D atau Nama Topik di Komentar` : `Ketik ${cfg.command} untuk mulai voting`) : 'Klik Kartu untuk Mulai'} &nbsp;•&nbsp; Terbanyak Menang
              </p>

              {cfg.topicVote && (
                <div className="g-anim-item w-full max-w-5xl mb-7" style={{ transitionDelay: '.25s' }}>
                  <div className="flex items-end justify-between gap-6">
                    <div className="flex items-baseline gap-3">
                      <span className="g-mono text-[11px] uppercase tracking-[0.2em] text-gray-300">
                        {!topicVoteStarted ? 'Ketik command untuk mulai voting' : topicVoteClosed ? 'Voting selesai' : 'Voting ditutup dalam'}
                      </span>
                      <span
                        className={`g-heading text-5xl leading-none font-bold tabular-nums ${
                          !topicVoteStarted || topicVoteClosed ? 'text-gray-300' : topicVoteLeft <= 10 ? 'text-red-400' : 'g-accent-on-dark'
                        }`}
                      >
                        {topicVoteStarted ? formatClock(topicVoteLeft) : '--:--'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="g-heading text-3xl leading-none font-bold">{topicVoteCount}</span>
                      <span className="g-mono text-[10px] uppercase tracking-widest text-gray-300 ml-2">pemilih</span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full transition-all duration-1000 ease-linear"
                      style={{ width: `${topicVoteProgress}%`, background: 'var(--g-accent)' }}
                    />
                  </div>
                </div>
              )}

              <div className="g-anim-item flex items-center gap-2 mb-7 flex-wrap justify-center" style={{ transitionDelay: '.3s' }}>
                <span className="g-mono text-xs text-gray-300 uppercase mr-2">Bahasa</span>
                {['auto', 'id', 'en', 'fr', 'jp'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguage(code)}
                    className={`g-lang-chip ${lang === code ? 'on' : ''}`}
                  >
                    {code === 'auto' ? 'Auto' : code.toUpperCase()}
                  </button>
                ))}
                <span className="w-px h-5 bg-gray-700 mx-3" />
                <span className="g-mono text-xs text-gray-300 uppercase mr-2">Durasi Soal</span>
                {[10, 15, 20, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDuration(sec)}
                    className={`g-setting-chip ${questionSec === sec ? 'on' : ''}`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              <div className="g-topic-grid grid grid-cols-2 gap-4 justify-center w-full max-w-5xl">
                {roundTopics.map((t, i) => {
                  const count = topicVotes[t.id] || 0;
                  const pct = topicVoteCount > 0 ? Math.round((count / topicVoteCount) * 100) : 0;
                  const isLeader = topicVoteLeader === t.id && topicVoteLeaderCount > 0;
                  return (
                    <div key={t.id} className="g-topic-card-wrapper g-anim-item flex flex-col items-center gap-4" style={{ transitionDelay: `${0.35 + i * 0.1}s` }}>
                      <button
                        type="button"
                        onClick={() => selectTopicAndStart(t)}
                        className={`g-play-card g-topic-card relative w-full h-[17rem] flex flex-col items-center justify-center ${isLeader ? 'g-play-card-leader' : ''} ${cfg.topicVote ? 'cursor-default' : 'cursor-pointer'}`}
                        style={{
                          borderColor: isLeader ? t.color : undefined,
                          boxShadow: isLeader ? `0 15px 40px ${t.color}55` : undefined,
                        }}
                      >
                        <div className="g-card-corner g-corner-tl" style={{ color: t.color }}>
                          <span>{String.fromCharCode(65 + i)}</span>
                          <span className="text-sm">{t.icon}</span>
                        </div>
                        <div className="g-card-corner g-corner-br" style={{ color: t.color }}>
                          <span>{String.fromCharCode(65 + i)}</span>
                          <span className="text-sm">{t.icon}</span>
                        </div>
                        {isLeader && (
                          <span className="absolute top-3 right-3 bg-white text-black g-mono text-[9px] font-bold uppercase tracking-wider px-2 py-1">
                            Terbanyak
                          </span>
                        )}
                        <div className="w-24 h-24 mb-4 flex items-center justify-center text-6xl" style={{ color: t.color }}>
                          {t.icon}
                        </div>
                        <h2 className="g-heading text-4xl uppercase font-bold text-center leading-tight">{t.label}</h2>
                        <p className="g-mono text-[10px] text-gray-600 mt-1 uppercase">{t.sub}</p>
                        {cfg.topicVote && (
                          <div className="mt-5 w-full px-5">
                            <div className="flex items-end justify-between">
                              <span className="g-heading text-3xl font-bold leading-none" style={{ color: t.color }}>
                                {count}
                              </span>
                              <span className="g-mono text-[10px] text-gray-600">{pct}%</span>
                            </div>
                            <div className="mt-2 h-2 w-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full transition-all duration-500 ease-out"
                                style={{ width: `${pct}%`, background: t.color }}
                              />
                            </div>
                            <span className="g-mono text-[9px] text-gray-600 uppercase tracking-widest mt-1 block">orang memilih</span>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="g-anim-item mt-8 g-mono text-xs text-gray-300 uppercase tracking-widest" style={{ transitionDelay: '.85s' }}>
                {cfg.topicVote ? (
                  topicVoteClosed ? (
                    <>Voting ditutup • tekan Start di dock atau ketik {cfg.command} untuk memilih topik lagi</>
                  ) : !topicVoteStarted ? (
                    <>Ketik <span className="text-gray-300">{cfg.command}</span> atau tekan Start di dock untuk membuka voting {cfg.topicVoteSec} detik</>
                  ) : (
                    <>Topik terbanyak otomatis dimulai saat timer habis • voting ditutup dalam {formatClock(topicVoteLeft)}</>
                  )
                ) : (
                  <>{roundTopics.length} topik ditampilkan untuk ronde ini • <span className="text-gray-300">{cfg.command} mulai</span></>
                )}
              </p>
            </div>

            {/* ================= SCREEN 2: CARA MAIN ================= */}
            <div id="g-screen-rules" className={`g-screen ${phase === 'rules' ? 'active' : ''} p-12 pt-16 items-center justify-center`}>
              <div className="g-anim-item w-full max-w-4xl mb-12" style={{ transitionDelay: '.1s' }}>
                <p className="g-mono text-gray-300 text-sm mb-2 uppercase">
                  RONDE <span>{round}</span> • TOPIK <span>{topic.id}</span> • <span>{totalQuestions}</span> SOAL •{' '}
                  <span>{questionSec}</span> DETIK
                </p>
                <h1 className="g-heading text-8xl uppercase tracking-tight">
                  Cara <span className="g-accent-on-dark">Main</span>
                </h1>
              </div>
              <div className="w-full max-w-4xl flex flex-col gap-6">
                <div className="g-anim-item flex gap-6 items-start border-b border-gray-800 pb-6" style={{ transitionDelay: '.3s' }}>
                  <span className="g-mono g-accent-on-dark text-xl font-bold mt-1">01</span>
                  <p className="text-2xl font-medium">
                    Ketik <span className="font-bold text-white">jawabannya</span> di komentar. Pilihan jawaban terkunci di awal soal.
                  </p>
                </div>
                <div className="g-anim-item flex gap-6 items-start border-b border-gray-800 pb-6" style={{ transitionDelay: '.4s' }}>
                  <span className="g-mono g-accent-on-dark text-xl font-bold mt-1">02</span>
                  <p className="text-2xl font-medium">
                    Maksimal <span className="font-bold text-white">{maxGuessesRef.current} tebakan</span> per soal. Typo kecil tetap dihitung.
                  </p>
                </div>
                <div className="g-anim-item flex gap-6 items-start border-b border-gray-800 pb-6" style={{ transitionDelay: '.5s' }}>
                  <span className="g-mono g-accent-on-dark text-xl font-bold mt-1">03</span>
                  <p className="text-2xl font-medium">
                    Benar dapat <span className="font-bold text-white">100 / 150 / 200 poin</span> sesuai tingkat + bonus cepat.
                  </p>
                </div>
                <div className="g-anim-item flex gap-6 items-start" style={{ transitionDelay: '.6s' }}>
                  <span className="g-mono g-accent-on-dark text-xl font-bold mt-1">04</span>
                  <p className="text-2xl font-medium">
                    Like, follow, gift &amp; donasi juga menambah <span className="font-bold text-white">bonus poin</span>.
                  </p>
                </div>
              </div>
              <p className="g-anim-item absolute bottom-12 left-0 right-0 text-center g-mono text-xs text-gray-300 uppercase" style={{ transitionDelay: '.7s' }}>
                {rulesStatus}
              </p>
            </div>

            {/* ================= SCREEN 3: INTRO SOAL ================= */}
            <div id="g-screen-intro" className={`g-screen ${phase === 'intro' ? 'active' : ''} items-center justify-center`}>
              <div className="text-center">
                <p className="g-anim-item g-mono text-gray-300 tracking-widest text-lg mb-4 uppercase" style={{ transitionDelay: '.1s' }}>
                  SOAL <span>{String(qIndex + 1).padStart(2, '0')}</span> / <span>{totalQuestions}</span>
                </p>
                <h1 className="g-anim-item g-heading text-[7rem] uppercase font-bold leading-none tracking-tighter drop-shadow-2xl" style={{ transitionDelay: '.2s' }}>
                  {topic.id}
                </h1>
                <div className="g-anim-item mt-8 flex items-center justify-center gap-4 text-xl" style={{ transitionDelay: '.3s' }}>
                  <span className="border g-accent-border g-accent-on-dark px-3 py-1 g-mono uppercase">{diff}</span>
                  <span className="g-mono tracking-widest text-gray-300">
                    <span>{points}</span> POIN + BONUS CEPAT
                  </span>
                </div>
              </div>
            </div>

            {/* ================= SCREEN 6: ROUND CHAMPIONS ================= */}
            <div id="g-screen-champion" className={`g-screen ${phase === 'champion' ? 'active' : ''} p-10 pt-14`}>
                <div className="g-champion-content w-full max-w-5xl mx-auto flex flex-col h-full items-center justify-center">
                  <div className="g-anim-item text-center mb-8" style={{ transitionDelay: '.1s' }}>
                    <p className="g-mono text-gray-300 text-sm mb-2 uppercase tracking-[.25em]">
                      RONDE {round} • PENGHARGAAN AKHIR
                    </p>
                    <h1 className="g-heading text-7xl uppercase tracking-tight">
                      JUARA <span className="g-accent-on-dark">RONDE {round}</span>
                    </h1>
                    <p className="g-mono text-xs text-gray-300 mt-3 uppercase tracking-widest">
                      {totalQuestions} SOAL SELESAI • SKOR DIRESET DI RONDE BERIKUTNYA
                    </p>
                  </div>

                  {roundChampions.length > 0 ? (
                    <div className="g-champion-podium grid grid-cols-3 items-end gap-6 w-full">
                      {championPodium.map(({ player, rank }, index) => (
                        <div
                          key={rank}
                          className={`g-anim-item g-champion-card flex min-w-0 flex-col items-center justify-end text-center ${rank === 1 ? 'g-champion-first' : ''}`}
                          style={{ transitionDelay: `${.2 + index * .15}s` }}
                        >
                          {player ? (
                            <>
                              <div className="g-champion-avatar-wrap relative mb-4 rounded-full border-4 p-1" style={{ borderColor: rank === 1 ? 'var(--g-accent)' : 'rgba(255,255,255,.24)' }}>
                                {rank === 1 && (
                                  <span className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 g-accent-bg g-mono text-xs font-black uppercase tracking-widest px-3 py-1">
                                    JUARA
                                  </span>
                                )}
                                <div className="h-full w-full overflow-hidden rounded-full">
                                  <Avatar name={player.username} url={cfg.showAvatar ? player.avatar : undefined} size={120} fill />
                                </div>
                              </div>
                              <span className="g-heading g-champion-name max-w-full truncate text-3xl font-bold">{player.username}</span>
                              <span className="g-mono g-champion-score mt-2 text-sm text-gray-300 uppercase">
                                {player.round.toLocaleString('id-ID')} POIN • {player.correctAnswers} BENAR
                              </span>
                              <div className={`g-champion-block g-champion-block-${rank} mt-5 flex w-full items-center justify-center border border-white/20 bg-gradient-to-b from-white/[.08] to-black/60`}>
                                <span className={`g-heading font-black ${rank === 1 ? 'text-8xl text-white' : 'text-7xl text-white/50'}`}>
                                  {rank}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="g-champion-avatar-wrap mb-4 grid place-items-center rounded-full border-4 border-dashed border-white/10 text-4xl text-white/20">?</div>
                              <span className="g-mono text-xs uppercase text-gray-500">Belum ada juara</span>
                              <div className={`g-champion-block g-champion-block-${rank} mt-5 flex w-full items-center justify-center border border-white/10 bg-white/[.02]`}>
                                <span className="g-heading text-7xl font-black text-white/15">{rank}</span>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="g-anim-item flex flex-1 items-center justify-center g-mono text-center text-gray-300 uppercase tracking-widest">
                      Belum ada pemain yang mendapatkan poin di ronde ini
                    </div>
                  )}
                </div>
            </div>

            {/* ================= SCREEN 4: SOAL ================= */}
            <div id="g-screen-question" className={`g-screen ${questionVisible ? 'active' : ''} p-8`}>
              <div className="flex flex-col flex-1 min-h-0 w-full max-w-5xl mx-auto">
                <div className="g-anim-item flex justify-between items-start w-full mb-4" style={{ transitionDelay: '.1s' }}>
                  <div>
                    <h2 className="g-heading text-4xl font-bold uppercase tracking-wide">Trivia</h2>
                    <p className="g-mono text-xs text-gray-300 uppercase mt-1">
                      RONDE <span>{round}</span> • <span>{topic.id}</span> • <span>{question?.category || 'UMUM'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="g-mono text-xs text-gray-300 uppercase">SOAL</p>
                    <p className="g-heading text-4xl font-bold leading-none">
                      <span>{String(qIndex + 1).padStart(2, '0')}</span>
                      <span className="text-gray-300">/<span>{totalQuestions}</span></span>
                    </p>
                  </div>
                </div>

                <div id="g-progress-row" className="g-anim-item flex gap-1 w-full mb-4" style={{ transitionDelay: '.2s' }}>
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      className={`g-progress-dash${i < qIndex ? ' filled' : i === qIndex ? ' current' : ''}`}
                    />
                  ))}
                </div>

                <div className="g-anim-item flex justify-between items-center w-full mb-3" style={{ transitionDelay: '.3s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 g-accent-bg" />
                    <span className="g-mono text-xs font-bold uppercase tracking-wider text-gray-300">
                      TINGKAT <span>{diff}</span> • <span>{points}</span> POIN
                    </span>
                  </div>
                  <span className="g-mono text-3xl font-bold">{formatClock(timeLeft)}</span>
                </div>
                <div className="g-anim-item w-full bg-gray-800 mb-8" style={{ transitionDelay: '.3s' }}>
                  <div
                    className="g-timer-bar"
                    style={{ width: `${questionSec > 0 ? Math.max(0, Math.min(100, (timeLeft / questionSec) * 100)) : 0}%` }}
                  />
                </div>

                {/* MC / IMAGE */}
                <div className={question?.type === 'truefalse' ? 'hidden' : ''}>
                  <h3 className="g-anim-item text-4xl font-bold mb-6 drop-shadow-md" style={{ transitionDelay: '.4s' }}>
                    {question?.question || ''}
                  </h3>

                  {question?.image && (
                    <div
                      className="g-anim-item flex w-full border border-gray-800 bg-gray-900 p-6 rounded-lg mb-6 justify-center"
                      style={{ transitionDelay: '.5s' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={question.image}
                        alt=""
                        className={`${question.type === 'image' ? 'h-72' : 'h-48'} object-contain drop-shadow-xl`}
                      />
                    </div>
                  )}

                  <div className="g-options-list flex flex-col">
                    {question?.type === 'image' && (
                      <div className="g-anim-item g-mono text-sm text-gray-300 uppercase tracking-widest" style={{ transitionDelay: '.6s' }}>
                        Ketik jawabanmu di komentar — tanpa pilihan
                      </div>
                    )}
                    {(question?.options || []).map((option, i) => {
                      const isCorrect = i === correctIndex;
                      const revealed = phase === 'reveal' || phase === 'leaderboard';
                      return (
                        <div key={`${option}-${i}`} className="g-anim-item" style={{ transitionDelay: `${0.6 + i * 0.1}s` }}>
                          <div
                            className={`g-option-row ${revealed && isCorrect ? 'is-correct' : ''} ${
                              revealed && !isCorrect ? 'is-wrong' : ''
                            }`}
                          >
                            <span className="g-option-check" aria-hidden="true" />
                            <span className="g-option-label">{option}</span>
                            {revealed && isCorrect && <span className="g-option-correct">BENAR</span>}
                            {showPercents && cfg.showPercent && (
                              <span className="g-option-percent">
                                <CountUp
                                  key={`${qIndex}-${option}-${i}`}
                                  value={pcts[i] ?? 0}
                                  delay={i * 80}
                                />
                                %
                              </span>
                            )}
                            {showPercents && cfg.showPercent && revealed && isCorrect && (
                              <span className="g-option-progress" aria-hidden="true">
                                <span style={{ width: `${pcts[i] ?? 0}%` }} />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className={`${phase !== 'reveal' ? 'hidden' : 'flex'} mt-4 items-center gap-4 border-l-4 border-green-500 bg-green-900/40 px-6 py-4`}
                  >
                    <span className="g-mono text-xs text-green-300 uppercase tracking-widest">Jawaban</span>
                    <span className="text-4xl g-heading font-bold uppercase">{question?.correct}</span>
                  </div>
                </div>

                {/* BOOLEAN */}
                <div className={question?.type === 'truefalse' ? '' : 'hidden'}>
                  <h3 className="g-anim-item text-[2.5rem] leading-tight font-bold mb-10" style={{ transitionDelay: '.4s' }}>
                    {question?.question || ''}
                  </h3>
                  <div className="g-options-list flex flex-col">
                    {(question?.options || []).map((option, i) => {
                      const isCorrect = i === correctIndex;
                      const revealed = phase === 'reveal' || phase === 'leaderboard';
                      return (
                        <div
                          key={`${option}-${i}`}
                          className={`g-option-row g-anim-item ${revealed && isCorrect ? 'is-correct' : ''} ${
                            revealed && !isCorrect ? 'is-wrong' : ''
                          }`}
                          style={{ transitionDelay: `${0.5 + i * 0.1}s` }}
                        >
                          <span className="g-option-check" aria-hidden="true" />
                          <span className="g-option-label">{option}</span>
                          {revealed && isCorrect && <span className="g-option-correct">BENAR</span>}
                          {showPercents && cfg.showPercent && (
                            <span className="g-option-percent">
                              <CountUp
                                key={`${qIndex}-${option}-${i}`}
                                value={pcts[i] ?? 0}
                                delay={i * 80}
                              />
                              %
                            </span>
                          )}
                          {showPercents && cfg.showPercent && revealed && isCorrect && (
                            <span className="g-option-progress" aria-hidden="true">
                              <span style={{ width: `${pcts[i] ?? 0}%` }} />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FAKTA */}
                <div
                  className={`g-facts ${factsShown ? 'show' : ''} mt-6 flex gap-4 items-start bg-transparent`}
                  style={{ display: factsShown ? 'block' : 'none' }}
                >
                  <span className="g-accent-bg g-mono text-[11px] font-bold px-2 py-1 uppercase tracking-widest shrink-0 mt-1 inline-block">
                    Fakta
                  </span>
                  <div className="flex flex-col gap-2">
                    <p className="text-3xl leading-snug font-bold text-white">{question?.facts || ''}</p>
                    <p className="g-mono text-[10px] text-gray-300 uppercase tracking-widest">SUMBER: WIKIPEDIA / TRIVIA DATABASE</p>
                  </div>
                </div>

                {/* PANEL PEMAIN LIVE */}
                <div className="g-anim-item mt-auto pt-4" style={{ transitionDelay: '.9s' }}>
                  <div className="flex items-center justify-between border-t border-gray-800 pt-3 mb-4">
                    <span className="g-mono text-[11px] text-gray-300 uppercase tracking-widest">
                      Ketik jawabannya di komentar • <b className="text-white">Maks {maxGuessesRef.current} tebakan</b>
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {(cfg.showAvatar ? answered.slice(-8) : []).map((p) => (
                          <Avatar
                            key={p.username}
                            name={p.username}
                            url={p.avatar}
                            size={28}
                            className="ring-2 ring-black"
                          />
                        ))}
                      </div>
                      <span className="g-heading text-2xl font-bold leading-none">{answered.length}</span>
                      <span className="g-mono text-[10px] text-gray-300 uppercase">Menjawab</span>
                    </div>
                  </div>

                  {cfg.showLiveBoard && (
                    <>
                      <div className="flex justify-between g-mono text-[10px] uppercase tracking-widest mb-2">
                        <span className="text-white font-bold">
                          Klasemen Live <span className="text-gray-300 font-normal">• {playerList.length} pemain</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const p = liveTop[i];
                          return p ? (
                            <LivePlayer key={`live-${p.username}`} player={p} rank={i} metric="total" showAvatar={cfg.showAvatar} />
                          ) : (
                            <div key={`live-empty-${i}`} className="flex flex-col items-center gap-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="g-mono text-[11px] font-bold text-gray-300">{String(i + 1).padStart(2, '0')}</span>
                                {cfg.showAvatar && <div className="w-11 h-11 rounded-full border border-dashed border-gray-700" />}
                              </div>
                              <span className="g-mono text-[11px] text-gray-500">—</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between g-mono text-[10px] uppercase tracking-widest mb-2">
                        <span className="g-accent-on-dark font-bold">
                          Klasemen Ronde {round} <span className="text-gray-300 font-normal">• {topic.label}</span>
                        </span>
                        <span className="text-gray-300">
                          Soal {String(qIndex + 1).padStart(2, '0')}/{totalQuestions}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const p = roundTop[i];
                          return p ? (
                            <LivePlayer key={`round-${p.username}`} player={p} rank={i} metric="round" showAvatar={cfg.showAvatar} />
                          ) : (
                            <div key={`round-empty-${i}`} className="flex flex-col items-center gap-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="g-mono text-[11px] font-bold text-gray-300">{String(i + 1).padStart(2, '0')}</span>
                                {cfg.showAvatar && <div className="w-11 h-11 rounded-full border border-dashed border-gray-700" />}
                              </div>
                              <span className="g-mono text-[11px] text-gray-500">—</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ================= SCREEN 5: LEADERBOARD ================= */}
            <div id="g-screen-leaderboard" className={`g-screen ${phase === 'leaderboard' ? 'active' : ''} p-10 pt-14`}>
              <div className="w-full max-w-4xl mx-auto flex flex-col h-full">
                <div className="flex justify-between items-end mb-10">
                  <div className="g-anim-item" style={{ transitionDelay: '.1s' }}>
                    <p className="g-mono text-gray-300 text-sm mb-2 uppercase">
                      RONDE <span>{round}</span> • <span>{topic.id}</span>
                    </p>
                    <h1 className="g-heading text-6xl uppercase tracking-tight">
                      TERCEPAT <span className="g-accent-on-dark">BENAR</span>
                    </h1>
                    <p className="g-mono text-xs text-gray-300 mt-2 uppercase">
                      SOAL <span>{String(qIndex + 1).padStart(2, '0')}</span> • JAWABAN:{' '}
                      <span className="text-white">{question?.correct || ''}</span>
                    </p>
                  </div>
                  <div className="g-anim-item text-right" style={{ transitionDelay: '.2s' }}>
                    <p className="g-mono text-xs text-gray-300 uppercase">SOAL</p>
                    <p className="g-heading text-4xl font-bold leading-none">
                      <span>{String(qIndex + 1).padStart(2, '0')}</span>
                      <span className="text-gray-300">/<span>{totalQuestions}</span></span>
                    </p>
                  </div>
                </div>

                <div className="g-leaderboard-list flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain pr-2">
                  {leaderboardPlayers.length === 0 && (
                    <div className="g-anim-item g-mono text-gray-300 uppercase p-6 border border-gray-800" style={{ transitionDelay: '.3s' }}>
                      Belum ada yang menjawab benar
                    </div>
                  )}
                  {leaderboardPlayers.map(({ player, result }, i) => (
                    <div
                      key={keyOf(player.username)}
                      className={`g-lb-row-wrapper g-rank-${i} relative flex w-full h-[60px] shrink-0 bg-gray-900 border border-gray-800 overflow-hidden shadow-lg`}
                      style={{ '--delay': `${0.1 + Math.min(i, 8) * 0.12}s` } as React.CSSProperties}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-[25%] bg-white z-10 g-anim-white-base" />
                      <div className="absolute top-0 bottom-0 z-20 g-sweep-block" />
                      <div className="relative z-30 flex w-full h-full g-content-reveal">
                        <div className="w-[25%] relative overflow-hidden bg-gray-800">
                          {cfg.showAvatar && <Avatar name={player.username} url={player.avatar} size={48} fill />}
                          <span className="g-lb-rank g-mono">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="w-[55%] flex flex-col justify-center px-6">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-white truncate max-w-[200px]">{player.username}</span>
                            <PlatformBadge platform={player.platform} size={20} />
                            {result && player.streak >= 3 && (
                              <span className="g-accent-bg g-mono text-[9px] font-bold px-1 rounded uppercase">
                                {player.streak}X BERUNTUN
                              </span>
                            )}
                          </div>
                          <span className="g-mono text-xs text-gray-300 mt-1">
                            {result
                              ? `${(result.time / 1000).toFixed(1).replace('.', ',')} DTK • +${result.points} SOAL INI`
                              : player.answeredQ ? 'BELUM BENAR' : 'BELUM MENJAWAB SOAL INI'}
                          </span>
                        </div>
                        <div
                          className="w-[20%] flex flex-col items-center justify-center"
                          style={{ color: i === 0 ? accentFg : i === 1 ? '#111111' : '#ffffff' }}
                        >
                          <CountUp value={player.total} delay={(0.1 + Math.min(i, 8) * 0.12 + 0.4) * 1000} className="text-3xl g-heading font-bold" />
                          <span className="g-mono text-[8px] uppercase">TOTAL POIN</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="g-anim-item mt-auto border-t border-gray-800 pt-6 flex justify-between items-end" style={{ transitionDelay: '.7s' }}>
                  <div className="flex flex-col gap-3">
                    <span className="g-heading text-sm tracking-widest uppercase text-gray-300 font-bold">PESERTA BABAK INI</span>
                    <span className="g-mono text-xs text-gray-300">{leaderboardPlayers.length} ORANG • SKOR TOTAL TERMASUK BABAK SEBELUMNYA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AutoScale>

        {!obsMode && (
          <div className="fixed bottom-3 right-3 px-2 py-1 bg-black/50 backdrop-blur border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-300 pointer-events-none">
            GAMES • {phase} • {simulate ? 'simulate' : connected ? 'connected' : 'offline'} • Q{Math.min(qIndex + 1, totalQuestions)}/{totalQuestions}
            {fallback ? ' • demo' : ''}
          </div>
        )}
      </div>
    </>
  );
}

type StartOptions = {
  questionSec?: number;
  totalQuestions?: number;
  maxGuesses?: number;
  lang?: string;
  mode?: GameQuestion['type'];
};

export default function GamesDisplayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">
          Loading games…
        </div>
      }
    >
      <GamesInner />
    </Suspense>
  );
}

const GAME_CSS = `
.g-stage{
  position:relative;width:1920px;height:1080px;overflow:hidden;color:#fff;user-select:none;
  font-family:var(--g-font,'Inter'),sans-serif;background:#050508;
}
.g-stage *{box-sizing:border-box}
.g-heading{font-family:var(--g-heading-font,'Oswald'),sans-serif}
.g-mono{font-family:'Jost',sans-serif}
.g-accent{color:var(--g-accent,#ff5500)}
.g-accent-on-dark{color:var(--g-accent-text,var(--g-accent,#ff5500))}
.g-accent-bg{background:var(--g-accent,#ff5500);color:var(--g-accent-fg,#000)}
.g-accent-border{border-color:var(--g-accent-text,var(--g-accent,#ff5500))}
.g-screen{position:absolute;inset:0;opacity:0;visibility:hidden;z-index:10;display:flex;flex-direction:column;transition:opacity .5s ease, visibility .5s ease}
.g-screen.active{opacity:1;visibility:visible;z-index:20}
#g-screen-topics{justify-content:flex-start;overflow-y:auto;overscroll-behavior:contain;padding-top:2rem;padding-bottom:2rem}
#g-screen-topics>h1{margin-top:auto}
#g-screen-topics>p:last-child{margin-bottom:auto}
.g-anim-item{opacity:0;transform:translateY(30px);transition:opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1)}
.g-screen.active .g-anim-item{opacity:1;transform:translateY(0)}
.g-screen:not(.active) .g-anim-item{transition-delay:0s!important}
.g-play-card{
  background:#fff;color:#111;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.5);
  transition:transform .2s, box-shadow .2s, border-color .2s;border:2px solid #ddd;text-align:center;
}
.g-play-card-leader{transform:translateY(-10px) scale(1.02);z-index:1}
.g-play-card:hover{transform:translateY(-10px) scale(1.02);box-shadow:0 15px 40px rgba(0,0,0,.45);border-color:var(--g-accent,#ff5500)}
.g-card-corner{position:absolute;display:flex;flex-direction:column;align-items:center;font-family:var(--g-heading-font,'Oswald'),sans-serif;font-weight:700;font-size:1.25rem;line-height:1}
.g-corner-tl{top:10px;left:12px}
.g-corner-br{bottom:10px;right:12px;transform:rotate(180deg)}
.g-progress-dash{flex-grow:1;height:4px;background:rgba(255,255,255,.2);border-radius:2px;transition:background .3s}
.g-progress-dash.filled{background:#fff}
.g-progress-dash.current{background:var(--g-accent,#ff5500)}
.g-timer-bar{height:6px;background:var(--g-accent,#ff5500);transition:width 1s linear}
.g-option-row{position:relative;display:flex;align-items:center;gap:14px;min-height:62px;padding:10px 8px;color:#f8fafc;border-top:1px solid rgba(255,255,255,.17);transition:opacity .25s;overflow:hidden}
.g-options-list>.g-anim-item:last-child .g-option-row{border-bottom:1px solid rgba(255,255,255,.17)}
.g-options-list>.g-option-row:last-child{border-bottom:1px solid rgba(255,255,255,.17)}
.g-option-row.is-correct::before{content:"";position:absolute;inset:0;background:#fff;transform:scaleX(0);transform-origin:left;animation:gOptionReveal .55s cubic-bezier(.16,1,.3,1) forwards;pointer-events:none}
@keyframes gOptionReveal{to{transform:scaleX(1)}}
.g-option-check{width:12px;height:12px;flex:none;border:1px solid rgba(255,255,255,.78);background:transparent}
.g-option-label{position:relative;z-index:1;flex:1;min-width:0;font-size:1.75rem;font-weight:700;line-height:1.2}
.g-option-correct{position:relative;z-index:1;flex:none;padding:4px 7px;background:var(--g-accent,#ff5500);color:var(--g-accent-fg,#000);font-size:10px;font-weight:700;letter-spacing:.12em}
.g-option-percent{position:relative;z-index:1;flex:none;min-width:3ch;text-align:right;font-family:var(--g-font,'Jost'),sans-serif;font-size:1rem;font-weight:700}
.g-option-correct{font-family:var(--g-font,'Jost'),sans-serif}
.g-option-row.is-correct{color:#fff}
.g-option-row.is-correct .g-option-label,.g-option-row.is-correct .g-option-percent{animation:gOptionTextDark .15s ease .45s forwards}
@keyframes gOptionTextDark{to{color:#111}}
.g-option-row.is-correct .g-option-check{animation:gOptionCheckDark .15s ease .45s forwards}
@keyframes gOptionCheckDark{to{border-color:#111}}
.g-option-row.is-correct .g-option-progress{position:absolute;bottom:0;left:0;right:0;height:3px;background:color-mix(in srgb,var(--g-accent,#ff5500) 18%,transparent);z-index:2}
.g-option-row.is-correct .g-option-progress>span{display:block;height:100%;background:var(--g-accent,#ff5500);transition:width .45s ease}
.g-option-row.is-wrong{color:rgba(255,255,255,.38)}
.g-option-row.is-wrong .g-option-check{border-color:rgba(255,255,255,.34)}
.g-lb-rank{position:absolute;left:1rem;top:50%;transform:translateY(-50%);z-index:2;padding:.25rem .45rem;color:#fff;background:rgba(0,0,0,.68);font-size:1.25rem;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,.6)}
.g-lang-chip,.g-setting-chip{border:1px solid #444;padding:4px 12px;font-family:'Jost',sans-serif;font-size:12px;text-transform:uppercase;cursor:pointer;border-radius:4px;color:#aaa;background:transparent;transition:background .2s,color .2s,border-color .2s}
.g-lang-chip:hover,.g-setting-chip:hover{border-color:#777;color:#fff}
.g-lang-chip.on,.g-setting-chip.on{background:var(--g-accent,#ff5500);border-color:var(--g-accent,#ff5500);color:var(--g-accent-fg,#000);font-weight:700}
.g-facts{opacity:0}
.g-facts.show{opacity:1;animation:gFactsIn .7s cubic-bezier(.16,1,.3,1) both}
@keyframes gFactsIn{from{opacity:0;transform:translateY(70px)}to{opacity:1;transform:translateY(0)}}
.g-lb-row-wrapper{opacity:0;transform:translateY(20px)}
.g-screen.active .g-lb-row-wrapper{opacity:1;transform:translateY(0);transition:opacity .3s ease var(--delay),transform .3s ease var(--delay)}
.g-anim-white-base{transform-origin:left;transform:scaleX(0)}
.g-screen.active .g-anim-white-base{transform:scaleX(1);transition:transform .4s cubic-bezier(.16,1,.3,1) calc(var(--delay) + .1s)}
.g-sweep-block{left:0%;width:0%}
.g-screen.active .g-sweep-block{animation:gBlockSweep 1.2s cubic-bezier(.16,1,.3,1) forwards;animation-delay:calc(var(--delay) + .2s)}
@keyframes gBlockSweep{0%{left:0%;width:0%}40%{left:0%;width:100%}100%{left:80%;width:20%}}
.g-content-reveal{opacity:0}
.g-screen.active .g-content-reveal{opacity:1;transition:opacity .4s ease calc(var(--delay) + .4s)}
.g-rank-0 .g-sweep-block{background-color:var(--g-accent,#ff5500)}
.g-rank-1 .g-sweep-block{background-color:#94a3b8}
.g-rank-2 .g-sweep-block{background-color:#b45309}
.g-champion-podium{width:min(100%,760px);height:580px;flex:none;margin-inline:auto}
.g-champion-avatar-wrap{width:144px;height:144px}
.g-champion-block-1{height:260px;border-top:5px solid var(--g-accent,#ff5500)}
.g-champion-block-2{height:170px}
.g-champion-block-3{height:130px}
@keyframes gPodiumRise{from{clip-path:inset(100% 0 0);opacity:.35}to{clip-path:inset(0);opacity:1}}
.g-screen.active .g-champion-block-2{animation:gPodiumRise .8s cubic-bezier(.16,1,.3,1) .2s both}
.g-screen.active .g-champion-block-3{animation:gPodiumRise .8s cubic-bezier(.16,1,.3,1) .38s both}
.g-screen.active .g-champion-block-1{animation:gPodiumRise 1s cubic-bezier(.16,1,.3,1) .56s both}
@media (max-width:1023px), (max-height:760px){
  .g-stage.g-compact #g-screen-topics{align-items:stretch;justify-content:flex-start;overflow-y:auto;overscroll-behavior:contain;padding:20px 14px 18px}
  .g-stage.g-compact #g-screen-topics>h1{font-size:clamp(2.5rem,10vw,3.5rem);text-align:center;margin-top:0;margin-bottom:.25rem}
  .g-stage.g-compact #g-screen-topics>p{font-size:9px;line-height:1.6;text-align:center;margin-bottom:1rem}
  .g-stage.g-compact #g-screen-topics>.g-topic-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-inline:auto}
  .g-stage.g-compact #g-screen-topics .g-topic-card-wrapper{width:100%;gap:0}
  .g-stage.g-compact #g-screen-topics .g-topic-card{width:100%;height:auto;min-height:190px;padding:24px 10px 14px;border-radius:10px}
  .g-stage.g-compact #g-screen-topics .g-topic-card>div.w-24{width:4rem;height:4rem;font-size:2.75rem;margin-bottom:.5rem}
  .g-stage.g-compact #g-screen-topics .g-topic-card h2{font-size:1.5rem;line-height:1.1}
  .g-stage.g-compact #g-screen-topics .g-topic-card>p{font-size:8px}
  .g-stage.g-compact #g-screen-topics .g-topic-card>div.mt-5{margin-top:.75rem;padding-inline:.25rem}
  .g-stage.g-compact #g-screen-topics .g-card-corner{font-size:.9rem}
  .g-stage.g-compact #g-screen-topics .g-card-corner .text-sm{font-size:.7rem}
  .g-stage.g-compact #g-screen-topics .g-topic-card>span.absolute{top:6px;right:6px;padding:3px 5px;font-size:7px}
  .g-stage.g-compact #g-screen-topics .g-play-card-leader{transform:translateY(-3px) scale(1.015)}
  .g-stage.g-compact #g-screen-topics [class*="max-w-5xl"]{max-width:100%}
  .g-stage.g-compact #g-screen-topics .g-anim-item.mt-8{margin-top:1rem}

  .g-stage.g-compact #g-screen-rules{overflow-y:auto;overscroll-behavior:contain;padding:28px 20px}
  .g-stage.g-compact #g-screen-rules>div:first-child{margin-bottom:2rem}
  .g-stage.g-compact #g-screen-rules>div:first-child h1{font-size:clamp(3.5rem,15vw,5rem)}
  .g-stage.g-compact #g-screen-rules>div:nth-child(2){gap:1rem}
  .g-stage.g-compact #g-screen-rules>div:nth-child(2)>div{gap:1rem;padding-bottom:1rem}
  .g-stage.g-compact #g-screen-rules>div:nth-child(2) p{font-size:1rem;line-height:1.5}

  .g-stage.g-compact #g-screen-intro{padding:20px}
  .g-stage.g-compact #g-screen-intro h1{font-size:clamp(4rem,20vw,6rem)}
  .g-stage.g-compact #g-screen-intro>div>div{font-size:1rem}

  .g-stage.g-compact #g-screen-question{overflow-y:auto;overscroll-behavior:contain;padding:18px 16px}
  .g-stage.g-compact #g-screen-question>div:first-child{flex:none;max-width:none}
  .g-stage.g-compact #g-screen-question h2{font-size:1.75rem}
  .g-stage.g-compact #g-screen-question h3{font-size:1.5rem;line-height:1.3;margin-bottom:1rem}
  .g-stage.g-compact #g-screen-question img{width:auto;height:auto;max-width:100%;max-height:180px}
  .g-stage.g-compact #g-screen-question .g-option-row{min-height:52px;padding:8px;gap:10px}
  .g-stage.g-compact #g-screen-question .g-option-label{font-size:1.15rem}
  .g-stage.g-compact #g-screen-question .g-option-percent{font-size:.8rem}
  .g-stage.g-compact #g-screen-question .g-option-correct{font-size:8px;padding:3px 5px}
  .g-stage.g-compact #g-screen-question .grid-cols-5{grid-template-columns:repeat(3,minmax(0,1fr))}
  .g-stage.g-compact #g-screen-question .mt-auto{margin-top:1rem}
  .g-stage.g-compact #g-screen-question .g-facts p:first-child{font-size:1.15rem;line-height:1.5}

  .g-stage.g-compact #g-screen-leaderboard{overflow-y:auto;overscroll-behavior:contain;padding:24px 16px}
  .g-stage.g-compact #g-screen-leaderboard h1{font-size:clamp(3rem,14vw,4.5rem)}
  .g-stage.g-compact #g-screen-leaderboard .g-lb-row-wrapper{height:52px}
  .g-stage.g-compact #g-screen-leaderboard .g-leaderboard-list{gap:6px}
  .g-stage.g-compact #g-screen-leaderboard .g-lb-row-wrapper>div>div:first-child{width:24%}
  .g-stage.g-compact #g-screen-leaderboard .g-lb-row-wrapper>div>div:nth-child(2){width:56%;padding-inline:10px}
  .g-stage.g-compact #g-screen-leaderboard .g-lb-row-wrapper>div>div:nth-child(2)>div>span:first-child{font-size:1rem;max-width:100px}
  .g-stage.g-compact #g-screen-leaderboard .g-lb-row-wrapper>div>div:nth-child(3){width:20%}
  .g-stage.g-compact #g-screen-leaderboard .g-lb-row-wrapper>div>div:nth-child(3) span{font-size:1.5rem}

  .g-stage.g-compact #g-screen-champion{overflow-y:auto;overscroll-behavior:contain;padding:24px 16px}
  .g-stage.g-compact #g-screen-champion h1{font-size:clamp(2.75rem,12vw,4rem)}
  .g-stage.g-compact #g-screen-champion .g-champion-podium{height:clamp(360px,58vh,500px);gap:8px}
  .g-stage.g-compact #g-screen-champion .g-champion-avatar-wrap{width:84px;height:84px}
  .g-stage.g-compact #g-screen-champion .g-champion-name{font-size:1.15rem}
  .g-stage.g-compact #g-screen-champion .g-champion-score{font-size:8px;line-height:1.4}
  .g-stage.g-compact #g-screen-champion .g-champion-block-1{height:150px}
  .g-stage.g-compact #g-screen-champion .g-champion-block-2{height:100px}
  .g-stage.g-compact #g-screen-champion .g-champion-block-3{height:75px}
}
@media (prefers-reduced-motion:reduce){
  .g-screen.active .g-champion-block-1,.g-screen.active .g-champion-block-2,.g-screen.active .g-champion-block-3{animation:none;clip-path:none}
}
.g-stage.g-portrait [class~="text-xs"]{font-size:calc(var(--text-xs,.75rem)*1.35)!important}
.g-stage.g-portrait [class~="text-sm"]{font-size:calc(var(--text-sm,.875rem)*1.3)!important}
.g-stage.g-portrait [class~="text-base"]{font-size:calc(var(--text-base,1rem)*1.25)!important}
.g-stage.g-portrait [class~="text-lg"]{font-size:calc(var(--text-lg,1.125rem)*1.2)!important}
.g-stage.g-portrait [class~="text-xl"]{font-size:calc(var(--text-xl,1.25rem)*1.15)!important}
.g-stage.g-portrait [class~="text-2xl"]{font-size:calc(var(--text-2xl,1.5rem)*1.15)!important}
.g-stage.g-portrait [class~="text-3xl"]{font-size:calc(var(--text-3xl,1.875rem)*1.12)!important}
.g-stage.g-portrait [class~="text-4xl"]{font-size:calc(var(--text-4xl,2.25rem)*1.1)!important}
.g-stage.g-portrait [class~="text-5xl"]{font-size:calc(var(--text-5xl,3rem)*1.08)!important}
.g-stage.g-portrait [class~="text-6xl"]{font-size:calc(var(--text-6xl,3.75rem)*1.06)!important}
.g-stage.g-portrait [class~="text-7xl"]{font-size:calc(var(--text-7xl,4.5rem)*1.05)!important}
.g-stage.g-portrait [class~="text-8xl"]{font-size:calc(var(--text-8xl,6rem)*1.05)!important}
.g-stage.g-portrait [class~="text-[8px]"]{font-size:12px!important}
.g-stage.g-portrait [class~="text-[9px]"]{font-size:13.5px!important}
.g-stage.g-portrait [class~="text-[10px]"]{font-size:15px!important}
.g-stage.g-portrait [class~="text-[11px]"]{font-size:16.5px!important}
.g-stage.g-portrait [class~="text-[2.5rem]"]{font-size:3rem!important}
.g-stage.g-portrait [class~="text-[7rem]"]{font-size:7.35rem!important}
.g-stage.g-portrait .g-option-label{font-size:2.1rem!important}
.g-stage.g-portrait .g-option-percent{font-size:1.2rem!important}
.g-stage.g-portrait .g-option-correct{font-size:13px!important}
.g-stage.g-portrait .g-lb-rank{font-size:1.5rem!important}
.g-stage.g-portrait .g-lang-chip,.g-stage.g-portrait .g-setting-chip{font-size:15px!important}
`;
