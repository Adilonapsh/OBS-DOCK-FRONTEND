'use client';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import './landing.css';
import { createClient } from '@/utils/supabase/client';

const SIM_STATES = ['chat', 'event', 'poll', 'timer', 'dock'] as const;
type SimName = typeof SIM_STATES[number];

const CHAT_SEED: Array<[string, string, string]> = [
  ['TIKTOK', 'LHM', 'pakai lensa apa kak?'],
  ['TWITCH', 'NeonPilot', 'Delay DoAction rendah banget (<40ms)'],
  ['YOUTUBE', 'SilverPioneer94', 'Vote [2] di poll! Valorant!'],
  ['KICK', 'RumbleWorks', 'Dock MediaMTX sinkron sama OBS'],
  ['TIKTOK', 'IKYY', 'pake mic ga ini bang?'],
];
const EV_SEED: Array<[string, string, string]> = [
  ['TIKTOK', 'LHM', '50x Rose Gift'],
  ['YOUTUBE', 'SilverPioneer94', '$20 Superchat'],
  ['TWITCH', 'CosmicEcho77', 'Resub 18 bln'],
  ['KICK', 'ApexGod', '5 Sub Gift'],
];
const CHAT_SAMPLES: Array<[string, string]> = [
  ['TIKTOK', 'LHM: pakai lensa apa kak?'],
  ['TWITCH', 'NeonPilot: delay-nya kecil banget'],
  ['YOUTUBE', 'Silver: vote yang nomor 2!'],
  ['KICK', 'Raka: audio-nya sinkron 🔥'],
];
const LOGOS = [
  { n: 'Streamer.bot', s: '/assets/logo/sbot.png' },
  { n: 'OBS Studio', s: '/assets/logo/obs.png' },
  { n: 'TikTok LIVE', s: '/assets/logo/tik-tok.png' },
  { n: 'MediaMTX', s: '/assets/logo/mediamtx.svg' },
  { n: 'XSplit', s: '/assets/logo/xsplit.png' },
  { n: 'Streamlabs', s: '/assets/logo/streamlabs.png' },
  { n: 'vMix', s: '/assets/logo/vmix.png' },
  { n: 'YouTube', s: '/assets/logo/youtube.png' },
  { n: 'Twitch', s: '/assets/logo/twitch.png' },
  { n: 'Kick', s: '/assets/logo/kick.png' },
];
/* Daftar widget — sama dengan page /widgets (id, params, ukuran thumbnail) */
type LPWidget = { id: string; title: string; desc: string; category: string; tags: string[]; params: string; w: number; h: number };
/* Daftar widget — sama dengan page /widgets (id, params, ukuran thumbnail).
   URUTAN PENTING: disusun agar bento 6 kolom (dense flow) terisi penuh tanpa lubang:
   chat(s4×2brs)+event(s2) | +follow(s2) | poll(s3)+timer(s3) | ticker(s6) |
   clock+media+counter(s2×3) | lyrics+music(s3×2) | task+qr+pinned(s2×3) | slides+social(s3×2) */
