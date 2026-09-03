'use client';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import { createClient } from '@/utils/supabase/client';
import { Copy, Check, ExternalLink, Monitor, Palette, Type, Settings2, Menu, Eye, EyeOff, Sparkles, ArrowLeft, RefreshCw, GripVertical, MessageSquare, Image as ImageIcon, Clock } from 'lucide-react';
import StandardTheme from './themes/Standard';
import BubbleTheme from './themes/Bubble';
import CleanTheme from './themes/Clean';
import BoxedTheme from './themes/Boxed';
import CuteTheme from './themes/Cute';
import type { ChatItem } from './themes/types';

const themes = [
  { value: 'standard', label: 'Standard - Dark Glass' },
  { value: 'bubble', label: 'Bubble - Putih WA-style' },
  { value: 'clean', label: 'Clean - Baris Minimalis' },
  { value: 'boxed', label: 'Boxed - Card dengan Header' },
  { value: 'cute', label: 'Cute ' },
];
const fontsList = ['Outfit','Inter','Poppins','Space Grotesk','JetBrains Mono','Manrope','Bebas Neue','Anton','Righteous','Geist','Montserrat','Roboto','Oswald'];
const anims = [
  { value: 'elegant', label: 'Elegant' },
  { value: 'softPop', label: 'Soft Pop — Halus' },
  { value: 'blur', label: 'Blur In — Minimal' },
  { value: 'luxe', label: 'Luxe — Editorial' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'pop', label: 'Pop' },
  { value: 'fade', label: 'Fade' },
  { value: 'flip', label: 'Flip' },
];
const horizontalAnims = [
  { value: 'elegant', label: 'Elegant' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'softPop', label: 'Soft Pop' },
  { value: 'blur', label: 'Blur In' },
  { value: 'luxe', label: 'Luxe' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'pop', label: 'Pop' },
  { value: 'fade', label: 'Fade' },
  { value: 'flip', label: 'Flip' },
];

const defaults = {
  theme: 'standard',
  font: 'Outfit',
  fontSize: 14,
  accent: '#8b5cf6',
  bg: 'transparent',
  bgOpacity: 100,
  maxMessages: 6,
  hideAfter: 0,
  showAvatar: true,
  showPlatform: true,
  showTimestamp: false,
  anim: 'elegant',
  horizontal: false,
  horizontalAnim: 'elegant',
  inline: false,
  cuteBubbleBg: '#1e1d2b',
  cuteResubFrom: '#c4a2f8',
  cuteResubTo: '#fca4d4',
  cuteBadgeBg: '#2e2c45',
  cuteBadgeText: '#a8a3ce',
  cuteNameMod: '#f5a8d0',
  cuteNameUser: '#d8cded',
};

function buildUrl(base: string, s: any) {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('bgOpacity', String(s.bgOpacity));
  p.set('maxMessages', String(s.maxMessages));
  p.set('hideAfter', String(s.hideAfter));
  p.set('showAvatar', s.showAvatar ? '1' : '0');
  p.set('showPlatform', s.showPlatform ? '1' : '0');
  p.set('showTimestamp', s.showTimestamp ? '1' : '0');
  p.set('anim', s.anim);
  p.set('horizontal', s.horizontal ? '1' : '0');
  p.set('horizontalAnim', s.horizontalAnim || 'slideLeft');
  p.set('inline', s.inline ? '1' : '0');
  // cute customizable colors (only when theme cute, but always persist for URL sharing)
  if (s.cuteBubbleBg) p.set('cuteBubbleBg', s.cuteBubbleBg);
  if (s.cuteResubFrom) p.set('cuteResubFrom', s.cuteResubFrom);
  if (s.cuteResubTo) p.set('cuteResubTo', s.cuteResubTo);
  if (s.cuteBadgeBg) p.set('cuteBadgeBg', s.cuteBadgeBg);
  if (s.cuteBadgeText) p.set('cuteBadgeText', s.cuteBadgeText);
  if (s.cuteNameMod) p.set('cuteNameMod', s.cuteNameMod);
  if (s.cuteNameUser) p.set('cuteNameUser', s.cuteNameUser);
  return `${base}?${p.toString()}`;
}

