'use client';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import { useWidgetPageShell } from '../_shared/hooks/useWidgetPage';
import { WidgetPageModals, toggleShowKey } from '../_shared/components/WidgetPageModals';
import { io, Socket } from 'socket.io-client';
import { Copy, Check, ExternalLink, Monitor, BarChart3, Palette, Type, Settings2, Menu, Eye, EyeOff, Sparkles, ArrowLeft, RefreshCw, GripVertical, Image as ImageIcon } from 'lucide-react';
import { WIDGET_FONTS } from '../_shared/constants/fonts';
import { getSocketUrl } from '../_shared/utils/socket';
import { PositionPicker } from '../_shared/components/PositionPicker';

const fontsList = [...WIDGET_FONTS];
const pollThemes = [
  { value:'bar', label:'Bar Horizontal' },
  { value:'card', label:'Cards' },
  { value:'donut', label:'Donut' },
  { value:'minimal', label:'Minimal' },
  { value:'anime', label:'Anime' },
  { value:'flower', label:'Flower Timer' },
  { value:'editorial', label:'Editorial' },
  { value:'plain', label:'Plain - Teks Polos' },
];

const defaults = {
  pos: 'center',
  theme: 'bar',
  font: 'Outfit',
  accent: '#8b5cf6',
  bg: 'transparent',
  showPercent: true,
  showCount: true,
  showTotal: true,
  showTimer: true,
};

function buildUrl(base:string, s:any){
  const p=new URLSearchParams();
  p.set('pos', s.pos || 'center');
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('accent', s.accent);
  if(s.bg && s.bg!=='transparent') p.set('bg', s.bg);
  p.set('showPercent', s.showPercent?'1':'0');
  p.set('showCount', s.showCount?'1':'0');
  p.set('showTotal', s.showTotal?'1':'0');
  p.set('showTimer', s.showTimer?'1':'0');
  return `${base}?${p.toString()}`;
}

