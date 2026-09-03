'use client';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import { createClient } from '@/utils/supabase/client';
import { Copy, Check, ExternalLink, Monitor, Clock3, Palette, Type, Settings2, Menu, Eye, EyeOff, Image as ImageIcon, Sparkles, ArrowLeft, RefreshCw, GripVertical } from 'lucide-react';

const fontsList = ['Outfit','Inter','Poppins','Space Grotesk','JetBrains Mono','Manrope','Bebas Neue','Anton','Righteous','Orbitron','Geist','Oswald','Montserrat','Roboto','Playfair Display','IBM Plex Mono'];

const timePresets = [
  { label: '06:40:06 PM (hh:mm:ss A)', value: 'hh:mm:ss A' },
  { label: '18:40:06 (HH:mm:ss)', value: 'HH:mm:ss' },
  { label: '06:40 PM (hh:mm A)', value: 'hh:mm A' },
  { label: '18:40 (HH:mm)', value: 'HH:mm' },
  { label: '06:40:06.000 PM', value: 'hh:mm:ss A' },
];

const datePresets = [
  { label: 'Thu 3 Sep 26 (ddd D MMM YY)', value: 'ddd D MMM YY' },
  { label: 'Thursday, 3 September 2026', value: 'dddd, D MMMM YYYY' },
  { label: '03/09/2026 (DD/MM/YYYY)', value: 'DD/MM/YYYY' },
  { label: '2026-09-03 (YYYY-MM-DD)', value: 'YYYY-MM-DD' },
  { label: 'Sep 3, 2026 (MMM D, YYYY)', value: 'MMM D, YYYY' },
  { label: 'Thu, 3 Sep (ddd, D MMM)', value: 'ddd, D MMM' },
];

const defaults = {
  font: 'Outfit',
  tz: 'Asia/Jakarta',
  l1: 'hh:mm:ss A',
  s1: 50, w1: '800', c1: '#ffffff', o1: 1, t1: 'uppercase', a1: 'center', v1: true,
  l2: 'ddd D MMM YY',
  s2: 40, w2: '400', c2: '#ffffff', o2: 0.9, t2: 'uppercase', a2: 'center', v2: true,
  l3: '',
  s3: 30, w3: '600', c3: '#ffffff', o3: 1, t3: 'none', a3: 'center', v3: false,
  gap: 2,
  bg: 'transparent',
};

function buildUrl(base: string, s: any, privateKey: string) {
  const p = new URLSearchParams();
  p.set('font', s.font);
  p.set('tz', s.tz);
  p.set('l1', s.l1); p.set('s1', String(s.s1)); p.set('w1', s.w1); p.set('c1', s.c1); p.set('o1', String(s.o1)); p.set('t1', s.t1); p.set('a1', s.a1); p.set('v1', s.v1 ? '1' : '0');
  p.set('l2', s.l2); p.set('s2', String(s.s2)); p.set('w2', s.w2); p.set('c2', s.c2); p.set('o2', String(s.o2)); p.set('t2', s.t2); p.set('a2', s.a2); p.set('v2', s.v2 ? '1' : '0');
  p.set('l3', s.l3); p.set('s3', String(s.s3)); p.set('w3', s.w3); p.set('c3', s.c3); p.set('o3', String(s.o3)); p.set('t3', s.t3); p.set('a3', s.a3); p.set('v3', s.v3 ? '1' : '0');
  p.set('gap', String(s.gap));
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  if (privateKey) p.set('key', privateKey);
  return `${base}?${p.toString()}`;
}