const DEMO_CHATS: ChatItem[] = [
  { id: 'd1', nickname: 'Rizky_JR', comment: 'Gass keun bang, semangat live-nya! 🔥', profilePictureUrl: 'https://ui-avatars.com/api/?name=Rizky&background=8b5cf6&color=fff', platform: 'tiktok', timestamp: Date.now() - 8000 },
  { id: 'd2', nickname: 'SitiPlay', comment: 'Lagi main apa nih? seru banget anjir', profilePictureUrl: 'https://ui-avatars.com/api/?name=Siti&background=FE2C55&color=fff', platform: 'youtube', timestamp: Date.now() - 5000 },
  { id: 'd3', nickname: 'ViewerTwitch', comment: 'Hello dari Twitch! Keren overlay-nya 👍', profilePictureUrl: 'https://ui-avatars.com/api/?name=Twitch&background=9146ff&color=fff', platform: 'twitch', timestamp: Date.now() - 3000 },
  { id: 'd4', nickname: 'BudiSantuy', comment: 'Tiktok live dari HP? kok jernih bener', profilePictureUrl: 'https://ui-avatars.com/api/?name=Budi&background=06b6d4&color=fff', platform: 'tiktok', timestamp: Date.now() - 1500 },
];

function SimulatedChatPreview({ state }: { state: any }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => (v + 1) % DEMO_CHATS.length), 2400);
    return () => clearInterval(t);
  }, []);
  const count = Math.min(state.maxMessages, 4);
  // show rotating slice to simulate live
  const chats = useMemo(() => {
    const all = DEMO_CHATS.slice(0, count);
    // rotate start index
    const start = tick % all.length;
    const rotated = [...all.slice(start), ...all.slice(0, start)].slice(0, count);
    return rotated.map((c, i) => ({ ...c, id: `sim_${i}_${tick}` }));
  }, [count, tick]);

  const animMap: Record<string, string> = { elegant: 'elegantIn', softPop: 'softPopIn', blur: 'blurIn', luxe: 'luxeIn', slideUp: 'slideUp', slideLeft: 'slideLeft', slideRight: 'slideRight', pop: 'popIn', fade: 'fadeIn', flip: 'flipIn' };
  const hAnimMap: Record<string, string> = { elegant: 'elegantIn', softPop: 'softPopIn', blur: 'blurIn', luxe: 'luxeIn', slideUp: 'slideUp', slideLeft: 'slideLeft', slideRight: 'slideRight', pop: 'popIn', fade: 'fadeIn', flip: 'flipIn' };
  const props: any = {
    chats,
    font: state.font,
    accent: state.accent,
    bg: state.bg,
    maxMessages: state.maxMessages,
    showAvatar: state.showAvatar,
    showPlatform: state.showPlatform,
    showTimestamp: state.showTimestamp,
    anim: animMap[state.anim] || 'slideUp',
    horizontalAnim: hAnimMap[state.horizontalAnim] || 'slideLeft',
    hideAfter: state.hideAfter,
    fontSize: state.fontSize,
    bgOpacity: state.bgOpacity,
    horizontal: state.horizontal,
    inline: state.inline,
    cuteBubbleBg: state.cuteBubbleBg,
    cuteResubFrom: state.cuteResubFrom,
    cuteResubTo: state.cuteResubTo,
    cuteBadgeBg: state.cuteBadgeBg,
    cuteBadgeText: state.cuteBadgeText,
    cuteNameMod: state.cuteNameMod,
    cuteNameUser: state.cuteNameUser,
  };
  if (state.theme === 'bubble') return <BubbleTheme {...props} />;
  if (state.theme === 'clean') return <CleanTheme {...props} />;
  if (state.theme === 'boxed') return <BoxedTheme {...props} />;
  if (state.theme === 'cute') return <CuteTheme {...props} />;
  return <StandardTheme {...props} />;
}

