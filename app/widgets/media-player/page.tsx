'use client';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import { createClient } from '@/utils/supabase/client';
import { Copy, Check, ExternalLink, Monitor, Palette, Music, Image as ImageIcon, Sparkles, ArrowLeft, RefreshCw, Settings2, Menu, GripVertical, Eye, EyeOff } from 'lucide-react';
import { WIDGET_FONTS } from '../_shared/constants/fonts';
import { getPositionStyle } from '../_shared/constants/positions';
import { PositionPicker } from '../_shared/components/PositionPicker';

const themes = [
  { value: 'standard', label: 'Standard' },
  { value: 'matte', label: 'Matte (Light)' },
  { value: 'matte-dark', label: 'Matte (Dark)' },
  { value: 'compact', label: 'Compact' },
  { value: 'compact-inverted', label: 'Compact (Inverted)' },
  { value: 'simple', label: 'Simple' },
  { value: 'classic', label: 'Classic' },
  { value: 'card', label: 'Card' },
  { value: 'album-art', label: 'Album Art' },
  { value: 'large-album-art', label: 'Large Album Art' },
  { value: 'vinyl', label: 'Vinyl' },
  { value: 'color-palette', label: 'Color Palette' },
];
const fontsList = [...WIDGET_FONTS];
const showAnimations = ['fade-in','slide-in-from-top','slide-in-from-bottom','slide-in-from-left','slide-in-from-right'];
const hideAnimations = ['fade-out','slide-out-top','slide-out-bottom','slide-out-left','slide-out-right'];

function buildUrl(base: string, state: any): string {
  const p = new URLSearchParams();
  p.set('theme', state.theme);
  if (state.font) p.set('font', state.font);
  p.set('fontSize', String(state.fontSize));
  p.set('maxWidth', String(state.maxWidth));
  p.set('verticalAlignment', state.verticalAlignment);
  p.set('textAlignment', state.textAlignment);
  p.set('useCustomColors', String(state.useCustomColors));
  p.set('color1', state.color1);
  p.set('color2', state.color2);
  p.set('showWhilePaused', String(state.showWhilePaused));
  p.set('autoHide', String(state.autoHide));
  p.set('displayDuration', String(state.displayDuration));
  if (state.includedApplications) p.set('includedApplications', state.includedApplications);
  if (state.excludedApplications) p.set('excludedApplications', state.excludedApplications);
  p.set('showAlbumArt', String(state.showAlbumArt));
  p.set('showProgressBar', String(state.showProgressBar));
  p.set('swapArtistTrack', String(state.swapArtistTrack));
  p.set('showPrimary', String(state.showPrimary));
  p.set('showSecondary', String(state.showSecondary));
  p.set('showAnimation', state.showAnimation);
  p.set('hideAnimation', state.hideAnimation);
  p.set('smtcBridgeAddress', state.smtcBridgeAddress);
  p.set('smtcBridgePort', state.smtcBridgePort);
  p.set('pos', state.pos || 'bl');
  // include obs flag for preview? not needed
  return `${base}?${p.toString()}`;
}

const defaults = {
  theme: 'classic',
  font: 'Outfit',
  fontSize: 20,
  maxWidth: 500,
  verticalAlignment: 'align-to-center',
  textAlignment: 'left',
  useCustomColors: false,
  color1: '#ffffff',
  color2: '#1d1d1d',
  showWhilePaused: true,
  autoHide: false,
  displayDuration: 5,
  includedApplications: '',
  excludedApplications: '',
  showAlbumArt: true,
  showProgressBar: true,
  swapArtistTrack: false,
  showPrimary: true,
  showSecondary: true,
  showAnimation: 'slide-in-from-bottom',
  hideAnimation: 'slide-out-bottom',
  smtcBridgeAddress: '127.0.0.1',
  smtcBridgePort: '5000',
  pos: 'bl',
};

function MediaPlayerSettingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLoadPopup, setShowLoadPopup] = useState(false);
  const [loadUrl, setLoadUrl] = useState('');
  const [state, setState] = useState<any>({...defaults});
  const [showDefaultsConfirm, setShowDefaultsConfirm] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);
  const maskUrl = (url: string) => url.replace(/key=[^&]+/, 'key=••••••••••••••••');
  const toggleShowKey = () => {
    if (!showKey && obsUrl.includes('key=')) { setShowKeyConfirm(true); return; }
    setShowKey(v => !v);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const pk = searchParams.get('key') || sessionStorage.getItem('dock_private_verified') || '';
    if (pk) setPrivateKey(pk);
    // load from URL if present
    const hasParams = searchParams.get('theme');
    if (hasParams) {
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
      const saved = localStorage.getItem('media-player-settings');
      if (saved) try { setState({ ...defaults, ...JSON.parse(saved) }); } catch {}
    }
  }, []);

  useEffect(() => { localStorage.setItem('media-player-settings', JSON.stringify(state)); }, [state]);

  const baseDisplayUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const keyPart = privateKey ? `key=${privateKey}&` : '';
    return `${window.location.origin}/widgets/media-player/display?${keyPart}`;
  }, [privateKey]);

  const widgetUrl = useMemo(() => buildUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/media-player/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  const previewUrl = useMemo(() => buildUrl(state.theme ? `${typeof window !== 'undefined' ? window.location.origin : ''}/widgets/media-player/display` : '', state), [state]);

  // preview src without key for iframe (key not needed for SMTC)
  const iframeSrc = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(state).forEach(([k,v]) => p.set(k, String(v)));
    return `/widgets/media-player/display?${p.toString()}`;
  }, [state]);

  const update = (k: string, v: any) => setState((prev: any) => ({ ...prev, [k]: v }));

  const copyUrl = async () => {
    await navigator.clipboard.writeText(obsUrl);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const loadFromUrl = () => {
    try {
      const url = new URL(loadUrl);
      const p = url.searchParams;
      const s: any = { ...defaults };
      for (const k of Object.keys(defaults)) {
        const v = p.get(k);
        if (v !== null) {
          const def = (defaults as any)[k];
          if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
          else if (typeof def === 'number') s[k] = parseInt(v) || def;
          else s[k] = v;
        }
      }
      setState(s); setShowLoadPopup(false);
    } catch { alert('URL tidak valid'); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="widgets" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        {/* Header */}
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <Link href="/widgets" className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center"><Music className="w-4 h-4 text-black" /></div>
            <div className="min-w-0">
              <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3 text-white" /> Media Player <span className="hidden sm:inline px-2 py-0.5 bg-white text-black rounded-full text-[9px]">SMTC</span></div>
              <div className="hidden sm:block text-gray-500 text-[10px]">Nutty-style Now Playing • SMTC Bridge 127.0.0.1:5000</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load Settings</button>
            <a href={iframeSrc} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </div>
        </header>

        {/* URL bar */}
        <div className="bg-[#161616] border-b border-white/5 px-4 md:px-6 py-3 flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-black tracking-widest uppercase text-gray-500 mb-1 flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Widget URL - Click to copy (paste ke OBS Browser Source)</div>
            <div onClick={copyUrl} className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 cursor-pointer hover:border-white/20 group">
              <code className={`flex-1 text-[11px] font-mono truncate ${showKey ? "text-white" : "text-white blur-[3px] select-none"}`}>{showKey ? obsUrl : maskUrl(obsUrl)}</code>
              <button type="button" onClick={(e) => { e.stopPropagation(); toggleShowKey(); }} className="shrink-0 w-7 h-7 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white" title={showKey ? "Sembunyikan key" : "Tampilkan key (konfirmasi)"}>
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <span className={`shrink-0 w-7 h-7 grid place-items-center rounded-lg ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-black group-hover:bg-zinc-100'}`}>{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href={obsUrl} target="_blank" className="h-9 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black text-[11px] uppercase flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> OBS</a>
            <a
              href={obsUrl}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData('text/plain', obsUrl); e.dataTransfer.setData('text/uri-list', obsUrl); e.dataTransfer.effectAllowed = 'copy'; }}
              title="Tahan & drag langsung ke OBS → Sources (akan buat Browser Source otomatis)"
              className="h-9 px-3 bg-white text-black border border-dashed border-zinc-300 hover:border-white rounded-xl font-black text-[11px] uppercase flex items-center gap-1.5 cursor-grab active:cursor-grabbing select-none"
            >
              <GripVertical className="w-3.5 h-3.5" /> Drag ke OBS
            </a>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Settings Panel */}
          <div className="w-full lg:w-[420px] shrink-0 bg-[#121212] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col max-h-[50vh] lg:max-h-none lg:h-[calc(100vh-112px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {/* Appearance */}
              <div className="space-y-3">
                <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Appearance</h2>
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Theme</span>
                    <select value={state.theme} onChange={e => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                      {themes.map(t => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Font <a href="ms-settings:fonts" className="text-white underline text-[10px] ml-1">Check installed fonts</a></span>
                    <input list="fonts" value={state.font} onChange={e => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
                    <datalist id="fonts">{fontsList.map(f => <option key={f} value={f} />)}</datalist>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Size</span><input type="number" value={state.fontSize} onChange={e => update('fontSize', parseInt(e.target.value)||0)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
                    <label className="block"><span className="text-[11px] font-bold text-gray-300">Max Width <span className="font-normal opacity-60">0=full</span></span><input type="number" value={state.maxWidth} onChange={e => update('maxWidth', parseInt(e.target.value)||0)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <label className="block"><span className="text-[11px] font-bold text-gray-300">Text Align</span><select value={state.textAlignment} onChange={e => update('textAlignment', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white"><option value="left" className="bg-zinc-900">Left</option><option value="center" className="bg-zinc-900">Center</option><option value="right" className="bg-zinc-900">Right</option></select></label>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-2">
                    <PositionPicker value={(state as any).pos || 'bl'} onChange={(v) => update('pos', v)} />
                  </div>
                  <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5">
                    <span className="text-[11px] font-bold text-white">Use Custom Colors</span>
                    <input type="checkbox" checked={state.useCustomColors} onChange={e => update('useCustomColors', e.target.checked)} className="w-4 h-4 accent-white" />
                  </label>
                  {state.useCustomColors && (
                    <div className="grid grid-cols-2 gap-3 animate-in slide-in">
                      <label className="block"><span className="text-[11px] font-bold text-gray-300">Primary</span><input type="color" value={state.color1} onChange={e => update('color1', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                      <label className="block"><span className="text-[11px] font-bold text-gray-300">Secondary</span><input type="color" value={state.color2} onChange={e => update('color2', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                    </div>
                  )}
                </div>
              </div>

              {/* General */}
              <div className="space-y-3">
                <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Settings2 className="w-4 h-4 text-blue-400" /> General</h2>
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <Toggle label="Show While Paused" desc="Visible even when track is paused." checked={state.showWhilePaused} onChange={v => update('showWhilePaused', v)} />
                  <Toggle label="Auto-Hide on Track Change" desc="Show for a set duration whenever a new track starts." checked={state.autoHide} onChange={v => update('autoHide', v)} />
                  {state.autoHide && <label className="block ml-4"><span className="text-[11px] font-bold text-gray-300">Display Duration (seconds)</span><input type="number" min={1} max={60} value={state.displayDuration} onChange={e => update('displayDuration', parseInt(e.target.value)||5)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>}
                  <label className="block"><span className="text-[11px] font-bold text-gray-300">Included Apps <span className="font-normal opacity-60">priority order, empty = focused app</span></span><span className="text-[10px] text-gray-500"> <a href="http://127.0.0.1:5000/sessions" target="_blank" className="text-white underline">View active sources</a></span><input value={state.includedApplications} onChange={e => update('includedApplications', e.target.value)} placeholder="Spotify.exe, vlc.exe" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
                  <label className="block"><span className="text-[11px] font-bold text-gray-300">Excluded Apps</span><input value={state.excludedApplications} onChange={e => update('excludedApplications', e.target.value)} placeholder="Chrome, vlc.exe" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
                  <Toggle label="Show Album Art" checked={state.showAlbumArt} onChange={v => update('showAlbumArt', v)} />
                  <Toggle label="Show Progress Bar" desc="Some apps do not display progress correctly." checked={state.showProgressBar} onChange={v => update('showProgressBar', v)} />
                  <Toggle label="Swap Artist and Track" desc="Artist above Track." checked={state.swapArtistTrack} onChange={v => update('swapArtistTrack', v)} />
                  <Toggle label="Show Primary Text" checked={state.showPrimary} onChange={v => update('showPrimary', v)} />
                  <Toggle label="Show Secondary Text" checked={state.showSecondary} onChange={v => update('showSecondary', v)} />
                  <label className="block"><span className="text-[11px] font-bold text-gray-300">Show Animation</span><select value={state.showAnimation} onChange={e => update('showAnimation', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{showAnimations.map(a => <option key={a} value={a} className="bg-zinc-900">{a}</option>)}</select></label>
                  <label className="block"><span className="text-[11px] font-bold text-gray-300">Hide Animation</span><select value={state.hideAnimation} onChange={e => update('hideAnimation', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{hideAnimations.map(a => <option key={a} value={a} className="bg-zinc-900">{a}</option>)}</select></label>
                </div>
              </div>

              {/* SMTC Bridge */}
              <div className="space-y-3">
                <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> SMTC Bridge</h2>
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <label className="block"><span className="text-[11px] font-bold text-gray-300">Address</span><input value={state.smtcBridgeAddress} onChange={e => update('smtcBridgeAddress', e.target.value)} placeholder="127.0.0.1" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" /></label>
                  <label className="block"><span className="text-[11px] font-bold text-gray-300">Port</span><input value={state.smtcBridgePort} onChange={e => update('smtcBridgePort', e.target.value)} placeholder="5000" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" /></label>
                  <div className="text-[10px] text-gray-500 bg-black/30 rounded-xl p-2 border border-white/5">Download SMTC Bridge: <a href="https://github.com/nuttylmao/smtc-bridge/releases" target="_blank" className="text-white underline">github.com/nuttylmao/smtc-bridge</a> • Test: <a href={`http://${state.smtcBridgeAddress}:${state.smtcBridgePort}/now-playing`} target="_blank" className="text-white underline">/now-playing</a> • <a href={`http://${state.smtcBridgeAddress}:${state.smtcBridgePort}/sessions`} target="_blank" className="text-white underline">/sessions</a></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setState({...defaults})} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
                <button onClick={copyUrl} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5" /> Copy URL</button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 bg-[#0a0a0a] p-4 md:p-6 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><ImageIcon className="w-4 h-4 text-white" /> Live Preview</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.theme} • {state.font} • {state.showAnimation}</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[320px] flex p-4" style={getPositionStyle((state as any).pos || state.verticalAlignment || 'bl') as any}>
              <iframe key={iframeSrc} src={iframeSrc} className="w-full h-full border-0 bg-black" allow="autoplay" />
              <div className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/60 backdrop-blur px-2 py-1 rounded-full text-white/60 border border-white/10 pointer-events-none">SMTC {state.smtcBridgeAddress}:{state.smtcBridgePort} • {state.autoHide ? `${state.displayDuration}s auto-hide` : 'always'} • {(state as any).pos || state.verticalAlignment || 'bl'}</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <a href={obsUrl} target="_blank" className="h-9 bg-white text-black rounded-xl font-black uppercase flex items-center justify-center gap-1.5"><Monitor className="w-3 h-3" /> Buka OBS</a>
              <button onClick={() => window.open(`http://${state.smtcBridgeAddress}:${state.smtcBridgePort}/now-playing`, '_blank')} className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">Test API</button>
              <Link href="/widgets" className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">Widgets</Link>
            </div>
          </div>
        </div>

        {/* Load Settings Popup */}
        {showLoadPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowLoadPopup(false)}>
            <div onClick={e => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[480px] space-y-4">
              <h2 className="text-white font-black">Load Settings</h2>
              <p className="text-xs text-gray-500">Paste in your existing widget URL</p>
              <input value={loadUrl} onChange={e => setLoadUrl(e.target.value)} placeholder="https://widgets.nutty.gg/now-playing/?..." className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
              <div className="flex gap-3">
                <button onClick={() => setShowLoadPopup(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Cancel</button>
                <button onClick={loadFromUrl} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-sm font-black text-black border border-white">Load Settings</button>
              </div>
            </div>
          </div>
        )}
        {showDefaultsConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowDefaultsConfirm(false)}>
            <div onClick={e => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[380px] space-y-4 text-center">
              <h2 className="text-white font-black">Load Defaults?</h2>
              <p className="text-xs text-gray-500">Reset semua setting ke default?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDefaultsConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">No</button>
                <button onClick={() => { setState({...defaults}); setShowDefaultsConfirm(false); }} className="flex-1 h-9 bg-white rounded-xl text-sm font-black text-black border border-white">Yes</button>
              </div>
            </div>
          </div>
        )}
        {showKeyConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowKeyConfirm(false)}>
            <div onClick={e => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[380px] space-y-4 text-center">
              <h2 className="text-white font-black">Tampilkan Private Key?</h2>
              <p className="text-[11px] text-gray-400 leading-relaxed">URL mengandung <span className="text-white font-bold">private key</span> rahasia. Yakin ingin menampilkan?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowKeyConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Batal</button>
                <button onClick={() => { setShowKey(true); setShowKeyConfirm(false); }} className="flex-1 h-9 bg-white text-black border border-white rounded-xl text-sm font-black">Tampilkan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MediaPlayerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <MediaPlayerSettingsInner />
    </Suspense>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 p-2.5 bg-black/30 border border-white/5 rounded-xl cursor-pointer hover:bg-white/5">
      <div className="flex-1 min-w-0">
        <div className="text-white font-bold text-[11px]">{label}</div>
        {desc && <div className="text-gray-500 text-[10px] leading-tight">{desc}</div>}
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-white shrink-0" />
    </label>
  );
}
