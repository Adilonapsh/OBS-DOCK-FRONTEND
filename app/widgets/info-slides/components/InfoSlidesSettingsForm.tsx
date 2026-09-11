'use client';

import { useState, useRef } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Monitor } from 'lucide-react';
import type { InfoSlidesSettings, InfoSlide } from '../config';
import { INFO_SLIDES_THEMES, INFO_SLIDES_ANIMS, INFO_SLIDES_FONTS, parseSlides } from '../config';
import { WIDGET_FONTS } from '../../_shared/constants/fonts';
import { PositionPicker } from '../../_shared/components/PositionPicker';

export function InfoSlidesSettingsForm({ state, update, reset }: { state: InfoSlidesSettings; update: (k: keyof InfoSlidesSettings, v: unknown) => void; reset: () => void; privateKey?: string; onCopy?: () => void }) {
  const slides = parseSlides(state.slidesJson);
  const [newBadge, setNewBadge] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');

  const saveSlides = (arr: InfoSlide[]) => update('slidesJson', JSON.stringify(arr.slice(0, 10)));
  const dragIdx = useRef<number | null>(null);

  const moveSlide = (from: number, to: number) => {
    if (to < 0 || to >= slides.length || from === to) return;
    const arr = [...slides];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    saveSlides(arr);
  };

  const fileToDataUrl = (file: File, cb: (url: string) => void) => {
    const r = new FileReader();
    r.onload = () => cb(String(r.result || ''));
    r.readAsDataURL(file);
  };

  const addSlide = () => {
    if (!newTitle.trim()) return;
    const next = [...slides, { id: Date.now().toString(36), badge: newBadge.trim().slice(0,20) || 'INFO', title: newTitle.trim().slice(0,80), desc: newDesc.trim().slice(0,160) || '-', accent: state.accent, image: newImage.trim() || undefined }];
    saveSlides(next);
    setNewBadge(''); setNewTitle(''); setNewDesc(''); setNewImage('');
  };
  const removeSlide = (id: string) => saveSlides(slides.filter(s => s.id !== id));
  const updateSlide = (id: string, patch: Partial<InfoSlide>) => saveSlides(slides.map(s => s.id === id ? { ...s, ...patch } : s));

  return (
    <div className="space-y-5">
      {/* Theme & Font */}
      <div className="space-y-2">
        <div className="text-white font-black uppercase text-[11px] tracking-widest">Tampilan</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Theme</span>
            <select value={state.theme} onChange={e => update('theme', e.target.value)} className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-2 text-[12px] text-white">
              {INFO_SLIDES_THEMES.map(t => <option key={t.value} value={t.value} className="bg-[#161616]">{t.label}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Font</span>
            <select value={state.font} onChange={e => update('font', e.target.value)} className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-2 text-[12px] text-white">
              {INFO_SLIDES_FONTS.map(f => <option key={f} value={f} className="bg-[#161616]">{f}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Animasi</span>
            <select value={state.anim} onChange={e => update('anim', e.target.value)} className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-2 text-[12px] text-white">
              {INFO_SLIDES_ANIMS.map(a => <option key={a.value} value={a.value} className="bg-[#161616]">{a.label}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Durasi / slide (s)</span>
            <input type="number" min={2} max={30} value={state.duration} onChange={e => update('duration', Math.max(2, Math.min(30, parseInt(e.target.value)||6)))} className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-[12px] text-white" />
          </label>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-[11px] text-gray-300"><input type="checkbox" checked={state.autoRotate} onChange={e => update('autoRotate', e.target.checked)} /> Auto rotate</label>
          <label className="flex items-center gap-2 text-[11px] text-gray-300"><input type="checkbox" checked={state.showProgress} onChange={e => update('showProgress', e.target.checked)} /> Dots</label>
          <label className="flex items-center gap-2 text-[11px] text-gray-300"><input type="checkbox" checked={state.showBadge} onChange={e => update('showBadge', e.target.checked)} /> Badge</label>
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-3 gap-2">
        <label className="space-y-1"><span className="text-[10px] font-bold uppercase text-gray-400">Accent</span><input type="color" value={state.accent} onChange={e => update('accent', e.target.value)} className="w-full h-9 bg-white/5 border border-white/10 rounded-xl p-1" /></label>
        <label className="space-y-1"><span className="text-[10px] font-bold uppercase text-gray-400">Teks</span><input type="color" value={state.textColor} onChange={e => update('textColor', e.target.value)} className="w-full h-9 bg-white/5 border border-white/10 rounded-xl p-1" /></label>
        <label className="space-y-1"><span className="text-[10px] font-bold uppercase text-gray-400">BG Opacity</span><input type="range" min={10} max={100} value={state.bgOpacity} onChange={e => update('bgOpacity', parseInt(e.target.value))} className="w-full" /></label>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={(state as unknown as { pos: string }).pos || 'bl'} onChange={(v) => update('pos' as keyof InfoSlidesSettings, v)} />
        </div>
      </div>

      {/* Slides editor - orderable via drag + ↑↓ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-white font-black uppercase text-[11px] tracking-widest">Slides (max 10) - {slides.length}/10</div>
          <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1"><GripVertical className="w-3 h-3" /> drag untuk urutkan</span>
        </div>
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {slides.map((s, idx) => (
            <div
              key={s.id}
              draggable
              onDragStart={() => { dragIdx.current = idx; }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={() => { if (dragIdx.current !== null) { moveSlide(dragIdx.current, idx); dragIdx.current = null; } }}
              onDragEnd={() => { dragIdx.current = null; }}
              className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 hover:border-white/15 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 grid place-items-center shrink-0 cursor-grab active:cursor-grabbing text-gray-400">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <span className="flex-1 text-[10px] font-black uppercase text-gray-500">#{idx+1} • {s.id}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveSlide(idx, idx-1)} disabled={idx===0} className="w-6 h-6 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed" title="Naik"><ChevronUp className="w-3 h-3" /></button>
                  <button onClick={() => moveSlide(idx, idx+1)} disabled={idx===slides.length-1} className="w-6 h-6 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed" title="Turun"><ChevronDown className="w-3 h-3" /></button>
                  <button onClick={() => removeSlide(s.id)} className="ml-1 text-[11px] font-bold text-red-400 hover:text-red-300">Hapus</button>
                </div>
              </div>
              <div className="flex gap-2">
                {s.image ? <img src={s.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0 bg-white" /> : <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 grid place-items-center text-[10px] text-gray-500 shrink-0">IMG</div>}
                <div className="flex-1 space-y-2 min-w-0">
                  <input value={s.image || ''} onChange={e => updateSlide(s.id, { image: e.target.value.trim() || undefined })} placeholder="Image URL (https://... atau upload)" className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[11px] text-white" />
                  <label className="text-[10px] text-violet-400 hover:text-violet-300 cursor-pointer">Upload gambar <input type="file" accept="image/*" className="hidden" onChange={e => { const f=e.target.files?.[0]; if(f) fileToDataUrl(f, url=> updateSlide(s.id,{image:url})); (e.target as HTMLInputElement).value=''; }} /></label>
                </div>
                {s.image && <button onClick={() => updateSlide(s.id, { image: undefined })} className="shrink-0 text-[10px] text-gray-400 hover:text-white px-1">✕</button>}
              </div>
              <input value={s.badge} onChange={e => updateSlide(s.id, { badge: e.target.value })} placeholder="Badge (SPONSOR/RULES)" className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[12px] text-white" />
              <input value={s.title} onChange={e => updateSlide(s.id, { title: e.target.value })} placeholder="Judul" className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[12px] text-white font-bold" />
              <textarea value={s.desc} onChange={e => updateSlide(s.id, { desc: e.target.value })} placeholder="Deskripsi" rows={2} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[12px] text-white" />
            </div>
          ))}
        </div>
        <div className="p-3 bg-white/[0.03] border border-dashed border-white/15 rounded-xl space-y-2">
          <div className="text-[10px] font-bold uppercase text-gray-400">Tambah Slide</div>
          <input value={newBadge} onChange={e => setNewBadge(e.target.value)} placeholder="Badge (opsional)" className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[12px] text-white" />
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Judul baru" className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[12px] text-white" />
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Deskripsi" rows={2} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[12px] text-white" />
          <input value={newImage} onChange={e => setNewImage(e.target.value)} placeholder="Image URL (opsional)" className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[11px] text-white" />
          <div className="flex gap-2">
            {newImage && <img src={newImage} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10 bg-white shrink-0" onError={e=> (e.currentTarget.style.display='none')} />}
            <label className="flex-1 h-8 grid place-items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-bold text-gray-300 cursor-pointer">Upload Gambar<input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f) fileToDataUrl(f, setNewImage); (e.target as HTMLInputElement).value='';}} /></label>
          </div>
          <button onClick={addSlide} disabled={!newTitle.trim() || slides.length >= 10} className="w-full h-9 bg-white text-black rounded-xl font-black uppercase text-[11px] disabled:opacity-40">+ Tambah Slide</button>
        </div>
      </div>

      <button onClick={reset} className="w-full h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-400">Reset ke Default (5 slide)</button>
    </div>
  );
}
