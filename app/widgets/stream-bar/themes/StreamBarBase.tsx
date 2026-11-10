'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type {
  StreamBarAlert,
  StreamBarAlertKind,
  StreamBarGoal,
  StreamBarPalette,
  StreamBarRule,
  StreamBarThemeProps,
} from './types';
import './StreamBarBase.css';

const CLOCK =
  '<svg viewBox="0 0 16 16" fill="none" stroke="#3fe0c8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8.7" r="5.4"/><path d="M8 6v2.8l1.9 1.2M6.4 1.6h3.2"/></svg>';
const EYE =
  '<svg viewBox="0 0 16 16" fill="none" stroke="#3fe0c8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.2 8S3.6 3.4 8 3.4 14.8 8 14.8 8 12.4 12.6 8 12.6 1.2 8 1.2 8z"/><circle cx="8" cy="8" r="2.1"/></svg>';
const GAMEPAD =
  '<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14h20a10 10 0 019.5 12.5l-2 8a5 5 0 01-8.5 2L30 31H18l-3 5.5a5 5 0 01-8.5-2l-2-8A10 10 0 0114 14z"/><path d="M15 21v6M12 24h6"/><circle cx="32" cy="22" r="1.4" fill="#fff"/><circle cx="36" cy="26" r="1.4" fill="#fff"/></svg>';

