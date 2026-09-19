'use client';

import { VIEW_COUNTER_THEMES, VIEW_COUNTER_FONTS, type ViewCounterSettings } from '../config';
import { PositionPicker } from '../../_shared/components/PositionPicker';
import { Palette, Type, Monitor, Eye } from 'lucide-react';

type Props = {
  state: ViewCounterSettings;
  update: (k: keyof ViewCounterSettings, v: unknown) => void;
};

export function ViewCounterSettingsForm({ state, update }: Props) {
  return (
    <>
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {VIEW_COUNTER_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="vc-fonts" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="vc-fonts">{VIEW_COUNTER_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Ukuran Angka</span><input type="number" min={12} max={96} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 28)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Type className="w-4 h-4 text-violet-400" /> Warna</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Aksen</span>
            <span className="mt-1 flex gap-2">
              <input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 cursor-pointer shrink-0" />
              <input type="text" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
            </span>
          </label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span>
            <span className="mt-1 flex gap-2">
              <input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={(e) => update('bg', e.target.value)} className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 cursor-pointer shrink-0" />
              <input type="text" value={state.bg} onChange={(e) => update('bg', e.target.value)} placeholder="transparent" className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Eye className="w-4 h-4 text-cyan-400" /> Tampilan</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Label</span><input type="checkbox" checked={state.showLabel} onChange={(e) => update('showLabel', e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Rincian</span><input type="checkbox" checked={state.showBreakdown} onChange={(e) => update('showBreakdown', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          </div>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Inline (satu baris)</span><input type="checkbox" checked={state.inline} onChange={(e) => update('inline', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Idle</span>
            <select value={state.idleFx} onChange={(e) => update('idleFx', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              <option value="none" className="bg-zinc-900">Mati</option>
              <option value="gradient" className="bg-zinc-900">Border Gradient Muter</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={(state as unknown as { pos: string }).pos || 'center'} onChange={(v) => update('pos', v)} />
        </div>
      </div>
    </>
  );
}
