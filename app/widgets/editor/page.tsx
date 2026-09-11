'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Eye, ExternalLink, Sparkles, Palette, Layers, Monitor, Save, Trash2, Plus, GripVertical, EyeOff, Settings2, Menu, Move, Type, Clock, Hash, Zap, MessageSquare, Timer, BarChart3, Share2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Sidebar from '../../components/Sidebar';
import { renderTemplate, TEMPLATE_VARS } from '../_shared/utils/template';
import { getPositionStyle } from '../_shared/constants/positions';

type LayerType = 'chat' | 'timer' | 'clock' | 'poll' | 'social' | 'custom';
type Layer = {
  id: string;
  type: LayerType;
  x: number; y: number; w: number; h: number; // 0-100 %
  template: string;
  css: string;
  js: string; // JS animation - el.animate(...) - pakai JS biar bisa custom easing/timeline
  anim: string; // CSS anim name (elegantIn etc) - kalau js kosong pakai ini
  opacity: number; // 0-100
  rotate: number; // deg
  scale: number; // 0.5-2
  zIndex: number;
  radius: number; // px
  shadow: boolean;
  bg: string;
  visible: boolean;
  locked: boolean;
  props?: Record<string, any>;
};

const DEFAULT_TEMPLATES: Record<LayerType, string> = {
  chat: '<div class="chat-bubble"><span class="user">{{username}}</span>: <span class="msg">{{message}}</span> <small>{{date}}</small></div>',
  timer: '<div class="timer">{{timer}}</div>',
  clock: '<div class="clock">{{clock}}</div>',
  poll: '<div class="poll">{{polls}}</div>',
  social: '<div class="social"><span>{{platform}}</span> {{handle}}</div>',
  custom: '<div class="custom">{{username}} - {{message}} - {{timer}} - {{clock}}</div>',
};

const LAYER_ICON: Record<LayerType, any> = {
  chat: MessageSquare, timer: Timer, clock: Clock, poll: BarChart3, social: Share2, custom: Type,
};

