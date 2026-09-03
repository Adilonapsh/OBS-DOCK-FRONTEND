'use client';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import { createClient } from '@/utils/supabase/client';
import { io, Socket } from 'socket.io-client';
import { Copy, Check, ExternalLink, Monitor, BarChart3, Palette, Type, Settings2, Menu, Eye, EyeOff, Sparkles, ArrowLeft, RefreshCw, GripVertical, Image as ImageIcon } from 'lucide-react';
import BarTheme from './themes/Bar';
import CardTheme from './themes/Card';
import DonutTheme from './themes/Donut';
import MinimalTheme from './themes/Minimal';
import AnimeTheme from './themes/Anime';
import FlowerTheme from './themes/Flower';
import VoteTheme from './themes/Vote';

function getSocketUrl(){ if(typeof window==='undefined') return 'http://localhost:3000'; const h=window.location.hostname; if(h==='localhost'||h==='127.0.0.1') return 'http://localhost:3000'; return window.location.origin; }

const fontsList = ['Outfit','Fredoka','Nunito','Inter','Poppins','Space Grotesk','JetBrains Mono','Manrope','Bebas Neue','Anton','Geist','Montserrat','Roboto','Oswald','Space Mono'];
const pollThemes = [
  { value:'bar', label:'Bar Horizontal' },
  { value:'card', label:'Cards' },
  { value:'donut', label:'Donut' },
  { value:'minimal', label:'Minimal' },
  { value:'anime', label:'Anime' },
  { value:'flower', label:'Flower Timer' },
];