const ICONS: Record<string, string> = {
  chatting:
    '<svg viewBox="0 0 64 64"><path d="M14 27h28v13a10 10 0 01-10 10h-8a10 10 0 01-10-10z" fill="#e59a5a"/><path d="M14 27h28v5H14z" fill="#f0b077"/><path d="M42 31h4a6 6 0 010 12h-4" fill="none" stroke="#e59a5a" stroke-width="4" stroke-linecap="round"/><ellipse cx="28" cy="27" rx="14" ry="3.5" fill="#6b3f22"/><path d="M22 19c-2-3 2-4 0-8M30 19c-2-3 2-4 0-8" stroke="#fff" stroke-opacity=".75" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="38" y="6" width="19" height="14" rx="4.5" fill="#f4f1e8"/><path d="M43 20l-3 5 7-5z" fill="#f4f1e8"/><circle cx="44" cy="13" r="1.5" fill="#2a6f86"/><circle cx="48.5" cy="13" r="1.5" fill="#2a6f86"/><circle cx="53" cy="13" r="1.5" fill="#2a6f86"/></svg>',
  sketch:
    '<svg viewBox="0 0 64 64"><path d="M32 8C17 8 7 18 7 31c0 12 9 22 21 22 5 0 6-3 4-6-2-3 0-6 4-6h8c7 0 13-4 13-11C57 18 46 8 32 8z" fill="#f2dcae"/><circle cx="20" cy="26" r="4.2" fill="#e5484d"/><circle cx="31" cy="18" r="4.2" fill="#3aa0f0"/><circle cx="43" cy="22" r="4.2" fill="#f7c948"/><circle cx="19" cy="39" r="4.2" fill="#3ec28f"/><path d="M44 46l13-23" stroke="#7a4a2a" stroke-width="3.6" stroke-linecap="round"/><path d="M44 46l-4 6 8-2z" fill="#2f2420"/></svg>',
  building:
    '<svg viewBox="0 0 64 64"><rect x="12" y="10" width="40" height="29" rx="3.5" fill="#33475b"/><rect x="15" y="13" width="34" height="23" rx="2" fill="#f4efe6"/><rect x="18" y="17" width="12" height="3" rx="1.5" fill="#e5484d"/><rect x="18" y="23" width="20" height="3" rx="1.5" fill="#3aa0f0"/><rect x="18" y="29" width="9" height="3" rx="1.5" fill="#3ec28f"/><path d="M6 43h52l-4 9H10z" fill="#4a6178"/><rect x="26" y="45.5" width="12" height="2" rx="1" fill="#8aa1b5"/></svg>',
  study:
    '<svg viewBox="0 0 64 64"><rect x="9" y="46" width="46" height="9" rx="2.2" fill="#c0563a"/><rect x="12" y="37" width="40" height="9" rx="2.2" fill="#e8c36a"/><rect x="8" y="28" width="42" height="9" rx="2.2" fill="#3b7f9e"/><path d="M38 24l5-13 11 4-3 13z" fill="#f2c14e"/><path d="M43 11l-1-5" stroke="#6b5a3a" stroke-width="2.4" stroke-linecap="round"/><rect x="36" y="24" width="16" height="3.5" rx="1.7" fill="#6b5a3a"/></svg>',
  music:
    '<svg viewBox="0 0 64 64"><circle cx="28" cy="40" r="19" fill="#1c1030"/><circle cx="28" cy="40" r="12" fill="none" stroke="#3b2a5c" stroke-width="1.5"/><circle cx="28" cy="40" r="6.5" fill="#f0a3d8"/><circle cx="28" cy="40" r="1.8" fill="#1c1030"/><path d="M15 36c3-8 10-11 17-10" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/><path d="M14 36C14 8 54 8 54 36" fill="none" stroke="#e9e6f5" stroke-width="4" stroke-linecap="round"/><rect x="9" y="32" width="10" height="17" rx="5" fill="#7fd6e8"/><rect x="49" y="32" width="10" height="17" rx="5" fill="#7fd6e8"/></svg>',
  irl: '<svg viewBox="0 0 64 64"><rect x="8" y="22" width="48" height="31" rx="7" fill="#f4ecd8"/><path d="M8 29a7 7 0 017-7h34a7 7 0 017 7v2H8z" fill="#e5484d"/><circle cx="32" cy="40" r="11" fill="#33475b"/><circle cx="32" cy="40" r="7.2" fill="#3aa0f0"/><circle cx="29.5" cy="37.5" r="2.2" fill="#fff" fill-opacity=".75"/><rect x="14" y="16" width="10" height="6" rx="2" fill="#33475b"/><circle cx="48" cy="29" r="2.2" fill="#fff"/><path d="M50 3a6.5 6.5 0 016.5 6.5C56.5 14 50 20 50 20s-6.5-6-6.5-10.5A6.5 6.5 0 0150 3z" fill="#ff5a6e"/><circle cx="50" cy="9.5" r="2.2" fill="#fff"/></svg>',
  variety:
    '<svg viewBox="0 0 64 64"><path d="M17 20h30a12 12 0 0111.8 14.2l-2.6 14a6 6 0 01-10.4 2.8L42 42H22l-4.8 9a6 6 0 01-10.4-2.8l-2.6-14A12 12 0 0117 20z" fill="#3a3f55"/><path d="M17 20h30" stroke="#5b6283" stroke-width="2" stroke-linecap="round"/><path d="M20 28v10M15 33h10" stroke="#f2f2f5" stroke-width="3.2" stroke-linecap="round"/><circle cx="43" cy="30" r="2.7" fill="#ffd166"/><circle cx="49" cy="35" r="2.7" fill="#ff6b9a"/><circle cx="37" cy="35" r="2.7" fill="#3ec28f"/><circle cx="43" cy="40" r="2.7" fill="#4aa9f2"/></svg>',
};

const PRESETS: Record<string, { title: string; sub: string; bg: [string, string] }> = {
  chatting: { title: 'Just chatting', sub: 'Coffee & questions', bg: ['#1f4258', '#0f2538'] },
  sketch: { title: 'Sketch stream', sub: 'Commissions open', bg: ['#f47f6e', '#d94f55'] },
  building: { title: 'Building a game', sub: 'Devlog #12', bg: ['#a6dcc4', '#6cb99b'] },
  study: { title: 'Study with me', sub: '50 / 10 focus', bg: ['#aebf80', '#6f8456'] },
  music: { title: 'Music production', sub: 'Beat from scratch', bg: ['#e04aae', '#7c3aed'] },
  irl: { title: 'IRL walk', sub: 'Night market', bg: ['#ffb54a', '#f2742c'] },
  variety: { title: 'Variety night', sub: 'Chat picks the game', bg: ['#6f5ff7', '#3a2fd0'] },
};