function genId() { return Math.random().toString(36).slice(2, 6); }

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [privateKey, setPrivateKey] = useState(searchParams.get('key') || '');
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [layers, setLayers] = useState<Layer[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('custom-overlay-layers');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { id: 'l1', type: 'chat', x: 2, y: 70, w: 30, h: 25, template: DEFAULT_TEMPLATES.chat, css: '.chat-bubble{background:rgba(22,22,22,0.9);border:1px solid #333;border-radius:12px;padding:8px 12px;color:#fff;font-family:Outfit}', js: '', anim: 'elegantIn', opacity: 100, rotate: 0, scale: 1, zIndex: 1, radius: 12, shadow: true, bg: 'transparent', visible: true, locked: false },
      { id: 'l2', type: 'timer', x: 70, y: 5, w: 28, h: 12, template: DEFAULT_TEMPLATES.timer, css: '.timer{font-size:32px;font-weight:900;color:#fff;background:#594d4a;border-radius:16px;padding:8px 16px;text-align:center}', js: '', anim: 'elegantIn', opacity: 100, rotate: 0, scale: 1, zIndex: 2, radius: 16, shadow: true, bg: 'transparent', visible: true, locked: false },
    ];
  });
  const [selected, setSelected] = useState<string>(layers[0]?.id || '');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selLayer = layers.find(l => l.id === selected) || null;

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUser(data.user)); }, [supabase]);
  useEffect(() => { localStorage.setItem('custom-overlay-layers', JSON.stringify(layers)); }, [layers]);

  // demo data for placeholders
  const demoData: Record<string, string> = {
    username: 'Rizky_JR', message: 'Gass keun bang! 🔥', date: new Date().toLocaleDateString('id-ID'),
    timer: '13:20', clock: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    polls: 'ML 42% • Valorant 28%', platform: 'tiktok', handle: '@adilonapsh', label: 'TikTok',
  };

  const addLayer = (type: LayerType) => {
    const nl: Layer = { id: genId(), type, x: 20 + Math.random()*20, y: 20 + Math.random()*30, w: 30, h: 15, template: DEFAULT_TEMPLATES[type], css: '', js: '', anim: 'elegantIn', opacity: 100, rotate: 0, scale: 1, zIndex: layers.length + 1, radius: 12, shadow: false, bg: 'transparent', visible: true, locked: false };
    setLayers(v => [...v, nl]); setSelected(nl.id);
  };
  const updateLayer = (id: string, patch: Partial<Layer>) => setLayers(v => v.map(l => l.id === id ? { ...l, ...patch } : l));
  const removeLayer = (id: string) => setLayers(v => v.filter(l => l.id !== id));

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || layer.locked) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = e.clientX; const startY = e.clientY;
    const origX = layer.x; const origY = layer.y;
    const move = (ev: MouseEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      updateLayer(id, { x: Math.max(0, Math.min(85, origX + dx)), y: Math.max(0, Math.min(85, origY + dy)) });
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  const insertVar = (v: string) => {
    if (!selLayer) return;
    const ta = document.getElementById('custom-template') as HTMLTextAreaElement | null;
    const cur = selLayer.template;
    const placeholder = `{{${v}}}`;
    if (ta && typeof ta.selectionStart === 'number') {
      const s = ta.selectionStart; const e = ta.selectionEnd;
      const next = cur.slice(0, s) + placeholder + cur.slice(e);
      updateLayer(selLayer.id, { template: next });
      setTimeout(() => { ta.focus(); ta.setSelectionRange(s + placeholder.length, s + placeholder.length); }, 0);
    } else {
      updateLayer(selLayer.id, { template: cur + placeholder });
    }
  };

  const layersQuery = encodeURIComponent(JSON.stringify(layers));
  const obsUrl = typeof window !== 'undefined' ? `${window.location.origin}/widgets/custom/display?layers=${layersQuery}${privateKey ? `&key=${privateKey}` : ''}&obs=1` : '';
  const previewUrl = obsUrl.replace('&obs=1', '&simulate=1');

  const handleCopy = async () => { await navigator.clipboard.writeText(obsUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const handleSave = async () => {
    localStorage.setItem('custom-overlay-layers', JSON.stringify(layers));
    // also save to Supabase if logged in (optional)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('profiles').update({ custom_overlay: JSON.stringify(layers) } as any).eq('id', session.user.id);
      }
    } catch {}
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="widgets" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <Link href="/widgets" className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="w-8 h-8 rounded-lg bg-white grid place-items-center"><Layers className="w-4 h-4 text-black" /></div>
            <div className="min-w-0">
              <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2">Custom Overlay <span className="hidden sm:inline px-2 py-0.5 bg-white text-black rounded-full text-[9px]">StreamElements-like</span></div>
              <div className="hidden sm:block text-gray-500 text-[10px]">Drag-drop canvas 1920×1080 • layers + {'{{username}}'} {'{{message}}'} {'{{timer}}'} {'{{clock}}'} {'{{polls}}'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={previewUrl} target="_blank" className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><Eye className="w-3 h-3" /> Preview</Link>
            <button onClick={handleSave} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${saved ? 'bg-green-500 text-white border-green-500' : 'bg-white text-black border-white'}`}>{saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />} {saved ? 'Saved' : 'Save'}</button>
            <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-[10px] font-black uppercase text-white">{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy OBS</button>
          </div>
        </header>

        <div className="bg-[#161616] border-b border-white/5 px-4 md:px-6 py-2 flex gap-2 sm:items-center overflow-x-auto">
          <div className="flex-1 min-w-0 flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
            <code className="flex-1 text-[11px] font-mono truncate text-white/70">{obsUrl.slice(0, 80)}…</code>
            <button onClick={handleCopy} className="shrink-0 w-7 h-7 grid place-items-center rounded-lg bg-white text-black">{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button>
          </div>
          <input value={privateKey} onChange={e => setPrivateKey(e.target.value)} placeholder="key" className="hidden sm:block w-32 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-[11px] font-mono text-white" />
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Left: Layers + Add */}
          <div className="w-full lg:w-[260px] shrink-0 bg-[#121212] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col max-h-[30vh] lg:max-h-none lg:h-[calc(100vh-112px)] overflow-hidden">
            <div className="p-3 border-b border-white/5">
              <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Plus className="w-3 h-3" /> Add Layer</div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {(['chat','timer','clock','poll','social','custom'] as LayerType[]).map(t => {
                  const Icon = LAYER_ICON[t];
                  return <button key={t} onClick={() => addLayer(t)} className="h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 text-white"><Icon className="w-5 h-5" /><span className="text-[9px] font-black uppercase">{t}</span></button>;
                })}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              <div className="text-gray-500 font-black uppercase text-[9px] tracking-widest px-1">Layers ({layers.length})</div>
              {layers.map(l => (
                <div key={l.id} onClick={() => setSelected(l.id)} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${selected===l.id ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}>
                  <GripVertical className="w-3 h-3 opacity-50" />
                  <span className="flex-1 text-[11px] font-bold truncate uppercase">{l.type} • {l.id}</span>
                  <button onClick={e=>{e.stopPropagation(); updateLayer(l.id,{visible:!l.visible})}} className="w-6 h-6 grid place-items-center rounded-lg bg-black/10">{l.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}</button>
                  <button onClick={e=>{e.stopPropagation(); removeLayer(l.id)}} className="w-6 h-6 grid place-items-center rounded-lg bg-red-500/20 text-red-300"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Canvas 16:9 */}
          <div className="flex-1 bg-[#0a0a0a] p-4 flex flex-col min-h-[400px] overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Monitor className="w-3 h-3" /> Canvas 1920×1080 • drag to move, pos global t/l/b/r</span>
              <span className="text-gray-500 text-[10px] font-mono">{layers.length} layers</span>
            </div>
            <div ref={canvasRef} className="relative w-full aspect-video bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl shrink-0" style={{ background: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px) 0 0 / 20px 20px, #0a0a0a' }}>
              {/* 9-grid guide */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-[0.04]"><div className="border-r border-white" /><div className="border-r border-white" /><div /><div className="border-t border-white border-r" /><div className="border-t border-r border-white" /><div className="border-t border-white" /><div className="border-t border-r border-white" /><div className="border-t border-r border-white" /><div className="border-t border-white" /></div>
                  {layers.filter(l=>l.visible).map(l => (
                <div
                  key={`${l.id}-${l.template}-${l.js}-${l.anim}-${l.opacity}-${l.rotate}-${l.scale}`}
                  onMouseDown={e=>onMouseDown(e,l.id)}
                  onClick={()=>setSelected(l.id)}
                  className={`absolute border cursor-move select-none overflow-hidden ${selected===l.id ? 'border-violet-500 ring-2 ring-violet-500/30' : 'border-white/20 hover:border-white/40'} ${l.locked ? 'opacity-60' : ''}`}
                  style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%`, height: `${l.h}%`, background: l.bg && l.bg !== 'transparent' ? l.bg : 'rgba(255,255,255,0.02)', opacity: (l.opacity ?? 100)/100, transform: `rotate(${l.rotate||0}deg) scale(${l.scale||1})`, zIndex: l.zIndex||1, borderRadius: `${l.radius||0}px`, boxShadow: l.shadow ? '0 8px 24px rgba(0,0,0,0.4)' : undefined, animation: !l.js && l.anim ? `${l.anim} 0.52s cubic-bezier(0.16,1,0.3,1) both` : undefined } as any}
                  ref={el => { if (el && l.js) { try { const fn = new Function('el', l.js); const target = el.querySelector('.layer-content') as HTMLElement | null; if (target) fn(target); else fn(el); } catch {} } }}
                >
                  <style dangerouslySetInnerHTML={{ __html: l.css }} />
                  <div className="layer-content w-full h-full p-2 text-white text-[11px] leading-tight overflow-hidden" dangerouslySetInnerHTML={{ __html: renderTemplate(l.template, demoData) }} />
                  <div className="absolute top-0 left-0 px-1 py-0.5 bg-violet-600 text-white text-[8px] font-black uppercase rounded-br">{l.type} {l.js ? 'JS' : ''}</div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-white/20 cursor-nwse-resize" onMouseDown={e=>{ e.stopPropagation(); const startW=l.w; const startH=l.h; const sx=e.clientX; const sy=e.clientY; const rect=canvasRef.current!.getBoundingClientRect(); const mv=(ev:MouseEvent)=>{ const dw=((ev.clientX-sx)/rect.width)*100; const dh=((ev.clientY-sy)/rect.height)*100; updateLayer(l.id,{w:Math.max(10,Math.min(90,startW+dw)), h:Math.max(8,Math.min(80,startH+dh))});}; const up=()=>{window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up);}; window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up);}} />
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Drag layer di canvas • gunakan PositionPicker di kanan untuk snap ke t/l/b/r/center/tl - live preview iframe di kanan pakai 1 file `/widgets/custom/display`</div>
          </div>

          {/* Right: Properties + Template */}
          <div className="w-full lg:w-[380px] shrink-0 bg-[#121212] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col max-h-[45vh] lg:max-h-none lg:h-[calc(100vh-112px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {!selLayer ? (
                <div className="text-gray-500 text-sm text-center py-10">Pilih layer di kiri/canvas</div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-black uppercase text-[11px] tracking-widest">{selLayer.type} • {selLayer.id}</h2>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-white"><input type="checkbox" checked={selLayer.locked} onChange={e=>updateLayer(selLayer.id,{locked:e.target.checked})} className="w-3 h-3 accent-white" /> Lock</label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <label className="block"><span className="text-[9px] font-bold text-gray-400">X%</span><input type="number" value={Math.round(selLayer.x)} onChange={e=>updateLayer(selLayer.id,{x: parseInt(e.target.value)||0})} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white" /></label>
                    <label className="block"><span className="text-[9px] font-bold text-gray-400">Y%</span><input type="number" value={Math.round(selLayer.y)} onChange={e=>updateLayer(selLayer.id,{y: parseInt(e.target.value)||0})} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white" /></label>
                    <label className="block"><span className="text-[9px] font-bold text-gray-400">W%</span><input type="number" value={Math.round(selLayer.w)} onChange={e=>updateLayer(selLayer.id,{w: parseInt(e.target.value)||0})} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white" /></label>
                    <label className="block"><span className="text-[9px] font-bold text-gray-400">H%</span><input type="number" value={Math.round(selLayer.h)} onChange={e=>updateLayer(selLayer.id,{h: parseInt(e.target.value)||0})} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white" /></label>
                  </div>
                  <div className="space-y-2 p-2.5 bg-white/5 border border-white/10 rounded-xl">
                    <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Settings2 className="w-3 h-3 text-violet-400" /> Settingan Lain</div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className="text-[9px] font-bold text-gray-400">Opacity {selLayer.opacity}%</span><input type="range" min={0} max={100} value={selLayer.opacity} onChange={e=>updateLayer(selLayer.id,{opacity: parseInt(e.target.value)||100})} className="w-full accent-white h-1" /></label>
                      <label className="block"><span className="text-[9px] font-bold text-gray-400">Rotate {selLayer.rotate}°</span><input type="range" min={-180} max={180} value={selLayer.rotate} onChange={e=>updateLayer(selLayer.id,{rotate: parseInt(e.target.value)||0})} className="w-full accent-white h-1" /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className="text-[9px] font-bold text-gray-400">Scale {selLayer.scale}x</span><input type="range" min={0.5} max={2} step={0.1} value={selLayer.scale} onChange={e=>updateLayer(selLayer.id,{scale: parseFloat(e.target.value)||1})} className="w-full accent-white h-1" /></label>
                      <label className="block"><span className="text-[9px] font-bold text-gray-400">Radius {selLayer.radius}px</span><input type="range" min={0} max={32} value={selLayer.radius} onChange={e=>updateLayer(selLayer.id,{radius: parseInt(e.target.value)||0})} className="w-full accent-white h-1" /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className="text-[9px] font-bold text-gray-400">Z-Index</span><input type="number" min={1} max={99} value={selLayer.zIndex} onChange={e=>updateLayer(selLayer.id,{zIndex: parseInt(e.target.value)||1})} className="w-full h-7 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white" /></label>
                      <label className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-white/5 cursor-pointer"><span className="text-[10px] font-bold text-white">Shadow</span><input type="checkbox" checked={!!selLayer.shadow} onChange={e=>updateLayer(selLayer.id,{shadow:e.target.checked})} className="w-4 h-4 accent-white" /></label>
                    </div>
                    <label className="block"><span className="text-[9px] font-bold text-gray-400">Background</span><div className="flex gap-1.5 mt-1"><input type="color" value={selLayer.bg === 'transparent' ? '#000000' : selLayer.bg} onChange={e=>updateLayer(selLayer.id,{bg:e.target.value})} className="w-8 h-8 rounded-lg p-1 bg-black/40 border border-white/10" /><button onClick={()=>updateLayer(selLayer.id,{bg:'transparent'})} className={`flex-1 h-8 rounded-lg text-[10px] font-black uppercase border ${selLayer.bg==='transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></div></label>
                  </div>
                  <div className="space-y-2">
                    <div className="text-white font-black uppercase text-[10px] tracking-widest">Template - drag variable</div>
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPLATE_VARS.map(v => (
                        <button key={v.key} draggable onDragStart={e=>e.dataTransfer.setData('text/plain', `{{${v.key}}}`)} onClick={()=>insertVar(v.key)} className="px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] font-bold text-white" title={`${v.desc} - ${v.example}`}>{'{{'}<span className="text-violet-300">{v.key}</span>{'}}'}</button>
                      ))}
                    </div>
                    <textarea id="custom-template" value={selLayer.template} onChange={e=>updateLayer(selLayer.id,{template:e.target.value})} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); const txt=e.dataTransfer.getData('text/plain'); if(txt) updateLayer(selLayer.id,{template: selLayer.template + txt});}} placeholder="<div>{{username}}: {{message}}</div>" className="w-full h-28 bg-black/40 border border-white/10 rounded-xl p-2 text-xs font-mono text-white" />
                    <div className="text-[10px] text-gray-500">Drag chip di atas ke textarea • pakai <code className="bg-white/10 px-1 rounded">{"{{username}} {{message}} {{date}} {{timer}} {{clock}} {{polls}} {{handle}} {{platform}}"}</code></div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-white font-black uppercase text-[10px] tracking-widest">Custom CSS (per layer)</div>
                    <textarea value={selLayer.css} onChange={e=>updateLayer(selLayer.id,{css:e.target.value})} placeholder=".chat-bubble{...}" className="w-full h-28 bg-black/40 border border-white/10 rounded-xl p-2 text-xs font-mono text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-between"><span>Animasi - CSS atau JS</span><span className="text-[9px] font-normal normal-case text-gray-500">{selLayer.js ? 'JS' : 'CSS'}</span></div>
                    <select value={selLayer.anim || 'elegantIn'} onChange={e=>updateLayer(selLayer.id,{anim:e.target.value, js: ''})} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white">
                      <option value="elegantIn" className="bg-zinc-900">CSS - Elegant In (blur + slide)</option>
                      <option value="softPopIn" className="bg-zinc-900">CSS - Soft Pop</option>
                      <option value="slideUp" className="bg-zinc-900">CSS - Slide Up</option>
                      <option value="fadeIn" className="bg-zinc-900">CSS - Fade</option>
                    </select>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'JS Fade', code: "el.animate([{opacity:0},{opacity:1}],{duration:500,easing:'ease'})" },
                        { label: 'JS SlideUp', code: "el.animate([{opacity:0,transform:'translateY(20px) scale(0.97)',filter:'blur(8px)'},{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0)'}],{duration:620,easing:'cubic-bezier(0.16,1,0.3,1)'})" },
                        { label: 'JS Bounce', code: "el.animate([{transform:'scale(0.8)',opacity:0},{transform:'scale(1.05)',opacity:1,offset:0.6},{transform:'scale(1)',opacity:1}],{duration:600,easing:'cubic-bezier(0.34,1.56,0.64,1)'})" },
                      ].map(p => (
                        <button key={p.label} onClick={()=>updateLayer(selLayer.id,{js:p.code, anim: ''})} className={`h-8 rounded-lg border text-[10px] font-bold ${selLayer.js===p.code ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}>{p.label}</button>
                      ))}
                    </div>
                    <textarea value={selLayer.js || ''} onChange={e=>updateLayer(selLayer.id,{js:e.target.value})} placeholder="JS: el.animate([...], {duration:500}) - pakai 'el' untuk layer element" className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-2 text-xs font-mono text-white" />
                    <div className="text-[10px] text-gray-500">Kosongkan JS untuk pakai CSS anim di atas. Pakai <code className="bg-white/10 px-1 rounded">el</code> di JS - contoh: <code className="bg-white/10 px-1 rounded">el.animate([{`{opacity:0}`},{`{opacity:1}`}],{"{duration:400}"})</code></div>
                    {selLayer.js ? <button onClick={()=>updateLayer(selLayer.id,{js:''})} className="text-[10px] text-red-400 underline">Hapus JS, pakai CSS</button> : null}
                  </div>
                  <div className="space-y-2">
                    <div className="text-white font-black uppercase text-[10px] tracking-widest">Preview layer</div>
                    <div className="bg-black border border-white/10 rounded-xl p-3">
                      <style dangerouslySetInnerHTML={{ __html: selLayer.css }} />
                      <div ref={el => { if(el && selLayer.js) { try { const fn = new Function('el', selLayer.js); fn(el); } catch {} } }} dangerouslySetInnerHTML={{ __html: renderTemplate(selLayer.template, demoData) }} style={!selLayer.js && selLayer.anim ? { animation: `${selLayer.anim} 0.52s cubic-bezier(0.16,1,0.3,1) both` } as any : undefined} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomEditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading editor…</div>}>
      <EditorContent />
    </Suspense>
  );
}