const LP_WIDGETS: LPWidget[] = [
  { id: 'chat', title: 'Chat Overlay', desc: 'Overlay chat TikTok + Streamer.bot (Twitch/YouTube/Kick) - 5 tema (Cute lavender), avatar & platform logo, animasi elegant & horizontal/inline.', category: 'chat', tags: ['Chat', 'TikTok', 'Streamer.bot', 'Overlay'], params: 'theme=perchar&font=Outfit&accent=%238b5cf6', w: 420, h: 520 },
  { id: 'event', title: 'Event Overlay', desc: 'Overlay event Join • Gift • Like - TikTok member/gift/like + Streamer.bot, 3 tema (Standard/Minimal/Cute), filter per event, animasi elegant.', category: 'alert', tags: ['Event', 'Join', 'Gift', 'Like', 'TikTok'], params: 'theme=perchar&font=Outfit&accent=%238b5cf6', w: 420, h: 400 },
  { id: 'follow', title: 'Follow Overlay', desc: 'Follow alert + suara - TikTok follow/member + Twitch/YouTube follow via Streamer.bot, 3 tema, suara MP3 kustom.', category: 'alert', tags: ['Follow', 'Alert', 'Sound', 'TikTok'], params: 'theme=cute&font=Outfit&accent=%23ec4899', w: 420, h: 300 },
  { id: 'poll', title: 'Poll Widget', desc: 'Polling interaktif 2-6 opsi - vote via chat 1-6 dari TikTok & Streamer.bot (YT/Twitch/Kick), progress % + voter count, 4 tema.', category: 'progress', tags: ['Poll', 'Vote', 'TikTok', 'Streamer.bot'], params: 'theme=editorial&font=Outfit', w: 640, h: 550 },
  { id: 'timer', title: 'Timer', desc: 'Pomodoro 50:00 × 3 sesi - 4 tema (Focus/Minimal/Subathon/Glass), Glass sync dock ±5m & COUNTDOWN live + badge +5m.', category: 'progress', tags: ['Timer', 'Focus', 'Glass', 'Sync'], params: 'theme=glass&font=Nunito&focusMinutes=50&totalSessions=3', w: 360, h: 340 },
  { id: 'ticker', title: 'Ticker', desc: 'Running text pengumuman / sponsor loop - 3 tema (Standard/Clean/Neon), kecepatan & arah atur, badge INFO.', category: 'info', tags: ['Ticker', 'Running Text', 'Pengumuman', 'Sponsor', 'OBS'], params: 'theme=standard&font=Outfit', w: 640, h: 120 },
  { id: 'clock', title: 'Clock Widget', desc: 'Jam digital 3 baris - format bebas, timezone, warna/size/opacity per baris. Transparent untuk OBS.', category: 'info', tags: ['Clock', 'Time', 'Timezone'], params: 'font=Outfit&tz=Asia/Jakarta&l1=hh:mm:ss%20A&l2=ddd%20D%20MMM%20YY', w: 600, h: 500 },
  { id: 'media-player', title: 'Media Player Widget', desc: 'Now Playing SMTC - Spotify/YouTube/VLC + Vibrant palette, 11 themes, progress & marquee.', category: 'info', tags: ['SMTC', 'Spotify', 'Vibrant', 'Now Playing'], params: 'theme=classic&font=Outfit&showProgressBar=true&showAlbumArt=true', w: 500, h: 500 },
  { id: 'view-counter', title: 'View Counter', desc: 'Total penonton gabungan TikTok + Twitch + YouTube + Kick. TikTok via backend, sisanya via Streamer.bot.', category: 'info', tags: ['Viewers', 'TikTok', 'Streamer.bot'], params: 'theme=standard&font=Outfit', w: 260, h: 200 },
  { id: 'lyrics', title: 'Lyrics Widget', desc: 'Synced Lyrics SMTC - hanya lirik (tanpa cover/progress), karaoke highlight via LRCLIB, 11 themes.', category: 'info', tags: ['Lyrics', 'LRCLIB', 'SMTC', 'Karaoke'], params: 'theme=simple&font=Outfit&lyricsFontSize=20&maxLyricsLines=3&lyricsAlign=center', w: 560, h: 180 },
  { id: 'music', title: 'Music Request', desc: 'Song request via chat !song + queue + player. Kontrol play/pause/next dari dock.', category: 'info', tags: ['Music', 'Song Request', 'Queue'], params: 'theme=card&font=Outfit', w: 420, h: 220 },
  { id: 'task', title: 'Task List', desc: 'Task list - 2 tema, inline/horizontal, animasi masuk/keluar. Pisah dari Timer.', category: 'progress', tags: ['Task', 'List', 'Todo'], params: 'theme=focus&font=Nunito', w: 360, h: 400 },
  { id: 'qr', title: 'QR Code', desc: 'QR statis untuk donasi / link / sosial - 7 tema, logo custom di tengah, warna & error correction bisa diatur.', category: 'info', tags: ['QR', 'Donasi', 'Link', 'Saweria'], params: 'theme=standard&font=Outfit&value=https%3A%2F%2Fsaweria.co%2Fusername&label=SCAN+UNTUK+DONASI', w: 300, h: 340 },
  { id: 'pinned', title: 'Pinned Chat', desc: 'Chat yang di-pin dari dock — sinkron realtime, lepas via unpin. 2 tema Standard/Minimal.', category: 'chat', tags: ['Pin', 'Chat', 'Sync'], params: 'theme=monkey&font=Outfit', w: 400, h: 500 },
  { id: 'info-slides', title: 'Info Slides', desc: 'Sponsor / Rules Loop - 5-10 slide auto-rotate 5-10s, 3 tema Clean/Boxed/Glass, badge + progress dots.', category: 'info', tags: ['Info', 'Slides', 'Sponsor', 'Rules'], params: 'theme=timer-glass&font=Outfit&fontSize=14&accent=%238b5cf6&bgOpacity=100&textColor=%23ffffff&duration=6&autoRotate=1&showProgress=1&showBadge=1&showArrows=0&anim=elegant&pos=center&slides=%255B%257B%2522id%2522%253A%2522s1%2522%252C%2522badge%2522%253A%2522SPONSOR%2522%252C%2522title%2522%253A%2522Truenapsh%2522%252C%2522desc%2522%253A%2522Powered%2520by%2520Truenapsh%2522%252C%2522accent%2522%253A%2522%25238b5cf6%2522%252C%2522image%2522%253A%2522https%253A%252F%252Fui-avatars.com%252Fapi%252F%253Fname%253DTrueNAP%2526background%253D8b5cf6%2526color%253Dfff%2526size%253D128%2526font-size%253D0.35%2526bold%253Dtrue%2522%257D%252C%257B%2522id%2522%253A%2522s2%2522%252C%2522badge%2522%253A%2522RULES%2522%252C%2522title%2522%253A%2522No%2520Toxic%2520%25E2%2580%25A2%2520No%2520SARA%2522%252C%2522desc%2522%253A%2522Jaga%2520chat%2520tetap%2520asik%2520%2526%2520respect%2520semua%2520viewer%2522%252C%2522accent%2522%253A%2522%252306b6d4%2522%257D%252C%257B%2522id%2522%253A%2522s3%2522%252C%2522badge%2522%253A%2522FOLLOW%2522%252C%2522title%2522%253A%2522Follow%2520%2526%2520Nyalakan%2520Lonceng%2522%252C%2522desc%2522%253A%2522%2540adilonapsh%2520di%2520TikTok%2520%25E2%2580%25A2%2520Twitch%2520%25E2%2580%25A2%2520YouTube%2522%252C%2522accent%2522%253A%2522%2523ec4899%2522%257D%252C%257B%2522id%2522%253A%2522s4%2522%252C%2522badge%2522%253A%2522SAWERIA%2522%252C%2522title%2522%253A%2522Dukung%2520via%2520Saweria%2522%252C%2522desc%2522%253A%2522Scan%2520QR%2520di%2520layar%2520%25E2%2580%25A2%2520Setiap%2520dukungan%2520berarti%21%2522%252C%2522accent%2522%253A%2522%2523f59e0b%2522%257D%252C%257B%2522id%2522%253A%2522s5%2522%252C%2522badge%2522%253A%2522DISCORD%2522%252C%2522title%2522%253A%2522Join%2520Discord%2520Community%2522%252C%2522desc%2522%253A%2522discord.gg%252Fadilonapsh%2520%25E2%2580%25A2%2520Info%2520turnamen%2520%2526%2520event%2522%252C%2522accent%2522%253A%2522%25235865F2%2522%257D%255D', w: 640, h: 500 },
  { id: 'social-rotator', title: 'Social Rotator', desc: 'Rotasi handle sosial - Instagram/TikTok/YouTube/Twitch/Discord, 5 tema, interval 2-20s, posisi global 9-titik.', category: 'info', tags: ['Social', 'Rotator', 'Instagram', 'TikTok', 'OBS'], params: 'theme=badge&font=Outfit&fontSize=14&accent=%238b5cf6&bgOpacity=100&textColor=%23ffffff&duration=4&autoRotate=1&showIcon=1&showHandle=1&showLabel=1&anim=slideRight&pos=tl&socials=%255B%257B%2522id%2522%253A%2522s1%2522%252C%2522platform%2522%253A%2522tiktok%2522%252C%2522handle%2522%253A%2522%2540adilonapsh%2522%252C%2522label%2522%253A%2522TikTok%2522%252C%2522accent%2522%253A%2522%2523FE2C55%2522%257D%252C%257B%2522id%2522%253A%2522s2%2522%252C%2522platform%2522%253A%2522instagram%2522%252C%2522handle%2522%253A%2522%2540adilonapsh%2522%252C%2522label%2522%253A%2522Instagram%2522%252C%2522accent%2522%253A%2522%2523E4405F%2522%257D%252C%257B%2522id%2522%253A%2522s3%2522%252C%2522platform%2522%253A%2522facebook%2522%252C%2522handle%2522%253A%2522Adil%2520On%2520Stream%2522%252C%2522label%2522%253A%2522Facebook%2522%252C%2522accent%2522%253A%2522%2523FF0000%2522%257D%252C%257B%2522id%2522%253A%2522s4%2522%252C%2522platform%2522%253A%2522twitch%2522%252C%2522handle%2522%253A%2522adilonapsh%2522%252C%2522label%2522%253A%2522Twitch%2522%252C%2522accent%2522%253A%2522%25239146FF%2522%257D%255D', w: 420, h: 350 },
];
const LP_CAT_LABEL: Record<string, string> = { chat: 'Chat', alert: 'Alert', progress: 'Progress', info: 'Info', minimal: 'Minimal' };
/* bento spans: s2/s3/s4/s6 = lebar kolom, tall = kartu hero 2 baris */
const LP_SPAN: Record<string, string> = {
  chat: 's4 tall',
  event: 's2', follow: 's2',
  poll: 's3', timer: 's3',
  ticker: 's6',
  clock: 's2', 'media-player': 's2', 'view-counter': 's2',
  lyrics: 's3', music: 's3',
  task: 's2', qr: 's2', pinned: 's2',
  'info-slides': 's3', 'social-rotator': 's3',
};
const LP_CATS: string[] = ['all', ...Array.from(new Set(LP_WIDGETS.map((w) => w.category)))];
const lpCatCount = (c: string) => (c === 'all' ? LP_WIDGETS.length : LP_WIDGETS.filter((w) => w.category === c).length);
// Jumlah item per kategori (untuk span adaptif view filter — computed sekali)
const LP_COUNT: Record<string, number> = {};
for (const w of LP_WIDGETS) LP_COUNT[w.category] = (LP_COUNT[w.category] || 0) + 1;