function PollSettingsInner(){
  const searchParams=useSearchParams();
  const [privateKey,setPrivateKey]=useState(searchParams.get('key')||'');
  const [state,setState]=useState<any>({...defaults});
  const [activePoll,setActivePoll]=useState<any>(null);
  const [connected,setConnected]=useState(false);
  const loadFromUrl=(urlStr:string)=>{
    const url=new URL(urlStr);
    const p=url.searchParams; const s:any={...defaults};
    for(const k of Object.keys(defaults)){
      const v=p.get(k);
      if(v!==null){ const def=(defaults as any)[k]; if(typeof def==='boolean') s[k]=v==='true'||v==='1'; else s[k]=v; }
    }
    setState(s);
    if(p.get('key')) setPrivateKey(p.get('key')||'');
  };
  const shell = useWidgetPageShell(loadFromUrl);
  const reset = () => setState({...defaults});

  useEffect(()=>{ const pk=searchParams.get('key')|| (typeof window!=='undefined'? sessionStorage.getItem('dock_private_verified')||'':''); if(pk) setPrivateKey(pk);
    const has = searchParams.get('theme')||searchParams.get('font')||searchParams.get('accent');
    if(has){
      const s:any={...defaults};
      for(const k of Object.keys(defaults)){
        const v=searchParams.get(k);
        if(v!==null){ const def=(defaults as any)[k]; if(typeof def==='boolean') s[k]=v==='true'||v==='1'; else s[k]=v; }
      }
      setState(s);
    } else {
      const saved= typeof window!=='undefined'? localStorage.getItem('poll-settings'):null;
      if(saved) try{ setState({...defaults, ...JSON.parse(saved)});}catch{}
    }
  },[]);
  useEffect(()=>{ if(typeof window!=='undefined') localStorage.setItem('poll-settings', JSON.stringify(state)); },[state]);

  // socket for live poll preview (read-only)
  useEffect(()=>{
    const s=io(getSocketUrl(),{transports:['websocket','polling']});
    const room=privateKey||'global';
    s.on('connect',()=>{ setConnected(true); s.emit('join-room', room); s.emit('poll-get',{privateKey:room}); });
    s.on('disconnect',()=>setConnected(false));
    s.on('poll-update',(p:any)=> setActivePoll(p));
    s.on('poll-clear',()=> setActivePoll(null));
    return ()=>{ s.disconnect(); };
  },[privateKey]);

  const widgetUrl = useMemo(()=> buildUrl(typeof window!=='undefined'? `${window.location.origin}/widgets/poll/display`:'', state) + (privateKey? `&key=${privateKey}`:''),[state,privateKey]);
  const obsUrl = useMemo(()=> `${widgetUrl}${widgetUrl.includes('?')?'&':'?'}obs=1`,[widgetUrl]);
  const previewUrl = useMemo(()=> buildUrl('/widgets/poll/display', state),[state]);
  const simulateUrl = useMemo(()=> `${previewUrl}${previewUrl.includes('?')?'&':'?'}simulate=1`,[previewUrl]);

  const handleCopy = () => shell.copy(obsUrl);
  const update=(k:string,v:any)=> setState((prev:any)=>({...prev,[k]:v}));

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="widgets" open={shell.sidebarOpen} onClose={()=>shell.setSidebarOpen(false)} user={shell.user} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={()=>shell.setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <Link href="/widgets" className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center"><BarChart3 className="w-4 h-4 text-black" /></div>
            <div className="min-w-0">
              <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3 text-white" /> Poll <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white text-black rounded-full"><span className={`w-2 h-2 rounded-full ${connected?'bg-green-500 animate-pulse':'bg-red-500'}`} />{connected?'Live':'Offline'}</span></div>
              <div className="hidden sm:block text-gray-500 text-[10px]">Style polling - buat poll-nya di Dock</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={()=>shell.setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={()=>shell.setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </div>
        </header>

        <div className="bg-[#161616] border-b border-white/5 px-4 md:px-6 py-3 flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-black tracking-widest uppercase text-gray-500 mb-1 flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Widget URL - paste ke OBS Browser Source (transparent)</div>
            <div onClick={handleCopy} className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 cursor-pointer hover:border-white/20 group">
              <code className={`flex-1 text-[11px] font-mono truncate ${shell.showKey?'text-white':'text-white blur-[3px] select-none'}`}>{shell.showKey? obsUrl: obsUrl.replace(/key=[^&]+/, 'key=••••••••••••••••')}</code>
              <button type="button" onClick={(e)=>{e.stopPropagation(); toggleShowKey(shell, obsUrl);}} className="shrink-0 w-7 h-7 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white">{shell.showKey? <EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button>
              <span className={`shrink-0 w-7 h-7 grid place-items-center rounded-lg ${shell.copied?'bg-emerald-500 text-white':'bg-white text-black group-hover:bg-zinc-100'}`}>{shell.copied? <Check className="w-3.5 h-3.5"/>:<Copy className="w-3.5 h-3.5"/>}</span>
            </div>
          </div>
          <div className="flex self-end gap-2 shrink-0">
            <a href={obsUrl} target="_blank" className="h-9 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black text-[11px] uppercase flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5"/> OBS</a>
            <a href={obsUrl} draggable onDragStart={(e)=>{e.dataTransfer.setData('text/plain', obsUrl); e.dataTransfer.setData('text/uri-list', obsUrl); e.dataTransfer.effectAllowed='copy';}} className="h-9 px-3 bg-white text-black border border-dashed border-zinc-300 hover:border-white rounded-xl font-black text-[11px] uppercase flex items-center gap-1.5 cursor-grab active:cursor-grabbing"><GripVertical className="w-3.5 h-3.5"/> Drag ke OBS</a>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          <div className="w-full lg:w-[420px] shrink-0 bg-[#121212] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col max-h-[52vh] lg:max-h-none lg:h-[calc(100vh-112px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {/* Style */}
              <div className="space-y-3">
                <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Style</h2>
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Tema</span>
                    <select value={state.theme} onChange={e=>update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                      {pollThemes.map(t=> <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
                    </select>
                    <span className="text-[10px] text-gray-500 mt-1 block">Pilih layout poll di OBS - bisa ganti kapan saja tanpa buat ulang poll.</span>
                  </label>
                </div>
              </div>

              {/* Posisi - Global */}
              <div className="space-y-3">
                <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <PositionPicker value={state.pos || 'center'} onChange={(v)=>update('pos', v)} />
                </div>
              </div>

              {/* Warna */}
              <div className="space-y-3">
                <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" /> Warna</h2>
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block"><span className="text-[11px] font-bold text-gray-300">Accent</span><input type="color" value={state.accent} onChange={e=>update('accent', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                    <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span><div className="mt-1 flex gap-1"><input type="color" value={state.bg==='transparent'?'#000000':state.bg} onChange={e=>update('bg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={()=>update('bg','transparent')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${state.bg==='transparent'?'bg-white text-black border-white':'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></div></label>
                  </div>
                  <div className="text-[10px] text-gray-500 bg-black/30 rounded-xl p-2 border border-white/5">Warna batang poll otomatis gradasi dari accent. Background transparent cocok untuk OBS.</div>
                </div>
              </div>

              {/* Font */}
              <div className="space-y-3">
                <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Type className="w-4 h-4 text-cyan-400" /> Font</h2>
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Font Family</span>
                    <input list="fonts" value={state.font} onChange={e=>update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
                    <datalist id="fonts">{fontsList.map(f=> <option key={f} value={f}/>)}</datalist>
                  </label>
                </div>
              </div>

              {/* Tampilan */}
              <div className="space-y-3">
                <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><ImageIcon className="w-4 h-4 text-white" /> Tampilan</h2>
                <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">% Persentase</span><input type="checkbox" checked={state.showPercent} onChange={e=>update('showPercent', e.target.checked)} className="w-4 h-4 accent-white" /></label>
                  <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Jumlah vote</span><input type="checkbox" checked={state.showCount} onChange={e=>update('showCount', e.target.checked)} className="w-4 h-4 accent-white" /></label>
                  <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Total voters</span><input type="checkbox" checked={state.showTotal} onChange={e=>update('showTotal', e.target.checked)} className="w-4 h-4 accent-white" /></label>
                  <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Timer</span><input type="checkbox" checked={state.showTimer} onChange={e=>update('showTimer', e.target.checked)} className="w-4 h-4 accent-white" /></label>
                </div>
              </div>

              <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-3">
                <div className="text-violet-300 font-black uppercase text-[10px]">Buat Poll di Dock</div>
                <div className="text-gray-400 text-[11px] leading-relaxed mt-1">Poll dibuat via <code className="bg-white/10 px-1 rounded text-white">/dock</code> → tombol Poll. Widget ini hanya mengatur <b className="text-white">warna/font/style</b>. Hasil vote (progress %) otomatis sinkron via socket.</div>
                <Link href={privateKey? `/dock?key=${privateKey}`:'/dock'} className="mt-2 h-8 flex items-center justify-center gap-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase"><BarChart3 className="w-3 h-3" /> Buka Dock</Link>
                {activePoll && <div className="mt-2 p-2 bg-black/30 border border-white/10 rounded-xl"><div className="text-white font-bold text-[11px] truncate">{activePoll.question}</div><div className="text-gray-500 text-[10px]">{activePoll.total} votes • {activePoll.options.join(' • ')}</div></div>}
              </div>

              <div className="flex gap-2">
                <button onClick={()=>setState({...defaults})} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
                <button onClick={handleCopy} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5"/> Copy URL</button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#0a0a0a] p-4 md:p-6 flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white"/> Preview Simulasi - {state.theme} • pos:{state.pos || 'center'}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • simulasi • OBS = data real</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px]">
              <iframe key={simulateUrl} src={simulateUrl} className="absolute inset-0 w-full h-full border-0 bg-transparent" title="poll-preview" />
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Preview di sini dummy - data real hanya di OBS (<code className="bg-white/10 px-1 rounded text-white">.../poll/display?obs=1</code>) yang terhubung ke Dock + chat.</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <a href={obsUrl} target="_blank" className="h-9 bg-white text-black rounded-xl font-black uppercase flex items-center justify-center gap-1.5"><Monitor className="w-3 h-3"/> Buka OBS (real)</a>
              <Link href="/widgets" className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">Widgets</Link>
              <button onClick={()=>window.open(previewUrl,'_blank')} className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white"><ExternalLink className="w-3 h-3"/> Popout Style</button>
            </div>
          </div>
        </div>

        <WidgetPageModals shell={shell} onReset={reset} />
      </div>
    </div>
  );
}

export default function PollPage(){
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <PollSettingsInner />
    </Suspense>
  );
}