function ClockEditorInner() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [privateKey, setPrivateKey] = useState(searchParams.get('key') || '');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLoadPopup, setShowLoadPopup] = useState(false);
  const [loadUrl, setLoadUrl] = useState('');
  const [showDefaultsConfirm, setShowDefaultsConfirm] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);
  const [state, setState] = useState<any>({ ...defaults });
  const [tzSearch, setTzSearch] = useState('');
  const maskUrl = (url: string) => url.replace(/key=[^&]+/, 'key=••••••••••••••••');
  const toggleShowKey = () => { if (!showKey && obsUrl.includes('key=')) { setShowKeyConfirm(true); return; } setShowKey(v=>!v); };

  const timezones: string[] = useMemo(() => {
    try { return (Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf('timeZone') : ['Asia/Jakarta','Asia/Makassar','Asia/Jayapura','UTC','Asia/Tokyo','America/New_York','Europe/London']; } catch { return ['Asia/Jakarta','UTC']; }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const pk = searchParams.get('key') || (typeof window !== 'undefined' ? sessionStorage.getItem('dock_private_verified') || '' : '');
    if (pk) setPrivateKey(pk);
    // load from URL if any clock param present
    const has = searchParams.get('l1') || searchParams.get('tz') || searchParams.get('s1');
    if (has) {
      const s: any = { ...defaults };
      for (const k of Object.keys(defaults)) {
        const v = searchParams.get(k);
        if (v !== null) {
          const def = (defaults as any)[k];
          if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
          else if (typeof def === 'number') s[k] = parseFloat(v) || def;
          else s[k] = v;
        }
      }
      setState(s);
    } else {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('clock-settings') : null;
      if (saved) try { setState({ ...defaults, ...JSON.parse(saved) }); } catch {}
    }
  }, []);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('clock-settings', JSON.stringify(state)); }, [state]);

  const widgetUrl = useMemo(() => buildUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/clock/display` : '', state, privateKey), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}${widgetUrl.includes('?') ? '&' : '?'}obs=1`, [widgetUrl]);
  const previewUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set('font', state.font); p.set('tz', state.tz);
    p.set('l1', state.l1); p.set('s1', String(state.s1)); p.set('w1', state.w1); p.set('c1', state.c1); p.set('o1', String(state.o1)); p.set('t1', state.t1); p.set('a1', state.a1); p.set('v1', state.v1 ? '1':'0');
    p.set('l2', state.l2); p.set('s2', String(state.s2)); p.set('w2', state.w2); p.set('c2', state.c2); p.set('o2', String(state.o2)); p.set('t2', state.t2); p.set('a2', state.a2); p.set('v2', state.v2 ? '1':'0');
    p.set('l3', state.l3); p.set('s3', String(state.s3)); p.set('w3', state.w3); p.set('c3', state.c3); p.set('o3', String(state.o3)); p.set('t3', state.t3); p.set('a3', state.a3); p.set('v3', state.v3 ? '1':'0');
    p.set('gap', String(state.gap));
    if (state.bg !== 'transparent') p.set('bg', state.bg);
    return `/widgets/clock/display?${p.toString()}`;
  }, [state]);

  const update = (k: string, v: any) => setState((prev: any) => ({ ...prev, [k]: v }));

  const copyUrl = async () => { await navigator.clipboard.writeText(obsUrl); setCopied(true); setTimeout(()=>setCopied(false),1500); };
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
          else if (typeof def === 'number') s[k] = parseFloat(v) || def;
          else s[k] = v;
        }
      }
      setState(s); setShowLoadPopup(false);
    } catch { alert('URL tidak valid'); }
  };

  const filteredTz = timezones.filter(tz => !tzSearch || tz.toLowerCase().includes(tzSearch.toLowerCase())).slice(0, 80);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="widgets" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <Link href="/widgets" className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center"><Clock3 className="w-4 h-4 text-black" /></div>
            <div className="min-w-0">
              <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3 text-white" /> Clock</div>
              <div className="hidden sm:block text-gray-500 text-[10px]"></div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </div>
        </header>

        <div className="bg-[#161616] border-b border-white/5 px-4 md:px-6 py-3 flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-black tracking-widest uppercase text-gray-500 mb-1 flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Widget URL - paste ke OBS Browser Source (transparent)</div>
            <div onClick={copyUrl} className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 cursor-pointer hover:border-white/20 group">
              <code className={`flex-1 text-[11px] font-mono truncate ${showKey ? 'text-white' : 'text-white blur-[3px] select-none'}`}>{showKey ? obsUrl : maskUrl(obsUrl)}</code>
              <button type="button" onClick={(e)=>{e.stopPropagation(); toggleShowKey();}} className="shrink-0 w-7 h-7 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white">{showKey ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}</button>
              <span className={`shrink-0 w-7 h-7 grid place-items-center rounded-lg ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-black group-hover:bg-zinc-100'}`}>{copied ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}</span>
            </div>
          </div>
          <div className="flex self-end gap-2 shrink-0">
            <button onClick={copyUrl} className="h-9 px-4 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center gap-2 border border-white"><Copy className="w-3.5 h-3.5"/> {copied ? 'Copied!' : 'Copy URL'}</button>
            <a href={obsUrl} target="_blank" className="h-9 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black text-[11px] uppercase flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5"/> OBS</a>
            <a href={obsUrl} draggable onDragStart={(e)=>{e.dataTransfer.setData('text/plain', obsUrl); e.dataTransfer.setData('text/uri-list', obsUrl); e.dataTransfer.effectAllowed='copy';}} className="h-9 px-3 bg-white text-black border border-dashed border-zinc-300 hover:border-white rounded-xl font-black text-[11px] uppercase flex items-center gap-1.5 cursor-grab active:cursor-grabbing"><GripVertical className="w-3.5 h-3.5"/> Drag ke OBS</a>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          <div className="w-full lg:w-[420px] shrink-0 bg-[#121212] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col max-h-[50vh] lg:max-h-none lg:h-[calc(100vh-112px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {/* Global */}
              <div className="space-y-3">
                <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white"/> Global</h2>
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Font Family</span>
                    <input list="fonts" value={state.font} onChange={e=>update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
                    <datalist id="fonts">{fontsList.map(f=> <option key={f} value={f}/>)}</datalist>
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Timezone</span>
                    <input list="tzs" value={state.tz} onChange={e=>update('tz', e.target.value)} onFocus={()=>setTzSearch('')} placeholder="Asia/Jakarta" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
                    <datalist id="tzs">{filteredTz.map(tz=> <option key={tz} value={tz}/>)}</datalist>
                    <span className="text-[10px] text-gray-500 mt-1 block">Ketik untuk cari • {timezones.length} zona • contoh: Asia/Jakarta, UTC, America/New_York</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block"><span className="text-[11px] font-bold text-gray-300">Gap antar baris</span><input type="number" value={state.gap} onChange={e=>update('gap', parseInt(e.target.value)||0)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
                    <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span><div className="mt-1 flex gap-2"><input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={e=>update('bg', e.target.value)} className="w-9 h-9 bg-black/40 border border-white/10 rounded-xl p-1" /><button onClick={()=>update('bg','transparent')} className={`flex-1 h-9 rounded-xl text-[11px] font-black uppercase border ${state.bg==='transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></div></label>
                  </div>
                  {/* <label className="block"><span className="text-[11px] font-bold text-gray-300">Private Key (optional, untuk isolasi OBS)</span><input value={privateKey} onChange={e=>setPrivateKey(e.target.value)} placeholder="YOUR_PRIVATE_KEY" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" /></label> */}
                </div>
              </div>

              {/* Line 1 */}
              <LineEditor title="Line 1 - Jam Utama" icon={<Clock3 className="w-3.5 h-3.5 text-white"/>} presets={timePresets} value={state.l1} onFormat={(v:string)=>update('l1',v)} state={state} prefix="1" update={update} />
              {/* Line 2 */}
              <LineEditor title="Line 2 - Tanggal" icon={<Type className="w-3.5 h-3.5 text-cyan-400"/>} presets={datePresets} value={state.l2} onFormat={(v:string)=>update('l2',v)} state={state} prefix="2" update={update} />
              {/* Line 3 */}
              <LineEditor title="Line 3 - Extra (opsional)" icon={<Sparkles className="w-3.5 h-3.5 text-amber-400"/>} presets={[...timePresets, ...datePresets, {label:'Custom: [Live] • dddd', value:'[Live] • dddd'}]} value={state.l3} onFormat={(v:string)=>update('l3',v)} state={state} prefix="3" update={update} />

              <div className="flex gap-2">
                <button onClick={()=>setState({...defaults})} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
                <button onClick={copyUrl} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5"/> Copy OBS URL</button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
                <div className="text-white font-black uppercase text-[10px] flex items-center gap-2"><ImageIcon className="w-3 h-3"/> Token format</div>
                <code className="block text-[10px] font-mono leading-relaxed text-gray-300 bg-black/30 border border-white/5 rounded-xl p-2">
                  YYYY YY • MMMM MMM MM M • DD D Do • dddd ddd • HH H hh h • mm ss • A a • [escape]<br/>
                  <span className="text-gray-500">Contoh: </span>hh:mm:ss A → 06:40:06 PM<br/>
                  <span className="text-gray-500">Contoh: </span>ddd D MMM YY → Thu 3 Sep 26<br/>
                  <span className="text-gray-500">Contoh: </span>dddd, D MMMM YYYY [WIB] → Thursday, 3 September 2026 WIB
                </code>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#0a0a0a] p-4 md:p-6 flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white"/> Live Preview - {state.tz}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • gap {state.gap}px</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[320px] grid place-items-center">
              <iframe key={previewUrl} src={previewUrl} className="w-full h-full border-0 bg-transparent" />
              <div className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/60 backdrop-blur px-2 py-1 rounded-full text-white/60 border border-white/10 pointer-events-none">CLOCK • {state.tz} • {state.font}</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <a href={obsUrl} target="_blank" className="h-9 bg-white text-black rounded-xl font-black uppercase flex items-center justify-center gap-1.5"><Monitor className="w-3 h-3"/> Buka OBS</a>
              <Link href="/widgets" className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">Widgets</Link>
              <button onClick={()=>window.open(previewUrl,'_blank')} className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white"><ExternalLink className="w-3 h-3"/> Popout</button>
            </div>
          </div>
        </div>

        {showLoadPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={()=>setShowLoadPopup(false)}>
            <div onClick={e=>e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[480px] space-y-4">
              <h2 className="text-white font-black">Load Settings</h2>
              <p className="text-xs text-gray-500">Paste widget URL yang sudah ada</p>
              <input value={loadUrl} onChange={e=>setLoadUrl(e.target.value)} placeholder="https://.../widgets/clock/display?..." className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
              <div className="flex gap-3">
                <button onClick={()=>setShowLoadPopup(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Cancel</button>
                <button onClick={loadFromUrl} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-sm font-black text-black border border-white">Load</button>
              </div>
            </div>
          </div>
        )}
        {showDefaultsConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={()=>setShowDefaultsConfirm(false)}>
            <div onClick={e=>e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[380px] space-y-4 text-center">
              <h2 className="text-white font-black">Load Defaults?</h2>
              <p className="text-xs text-gray-500">Reset semua setting ke defaults?</p>
              <div className="flex gap-3">
                <button onClick={()=>setShowDefaultsConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">No</button>
                <button onClick={()=>{setState({...defaults}); setShowDefaultsConfirm(false);}} className="flex-1 h-9 bg-white rounded-xl text-sm font-black text-black border border-white">Yes</button>
              </div>
            </div>
          </div>
        )}
        {showKeyConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={()=>setShowKeyConfirm(false)}>
            <div onClick={e=>e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[380px] space-y-4 text-center">
              <h2 className="text-white font-black">Tampilkan Private Key?</h2>
              <p className="text-[11px] text-gray-400 leading-relaxed">URL mengandung <span className="text-white font-bold">private key</span> rahasia.</p>
              <div className="flex gap-3">
                <button onClick={()=>setShowKeyConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Batal</button>
                <button onClick={()=>{setShowKey(true); setShowKeyConfirm(false);}} className="flex-1 h-9 bg-white text-black border border-white rounded-xl text-sm font-black">Tampilkan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LineEditor({ title, icon, presets, value, onFormat, state, prefix, update }: any) {
  const s = (k: string) => state[`${k}${prefix}`];
  const set = (k: string, v: any) => update(`${k}${prefix}`, v);
  return (
    <div className="space-y-3">
      <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2">{icon} {title}</h2>
      <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
        <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5">
          <span className="text-[11px] font-bold text-white">Tampilkan</span>
          <input type="checkbox" checked={s('v')} onChange={e=>set('v', e.target.checked)} className="w-4 h-4 accent-white" />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold text-gray-300">Format</span>
          <input value={value} onChange={e=>onFormat(e.target.value)} placeholder="hh:mm:ss A" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
          <select value="" onChange={e=>{ if(e.target.value) onFormat(e.target.value); e.target.value=''; }} className="mt-1 w-full h-8 bg-black/30 border border-white/10 rounded-xl px-2 text-[11px] text-gray-300">
            <option value="" className="bg-zinc-900">- Preset cepat -</option>
            {presets.map((p:any)=> <option key={p.value+p.label} value={p.value} className="bg-zinc-900">{p.label}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Size</span><input type="number" value={s('s')} onChange={e=>set('s', parseInt(e.target.value)||0)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Weight</span><select value={s('w')} onChange={e=>set('w', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white"><option value="300" className="bg-zinc-900">300 Light</option><option value="400" className="bg-zinc-900">400 Regular</option><option value="600" className="bg-zinc-900">600 Semibold</option><option value="700" className="bg-zinc-900">700 Bold</option><option value="800" className="bg-zinc-900">800 Extrabold</option><option value="900" className="bg-zinc-900">900 Black</option></select></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Color</span><input type="color" value={s('c')} onChange={e=>set('c', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Opacity {s('o')}</span><input type="range" min={0} max={1} step={0.1} value={s('o')} onChange={e=>set('o', parseFloat(e.target.value))} className="mt-1 w-full accent-white" /></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Transform</span><select value={s('t')} onChange={e=>set('t', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white"><option value="none" className="bg-zinc-900">None</option><option value="uppercase" className="bg-zinc-900">UPPERCASE</option><option value="lowercase" className="bg-zinc-900">lowercase</option><option value="capitalize" className="bg-zinc-900">Capitalize</option></select></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Align</span><select value={s('a')} onChange={e=>set('a', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white"><option value="left" className="bg-zinc-900">Left</option><option value="center" className="bg-zinc-900">Center</option><option value="right" className="bg-zinc-900">Right</option></select></label>
        </div>
      </div>
    </div>
  );
}

export default function ClockPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <ClockEditorInner />
    </Suspense>
  );
}
