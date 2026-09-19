'use client';

import { Palette, Clock } from 'lucide-react';
import { TIMER_THEMES, TIMER_ANIMS, type TimerSettings } from '../config';
import { WIDGET_FONTS } from '../../_shared/constants/fonts';
import { PositionPicker } from '../../_shared/components/PositionPicker';

export function TimerSettingsForm({ state, update }: { state: TimerSettings; update: (k: keyof TimerSettings, v: unknown) => void; }) {
  return (
    <>
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {TIMER_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="fonts-timer" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="fonts-timer">{WIDGET_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Size</span><input type="number" min={10} max={26} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 14)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi</span><select value={state.anim} onChange={(e) => update('anim', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{TIMER_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select></label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" /> Warna</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Accent</span><input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Text Color</span><input type="color" value={(state as unknown as { textColor: string }).textColor || '#ffffff'} onChange={(e) => update('textColor' as keyof typeof state, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span><div className="mt-1 flex gap-1"><input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={(e) => update('bg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('bg', 'transparent')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${state.bg === 'transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></div></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Opacity Background - {state.bgOpacity}%</span><input type="range" min={10} max={100} value={state.bgOpacity} onChange={(e) => update('bgOpacity', parseInt(e.target.value))} className="mt-1 w-full accent-white" /></label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Posisi - Global</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={(state as unknown as { pos: string }).pos || 'center'} onChange={(v) => update('pos' as keyof typeof state, v)} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Focus Timer</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-1 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Timer (menit)</span><input type="number" min={1} max={120} value={state.focusMinutes} onChange={(e) => update('focusMinutes', parseInt(e.target.value) || 50)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            {/* <label className="block"><span className="text-[11px] font-bold text-gray-300">Sessions</span><input type="number" min={1} max={10} value={state.totalSessions} onChange={(e) => update('totalSessions', parseInt(e.target.value) || 3)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label> */}
          </div>
          {(state.theme === 'subathon' || state.theme === 'glass') && (
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Mode - {state.theme === 'glass' ? 'Glass' : 'Subathon'}</span>
              <select value={(state as unknown as { subathonMode: string }).subathonMode} onChange={(e) => update('subathonMode' as keyof typeof state, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                <option value="powerup" className="bg-zinc-900">Power-Up - 2X cream</option>
                <option value="sleep" className="bg-zinc-900">Sleep - Zz purple</option>
                <option value="locked" className="bg-zinc-900">Locked - gembok</option>
                <option value="paused" className="bg-zinc-900">Paused - pause</option>
              </select>
              <span className="text-[10px] text-gray-500 mt-1 block">Mode general - dipakai Glass & Subathon (shared TimerCoreConfig.subathonMode). Tema lain ingore field ini.</span>
            </label>
          )}
          <div className="text-[10px] text-gray-500 bg-black/30 rounded-xl p-2 border border-white/5">Timer di OBS bisa di-play/pause/reset via preview. Default 50:00 × 3 sesi (subathon pakai HH:MM:SS 42:56:08).</div>
        </div>
      </div>
    </>
  );
}