const fm = (s: number) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

/* Navbar — disesuaikan dengan section yang ada di halaman (urut sesuai alur scroll) */
const NAV_ITEMS = [
  { id: 'hero', label: 'Home' },
  { id: 'cara', label: 'Cara Kerja' },
  { id: 'widgets', label: 'Widget' },
  { id: 'studio', label: 'Studio' },
] as const;

export default function LandingPage() {
  /* theme */
  const [th, setTh] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    try {
      const s = localStorage.getItem('6k_theme');
      if (s === 'light' || s === 'dark') setTh(s);
    } catch {}
  }, []);
  const toggleTh = () => {
    setTh((t) => {
      const n = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('6k_theme', n); } catch {}
      showToast(n === 'dark' ? 'Mode gelap' : 'Mode terang');
      return n;
    });
  };

  /* auth-aware nav */
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);

  /* toast */
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<number | null>(null);
  const showToast = (m: string) => {
    setToastMsg(m);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(''), 2400);
  };
  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);
  const copy = (u: string) => {
    try { navigator.clipboard.writeText(u); } catch {}
    showToast('URL OBS disalin ke clipboard');
  };

  /* scroll: nav shrink + progress + sembunyikan scrollbar root saat landing aktif */
  const navwRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.documentElement.classList.add('lp-noscroll');
    return () => { document.documentElement.classList.remove('lp-noscroll'); };
  }, []);
  useEffect(() => {
    const on = () => {
      navwRef.current?.classList.toggle('s', window.scrollY > 24);
      const h = document.documentElement;
      if (progRef.current) progRef.current.style.width = (window.scrollY / (h.scrollHeight - window.innerHeight) * 100) + '%';
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  /* scroll-spy: tandai nav sesuai section yang sedang terlihat */
  const [activeNav, setActiveNav] = useState<string>('hero');
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const ids = NAV_ITEMS.map((n) => n.id);
    const secs = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!secs.length) return;
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) setActiveNav(e.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  /* widget filter (also re-triggers reveal) */
  const [cat, setCat] = useState('all');

  /* reveal on scroll */
  useEffect(() => {
    const els = [...document.querySelectorAll('.lp .rv:not(.in)')];
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [cat]);

  /* spotlight */
  useEffect(() => {
    const mv = (e: PointerEvent) => {
      const c = (e.target as HTMLElement).closest?.('.lp .card') as HTMLElement | null;
      if (c) {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--x', e.clientX - r.left + 'px');
        c.style.setProperty('--y', e.clientY - r.top + 'px');
      }
    };
    document.addEventListener('pointermove', mv);
    return () => document.removeEventListener('pointermove', mv);
  }, []);

  /* dock tilt */
  const winRef = useRef<HTMLDivElement>(null);
  const tilt = (e: React.PointerEvent<HTMLDivElement>) => {
    const win = winRef.current;
    if (!win) return;
    const r = win.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    win.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
  };
  const untilt = () => { if (winRef.current) winRef.current.style.transform = ''; };

  /* VU + fps */
  const [vu, setVu] = useState<number[]>(() => Array(10).fill(12));
  const [fps, setFps] = useState('60 FPS · 38ms');
  useEffect(() => {
    const t = window.setInterval(() => {
      setVu(Array.from({ length: 10 }, () => 6 + Math.random() * 28));
      setFps('60 FPS · ' + (34 + Math.floor(Math.random() * 8)) + 'ms');
    }, 180);
    return () => window.clearInterval(t);
  }, []);

  /* dock tabs + cam source */
  const [pane, setPane] = useState(0);
  const [src, setSrc] = useState('rtsp://localhost:8554/live/cam_main');

  /* chat demo */
  const [msgs, setMsgs] = useState(() => CHAT_SEED.map((m) => ({ p: m[0], u: m[1], t: m[2] })));
  const [ci, setCi] = useState('');
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const siRef = useRef(0);
  useEffect(() => {
    const t = window.setInterval(() => {
      const m = CHAT_SEED[siRef.current++ % CHAT_SEED.length];
      setMsgs((prev) => [...prev, { p: m[0], u: m[1], t: m[2] }].slice(-30));
    }, 3500);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    const c = chatBoxRef.current;
    if (c) c.scrollTop = c.scrollHeight;
  }, [msgs, pane]);
  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const v = ci.trim();
    if (!v) return;
    setMsgs((prev) => [...prev, { p: 'OBS', u: 'Kamu', t: v }].slice(-30));
    setCi('');
    showToast('Pesan terkirim ke semua kanal');
  };

  /* events feed */
  const [evs, setEvs] = useState(() => EV_SEED.map((d) => ({ p: d[0], u: d[1], t: d[2] })));
  const eiRef = useRef(0);
  useEffect(() => {
    const t = window.setInterval(() => {
      const d = EV_SEED[eiRef.current++ % EV_SEED.length];
      setEvs((prev) => [{ p: d[0], u: d[1], t: d[2] }, ...prev].slice(0, 4));
    }, 2800);
    return () => window.clearInterval(t);
  }, []);

  /* dock timer + goal */
  const [sec, setSec] = useState(1500);
  const [run, setRun] = useState(false);
  const [goal, setGoal] = useState(42);
  useEffect(() => {
    if (!run) return;
    const t = window.setInterval(() => setSec((s) => (s > 0 ? s - 1 : s)), 1000);
    return () => window.clearInterval(t);
  }, [run]);
  const stepGoal = (d: number) => setGoal((g) => Math.max(0, Math.min(100, g + d)));

  /* widgets grid demos */

  /* modal */
  const [modal, setModal] = useState<ReactNode>(null);
  const closeModal = () => setModal(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const openWidgetModal = (w: LPWidget) => {
    setModal(<>
      <h3>{w.title}</h3>
      <p className="mut" style={{ fontSize: 13 }}>{w.desc}</p>
      <div className="acts" style={{ margin: '10px 0' }}>
        <div className="card" style={{ padding: 10 }}><small className="mut">Lebar</small><br /><b>{w.w}px</b></div>
        <div className="card" style={{ padding: 10 }}><small className="mut">Tinggi</small><br /><b>{w.h}px</b></div>
      </div>
      <p className="mut" style={{ fontSize: 12 }}>Atur tema & salin URL Browser Source dari halaman widget.</p>
      <div className="mrow">
        <button className="btn g" onClick={closeModal}>Selesai</button>
        <Link className="btn p" href={`/widgets/${w.id}`}>Buka Widget →</Link>
      </div>
    </>);
  };
  const openLegal = (t: string) => setModal(<>
    <h3>{t}</h3>
    <p className="mut" style={{ fontSize: 13 }}>OBSDOCK adalah platform independen untuk kreator live video. Chat dan alert dikirim langsung ke browser source OBS tanpa disimpan permanen. Token dan kredensial WebSocket bersifat pribadi dan tidak boleh dibagikan. OBS, YouTube, Twitch, TikTok, Kick, XSplit, dan vMix adalah merek dagang pemiliknya masing-masing.</p>
    <div className="mrow"><button className="btn p" onClick={closeModal}>Tutup</button></div>
  </>);

  /* OBS output simulation */
  const [simIdx, setSimIdx] = useState(0);
  const [chatIdx, setChatIdx] = useState(0);
  const [simSec, setSimSec] = useState(1500);
  useEffect(() => {
    const t = window.setInterval(() => {
      setSimIdx((i) => {
        const n = (i + 1) % SIM_STATES.length;
        if (SIM_STATES[n] === 'chat') setChatIdx((c) => (c + 1) % CHAT_SAMPLES.length);
        return n;
      });
    }, 3600);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    const t = window.setInterval(() => setSimSec((s) => (s > 0 ? s - 1 : s)), 1000);
    return () => window.clearInterval(t);
  }, []);
  const simName: SimName = SIM_STATES[simIdx];
  const simMini = (n: SimName) => n === 'chat' ? 'LIVE' : n === 'event' ? 'TRIGGERED' : n === 'poll' ? '62%' : n === 'timer' ? fm(simSec) : 'CONNECTED';

  /* pipeline cables */
  const pipeRef = useRef<HTMLDivElement>(null);
  const cabRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const draw = () => {
      const pipe = pipeRef.current, cab = cabRef.current;
      if (!pipe || !cab) return;
      const cs = [...pipe.querySelectorAll(':scope > .card')];
      if (cs.length < 3) return;
      const [L, H, R] = cs as HTMLElement[];
      let h = '', n = 0;
      const cable = (d: string, dl: number) => {
        const id = 'c' + n++;
        h += `<path id="${id}" class="base" d="${d}"/><path class="flow" d="${d}"/><circle r="3.5" class="pk"><animateMotion dur="2.4s" begin="${dl}s" repeatCount="indefinite"><mpath href="#${id}"/></animateMotion></circle>`;
      };
      const port = (x: number, y: number) => { h += `<circle class="port" cx="${x}" cy="${y}" r="5"/>`; };
      if (window.innerWidth > 820) {
        const hy = H.offsetTop + H.offsetHeight / 2, lx = L.offsetLeft + L.offsetWidth, hl = H.offsetLeft, hr = hl + H.offsetWidth, rl = R.offsetLeft;
        const m1 = (lx + hl) / 2, m2 = (hr + rl) / 2;
        L.querySelectorAll('.row').forEach((r, i) => {
          const el = r as HTMLElement;
          const y = L.offsetTop + el.offsetTop + el.offsetHeight / 2, y2 = hy + (i - 2) * 12;
          cable(`M${lx} ${y} C${m1} ${y} ${m1} ${y2} ${hl} ${y2}`, i * 0.4); port(lx, y); port(hl, y2);
        });
        R.querySelectorAll('.row').forEach((r, i) => {
          const el = r as HTMLElement;
          const y = R.offsetTop + el.offsetTop + el.offsetHeight / 2, y2 = hy + (i - 2) * 12;
          cable(`M${hr} ${y2} C${m2} ${y2} ${m2} ${y} ${rl} ${y}`, i * 0.4 + 0.2); port(hr, y2); port(rl, y);
        });
      } else {
        const x = pipe.offsetWidth / 2;
        [0, 1].forEach((i) => {
          const y1 = (cs[i] as HTMLElement).offsetTop + (cs[i] as HTMLElement).offsetHeight;
          const y2 = (cs[i + 1] as HTMLElement).offsetTop;
          cable(`M${x} ${y1} L${x} ${y2}`, i * 0.5); port(x, y1); port(x, y2);
        });
      }
      cab.innerHTML = h;
    };
    const ro = new ResizeObserver(draw);
    if (pipeRef.current) ro.observe(pipeRef.current);
    draw();
    try { (document as Document).fonts?.ready.then(() => draw()); } catch {}
    return () => ro.disconnect();
  }, []);
  const burst = () => {
    cabRef.current?.classList.add('burst');
    window.setTimeout(() => cabRef.current?.classList.remove('burst'), 1400);
  };

  /* profile + event filter */
  const [prof, setProf] = useState(0);
  const [flt, setFlt] = useState(0);
  const PROFS = ['Profil IRL + MediaMTX aktif', 'Profil Speedrun aktif', 'Profil Subathon aktif'];
  const FLTS = ['Semua event', 'Sub & cheer di atas $5', 'Sinyal kamera putus'];

  const words1 = ['Bikin', 'Live', 'Kamu'];
  const words2 = ['Lebih', 'Hidup.'];

  return (
    <div className="lp" data-theme={th}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Bungee&display=swap" rel="stylesheet" />
      <div className="prog" ref={progRef}></div>
      <div className="aurora"><i></i><i></i></div>

      <div className="navw" ref={navwRef}><header className="nav">
        <a href="#hero" className="logo" style={{ fontSize: 22 }}>OBSDOCK</a>
        <nav>
          {NAV_ITEMS.map((n) => (
            <a key={n.id} href={`#${n.id}`} className={activeNav === n.id ? 'on' : ''}>{n.label}</a>
          ))}
        </nav>
        <div className="r">
          {loggedIn ? (
            <Link className="abtn p" href="/dashboard">Dashboard →</Link>
          ) : (
            <>
              <Link className="abtn hide-sm" href="/login">Masuk</Link>
              <Link className="abtn p" href="/register">Daftar</Link>
            </>
          )}
          <button className="ib" onClick={toggleTh} aria-label="Ganti tema">{th === 'dark' ? '☀' : '☾'}</button>
          <button className={'ib burger' + (menuOpen ? ' open' : '')} onClick={() => setMenuOpen((o) => !o)} aria-label="Buka menu" aria-expanded={menuOpen}><span></span><span></span><span></span></button>
        </div>
        <div className={'mmenu' + (menuOpen ? ' on' : '')}>
          {NAV_ITEMS.map((n) => (
            <a key={n.id} href={`#${n.id}`} className={activeNav === n.id ? 'on' : ''} onClick={() => setMenuOpen(false)}>{n.label}</a>
          ))}
          {!loggedIn && <Link href="/login" onClick={() => setMenuOpen(false)}>Masuk</Link>}
        </div>
      </header></div>

      <main>
        <section id="hero" className="hero"><div className="wrap">
          <div className="pill"><span className="dot"></span>BUILT FOR STREAMERS · OBS + STREAMER.BOT</div>
          <h1>
            {words1.map((w, i) => <span key={w} className="w"><span style={{ '--i': i } as CSSProperties}>{w}</span></span>).reduce<ReactNode[]>((a, s, i) => (i ? [...a, ' ', s] : [s]), [])}
            <br />
            {words2.map((w, k) => <span key={w} className="w"><span style={{ '--i': k + 3, opacity: 0.72 } as CSSProperties}>{w}</span></span>).reduce<ReactNode[]>((a, s, i) => (i ? [...a, ' ', s] : [s]), [])}
          </h1>
          <p className="sub">Chat, gift, alert, poll, timer, goal, sampai kontrol OBS <b>semua dalam satu tempat.</b> Pasang, atur, lalu live. Tanpa dashboard yang ribet.</p>
          <div className="cta">
            {loggedIn ? (
              <Link className="btn p" href="/dashboard">Buka Dashboard →</Link>
            ) : (
              <Link className="btn p" href="/register">Coba Widget Gratis →</Link>
            )}
            <a className="btn g" href="#cara">Lihat cara kerjanya</a>
          </div>
          <div className="stats"><div><b>10+</b><span>widget siap pakai</span></div><div><b>1 klik</b><span>untuk mulai</span></div><div><b>4</b><span>platform chat</span></div></div>

          <div className="streamer-benefits rv" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, maxWidth: 900, margin: '42px auto 0', textAlign: 'left' }}>
            <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 22, marginBottom: 6 }}>⚡</div><b>Setup cepat</b><div className="mut" style={{ fontSize: 12, marginTop: 4 }}>Tambah Browser Source dan langsung tampil di OBS.</div></div>
            <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 22, marginBottom: 6 }}>🎁</div><b>Engagement naik</b><div className="mut" style={{ fontSize: 12, marginTop: 4 }}>Gift, vote, goal, wheel, dan alert bikin penonton ikut main.</div></div>
            <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 22, marginBottom: 6 }}>🎨</div><b>Brand kamu</b><div className="mut" style={{ fontSize: 12, marginTop: 4 }}>Atur widget supaya cocok dengan gaya stream kamu.</div></div>
          </div>

          <div className="pipe" ref={pipeRef}>
            <svg id="cab" ref={cabRef} className="rv" style={{ '--d': '.5s' } as CSSProperties} aria-hidden="true"></svg>
            <div className="card rv"><h4>Di balik layar <span>5 terhubung</span></h4>
              <div className="row"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><img className="pl" src="/assets/logo/tik-tok.png" alt="TikTok" />TikTok Live</span> <small>@adilonapsh</small></div>
              <div className="row"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><img className="pl" src="/assets/logo/youtube.png" alt="YouTube" />YouTube Live</span> <small>Chat &amp; Superchat</small></div>
              <div className="row"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><img className="pl" src="/assets/logo/twitch.png" alt="Twitch" />Twitch</span> <small>Subs &amp; Bits</small></div>
              <div className="row"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><img className="pl" src="/assets/logo/kick.png" alt="Kick" />Kick</span> <small>Chat &amp; Emote</small></div>
              <div className="row"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><img className="pl" src="/assets/logo/mediamtx.svg" alt="MediaMTX" />MediaMTX</span> <small>RTSP &amp; WebRTC</small></div></div>
            <div className="card hub rv" style={{ '--d': '.12s' } as CSSProperties}><div className="core">⚡</div><b>Streamer.bot Engine</b><span className="pill">ws://127.0.0.1:8080</span>
              <div className="acts" style={{ width: '100%' }}>
                <button onClick={() => { showToast('Streamer.bot: #GiftAlert dijalankan'); burst(); }}>#GiftAlert</button>
                <button onClick={() => { showToast('Streamer.bot: #SubathonAdd +30d'); burst(); }}>#SubathonAdd</button>
              </div></div>
            <div className="card rv obs-live" style={{ '--d': '.24s' } as CSSProperties}><h4>OBS outputs <span>Browser source · <b id="obsStatus">{simName === 'event' ? 'EVENT' : 'LIVE'}</b></span></h4>
              {(['chat', 'event', 'poll', 'timer', 'dock'] as SimName[]).map((n) => (
                <div key={n}>
                  <div className={'row' + (simName === n ? ' active' : '')}>
                    {n === 'chat' && <>Chat Overlay <small>Multi-chat</small><span className="obs-mini">{simMini(n)}</span><span className="sim"></span></>}
                    {n === 'event' && <>Event &amp; Gift Alert <small>SFX</small><span className="obs-mini">{simMini(n)}</span><span className="sim"></span></>}
                    {n === 'poll' && <>Poll &amp; Wheel <small>Interaktif</small><span className="obs-mini">{simMini(n)}</span><span className="sim"></span></>}
                    {n === 'timer' && <>Timer &amp; Goal <small>Subathon</small><span className="obs-mini">{simMini(n)}</span><span className="sim"></span></>}
                    {n === 'dock' && <>OBS Dock <small>WS 5.0</small><span className="obs-mini">{simMini(n)}</span><span className="sim"></span></>}
                  </div>
                  {n === 'chat' && (
                    <div className={'obs-preview' + (simName === 'chat' ? ' show' : '')}>
                      <div className="obs-chatline" key={chatIdx}><i></i><b>{CHAT_SAMPLES[chatIdx][0]}</b> {CHAT_SAMPLES[chatIdx][1]}</div>
                    </div>
                  )}
                  {n === 'event' && (
                    <div className={'obs-preview' + (simName === 'event' ? ' show' : '')}><div className="obs-event"><span className="obs-gift">🎁</span><span><b>10× Rose</b> · Gift Alert dipicu via Streamer.bot</span></div></div>
                  )}
                  {n === 'poll' && (
                    <div className={'obs-preview' + (simName === 'poll' ? ' show' : '')}><div><b>Poll:</b> Valorant vs Elden Ring</div><div className="obs-pollbar"><i></i><i></i></div></div>
                  )}
                  {n === 'timer' && (
                    <div className={'obs-preview' + (simName === 'timer' ? ' show' : '')}><span className="obs-timer"><span className="blink">{fm(simSec)}</span></span> · +5 menit <span className="obs-goal"><i></i></span></div>
                  )}
                  {n === 'dock' && (
                    <div className={'obs-preview' + (simName === 'dock' ? ' show' : '')}><div className="obs-dock"><span>MediaMTX</span><div className="dock-screen"></div><b>38ms</b></div></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="dock rv">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <div className="tabs">
                {['MediaMTX Monitor', 'Multi-Chat', 'Timer & Goal'].map((t, i) => (
                  <button key={t} className={'tab' + (pane === i ? ' on' : '')} onClick={() => setPane(i)}>{t}</button>
                ))}
              </div>
              <span className="pill"><span className="dot"></span>OBS 5.0 terhubung</span>
            </div>
            <div onPointerMove={tilt} onPointerLeave={untilt}>
              <div className="win" ref={winRef}>
                <div className="wh"><span className="dots"><i></i><i></i><i></i></span><span>OBS Custom Dock · adilonapsh</span><span className="mut">{fps}</span></div>
                <div className="wb">
                  <div className="view">
                    <div className={'pane' + (pane === 0 ? ' on' : '')}>
                      <div className="scan"></div>
                      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}><div><div style={{ fontSize: 38 }}>📹</div><b style={{ fontSize: 13 }}>MediaMTX WebRTC Stream</b><div style={{ fontSize: 11, color: '#999' }}>{src}</div></div></div>
                      <div className="vu">{vu.map((h, i) => <i key={i} style={{ height: h }} />)}</div>
                      <div style={{ position: 'absolute', right: 12, bottom: 12, display: 'flex', gap: 6 }}>
                        {[['cam_main', 'Cam 1'], ['irl_phone', 'IRL'], ['srt_screen', 'Screen']].map(([v, l]) => (
                          <button key={v} className="mb o" onClick={() => { setSrc('rtsp://localhost:8554/live/' + v); showToast('Sumber aktif: ' + v); }}>{l}</button>
                        ))}
                      </div>
                      <span className="mb" style={{ position: 'absolute', top: 12, left: 12 }}>● LIVE 1080p60</span>
                    </div>
                    <div className={'pane' + (pane === 1 ? ' on' : '')}>
                      <div className="chat" ref={chatBoxRef}>
                        {msgs.map((m, i) => <div key={i} className="msg"><em>{m.p}</em><b>{m.u}:</b> {m.t}</div>)}
                      </div>
                      <form className="cf" onSubmit={sendChat}><input value={ci} onChange={(e) => setCi(e.target.value)} placeholder="Kirim ke semua platform…" /><button className="sb" type="submit">Kirim</button></form>
                    </div>
                    <div className={'pane' + (pane === 2 ? ' on' : '')} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: '#111', borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center' }}><small>Subathon timer</small><div className="big">{fm(sec)}</div><div><button className="mb" onClick={() => setRun((r) => !r)}>{run ? 'Jeda' : 'Mulai'}</button> <button className="mb o" onClick={() => { setSec((s) => s + 300); showToast('+5 menit ditambahkan'); }}>+5m</button></div></div>
                      <div style={{ background: '#111', borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center' }}><small>Follower goal</small><div className="big">{goal}/100</div><div className="bar"><i style={{ width: goal + '%' }}></i></div><div><button className="mb o" onClick={() => stepGoal(-1)}>−</button> <button className="mb" onClick={() => stepGoal(1)}>+</button></div></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 12 }}>Aktivitas live</div>
                    <div>{evs.map((d, i) => <div key={i} className="ev"><b>{d.p}</b>{d.u} · <span className="mut">{d.t}</span></div>)}</div>
                    <div className="acts">
                      <button onClick={(e) => { showToast('Alert TTS terkirim: Terima kasih giftnya!'); (e.currentTarget as HTMLButtonElement).classList.add('f'); window.setTimeout(() => (e.currentTarget as HTMLButtonElement).classList.remove('f'), 300); }}>Test TTS</button>
                      <button onClick={() => { stepGoal(10); showToast('+10 goal tersinkron ke OBS'); }}>+10 Goal</button>
                    </div>
                    <button className="btn p" style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: 11 }} onClick={() => copy('http://127.0.0.1:3000/dock?key=adilonapsh_live')}>Salin URL Dock</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div></section>

        <div className="mq" id="integrasi"><div className="mt">{[...LOGOS, ...LOGOS].map((l, i) => <span key={i} className="lg" title={l.n}><img src={l.s} alt={l.n} /></span>)}</div></div>

        <section id="cara"><div className="wrap"><div className="hd rv"><h2>Mulai Live dalam 3 Langkah</h2><p>Nggak perlu jadi expert. Pilih widget, pasang ke OBS, lalu bikin penonton ikut berinteraksi.</p></div>
          <div className="g3">
            <div className="card step rv"><div className="sg"><span>🧩</span></div><small>Langkah 1</small><h3>Pilih widget</h3><p>Pilih widget yang dibutuhkan. Satu widget sama dengan satu Browser Source transparan.</p></div>
            <div className="card step rv" style={{ '--d': '.12s' } as CSSProperties}><div className="sg"><span>🎯</span></div><small>Langkah 2</small><h3>Tambah Browser Source</h3><p>Di OBS, klik + pada Sources, pilih Browser, lalu tempel URL dengan <code>?key=private_key</code>.</p></div>
            <div className="card step rv" style={{ '--d': '.24s' } as CSSProperties}><div className="sg"><span>⚡</span></div><small>Langkah 3</small><h3>Hubungkan &amp; live</h3><p>Chat, gift, dan vote dari semua platform otomatis tampil lewat Streamer.bot DoAction.</p></div>
          </div></div></section>

        <section id="widgets"><div className="wrap"><div className="hd rv"><h2>Semua yang Kamu Butuhkan untuk Live</h2><p>Thumbnail di bawah adalah widget asli yang berjalan live (mode simulasi). Pilih yang kamu suka, masukkan ke OBS, dan bikin stream kamu terasa lebih interaktif.</p>
          <div className="fl">{LP_CATS.map((v) => <button key={v} className={'fb' + (cat === v ? ' on' : '')} onClick={() => setCat(v)}>{v === 'all' ? `Semua (${lpCatCount(v)})` : `${LP_CAT_LABEL[v]} (${lpCatCount(v)})`}</button>)}</div></div>
          <div className="bento">
            {LP_WIDGETS.filter((w) => cat === 'all' || w.category === cat).map((w, i) => {
              // 'all' pakai bento curated (urutan LP_WIDGETS sudah pack penuh).
              // View filter pakai span seragam + kartu terakhir melebar menutup sisa baris
              // (baris 3 kartu s2×3; sisa 1 → terakhir s6; sisa 2 → terakhir s4) → tidak ada lubang.
              let span: string;
              if (cat === 'all') {
                span = LP_SPAN[w.id] || '';
              } else {
                const n = LP_COUNT[cat] || 0;
                const r = n % 3;
                const last = i === n - 1;
                span = last && r === 1 ? 's6' : last && r === 2 ? 's4' : 's2';
              }
              const tall = span.includes('tall');
              return (
              <div key={w.id} className={'card wg rv ' + span}><div className="wt"><span>{w.title}</span><span className="mut">{w.tags[0]}</span></div>
                <div className="wv" style={tall ? { flex: 1, minHeight: 340 } : { aspectRatio: `${w.w} / ${w.h}` }}><iframe title={w.title} src={`/widgets/${w.id}/display?${w.params}&simulate=1`} loading="lazy" style={{ width: '100%', height: '100%', border: 0, background: 'transparent', pointerEvents: 'none' }} /></div>
                <div className="wf"><span>{w.tags.slice(0, 3).join(' · ')}</span><button onClick={() => openWidgetModal(w)}>Pasang di OBS →</button></div></div>
              );
            })}
          </div></div></section>

        <section id="studio"><div className="wrap">
          <div className="hd rv">
            <h2>Make it yours</h2>
            <p>Atur dashboard sesuai gaya streaming kamu. Pilih event, lihat semua chat, lalu jalankan aksi tanpa pindah-pindah aplikasi.</p>
            <div className="sel">
              {PROFS.map((p, i) => <button key={p} className={'tab' + (prof === i ? ' on' : '')} onClick={() => { setProf(i); showToast(p); }}>{['IRL + MediaMTX', 'Speedrun', 'Subathon'][i]}</button>)}
            </div>
          </div>

          <div className="card stu studio-shell rv">
            <div className="studio-top">
              <div className="studio-kicker"><span className="studio-live"></span> Stream workspace</div>
              <span className="pill">OBS + Streamer.bot</span>
            </div>
            <div className="studio-grid">
              <div className="studio-col">
                <div className="studio-title"><span className="studio-icon">⌁</span>Filter event</div>
                <div className="studio-desc">Pilih event yang ingin memicu tampilan atau automation di live kamu.</div>
                <div>
                  {FLTS.map((f, i) => <button key={f} className={'studio-option opt' + (flt === i ? ' on' : '')} onClick={() => { setFlt(i); showToast('Filter: ' + f); }}>{f} <span className="studio-check">✓</span></button>)}
                </div>
              </div>
              <div className="studio-col">
                <div className="studio-title"><span className="studio-icon">☷</span>Multi-chat</div>
                <div className="studio-desc">Gabungkan percakapan dari berbagai platform dalam satu tampilan.</div>
                <div className="studio-chat">
                  <div className="studio-msg"><span className="platform tiktok">TIKTOK</span><span>pakai lensa apa kak?</span><span className="chat-dot"></span></div>
                  <div className="studio-msg"><span className="platform twitch">TWITCH</span><span>DoAction delay rendah banget</span><span className="chat-dot"></span></div>
                  <div className="studio-msg"><span className="platform kick">KICK</span><span>Audio VU sinkron sempurna</span><span className="chat-dot"></span></div>
                </div>
              </div>
              <div className="studio-col">
                <div className="studio-title"><span className="studio-icon">ϟ</span>Aksi Streamer.bot</div>
                <div className="studio-desc">Jalankan automation dari satu panel saat live sedang berjalan.</div>
                <div className="studio-actions">
                  {[['◉', 'Cut ke Cam 1'], ['◌', 'Mulai Poll'], ['✦', 'Putar Wheel'], ['＋', '+10 Sub Goal']].map(([ic, lb]) => (
                    <button key={lb} className="studio-action" onClick={(e) => { showToast('Aksi dijalankan: ' + lb); const b = e.currentTarget; b.classList.add('f'); window.setTimeout(() => b.classList.remove('f'), 300); }}><span>{ic}</span>{lb}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div></section>

        <section><div className="wrap rv" style={{ textAlign: 'center' }}><div className="big2">Stream lebih <u>seru.</u><br />Penonton lebih <u>ikut.</u></div><p className="mut" style={{ maxWidth: 560, margin: '22px auto 30px' }}>Stop cuma live. Kasih penonton alasan untuk ikut klik, vote, gift, dan balik lagi.</p>
          {loggedIn ? <Link className="btn p" href="/dashboard">Buka Dashboard →</Link> : <Link className="btn p" href="/register">Coba 10+ Widget Gratis →</Link>}
        </div></section>
      </main>

      <footer><div className="wrap" style={{ paddingBottom: 50 }}><div className="card rv"><div className="fg">
        <div><div className="logo" style={{ fontSize: 28 }}>OBSDOCK</div><p className="mut" style={{ fontSize: 13, marginTop: 8 }}>Toolkit streaming yang ringan dan cepat.</p></div>
        <div><h5>OBSDOCK</h5><ul><li><a href="#hero">Home</a></li><li><a href="#cara">Cara Kerja</a></li><li><button onClick={() => openLegal('Terms of Service')}>Terms of Service</button></li><li><button onClick={() => openLegal('Privacy Policy')}>Privacy Policy</button></li><li><button onClick={() => openLegal('Legal Notice')}>Legal Notice</button></li></ul></div>
        <div><h5>Products</h5><ul><li><a href="#widgets">Widget</a></li><li><a href="#studio">Studio</a></li><li><a href="#integrasi">Integrasi</a></li></ul></div>
        <div><h5>Komunitas</h5><ul><li><a href="https://discord.com" target="_blank" rel="noreferrer">Discord</a></li><li><a href="https://buymeacoffee.com" target="_blank" rel="noreferrer">BuyMeACoffee</a></li></ul></div>
      </div><p className="mut" style={{ marginTop: 28, fontSize: 12 }}>© OBSDOCK 2026</p></div></div></footer>

      <div id="toast" className={toastMsg ? 'on' : ''}>{toastMsg}</div>
      <div className={'md' + (modal ? ' on' : '')} onClick={(e) => { if ((e.target as HTMLElement).id === 'md') closeModal(); }} id="md">
        <div className="mc">{modal}</div>
      </div>
    </div>
  );
}
