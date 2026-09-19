'use client';

import Link from 'next/link';
import { Palette, Clock, ListChecks, Monitor, Copy, Image as ImageIcon } from 'lucide-react';
import { TASK_THEMES, TASK_ANIMS, TASK_HORIZONTAL_ANIMS, TASK_HIDE_ANIMS, type TaskSettings } from '../config';
import { WIDGET_FONTS } from '../../_shared/constants/fonts';
import { PositionPicker } from '../../_shared/components/PositionPicker';
import type { TaskItem } from '../themes/types';

export function TaskSettingsForm({
  state,
  update,
  reset,
  privateKey,
  onCopy,
}: {
  state: TaskSettings;
  update: (k: keyof TaskSettings, v: unknown) => void;
  reset: () => void;
  privateKey: string;
  onCopy: () => void;
}) {
  const addTask = () => {
    const text = prompt('Masukkan tugas baru:');
    if (!text?.trim()) return;
    const next = [...(state.tasks as unknown as TaskItem[]), { id: Date.now().toString(), text: text.trim(), completed: false, user: '' }];
    update('tasks', next);
  };
  const removeTask = (id: string) => update('tasks', (state.tasks as unknown as TaskItem[]).filter((t) => t.id !== id));
  const toggleTask = (id: string) => update('tasks', (state.tasks as unknown as TaskItem[]).map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  const updateTaskText = (id: string, text: string) => update('tasks', (state.tasks as unknown as TaskItem[]).map((t) => t.id === id ? { ...t, text } : t));

  return (
    <>
      {/* Tema & Font - sama persis dengan chat/poll */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {TASK_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="fonts-task" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="fonts-task">{WIDGET_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Size</span><input type="number" min={10} max={26} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 14)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Masuk</span><select value={state.anim} onChange={(e) => update('anim', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{TASK_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Keluar (hide)</span><select value={(state as unknown as { hideAnim: string }).hideAnim} onChange={(e) => update('hideAnim' as keyof TaskSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{TASK_HIDE_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select><span className="text-[10px] text-gray-500">Dipakai saat task selesai - default fade halus</span></label>
        </div>
      </div>

      {/* Warna - sama dengan chat */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" /> Warna</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Accent</span><input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span><div className="mt-1 flex gap-1"><input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={(e) => update('bg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('bg', 'transparent')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${state.bg === 'transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></div></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Opacity Background - {state.bgOpacity}%</span><input type="range" min={10} max={100} value={state.bgOpacity} onChange={(e) => update('bgOpacity', parseInt(e.target.value))} className="mt-1 w-full accent-white" /></label>
        </div>
      </div>

      {/* Posisi - Global */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={(state as unknown as { pos: string }).pos || 'center'} onChange={(v) => update('pos' as keyof TaskSettings, v)} />
        </div>
      </div>

      {/* Tampilan - sama dengan chat: inline/horizontal */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><ImageIcon className="w-4 h-4 text-white" /> Tampilan</h2>
        <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Inline</span><input type="checkbox" checked={(state as unknown as { inline: boolean }).inline} onChange={(e) => update('inline' as keyof TaskSettings, e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Horizontal layout</span><input type="checkbox" checked={(state as unknown as { horizontal: boolean }).horizontal} onChange={(e) => update('horizontal' as keyof TaskSettings, e.target.checked)} className="w-4 h-4 accent-white" /></label>
          {(state as unknown as { horizontal: boolean }).horizontal && (
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Horizontal</span><select value={(state as unknown as { horizontalAnim: string }).horizontalAnim} onChange={(e) => update('horizontalAnim' as keyof TaskSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{TASK_HORIZONTAL_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select></label>
          )}
        </div>
      </div>

      {/* Auto Collapse - baru */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Auto Collapse</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Auto collapsed on time</span><input type="checkbox" checked={(state as unknown as { autoCollapse: boolean }).autoCollapse || false} onChange={(e) => update('autoCollapse' as keyof TaskSettings, e.target.checked)} className="w-4 h-4 accent-white" /></label>
          {(state as unknown as { autoCollapse: boolean }).autoCollapse && (
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Collapse setelah (detik)</span><input type="number" min={1} max={60} value={(state as unknown as { collapseAfter: number }).collapseAfter ?? 3} onChange={(e) => update('collapseAfter' as keyof TaskSettings, parseInt(e.target.value) || 3)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /><span className="text-[10px] text-gray-500 mt-1 block">Awalnya muncul semua, sekian detik collapse ke 1 task belum done. Berlaku di Focus/Minimal/Glass.</span></label>
          )}
          <div className="text-[10px] text-gray-500 bg-black/30 rounded-xl p-2 border border-white/5">Jika aktif: awalnya tampil semua, setelah {(state as unknown as { collapseAfter: number }).collapseAfter ?? 3}s collapse ke task selanjutnya aja. Ketika di-checklist di Dock, muncul lagi semua, sekian detik collapse lagi.</div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><ListChecks className="w-4 h-4 text-cyan-400" /> Tasks</h2>
        <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
          {(state.tasks as unknown as TaskItem[]).map((t) => (
            <div key={t.id} className="flex gap-2 items-center bg-black/30 border border-white/5 rounded-xl px-2 py-2">
              <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} className="w-4 h-4 accent-white shrink-0" />
              <input value={t.text} onChange={(e) => updateTaskText(t.id, e.target.value)} placeholder="Task text" className="flex-1 bg-transparent text-white text-[12px] font-bold focus:outline-none placeholder:text-gray-500" />
              <button onClick={() => removeTask(t.id)} className="text-[10px] font-black uppercase text-red-400 hover:text-red-300 px-1">Hapus</button>
            </div>
          ))}
          <button onClick={addTask} className="w-full h-8 bg-white text-black rounded-xl text-[11px] font-black uppercase hover:bg-zinc-100">+ Tambah Task</button>
        </div>
      </div>

      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-3">
        <div className="text-violet-300 font-black uppercase text-[10px]">OBS - Task Focus</div>
        <div className="text-gray-400 text-[11px] leading-relaxed mt-1">Timer & tasks live di OBS - tasks bisa ditoggle di preview, timer auto-next sesi. Background transparent cocok untuk OBS.</div>
        <Link href={privateKey ? `/dock?key=${privateKey}` : '/dock'} className="mt-2 h-8 flex items-center justify-center gap-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase"><Monitor className="w-3 h-3" /> Buka Dock</Link>
      </div>

      <div className="flex gap-2">
        <button onClick={reset} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
        <button onClick={onCopy} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5" /> Copy URL</button>
      </div>
    </>
  );
}