const MARQUEE_ICONS: Record<string, string> = {
  none: '',
  follow:
    '<svg viewBox="0 0 20 20" fill="none" stroke="#8fd1e8" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="7" r="3.2"/><path d="M2.5 16.5c.6-3 3-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><path d="M16 5v5M13.5 7.5h5"/></svg>',
  shield:
    '<svg viewBox="0 0 20 20" fill="none" stroke="#d5b86a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2.5l6 2.2v4.6c0 4-2.6 6.6-6 8.2-3.4-1.6-6-4.2-6-8.2V4.7z"/><path d="M7.2 9.8l2 2 3.6-3.8"/></svg>',
  heart:
    '<svg viewBox="0 0 20 20"><path d="M10 17.2S2.8 12.8 2.8 7.6A3.9 3.9 0 0110 5.6a3.9 3.9 0 017.2 2c0 5.2-7.2 9.6-7.2 9.6z" fill="#ff6b9a"/></svg>',
};

const ALERT_ICONS: Record<StreamBarAlertKind, string> = {
  raid: '<svg viewBox="0 0 50 56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M25 4c8 6 11 15 9 26H16C14 19 17 10 25 4z"/><circle cx="25" cy="19" r="4.5"/><path d="M16 30l-6 8 8-2M34 30l6 8-8-2"/><path d="M21 36v6M29 36v6M25 36v14"/></svg>',
  follow:
    '<svg viewBox="0 0 50 56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="21" cy="19" r="9"/><path d="M4 48c1.5-9 8-14 17-14s15.5 5 17 14"/><path d="M41 10v14M34 17h14"/></svg>',
  sub: '<svg viewBox="0 0 50 56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M25 5l6.2 14 15.3 1.4-11.6 10 3.5 15L25 37.8 11.6 45.4l3.5-15-11.6-10L18.8 19z"/></svg>',
  donation:
    '<svg viewBox="0 0 50 56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M25 48S5 36 5 22a11 11 0 0120-6 11 11 0 0120 6c0 14-20 26-20 26z"/></svg>',
  gift: '<svg viewBox="0 0 50 56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 20h34v10H8zM12 30h26v18H12z"/><path d="M25 20v28M25 20c-7 0-11-3-11-7a4 4 0 018-1c1 3 3 8 3 8zM25 20c7 0 11-3 11-7a4 4 0 00-8-1c-1 3-3 8-3 8z"/></svg>',
  goal: '<svg viewBox="0 0 50 56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 8h22v12a11 11 0 01-22 0z"/><path d="M14 12H6c0 8 3 12 9 13M36 12h8c0 8-3 12-9 13"/><path d="M25 31v9M16 48h18M19 40h12"/></svg>',
};

type AlertColor = { ev: string; g: string; a: [string, string, string]; chip: string };