function ChatSettingsInner() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [privateKey, setPrivateKey] = useState(searchParams.get('key') || '');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLoadPopup, setShowLoadPopup] = useState(false);
  const [loadUrl, setLoadUrl] = useState('');
  const [state, setState] = useState<any>({ ...defaults });
  const [showDefaultsConfirm, setShowDefaultsConfirm] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);
  const maskUrl = (url: string) => url.replace(/key=[^&]+/, 'key=••••••••••••••••');
  const toggleShowKey = () => { if (!showKey && obsUrl.includes('key=')) { setShowKeyConfirm(true); return; } setShowKey(v => !v); };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const pk = searchParams.get('key') || (typeof window !== 'undefined' ? sessionStorage.getItem('dock_private_verified') || '' : '');
    if (pk) setPrivateKey(pk);
    const has = searchParams.get('theme');
    if (has) {
      const s: any = { ...defaults };
      for (const k of Object.keys(defaults)) {
        const v = searchParams.get(k);
        if (v !== null) {
          const def = (defaults as any)[k];
          if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
          else if (typeof def === 'number') s[k] = parseInt(v) || def;
          else s[k] = v;
        }
      }
      setState(s);
    } else {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('chat-settings') : null;
      if (saved) try { setState({ ...defaults, ...JSON.parse(saved) }); } catch {}
    }
  }, []);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('chat-settings', JSON.stringify(state)); }, [state]);

  const widgetUrl = useMemo(() => buildUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/chat/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  const previewUrl = useMemo(() => buildUrl('/widgets/chat/display', state), [state]);

  const copyUrl = async () => { await navigator.clipboard.writeText(obsUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const loadFromUrl = () => {
    try {
      const url = new URL(loadUrl);
      const p = url.searchParams; const s: any = { ...defaults };
      for (const k of Object.keys(defaults)) {
        const v = p.get(k);
        if (v !== null) { const def = (defaults as any)[k]; if (typeof def === 'boolean') s[k] = v === 'true' || v === '1'; else if (typeof def === 'number') s[k] = parseInt(v) || def; else s[k] = v; }
      }
      setState(s); setShowLoadPopup(false);
      if (p.get('key')) setPrivateKey(p.get('key') || '');
    } catch { alert('URL tidak valid'); }
  };
  const update = (k: string, v: any) => setState((prev: any) => ({ ...prev, [k]: v }));

  return (
    <>
      <style>{`
        /* — Elegant core — blur + soft spring, 0.16,1,0.3,1 */
        @keyframes elegantIn { from { opacity:0; transform: translateY(14px) scale(0.97); filter: blur(8px); } to { opacity:1; transform: translateY(0) scale(1); filter: blur(0); } }
        @keyframes softPopIn { from { opacity:0; transform: scale(0.94) translateY(8px); filter: blur(6px); } to { opacity:1; transform: scale(1) translateY(0); filter: blur(0); } }
        @keyframes blurIn { from { opacity:0; filter: blur(12px); } to { opacity:1; filter: blur(0); } }
        @keyframes luxeIn { from { opacity:0; transform: translateY(18px) scale(0.96); filter: blur(10px); letter-spacing: 0.04em; } to { opacity:1; transform: translateY(0) scale(1); filter: blur(0); letter-spacing: 0; } }
        /* — Standard — upgraded with subtle blur for elegance */
        @keyframes slideUp { from { opacity:0; transform: translateY(16px) scale(0.96); filter: blur(6px); } to { opacity:1; transform: translateY(0) scale(1); filter: blur(0); } }
        @keyframes slideLeft { from { opacity:0; transform: translateX(18px); filter: blur(4px); } to { opacity:1; transform: translateX(0); filter: blur(0); } }
        @keyframes slideRight { from { opacity:0; transform: translateX(-18px); filter: blur(4px); } to { opacity:1; transform: translateX(0); filter: blur(0); } }
        @keyframes popIn { 0%{ opacity:0; transform: scale(0.85) translateY(8px); filter: blur(6px);} 60%{ transform: scale(1.03); filter: blur(0);} 100%{ opacity:1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from{ opacity:0; filter: blur(6px); } to{ opacity:1; filter: blur(0); } }
        @keyframes flipIn { from { opacity:0; transform: perspective(600px) rotateX(-20deg); filter: blur(6px); } to { opacity:1; transform: perspective(600px) rotateX(0); filter: blur(0); } }
      `}</style>
      <div className="min-h-screen bg-[#0a0a0a] flex">
        <Sidebar active="widgets" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <Link href="/widgets" className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-white" /></div>
            <div className="min-w-0">
              <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3 text-white" /> Chat Overlay <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white text-black rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Live</span></div>
              <div className="hidden sm:block text-gray-500 text-[10px]">TikTok + Streamer.bot (Twitch / YouTube / Kick) - via server.ts tiktok-chat</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </div>
        </header>

        <div className="bg-[#161616] border-b border-white/5 px-4 md:px-6 py-3 flex flex-col sm:flex-row gap-2 sm:items-center items-end">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-black tracking-widest uppercase text-gray-500 mb-1 flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Widget URL - paste ke OBS Browser Source (transparent)</div>
            <div onClick={copyUrl} className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 cursor-pointer hover:border-white/20 group">
              <code className={`flex-1 text-[11px] font-mono truncate ${showKey ? 'text-white' : 'text-white blur-[3px] select-none'}`}>{showKey ? obsUrl : obsUrl.replace(/key=[^&]+/, 'key=••••••••••••••••')}</code>
              <button type="button" onClick={(e) => { e.stopPropagation(); toggleShowKey(); }} className="shrink-0 w-7 h-7 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white">{showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
              <span className={`shrink-0 w-7 h-7 grid place-items-center rounded-lg ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-black group-hover:bg-zinc-100'}`}>{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href={obsUrl} target="_blank" className="h-9 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black text-[11px] uppercase flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> OBS</a>
            <a href={obsUrl} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', obsUrl); }} className="h-9 px-3 bg-white text-black border border-dashed border-zinc-300 hover:border-white rounded-xl font-black text-[11px] uppercase flex items-center gap-1.5 cursor-grab active:cursor-grabbing"><GripVertical className="w-3.5 h-3.5" /> Drag ke OBS</a>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          <div className="w-full lg:w-[420px] shrink-0 bg-[#121212] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col max-h-[52vh] lg:max-h-none lg:h-[calc(100vh-112px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {/* Style */}
              <div className="space-y-3">
                <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Tema</span>
                    <select value={state.theme} onChange={e => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                      {themes.map(t => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Font Family</span>
                    <input list="fonts" value={state.font} onChange={e => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
                    <datalist id="fonts">{fontsList.map(f => <option key={f} value={f} />)}</datalist>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Size</span><input type="number" min={10} max={26} value={state.fontSize} onChange={e => update('fontSize', parseInt(e.target.value) || 14)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
                    <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi</span><select value={state.anim} onChange={e => update('anim', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{anims.map(a => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select></label>
                  </div>
                </div>
              </div>

              {/* Warna */}
              {state.theme === 'cute' ? (
                <div className="space-y-3">
                  <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-pink-400" /> Warna — Cute (kustom)</h2>
                  <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                    <div className="text-[10px] text-gray-500 bg-pink-500/10 border border-pink-500/20 rounded-xl p-2">Tema Cute tidak pakai Background container — hanya warna bubble & badge yang bisa dikustom.</div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block"><span className="text-[11px] font-bold text-gray-300">Bubble</span><input type="color" value={state.cuteBubbleBg} onChange={e => update('cuteBubbleBg', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                      <label className="block"><span className="text-[11px] font-bold text-gray-300">Badge BG</span><input type="color" value={state.cuteBadgeBg} onChange={e => update('cuteBadgeBg', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block"><span className="text-[11px] font-bold text-gray-300">Badge Text</span><input type="color" value={state.cuteBadgeText} onChange={e => update('cuteBadgeText', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                      <label className="block"><span className="text-[11px] font-bold text-gray-300">Resub From</span><input type="color" value={state.cuteResubFrom} onChange={e => update('cuteResubFrom', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block"><span className="text-[11px] font-bold text-gray-300">Resub To</span><input type="color" value={state.cuteResubTo} onChange={e => update('cuteResubTo', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                      <label className="block"><span className="text-[11px] font-bold text-gray-300">Name VIP/Mod</span><input type="color" value={state.cuteNameMod} onChange={e => update('cuteNameMod', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                    </div>
                    <label className="block"><span className="text-[11px] font-bold text-gray-300">Name User</span><input type="color" value={state.cuteNameUser} onChange={e => update('cuteNameUser', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                    <div className="text-[10px] text-gray-500">Tip: Resub gradient = From → To. Semua warna langsung pengaruh ke preview & OBS.</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" /> Warna</h2>
                  <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block"><span className="text-[11px] font-bold text-gray-300">Accent</span><input type="color" value={state.accent} onChange={e => update('accent', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                      <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span><div className="mt-1 flex gap-1"><input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={e => update('bg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('bg', 'transparent')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${state.bg === 'transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></div></label>
                    </div>
                    <label className="block">
                      <span className="text-[11px] font-bold text-gray-300">Opacity Background - {state.bgOpacity}%</span>
                      <input type="range" min={10} max={100} value={state.bgOpacity} onChange={e => update('bgOpacity', parseInt(e.target.value))} className="mt-1 w-full accent-white" />
                    </label>
                  </div>
                </div>
              )}

              {/* Chat behavior */}
              <div className="space-y-3">
                <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-400" /> Chat</h2>
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block"><span className="text-[11px] font-bold text-gray-300">Max Messages</span><input type="number" min={1} max={30} value={state.maxMessages} onChange={e => update('maxMessages', parseInt(e.target.value) || 6)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
                    <label className="block"><span className="text-[11px] font-bold text-gray-300">Hide After (detik)</span><input type="number" min={0} max={60} value={state.hideAfter} onChange={e => update('hideAfter', parseInt(e.target.value) || 0)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /><span className="text-[10px] text-gray-500">0 = tidak auto-hide</span></label>
                  </div>
                  <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Avatar</span><input type="checkbox" checked={state.showAvatar} onChange={e => update('showAvatar', e.target.checked)} className="w-4 h-4 accent-white" /></label>
                  <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Platform Logo</span><input type="checkbox" checked={state.showPlatform} onChange={e => update('showPlatform', e.target.checked)} className="w-4 h-4 accent-white" /></label>
                  <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white flex items-center gap-1.5"><Clock className="w-3 h-3" /> Timestamp</span><input type="checkbox" checked={state.showTimestamp} onChange={e => update('showTimestamp', e.target.checked)} className="w-4 h-4 accent-white" /></label>
                  <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
                    <span className="text-[11px] font-bold text-white">Inline chat <span className="text-[9px] font-normal text-gray-400 block">nickname: pesan sebaris</span></span>
                    <input type="checkbox" checked={state.inline} onChange={e => update('inline', e.target.checked)} className="w-4 h-4 accent-white shrink-0" />
                  </label>
                  <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer bg-cyan-500/5">
                    <span className="text-[11px] font-bold text-white">Horizontal layout <span className="text-[9px] font-normal text-gray-400 block">Sampingan (row), cocok untuk bottom bar</span></span>
                    <input type="checkbox" checked={state.horizontal} onChange={e => update('horizontal', e.target.checked)} className="w-4 h-4 accent-white shrink-0" />
                  </label>
                  {state.horizontal && (
                    <label className="block">
                      <span className="text-[11px] font-bold text-gray-300">Animasi Horizontal</span>
                      <select value={state.horizontalAnim} onChange={e => update('horizontalAnim', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                        {horizontalAnims.map(a => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}
                      </select>
                    </label>
                  )}
                </div>
              </div>

              <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-3">
                <div className="text-violet-300 font-black uppercase text-[10px]">Sumber Chat</div>
                <div className="text-gray-400 text-[11px] leading-relaxed mt-1">Semua chat masuk lewat event <code className="bg-white/10 px-1 rounded text-white">tiktok-chat</code> di <code className="bg-white/10 px-1 rounded text-white">server.ts</code> - TikTok Live Connector + Streamer.bot (Twitch/YouTube/Kick) → broadcast ke room <code className="bg-white/10 px-1 rounded text-white">key</code> &amp; <code className="bg-white/10 px-1 rounded text-white">global</code>.</div>
                <Link href={privateKey ? `/dock?key=${privateKey}` : '/dock'} className="mt-2 h-8 flex items-center justify-center gap-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase"><Monitor className="w-3 h-3" /> Buka Dock - Connect TikTok</Link>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setState({ ...defaults })} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
                <button onClick={copyUrl} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5" /> Copy URL</button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#0a0a0a] p-4 md:p-6 flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview - {state.theme} • {state.anim}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • {state.maxMessages} msgs • OBS = data real</span>
            </div>
            <div className={`flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px] p-4 flex ${state.horizontal ? 'items-end justify-center' : 'items-end justify-start'}`}>
              <SimulatedChatPreview state={state} />
              <div className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/60 backdrop-blur px-2 py-1 rounded-full text-white/60 border border-white/10 pointer-events-none">SIMULASI • {state.theme} • {state.font} {state.horizontal ? '• HORIZONTAL' : ''}</div>
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Preview simulasi - data real hanya di OBS (<code className="bg-white/10 px-1 rounded text-white">…/chat/display?obs=1</code>) yang terhubung via socket.</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <a href={obsUrl} target="_blank" className="h-9 bg-white text-black rounded-xl font-black uppercase flex items-center justify-center gap-1.5"><Monitor className="w-3 h-3" /> Buka OBS (real)</a>
              <Link href="/widgets" className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">Widgets</Link>
              <button onClick={() => window.open(previewUrl, '_blank')} className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white"><ExternalLink className="w-3 h-3" /> Popout Style</button>
            </div>
          </div>
        </div>

        {showLoadPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowLoadPopup(false)}>
            <div onClick={e => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[480px] space-y-4">
              <h2 className="text-white font-black">Load Settings</h2>
              <p className="text-xs text-gray-500">Paste widget URL yang sudah ada</p>
              <input value={loadUrl} onChange={e => setLoadUrl(e.target.value)} placeholder="https://.../widgets/chat/display?..." className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
              <div className="flex gap-3">
                <button onClick={() => setShowLoadPopup(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Cancel</button>
                <button onClick={loadFromUrl} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-sm font-black text-black border border-white">Load</button>
              </div>
            </div>
          </div>
        )}
        {showDefaultsConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowDefaultsConfirm(false)}>
            <div onClick={e => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[380px] space-y-4 text-center">
              <h2 className="text-white font-black">Load Defaults?</h2>
              <p className="text-xs text-gray-500">Reset style ke defaults?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDefaultsConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">No</button>
                <button onClick={() => { setState({ ...defaults }); setShowDefaultsConfirm(false); }} className="flex-1 h-9 bg-white rounded-xl text-sm font-black text-black border border-white">Yes</button>
              </div>
            </div>
          </div>
        )}
        {showKeyConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowKeyConfirm(false)}>
            <div onClick={e => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[380px] space-y-4 text-center">
              <h2 className="text-white font-black">Tampilkan Private Key?</h2>
              <p className="text-[11px] text-gray-400 leading-relaxed">URL mengandung <span className="text-white font-bold">private key</span> rahasia.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowKeyConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Batal</button>
                <button onClick={() => { setShowKey(true); setShowKeyConfirm(false); }} className="flex-1 h-9 bg-white text-black border border-white rounded-xl text-sm font-black">Tampilkan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <ChatSettingsInner />
    </Suspense>
  );
}
