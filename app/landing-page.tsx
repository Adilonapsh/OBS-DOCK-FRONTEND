'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import {
  User,
  ChevronDown,
  MessageCircle,
  Tv,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X as XIcon,
  Menu,
  Camera,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Music2,
  Monitor,
  Layers,
  Headphones,
  MessageSquare,
  BarChart3,
  Smartphone,
  Puzzle,
  Gift,
  Sliders,
  Volume2,
  Mic,
  Radio
} from 'lucide-react';

/* FAQ Data */
interface FaqItem { q: string; a: string; }
const FAQ_ITEMS: FaqItem[] = [
  { q: 'Apa itu OBS Dock?', a: 'OBS Dock adalah platform kontrol dan widget all-in-one untuk streamer. Kamu bisa mengontrol OBS Studio Mode / Scene Switcher langsung dari browser atau HP, serta menambahkan 14+ widget interaktif dan overlay real-time.' },
  { q: 'Bagaimana cara menghubungkan widget ke OBS?', a: 'Cukup salin URL Browser Source dari dashboard OBS Dock kamu, lalu tambahkan sumber "Browser" baru di scene OBS Studio. Widget langsung terhubung dan sinkron secara real-time via WebSocket.' },
  { q: 'Apa itu Private Key dan seberapa amannya?', a: 'Setiap streamer mendapatkan Private Key unik untuk isolasi room WebSocket privat. Ini menjamin data kontrol dock, chat, dan overlay kamu terisolasi penuh dan tidak bisa diakses atau diintervensi oleh streamer lain.' },
  { q: 'Apakah OBS Dock gratis untuk digunakan?', a: 'Ya! Fitur inti OBS Dock gratis untuk memulai tanpa memerlukan kartu kredit. Kamu bisa langsung mengontrol scene, memakai widget chat, timer, poll, dan overlay bawaan.' },
  { q: 'Platform streaming apa saja yang didukung?', a: 'OBS Dock mendukung integrasi multi-platform termasuk Twitch, YouTube Live, dan TikTok LIVE untuk interaksi chat, event gift/like/follow, serta animasi penonton.' },
  { q: 'Bagaimana cara menggunakan Mobile Dock di smartphone?', a: 'Cukup buka dashboard OBS Dock di browser smartphone kamu dan login ke akun yang sama. Antarmuka Mobile Dock responsif dan memungkinkanmu mengganti scene, trigger transisi, atau mute audio tanpa menyentuh PC.' },
  { q: 'Apakah Media Player mendukung sinkronisasi lirik otomatis?', a: 'Ya! Widget Media Player terintegrasi dengan LRCLIB dan SMTC Bridge di Windows. Lagu yang sedang diputar di Spotify atau Windows Media Player akan menampilkan synced lyrics baris demi baris di layar stream.' },
  { q: 'Bagaimana cara kustomisasi tema overlay dan widget?', a: 'Setiap widget memiliki konfigurasi visual lengkap di dashboard: warna solid, ukuran font, tata letak, border, sound alert, hingga posisi tanpa perlu menulis CSS manual.' },
  { q: 'Apakah OBS Dock membutuhkan instalasi plugin khusus di OBS?', a: 'Untuk overlay dan widget, hanya butuh Browser Source standar di OBS (tanpa plugin apapun). Untuk Dock Control penuh, OBS Studio versi 28 ke atas sudah memiliki OBS WebSocket bawaan yang langsung kompatibel.' },
  { q: 'Bagaimana jika saya mengalami kendala teknis?', a: 'Tersedia dokumentasi lengkap di dashboard serta live chat support di pojok kanan bawah. Kamu juga bisa bergabung ke komunitas streamer kami untuk bertanya dan berdiskusi.' },
];
const PLATFORMS = [
  { id: 'twitch', name: 'Twitch', icon: '/assets/logo/twitch.png' },
  { id: 'youtube', name: 'YouTube', icon: '/assets/logo/youtube.png' },
  { id: 'kick', name: 'Kick', icon: '/assets/logo/kick.png' },
  { id: 'streamlabs', name: 'Streamlabs', icon: '/assets/logo/streamlabs.png' },
  { id: 'obs', name: 'OBS Studio', icon: '/assets/logo/obs.png' },
  { id: 'tiktok', name: 'TikTok LIVE', icon: '/assets/logo/tik-tok.png' },
];
interface ReviewNote { id: string; stars: number; quote: string; author: string; product: string; tint: string; }
const STICKY_REVIEWS: ReviewNote[] = [
  { id: '1', stars: 5, quote: 'Media Player widget-nya keren banget, sync lirik otomatis dari LRCLIB. Chat langsung nyambung ke OBS.', author: 'Rian_FPS', product: 'Media Player Widget', tint: 'bg-[#f3e8ff] text-[#581c87] border-[#e9d5ff]' },
  { id: '2', stars: 5, quote: 'Private key system-nya bikin tiap streamer punya room sendiri. Nggak ada drama bocor event dari streamer lain.', author: 'SarahLive', product: 'Dock Control', tint: 'bg-[#e0f2fe] text-[#075985] border-[#bae6fd]' },
  { id: '3', stars: 5, quote: 'Overlay chat-nya customizable banget, bisa ganti theme langsung dari editor tanpa restart OBS.', author: 'DimasKuroba', product: 'Chat Overlay', tint: 'bg-[#dcfce7] text-[#14532d] border-[#bbf7d0]' },
  { id: '4', stars: 5, quote: 'Scene switcher di dock control smooth banget. Studio mode OBS jadi jauh lebih enak dipake live.', author: 'ArfanStream', product: 'Dock Control', tint: 'bg-[#e0f2fe] text-[#075985] border-[#bae6fd]' },
  { id: '5', stars: 5, quote: 'Poll widget-nya interaktif, viewer bisa vote langsung dari chat TikTok Live. Seru banget!', author: 'NitaChannel', product: 'Poll Widget', tint: 'bg-[#f3e8ff] text-[#581c87] border-[#e9d5ff]' },
  { id: '6', stars: 5, quote: 'Gift overlay langsung muncul real-time waktu ada yang kasih gift di TikTok. Setup-nya gampang banget.', author: 'BoyStream', product: 'Gift Overlay', tint: 'bg-[#fce7f3] text-[#831843] border-[#fbcfe8]' },
  { id: '7', stars: 5, quote: 'Ticker widget buat running text pengumuman di stream. Simple tapi berguna banget buat info schedule.', author: 'FranjohnGaming', product: 'Ticker Widget', tint: 'bg-[#f3e8ff] text-[#581c87] border-[#e9d5ff]' },
  { id: '8', stars: 5, quote: 'Timer countdown buat giveaway segment. Viewer jadi lebih hype nungguin hasilnya!', author: 'Hayley_IRL', product: 'Timer Widget', tint: 'bg-[#cffafe] text-[#164e63] border-[#a5f3fc]' },
  { id: '9', stars: 5, quote: 'Semua widget-nya bisa di-embed sebagai Browser Source. Clean, ringan, nggak ngaruh ke performa.', author: 'DenimGaming', product: 'Widgets', tint: 'bg-[#ffedd5] text-[#7c2d12] border-[#fed7aa]' },
  { id: '10', stars: 5, quote: 'QR widget buat nampilin link donasi / media sosial di stream. Praktis banget buat mobile streaming.', author: 'KiraVT', product: 'QR Widget', tint: 'bg-[#ffedd5] text-[#7c2d12] border-[#fed7aa]' },
  { id: '11', stars: 5, quote: 'Goals widget buat target subscriber bulanan. Viewer jadi ikut semangat bantu capai target.', author: 'DanielFPS', product: 'Goals Widget', tint: 'bg-[#fef9c3] text-[#713f12] border-[#fde68a]' },
  { id: '12', stars: 5, quote: 'Social rotator otomatis ganti-ganti sosmed di layar. Profesional banget tampilannya.', author: 'DirkOne', product: 'Social Rotator Widget', tint: 'bg-[#ffedd5] text-[#7c2d12] border-[#fed7aa]' },
  { id: '13', stars: 5, quote: 'Info slides buat nampilin sponsor atau aturan channel secara bergantian. Love it!', author: 'OliviaStream', product: 'Info Slides Widget', tint: 'bg-[#dcfce7] text-[#14532d] border-[#bbf7d0]' },
  { id: '14', stars: 5, quote: 'Dock-nya bisa dibuka dari HP waktu lagi live! Mobile dock feature-nya unexpected banget tapi super useful.', author: 'JoelPlay', product: 'Mobile Dock', tint: 'bg-[#f3e8ff] text-[#581c87] border-[#e9d5ff]' },
  { id: '15', stars: 5, quote: 'View counter real-time langsung keliatan di overlay. Viewer nggak perlu tanya terus berapa yang nonton.', author: 'AnonStreamer', product: 'View Counter Widget', tint: 'bg-[#dcfce7] text-[#14532d] border-[#bbf7d0]' },
];
const AESTHETIC_CATEGORIES = [
  { id: 'dock', title: 'Dock Control', desc: 'OBS Studio Mode, scene switcher, dan stream tools - semua dalam satu panel yang bisa dibuka dari browser.', icon: <Monitor size={22} color="#0369a1" strokeWidth={2.2} />, bg: '#e0f2fe', border: '#bae6fd' },
  { id: 'overlay', title: 'Overlays', desc: 'Chat, gift, like, dan full overlay - langsung connect via Browser Source ke OBS atau Streamlabs.', icon: <Layers size={22} color="#ea580c" strokeWidth={2.2} />, bg: '#ffedd5', border: '#fed7aa' },
  { id: 'mediaplayer', title: 'Media Player', desc: '11 tema visual, sync lirik otomatis via LRCLIB, dan integrasi SMTC Bridge untuk Windows.', icon: <Headphones size={22} color="#7c3aed" strokeWidth={2.2} />, bg: '#ede9fe', border: '#ddd6fe' },
  { id: 'chat', title: 'Chat Widget', desc: 'Tampilkan live chat dari Twitch, YouTube, TikTok di stream - dengan berbagai tema dan animasi.', icon: <MessageSquare size={22} color="#0369a1" strokeWidth={2.2} />, bg: '#e0f2fe', border: '#bae6fd' },
  { id: 'poll', title: 'Poll & Goals', desc: 'Buat polling interaktif untuk viewer dan tampilkan goals subscriber/donasi secara real-time.', icon: <BarChart3 size={22} color="#059669" strokeWidth={2.2} />, bg: '#d1fae5', border: '#a7f3d0' },
  { id: 'mobiledock', title: 'Mobile Dock', desc: 'Kontrol OBS dari smartphone saat lagi live. Scene switch dan widget control di genggaman tangan.', icon: <Smartphone size={22} color="#4f46e5" strokeWidth={2.2} />, bg: '#e0e7ff', border: '#c7d2fe' },
  { id: 'utils', title: 'Utility Widgets', desc: 'Timer, ticker, QR code, view counter, social rotator, info slides - lengkap untuk setup profesional.', icon: <Puzzle size={22} color="#16a34a" strokeWidth={2.2} />, bg: '#dcfce7', border: '#bbf7d0' },
];
const CREATORS = [
  { name: 'Rian Kurniawan (@rian_fps)', role: 'Twitch Streamer · Pakai Dock Control + Overlay', img: '/assets/packs/itachi.jpg' },
  { name: 'Sarah Aliyah (@sarah_live)', role: 'TikTok Live · Pakai Gift Overlay + Poll Widget', img: '/assets/packs/vtuber.jpg' },
  { name: 'Dimas Kuroba (@kuroba_vt)', role: 'YouTube Gaming · Pakai Media Player + Lyrics Widget', img: '/assets/packs/data.jpg' },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setIsLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);
  const [openDropdown, setOpenDropdown] = useState<'fitur' | 'widget' | null>(null);
  const fiturRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!fiturRef.current?.contains(t) && !widgetRef.current?.contains(t)) setOpenDropdown(null);
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenDropdown(null); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEsc); };
  }, []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState<'fitur' | 'widget' | null>(null);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    if (!mobileOpen) setMobileDropdown(null);
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 1024 && mobileOpen) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mobileOpen]);
  const [toastText, setToastText] = useState('');
  const toastTimeoutRef = useRef<number | null>(null);
  const showToast = (msg: string) => {
    setToastText(msg);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastText(''), 2600);
  };
  const [activeAestheticTab, setActiveAestheticTab] = useState<'product' | 'game' | 'aesthetic'>('product');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const toggleFaq = (i: number) => setOpenFaq(prev => prev === i ? null : i);
  /* Private Key mock random code show/hide - interaktif scramble */
  const [showPrivateMock, setShowPrivateMock] = useState(false);
  const [mockCode, setMockCode] = useState('sk_live_9f3a7b2c1d8e4f6a');
  useEffect(() => {
    const chars = '0123456789abcdef';
    const gen = () => 'sk_live_' + Array.from({length: 12}, () => chars[Math.floor(Math.random()*chars.length)]).join('') + '_' + Array.from({length: 4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    const interval = showPrivateMock ? 1800 : 90;
    const id = window.setInterval(() => setMockCode(gen()), interval);
    return () => window.clearInterval(id);
  }, [showPrivateMock]);

  return (
    <div className="min-h-dvh bg-[#f8fafc] text-[#475569] font-sans text-[15px] leading-[1.6] overflow-x-hidden relative pt-[72px] max-[640px]:pt-[64px] box-border">
      <style>{`html{scroll-behavior:smooth;scroll-padding-top:90px} @media(max-width:640px){html{scroll-padding-top:72px}}
@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
@keyframes pulse-skeleton{0%,100%{opacity:1}50%{opacity:0.7}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeUpHold{0%{opacity:0;transform:translateY(14px)}12%{opacity:1;transform:translateY(0)}38%{opacity:1;transform:translateY(0)}50%{opacity:0;transform:translateY(-8px)}100%{opacity:0;transform:translateY(-8px)}}
@keyframes lyricGantiA{0%,42%{opacity:1;transform:translateY(0)}50%,92%{opacity:0;transform:translateY(-18px)}100%{opacity:1;transform:translateY(0)}}
@keyframes lyricGantiB{0%,42%{opacity:0;transform:translateY(18px)}50%,92%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(18px)}}
.skeleton-shimmer{position:relative;overflow:hidden}
.skeleton-shimmer::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent);transform:translateX(-100%);animation:shimmer 1.8s infinite}
@media(prefers-reduced-motion:reduce){.skeleton-shimmer::after,.animate-pulse,[style*="animation"]{animation:none!important}}`}</style>

      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 w-full z-[90] bg-[rgba(248,250,252,0.95)] backdrop-blur-[12px] border-b border-[rgba(226,232,240,0.8)] h-[72px] max-[640px]:h-[64px]">
        <div className="max-w-[1280px] mx-auto h-full px-8 max-[1024px]:px-5 max-[640px]:px-[14px] flex items-center justify-between gap-2">
          <Link href="/" className="font-extrabold text-[28px] tracking-[-0.05em] text-[#0a0e1a] max-[640px]:text-[22px]">OBS Dock</Link>
          <nav className="hidden lg:flex items-center gap-2">
            <Link href="/" className="px-4 py-2 rounded-full text-[14px] font-bold bg-[#e0f2fe] text-[#0369a1] inline-flex items-center gap-1">Home</Link>
            <div className="relative" ref={fiturRef} onMouseEnter={() => setOpenDropdown('fitur')} onMouseLeave={() => setOpenDropdown(null)}>
              <button onClick={() => setOpenDropdown(p => p === 'fitur' ? null : 'fitur')} aria-expanded={openDropdown === 'fitur'} className={`px-4 py-2 rounded-full text-[14px] font-semibold inline-flex items-center gap-1 transition-all ${openDropdown === 'fitur' ? 'bg-[#e0f2fe] text-[#0369a1]' : 'text-[#334155] hover:text-[#0f172a]'}`}>Fitur <ChevronDown size={14} className="opacity-60" style={{ transform: openDropdown === 'fitur' ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s ease' }} /></button>
              <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[560px] max-w-[calc(100vw-24px)] z-[95] transition-all duration-200 ${openDropdown === 'fitur' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible pointer-events-none translate-y-[6px]'} max-[1024px]:hidden`}>
                <div className="bg-white border border-[#e2e8f0] rounded-[16px] shadow-[0_12px_32px_rgba(15,23,42,0.12),0_0_0_1px_rgba(0,0,0,0.04)] p-3 relative">
                  <div className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-[#e2e8f0] rotate-45" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <a href="#inside" onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] text-left min-w-0"><span className="w-9 h-9 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] inline-flex items-center justify-center shrink-0" style={{ background: '#e0f2fe', borderColor: '#bae6fd' }}><Monitor size={16} color="#0369a1" /></span><span className="flex flex-col gap-px min-w-0"><strong className="text-[13.5px] font-bold text-[#0a0e1a] leading-[1.3] break-words">Dock Control</strong><span className="text-xs font-medium text-[#64748b] leading-[1.4] break-words">Studio Mode & Scene Switcher</span></span></a>
                    <a href="#inside" onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] text-left min-w-0"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#ffedd5', borderColor: '#fed7aa' }}><Layers size={16} color="#ea580c" /></span><span className="flex flex-col gap-px min-w-0"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Event Overlay</strong><span className="text-xs font-medium text-[#64748b]">Gift, Follow & Donasi Real-time</span></span></a>
                    <a href="#inside" onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] text-left min-w-0"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#ede9fe', borderColor: '#ddd6fe' }}><Headphones size={16} color="#7c3aed" /></span><span className="flex flex-col gap-px min-w-0"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Media Player</strong><span className="text-xs font-medium text-[#64748b]">11 Tema + Lirik LRCLIB</span></span></a>
                    <a href="#inside" onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] text-left min-w-0"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#e0e7ff', borderColor: '#c7d2fe' }}><Smartphone size={16} color="#4f46e5" /></span><span className="flex flex-col gap-px min-w-0"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Mobile Dock</strong><span className="text-xs font-medium text-[#64748b]">Kontrol OBS dari HP</span></span></a>
                    <a href="#inside" onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] text-left min-w-0"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#dcfce7', borderColor: '#bbf7d0' }}><Radio size={16} color="#16a34a" /></span><span className="flex flex-col gap-px min-w-0"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Private WebSocket</strong><span className="text-xs font-medium text-[#64748b]">Room isolasi per streamer</span></span></a>
                    <a href="#inside" onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] text-left min-w-0"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#f1f5f9', borderColor: '#e2e8f0' }}><Sliders size={16} color="#334155" /></span><span className="flex flex-col gap-px min-w-0"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Widget Dashboard</strong><span className="text-xs font-medium text-[#64748b]">Kelola semua widget terpusat</span></span></a>
                  </div>
                  <a href="#inside" onClick={() => setOpenDropdown(null)} className="flex items-center justify-center gap-1.5 mt-2.5 -mx-3 -mb-3 px-4 py-3 border-t border-[#f1f5f9] rounded-b-[16px] bg-[#f8fafc] text-[13px] font-bold text-[#005ea6] hover:bg-[#f1f5f9] hover:text-[#004a8c] transition-colors">Lihat semua fitur <ArrowRight size={13} /></a>
                </div>
              </div>
            </div>
            <div className="relative" ref={widgetRef} onMouseEnter={() => setOpenDropdown('widget')} onMouseLeave={() => setOpenDropdown(null)}>
              <button onClick={() => setOpenDropdown(p => p === 'widget' ? null : 'widget')} aria-expanded={openDropdown === 'widget'} className={`px-4 py-2 rounded-full text-[14px] font-semibold inline-flex items-center gap-1 transition-all ${openDropdown === 'widget' ? 'bg-[#e0f2fe] text-[#0369a1]' : 'text-[#334155] hover:text-[#0f172a]'}`}>Widget <ChevronDown size={14} className="opacity-60" style={{ transform: openDropdown === 'widget' ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s ease' }} /></button>
              <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[560px] max-w-[calc(100vw-24px)] z-[95] transition-all duration-200 ${openDropdown === 'widget' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible pointer-events-none translate-y-[6px]'} max-[1024px]:hidden`}>
                <div className="bg-white border border-[#e2e8f0] rounded-[16px] shadow-[0_12px_32px_rgba(15,23,42,0.12)] p-3 relative">
                  <div className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-[#e2e8f0] rotate-45" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <a href="#aesthetic" onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] text-left"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#e0f2fe', borderColor: '#bae6fd' }}><MessageSquare size={16} color="#0369a1" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Chat Widget</strong><span className="text-xs font-medium text-[#64748b]">Twitch, YouTube, TikTok Live</span></span></a>
                    <a href="#aesthetic" onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] text-left"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#d1fae5', borderColor: '#a7f3d0' }}><BarChart3 size={16} color="#059669" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Poll & Goals</strong><span className="text-xs font-medium text-[#64748b]">Vote interaktif & target donasi</span></span></a>
                    <a href="#aesthetic" onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] text-left"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#ffedd5', borderColor: '#fed7aa' }}><Gift size={16} color="#ea580c" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Overlays</strong><span className="text-xs font-medium text-[#64748b]">Chat, Gift, Like, Full Overlay</span></span></a>
                    <a href="#aesthetic" onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] text-left"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#ede9fe', borderColor: '#ddd6fe' }}><Music2 size={16} color="#7c3aed" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Media & Lirik</strong><span className="text-xs font-medium text-[#64748b]">Sync lirik otomatis</span></span></a>
                    <a href="#aesthetic" onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] text-left"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#fef9c3', borderColor: '#fde68a' }}><Puzzle size={16} color="#a16207" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Utility Widgets</strong><span className="text-xs font-medium text-[#64748b]">Timer, Ticker, QR, Counter</span></span></a>
                    <a href="#aesthetic" onClick={() => setOpenDropdown(null)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc] text-left"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#cffafe', borderColor: '#a5f3fc' }}><Volume2 size={16} color="#0891b2" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Social Rotator</strong><span className="text-xs font-medium text-[#64748b]">Info Slides & sosmed</span></span></a>
                  </div>
                  <a href="#aesthetic" onClick={() => setOpenDropdown(null)} className="flex items-center justify-center gap-1.5 mt-2.5 -mx-3 -mb-3 px-4 py-3 border-t border-[#f1f5f9] rounded-b-[16px] bg-[#f8fafc] text-[13px] font-bold text-[#005ea6] hover:bg-[#f1f5f9] hover:text-[#004a8c]">Jelajahi semua widget <ArrowRight size={13} /></a>
                </div>
              </div>
            </div>
            <a href="#reviews" className="px-4 py-2 rounded-full text-[14px] font-semibold text-[#334155] hover:text-[#0f172a] transition-colors">Testimoni</a>
            <a href="#faq" className="px-4 py-2 rounded-full text-[14px] font-semibold text-[#334155] hover:text-[#0f172a]">FAQ</a>
            <a href="#spotlight" className="px-4 py-2 rounded-full text-[14px] font-semibold text-[#334155] hover:text-[#0f172a]">Komunitas</a>
          </nav>
          <div className="flex items-center gap-3.5 max-[640px]:gap-2">
            <Link href={isLoggedIn ? '/dashboard' : '/login'} className="w-9 h-9 rounded-full inline-flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-colors"><User size={19} /></Link>
            <Link href={isLoggedIn ? '/dashboard' : '/register'} className="inline-flex items-center gap-2 bg-[#005ea6] hover:bg-[#004a8c] hover:-translate-y-px text-[#ffffff] px-5 py-[9px] rounded-full text-[14px] font-bold shadow-[0_4px_14px_rgba(0,94,166,0.28)] transition-all max-[640px]:px-[14px] max-[640px]:text-[13px] max-[640px]:gap-1.5"><Tv size={15} /><span>{isLoggedIn ? 'Dashboard' : 'Mulai Gratis'}</span></Link>
            <button onClick={() => setMobileOpen(p => !p)} aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'} aria-expanded={mobileOpen} className="hidden max-[1024px]:inline-flex w-10 h-10 rounded-[10px] border border-[#e2e8f0] bg-white text-[#334155] items-center justify-center shrink-0 hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:text-[#0f172a] transition-all">{mobileOpen ? <XIcon size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        <div onClick={() => setMobileOpen(false)} className={`fixed inset-0 top-[72px] max-[640px]:top-[64px] bg-[rgba(15,23,42,0.32)] backdrop-blur-[2px] z-[88] transition-all ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`} aria-hidden="true" />
        <nav className={`fixed left-0 right-0 top-[72px] max-[640px]:top-[64px] max-h-[calc(100dvh-72px)] max-[640px]:max-h-[calc(100dvh-64px)] overflow-y-auto bg-white border-b border-[#e2e8f0] px-3 py-2.5 pb-6 flex flex-col gap-0.5 z-[89] shadow-[0_16px_32px_rgba(15,23,42,0.1)] transition-all duration-200 ${mobileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible pointer-events-none -translate-y-2.5'} max-[1024px]:flex lg:hidden`}>
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center justify-between w-full px-3.5 py-3.5 rounded-xl text-[14.5px] font-semibold text-[#334155] hover:bg-[#f8fafc] hover:text-[#0f172a]">Home</Link>
          <div className={`rounded-xl border transition-colors ${mobileDropdown === 'fitur' ? 'border-[#e2e8f0] bg-[#f8fafc]' : 'border-transparent'}`}>
            <button onClick={() => setMobileDropdown(p => p === 'fitur' ? null : 'fitur')} aria-expanded={mobileDropdown === 'fitur'} className={`flex items-center justify-between w-full px-3.5 py-3.5 rounded-xl text-[14.5px] font-semibold text-left ${mobileDropdown === 'fitur' ? 'bg-[#e0f2fe] text-[#0369a1]' : 'text-[#334155] hover:bg-[#f8fafc]'}`}>Fitur <ChevronDown size={16} className="opacity-70 shrink-0 transition-transform" style={{ transform: mobileDropdown === 'fitur' ? 'rotate(180deg)' : undefined }} /></button>
            <div className={`grid grid-cols-1 gap-1 overflow-hidden transition-all duration-300 ${mobileDropdown === 'fitur' ? 'max-h-[720px] opacity-100 py-1.5 px-1' : 'max-h-0 opacity-0 px-1'}`}>
              <a href="#inside" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] bg-white border border-[#e2e8f0] hover:bg-[#f1f5f9]"><span className="w-9 h-9 rounded-[10px] border bg-[#e0f2fe] border-[#bae6fd] inline-flex items-center justify-center shrink-0"><Monitor size={16} color="#0369a1" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Dock Control</strong><span className="text-xs font-medium text-[#64748b]">Studio Mode & Scene Switcher</span></span></a>
              <a href="#inside" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] bg-white border border-[#e2e8f0]"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#ffedd5', borderColor: '#fed7aa' }}><Layers size={16} color="#ea580c" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Event Overlay</strong><span className="text-xs font-medium text-[#64748b]">Gift, Follow & Donasi</span></span></a>
              <a href="#inside" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] bg-white border border-[#e2e8f0]"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#ede9fe', borderColor: '#ddd6fe' }}><Headphones size={16} color="#7c3aed" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Media Player</strong><span className="text-xs font-medium text-[#64748b]">11 Tema + Lirik LRCLIB</span></span></a>
              <a href="#inside" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] bg-white border border-[#e2e8f0]"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#e0e7ff', borderColor: '#c7d2fe' }}><Smartphone size={16} color="#4f46e5" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Mobile Dock</strong><span className="text-xs font-medium text-[#64748b]">Kontrol OBS dari HP</span></span></a>
              <a href="#inside" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] bg-white border border-[#e2e8f0]"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#dcfce7', borderColor: '#bbf7d0' }}><Radio size={16} color="#16a34a" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Private WebSocket</strong><span className="text-xs font-medium text-[#64748b]">Room isolasi per streamer</span></span></a>
              <a href="#inside" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] bg-white border border-[#e2e8f0]"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#f1f5f9', borderColor: '#e2e8f0' }}><Sliders size={16} color="#334155" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Widget Dashboard</strong><span className="text-xs font-medium text-[#64748b]">Kelola semua widget</span></span></a>
              <a href="#inside" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-1.5 mt-1 px-3.5 py-2.5 rounded-[10px] bg-[#005ea6] hover:bg-[#004a8c] text-[#ffffff] text-[13px] font-bold">Lihat semua fitur <ArrowRight size={13} /></a>
            </div>
          </div>
          <div className={`rounded-xl border transition-colors ${mobileDropdown === 'widget' ? 'border-[#e2e8f0] bg-[#f8fafc]' : 'border-transparent'}`}>
            <button onClick={() => setMobileDropdown(p => p === 'widget' ? null : 'widget')} aria-expanded={mobileDropdown === 'widget'} className={`flex items-center justify-between w-full px-3.5 py-3.5 rounded-xl text-[14.5px] font-semibold text-left ${mobileDropdown === 'widget' ? 'bg-[#e0f2fe] text-[#0369a1]' : 'text-[#334155] hover:bg-[#f8fafc]'}`}>Widget <ChevronDown size={16} className="opacity-70 shrink-0 transition-transform" style={{ transform: mobileDropdown === 'widget' ? 'rotate(180deg)' : undefined }} /></button>
            <div className={`grid grid-cols-1 gap-1 overflow-hidden transition-all duration-300 ${mobileDropdown === 'widget' ? 'max-h-[720px] opacity-100 py-1.5 px-1' : 'max-h-0 opacity-0 px-1'}`}>
              <a href="#aesthetic" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] bg-white border border-[#e2e8f0]"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#e0f2fe', borderColor: '#bae6fd' }}><MessageSquare size={16} color="#0369a1" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Chat Widget</strong><span className="text-xs font-medium text-[#64748b]">Twitch, YouTube, TikTok</span></span></a>
              <a href="#aesthetic" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] bg-white border border-[#e2e8f0]"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#d1fae5', borderColor: '#a7f3d0' }}><BarChart3 size={16} color="#059669" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Poll & Goals</strong><span className="text-xs font-medium text-[#64748b]">Vote & target donasi</span></span></a>
              <a href="#aesthetic" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] bg-white border border-[#e2e8f0]"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#ffedd5', borderColor: '#fed7aa' }}><Gift size={16} color="#ea580c" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Overlays</strong><span className="text-xs font-medium text-[#64748b]">Chat, Gift, Full Overlay</span></span></a>
              <a href="#aesthetic" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] bg-white border border-[#e2e8f0]"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#ede9fe', borderColor: '#ddd6fe' }}><Music2 size={16} color="#7c3aed" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Media & Lirik</strong><span className="text-xs font-medium text-[#64748b]">Sync lirik otomatis</span></span></a>
              <a href="#aesthetic" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] bg-white border border-[#e2e8f0]"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#fef9c3', borderColor: '#fde68a' }}><Puzzle size={16} color="#a16207" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Utility Widgets</strong><span className="text-xs font-medium text-[#64748b]">Timer, Ticker, QR</span></span></a>
              <a href="#aesthetic" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] bg-white border border-[#e2e8f0]"><span className="w-9 h-9 rounded-[10px] border inline-flex items-center justify-center shrink-0" style={{ background: '#cffafe', borderColor: '#a5f3fc' }}><Volume2 size={16} color="#0891b2" /></span><span className="flex flex-col"><strong className="text-[13.5px] font-bold text-[#0a0e1a]">Social Rotator</strong><span className="text-xs font-medium text-[#64748b]">Info Slides & sosmed</span></span></a>
              <a href="#aesthetic" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-1.5 mt-1 px-3.5 py-2.5 rounded-[10px] bg-[#005ea6] hover:bg-[#004a8c] text-[#ffffff] text-[13px] font-bold">Jelajahi semua widget <ArrowRight size={13} /></a>
            </div>
          </div>
          <a href="#reviews" onClick={() => setMobileOpen(false)} className="flex items-center justify-between w-full px-3.5 py-3.5 rounded-xl text-[14.5px] font-semibold text-[#334155] hover:bg-[#f8fafc]">Testimoni</a>
          <a href="#faq" onClick={() => setMobileOpen(false)} className="flex items-center justify-between w-full px-3.5 py-3.5 rounded-xl text-[14.5px] font-semibold text-[#334155] hover:bg-[#f8fafc]">FAQ</a>
          <a href="#spotlight" onClick={() => setMobileOpen(false)} className="flex items-center justify-between w-full px-3.5 py-3.5 rounded-xl text-[14.5px] font-semibold text-[#334155] hover:bg-[#f8fafc]">Komunitas</a>
          <div className="mt-2.5 pt-3.5 border-t border-[#e2e8f0]"><Link href={isLoggedIn ? '/dashboard' : '/register'} onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full bg-[#005ea6] hover:bg-[#004a8c] text-[#ffffff] px-5 py-3.5 rounded-full text-[14px] font-bold shadow-[0_4px_14px_rgba(0,94,166,0.28)]"><Tv size={16} />{isLoggedIn ? 'Buka Dashboard' : 'Mulai Gratis'}</Link></div>
        </nav>
      </header>

      <main>
        {/* HERO - text tengah, image mengintip setengah (peeking) */}
        <section className="relative min-h-[calc(100vh-72px)] max-[900px]:min-h-auto flex flex-col justify-center items-center pt-12 pb-[360px] max-[900px]:pb-[280px] max-[640px]:pb-[240px] bg-[#f8fafc] overflow-visible">
          <div className="max-w-[1280px] mx-auto px-8 max-[640px]:px-4 w-full">
            <div className="flex flex-col items-center text-center max-w-[1120px] mx-auto w-full">
              <div className="inline-flex items-center gap-2 bg-white border border-[#e2e8f0] px-3.5 py-1.5 rounded-full text-[12.5px] font-bold text-[#334155] shadow-[0_1px_4px_rgba(0,0,0,0.04)] mb-4"><span className="w-[7px] h-[7px] rounded-full bg-[#10b981] shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />OBS Studio v28+ & WebSocket Privat Siap Pakai</div>
              <h1 className="font-extrabold text-[clamp(36px,5vw,68px)] max-[640px]:text-[clamp(30px,8vw,42px)] leading-[1.05] tracking-[-0.05em] text-[#0a0e1a] mb-4 max-w-[860px] text-balance">Kontrol OBS & 14+ Widget Stream<br /><span className="text-[#005ea6]">Langsung dari Browser</span></h1>
              <p className="text-[clamp(14.5px,1.2vw,16.5px)] leading-[1.55] text-[#475569] max-w-[660px] mb-5 text-pretty">Ganti scene Studio Mode, kontrol audio, pasang overlay chat & event donasi real-time, serta jalankan widget interaktif tanpa software rumit. Terhubung otomatis via Browser Source dan WebSocket room privat.</p>
              <div className="flex items-center justify-center gap-3 mb-3.5 flex-wrap">
                <Link href={isLoggedIn ? '/dashboard' : '/register'} className="inline-flex items-center gap-2 bg-[#005ea6] hover:bg-[#004a8c] hover:-translate-y-px text-[#ffffff] px-6 py-[11px] rounded-full text-[14px] font-bold shadow-[0_4px_14px_rgba(0,94,166,0.28)] transition-all whitespace-nowrap"><span>{isLoggedIn ? 'Buka Dashboard' : 'Mulai Sekarang - Gratis'}</span> <ArrowRight size={16} /></Link>
                <a href="#inside" className="inline-flex items-center gap-2 bg-white text-[#1e293b] border border-[#e2e8f0] px-5 py-[11px] rounded-full text-[14px] font-bold hover:border-[#94a3b8] hover:text-[#005ea6] transition-all whitespace-nowrap"><Sliders size={16} />Jelajahi Fitur</a>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-[#64748b] mb-2 flex-wrap"><span className="text-[#f59e0b] tracking-[2px] text-[13px]">★★★★★</span><span className="text-[#0f172a] font-bold">500+ streamer aktif</span><span>·</span><span>Tanpa kartu kredit</span><span>·</span><span>Setup instan 60 detik</span></div>
            </div>
          </div>
          {/* Image mengintip - diperbesar lagi */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-[1240px] px-6 max-[640px]:px-4 pointer-events-none">
            <div className="w-full bg-[#0b0f19] rounded-[18px] border border-[#1e293b] shadow-[0_32px_70px_-12px_rgba(0,0,0,0.55)] overflow-hidden text-left hover:-translate-y-1 hover:shadow-[0_38px_80px_-12px_rgba(0,0,0,0.65)] transition-all pointer-events-auto">
              <div className="w-full relative bg-black overflow-hidden block"><img src="/assets/dock-preview.png" alt="OBS Dock Controller Interface (/dock)" className="w-full h-auto block object-cover object-top max-h-[720px] max-[1000px]:max-h-[480px] max-[640px]:max-h-[360px] min-h-[320px]" /></div>
            </div>
          </div>
        </section>

        {/* PLATFORMS - hover only, tidak perlu selectable - pt besar karena hero image mengintip diperbesar */}
        <section id="platforms" className="pt-[420px] pb-[60px] max-[1000px]:pt-[320px] max-[640px]:pt-[260px] text-center border-t border-[#e2e8f0]">
          <div className="max-w-[1280px] mx-auto px-8 max-[640px]:px-4">
            <h2 className="font-extrabold text-[clamp(32px,4vw,50px)] tracking-[-0.04em] text-[#0a0e1a] mb-[30px] flex items-center justify-center flex-wrap gap-3 select-none"><span>Stream Overlays</span><span>for</span><span className="bg-[#005ea6] text-[#ffffff] px-5 py-0.5 rounded-full inline-block shadow-[0_4px_14px_rgba(0,94,166,0.28)] select-none">Every Platform</span></h2>
            <div className="flex justify-center items-center flex-wrap gap-4 max-w-[900px] mx-auto">
              {PLATFORMS.map(p => (
                <div key={p.id} className="group inline-flex items-center gap-2 border rounded-full px-5 py-2.5 text-[14.5px] font-bold shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-all cursor-default select-none bg-white border-[#e2e8f0] text-[#334155] hover:bg-[#0f172a] hover:border-[#0f172a] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
                  <img src={p.icon} alt={p.name} className="w-5 h-5 object-contain transition-all group-hover:brightness-0" />
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INSIDE - BENTO GRID */}
        <section id="inside" className="py-[70px] pb-20 border-t border-[#e2e8f0] bg-white">
          <div className="max-w-[1280px] mx-auto px-8 max-[640px]:px-4">
            <h2 className="font-extrabold text-[clamp(32px,3.8vw,48px)] tracking-[-0.035em] text-[#0a0e1a] mb-9">Semua yang ada di OBS Dock</h2>
            <div className="grid grid-cols-12 gap-5 mb-6 auto-rows-[minmax(180px,auto)] max-[1024px]:grid-cols-1 max-[1024px]:auto-rows-auto">
              {/* Bento 1 - Dock Control (besar, tall) */}
              <div className="col-span-12 lg:col-span-5 lg:row-span-2 bg-white border border-[#e2e8f0] rounded-[20px] overflow-hidden flex flex-col shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] transition-all min-h-0"><div className="h-[340px] max-[1024px]:h-[260px] bg-[#eff6ff] border-b border-[#e2e8f0] flex items-center justify-center relative overflow-hidden p-4 shrink-0 skeleton-shimmer"><div style={{ width: '85%', height: '80%', background: '#fff', borderRadius: 16, border: '1.5px solid #93c5fd', boxShadow: '0 10px 25px rgba(59,130,246,0.12)', position: 'relative', padding: 16 }}><div style={{ position: 'absolute', top: 12, right: 12, width: 80, height: 18, background: '#e0f2fe', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0369a1' }} /><span style={{ width: 40, height: 4, background: '#93c5fd', borderRadius: 2 }} /></div><div style={{ position: 'absolute', bottom: 16, left: 16, width: '45%', height: '52%', background: '#f8fafc', border: '2px solid #005ea6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 34, height: 34, borderRadius: '50%', background: '#cbd5e1' }} /></div><div style={{ position: 'absolute', bottom: 22, right: 16, width: '42%', height: 16, background: '#f1f5f9', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#005ea6' }} /><span style={{ width: 48, height: 5, background: '#005ea6', borderRadius: 2 }} /></div></div></div><div className="p-[22px] flex-1 flex flex-col justify-center"><h3 className="font-extrabold text-[19px] tracking-[-0.02em] text-[#0a0e1a] mb-2">Dock Control</h3><p className="text-[13.5px] text-[#475569] leading-[1.55]">Panel OBS langsung di browser - scene switcher, studio mode, dan stream tools tanpa buka aplikasi lain.</p></div></div>
              {/* Bento 2 - Event Overlay (1 per 1 fade, hold 1 detik, delay per div) */}
              <div className="col-span-12 lg:col-span-4 lg:row-span-2 bg-white border border-[#e2e8f0] rounded-[20px] overflow-hidden flex flex-col shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] transition-all min-h-0"><div className="h-[340px] max-[1024px]:h-[260px] bg-[#fff7ed] border-b border-[#e2e8f0] flex flex-col items-center justify-center gap-3.5 p-4 shrink-0 overflow-hidden"><div style={{animationDelay:'0ms'}} className="w-[85%] h-[46px] bg-white rounded-xl border border-[#fed7aa] flex items-center gap-2.5 px-3.5 shadow-[0_6px_16px_rgba(249,115,22,0.08)] opacity-0 animate-[fadeUpHold_4.2s_ease-in-out_infinite]"><span className="w-3.5 h-3.5 rounded-full bg-[#f97316]" /><div className="flex-1 flex flex-col gap-1"><span className="w-[60%] h-1.5 bg-[#fdba74] rounded" /><span className="w-[40%] h-1 bg-[#fed7aa] rounded" /></div><span className="w-[22px] h-2.5 bg-[#ea580c] rounded" /></div><div style={{animationDelay:'1400ms'}} className="w-[85%] h-[46px] bg-white rounded-xl border border-[#fed7aa] flex items-center gap-2.5 px-3.5 shadow-[0_6px_16px_rgba(249,115,22,0.08)] opacity-0 animate-[fadeUpHold_4.2s_ease-in-out_infinite]"><span className="w-3.5 h-3.5 rounded-full bg-[#ea580c]" /><div className="flex-1 flex flex-col gap-1"><span className="w-[70%] h-1.5 bg-[#fdba74] rounded" /><span className="w-[35%] h-1 bg-[#fed7aa] rounded" /></div></div><div style={{animationDelay:'2800ms'}} className="w-[85%] h-[46px] bg-white rounded-xl border border-[#fed7aa] flex items-center gap-2.5 px-3.5 opacity-0 animate-[fadeUpHold_4.2s_ease-in-out_infinite]"><span className="w-3.5 h-3.5 rounded-full bg-[#fb923c]" /><span className="w-1/2 h-1.5 bg-[#fdba74] rounded" /></div></div><div className="p-[22px] flex-1 flex flex-col justify-center"><h3 className="font-extrabold text-[19px] text-[#0a0e1a] mb-2">Event Overlay</h3><p className="text-[13.5px] text-[#475569]">Gift, follow, sub, dan donasi muncul real-time - WebSocket privat memastikan event streamer lain tidak bocor.</p></div></div>
              {/* Bento 3 - Media Player + Lirik (crossfade gantian, arah terus ke atas) */}
              <div className="col-span-12 lg:col-span-3 bg-white border border-[#e2e8f0] rounded-[20px] overflow-hidden flex flex-col shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] transition-all min-h-0"><div className="h-[210px] max-[1024px]:h-[190px] bg-[#faf5ff] border-b border-[#e2e8f0] flex items-center justify-center p-4 shrink-0 overflow-hidden"><div className="w-[80%] h-[85px] bg-white rounded-xl border border-[#e9d5ff] shadow-[0_8px_20px_rgba(168,85,247,0.1)] flex flex-col items-center justify-center overflow-hidden relative py-2"><div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 animate-[lyricGantiA_3.6s_ease-in-out_infinite]"><span className="h-1.5 w-[38%] bg-[#c084fc]/70 rounded block" /><span className="h-2.5 w-[68%] bg-[#a855f7] rounded block shadow-[0_2px_8px_rgba(168,85,247,0.18)]" /><span className="h-1.5 w-[42%] bg-[#e9d5ff] rounded block" /></div><div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 animate-[lyricGantiB_3.6s_ease-in-out_infinite]"><span className="h-1.5 w-[52%] bg-[#c084fc]/60 rounded block" /><span className="h-2.5 w-[64%] bg-[#a855f7] rounded block shadow-[0_2px_8px_rgba(168,85,247,0.18)]" /><span className="h-1.5 w-[48%] bg-[#e9d5ff]/80 rounded block" /></div></div></div><div className="p-[22px] flex-1"><h3 className="font-extrabold text-[19px] text-[#0a0e1a] mb-2">Media Player + Lirik</h3><p className="text-[13.5px] text-[#475569]">11 tema visual, sinkronisasi lirik otomatis LRCLIB, dan SMTC Bridge - musik stream tampil profesional.</p></div></div>
              {/* Bento 4 - Widget Dashboard (kecil kanan bawah) */}
              <div className="col-span-12 lg:col-span-3 bg-white border border-[#e2e8f0] rounded-[20px] overflow-hidden flex flex-col shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] transition-all min-h-0"><div className="h-[210px] max-[1024px]:h-[190px] bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-center p-4 shrink-0 skeleton-shimmer"><div className="w-[85%] h-[95px] bg-white rounded-xl border border-[#cbd5e1] p-2.5 flex flex-col gap-2"><div className="w-full h-[26px] bg-[#e2e8f0] rounded-md" /><div className="grid grid-cols-3 gap-1.5"><div className="h-[38px] bg-[#f8fafc] border border-[#e2e8f0] rounded-md" /><div className="h-[38px] bg-[#f8fafc] border border-[#e2e8f0] rounded-md" /><div className="h-[38px] bg-[#f8fafc] border border-[#e2e8f0] rounded-md" /></div></div></div><div className="p-[22px] flex-1"><h3 className="font-extrabold text-[19px] text-[#0a0e1a] mb-2">Widget Dashboard</h3><p className="text-[13.5px] text-[#475569]">Kelola semua widget - chat, poll, timer, ticker - dari satu panel terpusat.</p></div></div>
              {/* Bento 5 - Mobile Dock (lebar 5) */}
              <div className="col-span-12 lg:col-span-5 bg-white border border-[#e2e8f0] rounded-[20px] overflow-hidden flex flex-col shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] transition-all min-h-0"><div className="h-[210px] max-[1024px]:h-[190px] bg-[#f0fdf4] border-b border-[#e2e8f0] flex items-center justify-center p-4 shrink-0 skeleton-shimmer"><div className="w-[70%] h-[110px] bg-white rounded-[14px] border border-[#bbf7d0] flex items-center justify-center gap-3.5 p-4"><div className="w-[54px] h-[54px] rounded-full border-[3px] border-[#16a34a] flex items-center justify-center"><div className="w-[18px] h-[18px] rounded-full bg-[#86efac]" /></div><div className="flex flex-col gap-2 flex-1"><div className="h-2.5 bg-[#dcfce7] rounded-full" /><div className="h-2.5 bg-[#dcfce7] rounded-full w-[70%]" /></div></div></div><div className="p-[22px] flex-1"><h3 className="font-extrabold text-[19px] text-[#0a0e1a] mb-2">Mobile Dock</h3><p className="text-[13.5px] text-[#475569]">Buka dock dari HP saat live - ganti scene, kontrol widget, tanpa sentuh laptop.</p></div></div>
              {/* Bento 6 - Private Key (interaktif - scramble, klik card, hover) */}
              <div onClick={() => setShowPrivateMock(v=>!v)} className="group col-span-12 lg:col-span-7 bg-white border border-[#e2e8f0] rounded-[20px] overflow-hidden flex flex-col shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] hover:border-[#bae6fd] transition-all min-h-0 cursor-pointer active:scale-[0.99]"><div className="h-[210px] max-[1024px]:h-[190px] bg-[#ecfeff] border-b border-[#e2e8f0] flex flex-col items-center justify-center gap-3 p-4 shrink-0 group-hover:bg-[#e0f2fe]/60 transition-colors"><div onClick={e => e.stopPropagation()} className="flex items-center gap-2 bg-white rounded-xl border border-[#bae6fd] group-hover:border-[#0369a1]/30 group-hover:shadow-[0_4px_12px_rgba(0,94,166,0.12)] px-3 py-2 shadow-sm w-[88%] max-w-[360px] transition-all"><span className={`flex-1 font-mono text-[11px] font-bold tracking-wider truncate transition-all duration-300 ${showPrivateMock ? 'text-[#0a0e1a]' : 'text-transparent [text-shadow:_0_0_8px_rgba(15,23,42,0.5)] select-none blur-[3px] animate-[pulse-skeleton_0.6s_ease-in-out_infinite]'}`}>{mockCode}<span className={`inline-block w-[2px] h-3 bg-[#0369a1] ml-0.5 align-middle ${showPrivateMock ? 'animate-[pulse-skeleton_1s_ease-in-out_infinite]' : 'opacity-40'}`} /></span><button onClick={() => setShowPrivateMock(v=>!v)} aria-label={showPrivateMock?'Sembunyikan key':'Tampilkan key'} className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all active:scale-90 ${showPrivateMock ? 'bg-[#005ea6] border-[#005ea6] text-[#ffffff] hover:bg-[#004a8c]' : 'bg-[#f1f5f9] border-[#e2e8f0] text-[#334155] hover:bg-[#e2e8f0] hover:text-[#0f172a]'}`}>{showPrivateMock ? <EyeOff size={14}/> : <Eye size={14}/>}</button></div><div className="flex items-center gap-2 text-[10px] font-bold tracking-widest"><span className={`px-2 py-1 rounded-full border text-[10px] font-bold transition-all flex items-center gap-1 ${showPrivateMock ? 'bg-[#dcfce7] border-[#bbf7d0] text-[#14532d] animate-[pulse-skeleton_1.2s_ease-in-out_infinite]' : 'bg-[#fef9c3] border-[#fde68a] text-[#713f12]'}`}>{showPrivateMock ? <><Unlock size={11} />TERBUKA</> : <><Lock size={11} />TERKUNCI</>}</span><span className={`font-mono text-[10px] transition-colors ${showPrivateMock ? 'text-[#0369a1]' : 'text-[#64748b]'}`}>{showPrivateMock ? 'room: private' : 'room: ••••••'}</span></div><span className="text-[10px] text-[#94a3b8] font-medium mt-1 group-hover:text-[#64748b] transition-colors">{showPrivateMock ? '' : ''}</span></div><div className="p-[22px] flex-1"><h3 className="font-extrabold text-[19px] text-[#0a0e1a] mb-2 group-hover:text-[#005ea6] transition-colors">Private Key & WebSocket</h3><p className="text-[13.5px] text-[#475569]">Tiap akun punya room WebSocket sendiri. Event stream kamu tidak akan bocor ke streamer lain.</p></div></div>
            </div>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[20px] px-7 py-4.5 flex items-center justify-between gap-5 flex-wrap shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-5"><div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-full border border-[#e2e8f0]"><span className="w-6 h-6 rounded-full flex items-center justify-center bg-[#0f172a] text-[#ffffff] text-xs font-bold">●</span><span className="w-6 h-6 rounded-full flex items-center justify-center bg-[#0f172a] text-[#ffffff] text-xs font-bold">S</span><span className="w-6 h-6 rounded-full flex items-center justify-center bg-[#0f172a] text-[#ffffff] text-xs font-bold">T</span></div><div className="text-sm font-semibold text-[#334155] max-w-[580px]">Semua widget dan overlay tersedia sebagai Browser Source - langsung paste URL ke OBS, Streamlabs, atau StreamElements.</div></div>
              <a href="#aesthetic" className="inline-flex items-center gap-2 bg-[#005ea6] hover:bg-[#004a8c] text-[#ffffff] px-6 py-3 rounded-full text-sm font-bold shadow-[0_4px_14px_rgba(0,94,166,0.28)] whitespace-nowrap transition-colors">Lihat semua fitur <ArrowUpRight size={16} /></a>
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section id="reviews" className="py-20 bg-[#f8fafc] border-t border-[#e2e8f0]">
          <div className="max-w-[1280px] mx-auto px-8 max-[640px]:px-4">
            <div className="mb-8"><h2 className="font-extrabold text-[clamp(32px,3.8vw,48px)] tracking-[-0.035em] text-[#0a0e1a] mb-1.5">Yang streamer bilang</h2><p className="text-[15px] text-[#475569]">Review nyata dari para streamer yang sudah pakai OBS Dock setiap hari.</p></div>
            <div className="bg-white border border-[#e2e8f0] rounded-3xl p-8 shadow-[0_4px_12px_rgba(15,23,42,0.05)] relative" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23cbd5e1' fill-opacity='0.4'/%3E%3C/svg%3E\")" }}>
              <div className="grid grid-cols-5 max-[1024px]:grid-cols-2 max-[480px]:grid-cols-1 gap-4">
                {STICKY_REVIEWS.map(r => (
                  <div key={r.id} className={`rounded-xl p-4 flex flex-col justify-between shadow-[0_4px_10px_rgba(0,0,0,0.04)] border border-black/5 min-h-[180px] hover:-translate-y-1 hover:scale-[1.02] transition-transform ${r.tint}`}>
                    <div><div className="text-[#ff4d2e] text-[11px] tracking-[1px] mb-2">{"★".repeat(r.stars)}</div><div className="text-[13.5px] font-bold leading-[1.4] mb-3 flex-1">"{r.quote}"</div></div><div className="text-[11.5px] opacity-80 border-t border-black/5 pt-2"><span className="font-bold">{r.author}</span> · {r.product}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-5"><button onClick={() => showToast('Halaman ulasan sebelumnya')} aria-label="Previous Reviews" className="w-9 h-9 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#334155] shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:bg-[#005ea6] hover:text-[#ffffff] hover:border-[#005ea6] transition-colors"><ChevronLeft size={16} /></button><button onClick={() => showToast('Halaman ulasan berikutnya')} aria-label="Next Reviews" className="w-9 h-9 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#334155] shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:bg-[#005ea6] hover:text-[#ffffff] hover:border-[#005ea6] transition-colors"><ChevronRight size={16} /></button></div>
            </div>
          </div>
        </section>

        {/* AESTHETIC - tab difungsikan */}
        <section id="aesthetic" className="py-20 bg-white border-t border-[#e2e8f0]">
          <div className="max-w-[1280px] mx-auto px-8 max-[640px]:px-4">
            <div className="mb-7"><h2 className="font-extrabold text-[clamp(32px,3.8vw,48px)] tracking-[-0.035em] text-[#0a0e1a] mb-9">Temukan Fitur yang Tepat</h2><div className="flex gap-2 bg-[#f1f5f9] p-1 rounded-full w-fit mb-8"><button onClick={() => setActiveAestheticTab('product')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeAestheticTab === 'product' ? 'bg-[#005ea6] text-[#ffffff] shadow-[0_4px_14px_rgba(0,94,166,0.28)]' : 'text-[#475569] hover:text-[#0f172a]'}`}>Fitur Utama</button><button onClick={() => setActiveAestheticTab('game')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeAestheticTab === 'game' ? 'bg-[#005ea6] text-[#ffffff] shadow-[0_4px_14px_rgba(0,94,166,0.28)]' : 'text-[#475569] hover:text-[#0f172a]'}`}>Multi-Platform</button><button onClick={() => setActiveAestheticTab('aesthetic')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeAestheticTab === 'aesthetic' ? 'bg-[#005ea6] text-[#ffffff] shadow-[0_4px_14px_rgba(0,94,166,0.28)]' : 'text-[#475569] hover:text-[#0f172a]'}`}>Semua Widget</button></div></div>
            <div className="grid grid-cols-3 max-[1024px]:grid-cols-1 gap-5 mb-6">
              {(activeAestheticTab === 'product' ? AESTHETIC_CATEGORIES.filter(c => ['dock','mediaplayer','poll','utils'].includes(c.id)) : activeAestheticTab === 'game' ? AESTHETIC_CATEGORIES.filter(c => ['overlay','chat','mobiledock'].includes(c.id)) : AESTHETIC_CATEGORIES).map(c => (
                <div key={c.id} className="bg-white border border-[#e2e8f0] rounded-[20px] p-6 flex items-start gap-4 shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] hover:border-[#cbd5e1] transition-all">
                  <div className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: c.bg, borderColor: c.border }}>{c.icon}</div><div className="flex-1"><h3 className="font-extrabold text-lg tracking-[-0.02em] text-[#0a0e1a] mb-1.5">{c.title}</h3><p className="text-[13.5px] text-[#475569] leading-[1.5]">{c.desc}</p></div>
                </div>
              ))}
            </div>
            <div className="bg-[#fefce8] border border-[#fef08a] rounded-[20px] px-8 py-6 flex items-center justify-between gap-5 shadow-[0_4px_12px_rgba(15,23,42,0.05)] flex-wrap">
              <div className="flex items-center gap-5"><div className="w-[52px] h-[52px] rounded-[14px] bg-white border border-[#fef08a] flex items-center justify-center"><Gift size={24} color="#ca8a04" strokeWidth={2.2} /></div><div><h3 className="font-extrabold text-xl text-[#713f12] mb-1">Mulai Gratis Sekarang</h3><p className="text-sm text-[#854d0e]">Gunakan 14+ widget, dock control, dan overlay interaktif langsung tanpa perlu kartu kredit.</p></div></div>
              <Link href={isLoggedIn ? "/dashboard" : "/login"} className="inline-flex items-center gap-2 bg-[#0f172a] hover:bg-[#005ea6] text-[#ffffff] px-6 py-3 rounded-full text-sm font-bold transition-colors whitespace-nowrap">Coba OBS Dock Gratis <ArrowRight size={15} /></Link>
            </div>
          </div>
        </section>

        {/* BUYONCE - diperbesar, pill tidak overlap border */}
        <section id="buyonce" className="py-20 pb-28 bg-white">
          <div className="max-w-[1280px] mx-auto px-8 max-[640px]:px-4">
            <div className="bg-[#005ea6] rounded-[28px] px-16 py-24 max-[1024px]:px-8 max-[1024px]:py-12 max-[640px]:px-6 max-[640px]:py-8 text-[#ffffff] grid grid-cols-[1.35fr_1.3fr] max-[1024px]:grid-cols-1 gap-12 max-[1024px]:gap-10 items-start shadow-[0_24px_50px_-15px_rgba(0,94,166,0.45)] overflow-visible">
              <div className="flex flex-col items-start min-w-0 pr-2"><h2 className="font-extrabold text-[clamp(42px,5vw,68px)] max-[1280px]:text-[clamp(38px,4.5vw,60px)] max-[640px]:text-[clamp(30px,8vw,42px)] leading-[1.05] tracking-[-0.04em] mb-3 break-words max-w-full">Mulai <span className="relative inline-block px-1.5"><span className="absolute inset-0 bg-[#fef08a] -rotate-1 rounded-[6px] opacity-90 shadow-[0_1px_0_rgba(0,0,0,0.08)]" aria-hidden="true" /><span className="relative text-[#713f12]">gratis</span></span>.<br /><span className="bg-[#d9f99d] text-[#0f172a] px-7 py-2.5 max-[640px]:px-5 max-[640px]:py-1.5 rounded-full inline-block font-extrabold tracking-[-0.03em] shadow-[0_4px_12px_rgba(0,0,0,0.15)] text-[0.58em] leading-[1.15] whitespace-normal break-words max-w-full mt-3">Tanpa biaya langganan.</span></h2></div>
              <div className="grid grid-cols-2 max-[640px]:grid-cols-1 gap-10 gap-x-10 min-w-0">
                <div className="min-w-0"><h3 className="font-extrabold text-[20px] max-[640px]:text-[18px] mb-2.5 tracking-[-0.02em] leading-[1.25]">Langsung aktif tanpa kartu kredit</h3><p className="text-[15px] max-[640px]:text-sm leading-[1.6] text-[#ffffff]/90 break-words">Cukup daftar akun dan Private Key unik kamu langsung aktif otomatis. Siap digunakan detik itu juga tanpa masa trial yang mengunci fitur.</p></div>
                <div className="min-w-0"><h3 className="font-extrabold text-[20px] max-[640px]:text-[18px] mb-2.5 leading-[1.25]">Atur tampilan sesuai gayamu</h3><p className="text-[15px] max-[640px]:text-sm leading-[1.6] text-[#ffffff]/90 break-words">Semua widget dan overlay dapat dikustomisasi: font, warna solid, tata letak, animasi kemunculan, hingga suara notifikasi event.</p></div>
                <div className="min-w-0"><h3 className="font-extrabold text-[20px] max-[640px]:text-[18px] mb-2.5 leading-[1.25]">Ringan dan terisolasi privat</h3><p className="text-[15px] max-[640px]:text-sm leading-[1.6] text-[#ffffff]/90 break-words">Komunikasi WebSocket private room memastikan performa OBS tetap ringan tanpa lag CPU, dan aman dari campur tangan stream lain.</p></div>
                <div className="min-w-0"><h3 className="font-extrabold text-[20px] max-[640px]:text-[18px] mb-2.5 leading-[1.25]">Bantuan dan panduan lengkap</h3><p className="text-[15px] max-[640px]:text-sm leading-[1.6] text-[#ffffff]/90 break-words">Tersedia panduan setup langkah demi langkah, dokumentasi browser source OBS, serta komunitas dan live chat yang siap membantu.</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* COMMUNITY */}
        <section id="spotlight" className="py-20 border-t border-[#e2e8f0] bg-[#f8fafc]">
          <div className="max-w-[1280px] mx-auto px-8 max-[640px]:px-4">
            <h2 className="font-extrabold text-[clamp(32px,3.8vw,48px)] tracking-[-0.035em] text-[#0a0e1a] mb-2 flex items-center gap-3 flex-wrap"><span>Community</span><span className="bg-[#ff4400] text-[#ffffff] px-[18px] py-0.5 rounded-full inline-block">spotlight</span></h2>
            <p className="text-[15px] text-[#475569] mb-9">Lihat para streamer dan konten kreator yang telah mempercayakan live stream mereka dengan OBS Dock.</p>
            <div className="grid grid-cols-3 max-[1024px]:grid-cols-1 gap-6">
              {CREATORS.map((c, i) => (
                <div key={i} className="bg-white border border-[#e2e8f0] rounded-[20px] overflow-hidden shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:-translate-y-1 transition-transform"><img src={c.img} alt={c.name} className="w-full h-[220px] object-cover block" /><div className="p-5"><h3 className="font-extrabold text-[17px] text-[#0a0e1a] mb-1">{c.name}</h3><p className="text-[13.5px] text-[#64748b]">{c.role}</p></div></div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-[#f8fafc] py-[100px] max-[768px]:py-12">
          <div className="max-w-[1280px] mx-auto px-8 max-[640px]:px-4">
            <div className="grid grid-cols-[340px_1fr] max-[768px]:grid-cols-1 gap-16 max-[768px]:gap-8 items-start">
              <div className="sticky top-[110px] max-[768px]:static"><h2 className="font-extrabold text-[clamp(2rem,4vw,3rem)] text-[#0a0e1a] leading-[1.15] tracking-[-0.03em]">Pertanyaan yang<br />sering diajukan</h2></div>
              <div className="flex flex-col rounded-2xl bg-white border border-[#e2e8f0] overflow-hidden">
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} className="border-b border-[#e2e8f0] last:border-0">
                    <button onClick={() => toggleFaq(i)} aria-expanded={openFaq === i} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-[15px] text-[#0a0e1a] hover:bg-[#f1f5f9] transition-colors"><span>{item.q}</span><ChevronDown size={18} className={`shrink-0 text-[#64748b] transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} /></button>
                    <div className={`grid transition-all duration-300 ${openFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><p className={`overflow-hidden px-6 m-0 text-[#475569] text-sm leading-[1.7] transition-all ${openFaq === i ? 'pb-5' : 'pb-0'}`}>{item.a}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="bg-[#f8fafc] py-[120px] pb-[140px] text-center border-t border-[#e2e8f0]">
          <div className="max-w-[1280px] mx-auto px-8 max-[640px]:px-4 flex flex-col items-center gap-4">
            <h2 className="font-extrabold text-[clamp(2.5rem,6vw,4.5rem)] text-[#0a0e1a] leading-[1.1] tracking-[-0.04em]">Upgrade stream kamu<br />ke level berikutnya</h2>
            <p className="text-[15px] text-[#64748b] max-w-[420px] leading-[1.65]">Kontrol OBS Studio Mode, pasang 14+ widget interaktif, dan berikan pengalaman visual terbaik untuk penontonmu hari ini.</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap justify-center"><Link href={isLoggedIn ? "/dashboard" : "/login"} className="inline-flex items-center gap-2 bg-[#005ea6] hover:bg-[#004a8c] hover:-translate-y-px text-[#ffffff] rounded-full px-7 py-3.5 text-[15px] font-bold transition-all">{isLoggedIn ? "Buka Dashboard" : "Mulai Gratis Sekarang"} <ArrowRight size={16} /></Link><a href="#inside" className="inline-flex items-center gap-2 text-[#0a0e1a] font-semibold text-[15px] px-5 py-3.5 rounded-full hover:bg-[#f1f5f9] transition-colors">Pelajari Fitur</a></div>
            <p className="text-xs text-[#64748b] mt-1">Digunakan oleh 500+ streamer aktif di berbagai platform streaming.</p>
          </div>
        </section>
      </main>

      <footer className="bg-[#0a0e1a] text-[#94a3b8] pt-16">
        <div className="max-w-[1160px] mx-auto px-6 max-[640px]:px-4">
          <div className="pb-10"><div className="flex items-center gap-6 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-3"><span className="font-extrabold text-[22px] text-[#ffffff] tracking-[-0.03em]">OBS Dock</span><span className="text-[13px] font-medium text-[#64748b]">Ikuti Kami</span><div className="flex gap-2.5"><a href="#" aria-label="TikTok" className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1e293b] text-[#cbd5e1] hover:bg-[#005ea6] hover:text-[#ffffff] transition-colors"><Music2 size={16} /></a><a href="#" aria-label="Twitter / X" className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1e293b] text-[#cbd5e1] hover:bg-[#005ea6] hover:text-[#ffffff] transition-colors"><XIcon size={16} /></a><a href="#" aria-label="Instagram" className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1e293b] text-[#cbd5e1] hover:bg-[#005ea6] hover:text-[#ffffff] transition-colors"><Camera size={16} /></a></div></div></div>
          <hr className="border-0 border-t border-[#1e293b] m-0" />
          <div className="grid grid-cols-4 max-[768px]:grid-cols-2 gap-10 py-12">
            <div><h4 className="text-sm font-bold text-[#ffffff] mb-4 tracking-[-0.01em]">OBS Dock</h4><ul className="flex flex-col gap-2.5"><li><Link href="/" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0] transition-colors">Home</Link></li><li><Link href={isLoggedIn ? "/dashboard" : "/login"} className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Dashboard</Link></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Fitur & Tools</a></li><li><a href="#faq" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">FAQ</a></li><li><a href="#spotlight" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Komunitas</a></li></ul></div>
            <div><h4 className="text-sm font-bold text-[#ffffff] mb-4">Fitur Unggulan</h4><ul className="flex flex-col gap-2.5"><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">OBS Dock Control</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">14+ Interactive Widgets</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Real-time Stream Overlays</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Media Player with Synced Lyrics</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Mobile Dock Controller</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Private Key Isolation</a></li></ul></div>
            <div><h4 className="text-sm font-bold text-[#ffffff] mb-4">Widgets & Tools</h4><ul className="flex flex-col gap-2.5"><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Live Chat Widget</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Viewer Poll & Vote</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Sub & Follow Goals</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Stream Countdown Timer</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Social Media Rotator</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Real-time View Counter</a></li></ul></div>
            <div><h4 className="text-sm font-bold text-[#ffffff] mb-4">Platform & Bantuan</h4><ul className="flex flex-col gap-2.5"><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">OBS Studio (v28+)</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Streamlabs Desktop</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Twitch & YouTube Live</a></li><li><a href="#inside" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">TikTok LIVE Studio</a></li><li><a href="#faq" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Panduan Browser Source</a></li><li><a href="#faq" className="text-[13.5px] text-[#64748b] hover:text-[#e2e8f0]">Bantuan & Dokumentasi</a></li></ul></div>
          </div>
          <hr className="border-0 border-t border-[#1e293b] m-0" />
          <div className="flex items-center justify-between gap-6 flex-wrap py-5 pb-7 max-[768px]:flex-col max-[768px]:items-start"><p className="text-xs text-[#475569] leading-[1.6]">© 2026, OBS Dock. All rights reserved.  <a href="#" className="hover:text-[#94a3b8]">Syarat & Ketentuan</a>  <a href="#" className="hover:text-[#94a3b8]">Kebijakan Privasi</a>  <a href="#" className="hover:text-[#94a3b8]">Dokumentasi</a>  <a href="#" className="hover:text-[#94a3b8]">Hubungi Kami</a></p><div className="flex gap-1.5 flex-wrap items-center"><span className="inline-block px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-[10px] font-bold text-[#94a3b8] tracking-[0.02em]">OBS Studio</span><span className="inline-block px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-[10px] font-bold text-[#94a3b8]">Twitch</span><span className="inline-block px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-[10px] font-bold text-[#94a3b8]">YouTube</span><span className="inline-block px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-[10px] font-bold text-[#94a3b8]">TikTok Live</span><span className="inline-block px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-[10px] font-bold text-[#94a3b8]">Streamlabs</span><span className="inline-block px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-[10px] font-bold text-[#94a3b8]">WebSocket</span></div></div>
        </div>
      </footer>
      <button onClick={() => showToast('Customer support chat live siap membantu!')} aria-label="Live Chat Support" title="Need help? Chat with us" className="fixed bottom-7 right-7 w-[54px] h-[54px] rounded-full bg-[#005ea6] hover:bg-[#004a8c] hover:scale-[1.08] text-[#ffffff] flex items-center justify-center shadow-[0_8px_24px_rgba(0,94,166,0.45)] z-[100] transition-all"><MessageCircle size={24} /></button>
      <div className={`fixed bottom-7 left-1/2 -translate-x-1/2 bg-[#0f172a] text-[#ffffff] px-6 py-3 rounded-full text-[13.5px] font-bold shadow-[0_10px_30px_rgba(0,0,0,0.25)] z-[200] pointer-events-none transition-all duration-200 ${toastText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>{toastText}</div>
    </div>
  );
}