const ALERT_COLORS: Record<StreamBarAlertKind, AlertColor> = {
  raid: { ev: '#4aa9f2', g: 'rgba(74,169,242,.65)', a: ['#4aa6f4', '#44c0e4', '#3dd9c6'], chip: '#3fe0c8' },
  follow: { ev: '#3fe0c8', g: 'rgba(63,224,200,.60)', a: ['#3fb8f0', '#3fd0d8', '#45e0b4'], chip: '#3fe0c8' },
  sub: { ev: '#b58cff', g: 'rgba(181,140,255,.65)', a: ['#6f8cff', '#8f84f4', '#b57cf0'], chip: '#d6c2ff' },
  donation: { ev: '#ff6b9a', g: 'rgba(255,107,154,.65)', a: ['#ff6f9f', '#ff8590', '#ffa56d'], chip: '#ffc2d6' },
  gift: { ev: '#ffd166', g: 'rgba(255,209,102,.70)', a: ['#f7b32b', '#f4952c', '#ec7a30'], chip: '#ffd166' },
  goal: { ev: '#ffd166', g: 'rgba(255,209,102,.70)', a: ['#f7b32b', '#f4952c', '#ec7a30'], chip: '#ffd166' },
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const hms = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
};
const fmtT = (s: number) => {
  const v = Math.max(0, Math.floor(Number(s) || 0));
  return `${Math.floor(v / 60)}:${pad2(v % 60)}`;
};
const rp = (n: number) => `Rp ${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;
const num = (n: number) => Math.round(Number(n) || 0).toLocaleString('id-ID');
const showValue = (g: StreamBarGoal, v: number) => (g.fmt === 'rp' ? rp(v) : num(v));

function richText(html: string): ReactNode[] {
  return html.split(/(<b>.*?<\/b>)/gi).map((part, i) => {
    const bold = part.match(/^<b>(.*?)<\/b>$/i);
    if (bold) return <b key={i}>{bold[1]}</b>;
    return <span key={i}>{part.replace(/<[^>]+>/g, '')}</span>;
  });
}

/** Judul panjang digeser (marquee) di dalam kotak tetap; teks pendek tampil normal. */
function MarqueeText({ text, className }: { text: string; className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [run, setRun] = useState(false);
  const [dist, setDist] = useState(0);
  const [dur, setDur] = useState(12);

  useEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!box || !inner) return;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const over = inner.scrollWidth - box.clientWidth;
      setRun(over > 2);
      setDist(Math.max(0, over));
      setDur(Math.max(6, Math.round((inner.scrollWidth + 30) / 60)));
    };
    measure();
    // Ukur ulang setelah font selesai dimuat (lebar teks bisa berubah).
    const t = window.setTimeout(measure, 400);
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [text]);

  return (
    <div ref={boxRef} className={`sb-abs ${className || ''}`.trim()}>
      <span
        ref={innerRef}
        className={run ? 'sb-title-inner sb-title-run' : 'sb-title-inner'}
        style={{ '--marq-dur': `${dur}s`, '--marq-dist': `-${dist}px` } as CSSProperties}
      >
        {text}
      </span>
    </div>
  );
}

type AlertPart = { text: string; chip?: boolean };

function alertParts(item: StreamBarAlert): { label: string; parts: AlertPart[] } {
  switch (item.type) {
    case 'follow':
      return { label: 'New follower', parts: [{ text: item.name, chip: true }, { text: 'just followed!' }] };
    case 'sub': {
      const months = Number(item.months) || 0;
      const parts: AlertPart[] = [{ text: item.name, chip: true }, { text: months > 1 ? 'subscribed for' : 'just subscribed!' }];
      if (months > 1) parts.push({ text: String(months), chip: true }, { text: 'months!' });
      return { label: 'New subscriber', parts };
    }
    case 'donation':
      return { label: 'New donation', parts: [{ text: item.name, chip: true }, { text: 'donated' }, { text: rp(item.amount || 0), chip: true }] };
    case 'gift': {
      const parts: AlertPart[] = [{ text: item.name, chip: true }, { text: 'sent' }, { text: item.giftName || 'Gift', chip: true }];
      if ((item.count || 1) > 1) parts.push({ text: `×${item.count}` });
      return { label: 'New gift', parts };
    }
    case 'goal':
      return { label: 'Goal reached', parts: [{ text: item.name, chip: true }, { text: 'reached!' }] };
    default:
      return { label: 'Raid', parts: [{ text: item.name, chip: true }, { text: 'is raiding with' }, { text: String(item.viewers || 0), chip: true }, { text: 'viewers!' }] };
  }
}

function LiveCard({
  mode,
  preset,
  title,
  sub,
  image,
  startedAt,
  viewers,
  now,
}: {
  mode: 'activity' | 'game';
  preset: string;
  title: string;
  sub: string;
  image: string;
  startedAt: number;
  viewers: number;
  now: number;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const pr = PRESETS[preset] || PRESETS.chatting;
  const cover = image;
  const showImg = !!cover && failedUrl !== cover;
  const label = title || (mode === 'activity' ? pr.title : '');
  const subLabel = sub || (mode === 'activity' ? pr.sub : '');
  const icon = ICONS[preset] || ICONS.chatting;
  const gameTitle = title || 'Game';

  let h = 0;
  for (const ch of gameTitle) h = (h * 31 + (ch.codePointAt(0) || 0)) % 360;

  return (
    <>
      {showImg ? (
        <div className="sb-abs sb-cover-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" onError={() => setFailedUrl(cover)} />
        </div>
      ) : mode === 'activity' ? (
        <div
          className="sb-abs sb-cover-sm"
          style={{ background: `linear-gradient(160deg, ${pr.bg[0]}, ${pr.bg[1]})` }}
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      ) : (
        <div className="sb-abs sb-cover-sm">
          <div className="sb-ph" style={{ '--h': h, '--h2': (h + 50) % 360 } as CSSProperties}>
            <span dangerouslySetInnerHTML={{ __html: GAMEPAD }} />
            <span>{gameTitle}</span>
          </div>
        </div>
      )}
      <div className="sb-abs sb-np-label">
        <span className="sb-dot sb-red" />
        <span>Live now</span>
      </div>
      <div className="sb-abs sb-name">{label}</div>
      <div className="sb-abs sb-sub">{subLabel}</div>
      <div className="sb-abs sb-chips">
        <span className="sb-chip">
          <span dangerouslySetInnerHTML={{ __html: CLOCK }} />
          <b>{hms(now - startedAt)}</b>
        </span>
        <span className="sb-chip">
          <span dangerouslySetInnerHTML={{ __html: EYE }} />
          <b>{Math.max(0, Math.floor(viewers || 0)).toLocaleString('id-ID')}</b>
        </span>
      </div>
    </>
  );
}

export function StreamBarBase({
  palette,
  accent,
  font,
  streamStartedAt,
  viewers,
  activityPreset,
  activityTitle,
  activitySub,
  activityImage,
  songActive,
  songTitle,
  songArtist,
  songArt,
  songElapsed,
  songTotal,
  gameActive,
  gameName,
  gameGenre,
  gameCover,
  welcomeLabel,
  welcomeTitle,
  welcomeSub,
  rules,
  alert,
  alertMs,
  goals,
  goalStyle,
  goalRotateMs,
  className,
}: StreamBarThemeProps & { palette: StreamBarPalette; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Rotasi tampilan kiri: activity / now playing / game.
  const views = useMemo(() => {
    const list: string[] = [];
    if (songActive) list.push('music');
    if (gameActive) list.push('game');
    return list.length ? list : ['stream'];
  }, [songActive, gameActive]);
  const [view, setView] = useState('stream');
  const activeView = views.includes(view) ? view : views[0];
  useEffect(() => {
    if (views.length <= 1) return;
    const t = window.setInterval(() => {
      setView((cur) => views[(views.indexOf(cur) + 1) % views.length]);
    }, 9000);
    return () => window.clearInterval(t);
  }, [views]);

  // Rotasi goals.
  const [goalIndex, setGoalIndex] = useState(0);
  const [goalOut, setGoalOut] = useState(false);
  const goalOutTimer = useRef<number | null>(null);
  const activeGoalIndex = goalIndex < goals.length ? goalIndex : 0;
  useEffect(() => {
    if (goals.length <= 1) return;
    const t = window.setInterval(() => {
      setGoalOut(true);
      goalOutTimer.current = window.setTimeout(() => {
        setGoalIndex((i) => (i + 1) % goals.length);
        setGoalOut(false);
      }, 450);
    }, Math.max(2000, goalRotateMs));
    return () => {
      window.clearInterval(t);
      if (goalOutTimer.current) window.clearTimeout(goalOutTimer.current);
    };
  }, [goals.length, goalRotateMs]);

  // Alert lifecycle: kelas sb-alerting/langsung memicu animasi wipe masuk.
  const alerting = !!alert && !alert.closing;
  const leaving = !!alert?.closing;
  const color = ALERT_COLORS[alert?.item.type || 'raid'] || ALERT_COLORS.raid;

  // Marquee: durasi mengikuti panjang teks, ~70px/detik.
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [marqueeDur, setMarqueeDur] = useState(40);
  const ruleRows: StreamBarRule[] = rules.length ? rules : [{ icon: 'none', html: '' }];
  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;
    const w = el.scrollWidth / 2;
    setMarqueeDur(Math.max(20, Math.round(w / 70)));
  }, [rules]);

  const styleVars = {
    '--sb-bar-from': palette.barFrom,
    '--sb-bar-to': palette.barTo,
    '--sb-bar-edge': palette.barEdge,
    '--sb-teal': accent || palette.teal,
    '--sb-blue': palette.blue,
    '--sb-text': palette.text,
    '--sb-muted': palette.muted,
    '--sb-panel-from': palette.panelFrom,
    '--sb-panel-to': palette.panelTo,
    '--sb-panel-border': palette.panelBorder,
    '--sb-card-bg': palette.cardBg,
    '--sb-icon-bg': palette.iconBg,
    '--sb-icon-border': palette.iconBorder,
    '--sb-chip-bg': palette.chipBg,
    '--sb-chip-text': palette.chipText,
    '--sb-marquee-sep': palette.marqueeSep,
    '--sb-shadow': palette.shadow,
    '--gdur': `${Math.max(2, goalRotateMs / 1000)}s`,
    '--dur': `${Math.max(1, (alert?.item.duration || alertMs) / 1000)}s`,
    '--ev': color.ev,
    '--evg': color.g,
    '--a1': color.a[0],
    '--a2': color.a[1],
    '--a3': color.a[2],
    '--chipc': color.chip,
    fontFamily: `'${font}', 'Outfit', 'Segoe UI', system-ui, sans-serif`,
  } as CSSProperties;

  const stageClass = [
    'stream-bar-stage',
    className || '',
    alerting ? 'sb-alerting' : '',
    leaving ? 'sb-leaving' : '',
  ].filter(Boolean).join(' ');

  const parts = alert ? alertParts(alert.item) : null;
  let wordIndex = 0;

  const goal = goals.length ? goals[Math.min(activeGoalIndex, goals.length - 1)] : null;
  const pct = goal ? Math.min(100, Math.round((goal.current / Math.max(1, goal.target)) * 100)) : 0;
  const left = goal ? Math.max(0, goal.target - goal.current) : 0;
  const progress = songTotal > 0 ? Math.max(0, Math.min(100, (songElapsed / songTotal) * 100)) : 0;

  return (
    <div className={stageClass} style={styleVars}>
      <div className="sb-abs sb-bar" />
      <div className="sb-abs sb-bar-halo" />
      <div className="sb-abs sb-bar-fx" />

      {/* ===== Kiri: kartu aktivitas ===== */}
      <div className={activeView === 'stream' ? 'sb-abs sb-view sb-show' : 'sb-abs sb-view'}>
        <LiveCard
          mode="activity"
          preset={activityPreset}
          title={activityTitle}
          sub={activitySub}
          image={activityImage}
          startedAt={streamStartedAt}
          viewers={viewers}
          now={now}
        />
      </div>

      {/* ===== Kiri: now playing ===== */}
      <div className={activeView === 'music' ? 'sb-abs sb-view sb-show' : 'sb-abs sb-view'}>
        <div className="sb-abs sb-vinyl" />
        <div className="sb-abs sb-cover">
          {songArt ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="sb-cover-img"
                src={songArt}
                alt=""
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="sb-shine" />
            </>
          ) : (
            <>
              <div className="sb-sun" />
              <div className="sb-hill" />
              <div className="sb-reflect" />
              <div className="sb-shine" />
            </>
          )}
        </div>
        <div className="sb-abs sb-np-label">
          <span className="sb-dot" />
          <span>Now playing</span>
          <span className="sb-eq"><i /><i /><i /></span>
        </div>
        <MarqueeText text={songTitle} className="sb-title-box" />
        <div className="sb-abs sb-artist">{songArtist}</div>
        <div className="sb-abs sb-time" style={{ left: 224 }}>{fmtT(songElapsed)}</div>
        <div className="sb-abs sb-track"><b style={{ width: `${progress}%` }} /></div>
        <div className="sb-abs sb-time" style={{ left: 554 }}>{fmtT(songTotal)}</div>
      </div>

      {/* ===== Kiri: game ===== */}
      <div className={activeView === 'game' ? 'sb-abs sb-view sb-show' : 'sb-abs sb-view'}>
        <LiveCard
          mode="game"
          preset={activityPreset}
          title={gameName}
          sub={gameGenre}
          image={gameCover}
          startedAt={streamStartedAt}
          viewers={viewers}
          now={now}
        />
      </div>

      {/* ===== Tengah: welcome + rules marquee ===== */}
      <div className="sb-abs sb-panel sb-welcome">
        <div className="sb-w-line" />
        <div className="sb-w-icon">
          <svg viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 6l3.6 9.4L35 19l-9.4 3.6L22 32l-3.6-9.4L9 19l9.4-3.6z" />
            <path d="M34 28v8M30 32h8" strokeWidth="2.2" />
          </svg>
        </div>
        <div className="sb-w-label">{welcomeLabel}</div>
        <div className="sb-w-title">{welcomeTitle}</div>
        <div className="sb-w-sub">{welcomeSub}</div>
        <div className="sb-w-div" />
        <div className="sb-marquee">
          <div className="sb-m-track" ref={marqueeRef} style={{ animationDuration: `${marqueeDur}s` }}>
            {[0, 1].map((copy) => (
              <span key={copy} style={{ display: 'inline-flex', alignItems: 'center' }}>
                {ruleRows.map((rule, i) => (
                  <span key={`${copy}-${i}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span className="sb-m-item">
                      {MARQUEE_ICONS[rule.icon || 'none'] ? (
                        <span dangerouslySetInnerHTML={{ __html: MARQUEE_ICONS[rule.icon || 'none'] }} />
                      ) : null}
                      <span>{richText(rule.html)}</span>
                    </span>
                    <span className="sb-m-sep">•</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Tengah: alert / event ===== */}
      <div className="sb-abs sb-panel sb-alert" key={alert?.item.id || 'idle'}>
        <div className="sb-ring" />
        <div className="sb-wave" />
        <div className="sb-wave" />
        <div className="sb-wave" />
        <div className="sb-a-icon">
          {alert ? <span dangerouslySetInnerHTML={{ __html: ALERT_ICONS[alert.item.type] || ALERT_ICONS.raid }} /> : null}
        </div>
        <div className="sb-a-label">{parts?.label || ''}</div>
        <div className="sb-a-text">
          {parts?.parts.map((part, pi) => {
            if (part.chip) {
              wordIndex += 1;
              return (
                <span className="sb-w" key={`c-${pi}`}>
                  <span className="sb-wi sb-chip-inline" style={{ '--i': wordIndex - 1 } as CSSProperties}>{part.text}</span>
                </span>
              );
            }
            return part.text.split(' ').filter(Boolean).map((word, wi) => {
              wordIndex += 1;
              return (
                <span className="sb-w" key={`t-${pi}-${wi}`}>
                  <span className="sb-wi" style={{ '--i': wordIndex - 1 } as CSSProperties}>{word}</span>
                </span>
              );
            });
          })}
        </div>
        <div className="sb-a-track"><b key={alert?.item.id || 'idle'} /></div>
        <div className="sb-sweep" />
      </div>

      {/* ===== Goals ===== */}
      {goals.length > 0 && (
      <>
      <div className={`sb-abs sb-goal${goalOut ? ' sb-out' : ''}${goalStyle === 'bar' ? ' sb-goal-bar' : ''}`}>
        <div className="sb-g-ring">
          <svg viewBox="0 0 116 116">
            <circle cx="58" cy="58" r="50" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="8" />
            <circle
              className="sb-g-arc"
              cx="58"
              cy="58"
              r="50"
              fill="none"
              stroke={accent || palette.teal}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="314.16"
              strokeDashoffset={314.16 * (1 - pct / 100)}
            />
          </svg>
          <div className="sb-g-pct">{pct}%</div>
        </div>
        <div className="sb-g-text">
          <div className="sb-g-head">
            <div className="sb-g-label">{goal?.label || ''}</div>
            <div className="sb-g-pct2">{pct}%</div>
          </div>
          <div className="sb-g-main">
            {goal ? (
              <>
                <span>{showValue(goal, goal.current)}</span>
                <small>/ {showValue(goal, goal.target)}{goal.unit ? ` ${goal.unit}` : ''}</small>
              </>
            ) : null}
          </div>
          <div className="sb-g-bar"><b style={{ width: `${pct}%` }} /></div>
          <div className="sb-g-sub">
            {goal ? `${showValue(goal, left)} to go${goal.next > 0 ? ` · Next ${showValue(goal, goal.next)}` : ''}` : ''}
          </div>
        </div>
      </div>
      <div className="sb-abs sb-g-line"><b key={activeGoalIndex} /></div>
      </>
      )}
    </div>
  );
}