const defaults = {
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

function SimulatedPollPreview({ state }: { state: any }){
  const [tick,setTick]=useState(0);
  useEffect(()=>{ const t=setInterval(()=>setTick(v=>v+1), 2200); return ()=>clearInterval(t); },[]);
  const fake = useMemo(()=>{
    const base=[38,26,18,12];
    const jitter = base.map(v=> Math.max(4, v + ((tick*7 + v*3)%9)-4));
    const total=jitter.reduce((a,b)=>a+b,0);
    return { id:'sim', room:'sim', question:'Mana turnamen selanjutnya?', options:['Mobile Legends','Valorant','PUBG Mobile','Free Fire'], votes:jitter, total, theme:state.theme, duration:60, createdAt:Date.now()-10000, ended:false, paused:false, accent:state.accent, bg:state.bg, font:state.font, showPercent:state.showPercent, showCount:state.showCount, showTotal:state.showTotal, showTimer:state.showTimer } as any;
  },[state.theme,state.accent,state.bg,state.font,state.showPercent,state.showCount,state.showTotal,state.showTimer,tick]);
  const props = { poll: fake, theme: state.theme, font: state.font, accent: state.accent, bg: state.bg, showPercent: state.showPercent, showCount: state.showCount, showTotal: state.showTotal, showTimer: state.showTimer } as any;
  if(state.theme==='flower') return <FlowerTheme {...props} />;
  if(state.theme==='anime') return <AnimeTheme {...props} />;
  if(state.theme==='donut') return <DonutTheme {...props} />;
  if(state.theme==='minimal') return <MinimalTheme {...props} />;
  if(state.theme==='card') return <CardTheme {...props} />;
  return <BarTheme {...props} />;
}

function PollSettingsInner(){
  const searchParams=useSearchParams();
  const supabase=createClient();
  const [user,setUser]=useState<any>(null);
  const [privateKey,setPrivateKey]=useState(searchParams.get('key')||'');
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [copied,setCopied]=useState(false);
  const [showLoadPopup,setShowLoadPopup]=useState(false);
  const [loadUrl,setLoadUrl]=useState('');
  const [showDefaultsConfirm,setShowDefaultsConfirm]=useState(false);
  const [showKey,setShowKey]=useState(false);
  const [showKeyConfirm,setShowKeyConfirm]=useState(false);
  const [state,setState]=useState<any>({...defaults});
  const [activePoll,setActivePoll]=useState<any>(null);
  const [connected,setConnected]=useState(false);
  const maskUrl=(url:string)=>url.replace(/key=[^&]+/, 'key=••••••••••••••••');
  const toggleShowKey=()=>{ if(!showKey && obsUrl.includes('key=')){ setShowKeyConfirm(true); return; } setShowKey(v=>!v); };

  useEffect(()=>{ supabase.auth.getUser().then(({data})=>setUser(data.user)); const pk=searchParams.get('key')|| (typeof window!=='undefined'? sessionStorage.getItem('dock_private_verified')||'':''); if(pk) setPrivateKey(pk);
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

  const copyUrl=async()=>{ await navigator.clipboard.writeText(obsUrl); setCopied(true); setTimeout(()=>setCopied(false),1500); };
  const loadFromUrl=()=>{
    try{
      const url=new URL(loadUrl);
      const p=url.searchParams; const s:any={...defaults};
      for(const k of Object.keys(defaults)){
        const v=p.get(k);
        if(v!==null){ const def=(defaults as any)[k]; if(typeof def==='boolean') s[k]=v==='true'||v==='1'; else s[k]=v; }
      }
      setState(s); setShowLoadPopup(false);
      if(p.get('key')) setPrivateKey(p.get('key')||'');
    }catch{ alert('URL tidak valid'); }
  };
  const update=(k:string,v:any)=> setState((prev:any)=>({...prev,[k]:v}));

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="widgets" open={sidebarOpen} onClose={()=>setSidebarOpen(false)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={()=>setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <Link href="/widgets" className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-white" /></div>
            <div className="min-w-0">
              <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3 text-white" /> Poll <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white text-black rounded-full"><span className={`w-2 h-2 rounded-full ${connected?'bg-green-500 animate-pulse':'bg-red-500'}`} />{connected?'Live':'Offline'}</span></div>
              <div className="hidden sm:block text-gray-500 text-[10px]">Style polling - buat poll-nya di Dock</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={()=>setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={()=>setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </div>
        </header>

        <div className="bg-[#161616] border-b border-white/5 px-4 md:px-6 py-3 flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-black tracking-widest uppercase text-gray-500 mb-1 flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Widget URL - paste ke OBS Browser Source (transparent)</div>
            <div onClick={copyUrl} className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 cursor-pointer hover:border-white/20 group">
              <code className={`flex-1 text-[11px] font-mono truncate ${showKey?'text-white':'text-white blur-[3px] select-none'}`}>{showKey? obsUrl: obsUrl.replace(/key=[^&]+/, 'key=••••••••••••••••')}</code>
              <button type="button" onClick={(e)=>{e.stopPropagation(); toggleShowKey();}} className="shrink-0 w-7 h-7 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white">{showKey? <EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button>
              <span className={`shrink-0 w-7 h-7 grid place-items-center rounded-lg ${copied?'bg-emerald-500 text-white':'bg-white text-black group-hover:bg-zinc-100'}`}>{copied? <Check className="w-3.5 h-3.5"/>:<Copy className="w-3.5 h-3.5"/>}</span>
            </div>
          </div>
          <div className="flex self-end gap-2 shrink-0">
            <a href={obsUrl} target="_blank" className="h-9 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black text-[11px] uppercase flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5"/> OBS</a>
            <a href={obsUrl} draggable onDragStart={(e)=>{e.dataTransfer.setData('text/plain', obsUrl);}} className="h-9 px-3 bg-white text-black border border-dashed border-zinc-300 hover:border-white rounded-xl font-black text-[11px] uppercase flex items-center gap-1.5 cursor-grab active:cursor-grabbing"><GripVertical className="w-3.5 h-3.5"/> Drag ke OBS</a>
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
                <button onClick={copyUrl} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5"/> Copy URL</button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#0a0a0a] p-4 md:p-6 flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white"/> Preview Simulasi - {state.theme}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • simulasi • OBS = data real</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px] grid place-items-center p-4">
              <SimulatedPollPreview state={state} />
              <div className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/60 backdrop-blur px-2 py-1 rounded-full text-white/60 border border-white/10 pointer-events-none">SIMULASI • {state.theme} • {state.font}</div>
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Preview di sini dummy - data real hanya di OBS (<code className="bg-white/10 px-1 rounded text-white">.../poll/display?obs=1</code>) yang terhubung ke Dock + chat.</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <a href={obsUrl} target="_blank" className="h-9 bg-white text-black rounded-xl font-black uppercase flex items-center justify-center gap-1.5"><Monitor className="w-3 h-3"/> Buka OBS (real)</a>
              <Link href="/widgets" className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">Widgets</Link>
              <button onClick={()=>window.open(previewUrl,'_blank')} className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white"><ExternalLink className="w-3 h-3"/> Popout Style</button>
            </div>
          </div>
        </div>

        {showLoadPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={()=>setShowLoadPopup(false)}>
            <div onClick={e=>e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[480px] space-y-4">
              <h2 className="text-white font-black">Load Settings</h2>
              <p className="text-xs text-gray-500">Paste widget URL yang sudah ada</p>
              <input value={loadUrl} onChange={e=>setLoadUrl(e.target.value)} placeholder="https://.../widgets/poll/display?..." className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
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
              <p className="text-xs text-gray-500">Reset style ke defaults?</p>
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

export default function PollPage(){
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <PollSettingsInner />
    </Suspense>
  );
}
