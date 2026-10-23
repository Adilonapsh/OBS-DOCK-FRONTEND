'use client';

import { Palette, Heart, Type, Activity, Settings2, Copy } from 'lucide-react';
import { HEARTRATE_THEMES, HEARTRATE_FONTS, HEARTRATE_ANIMS, type HeartrateSettings } from '../config';
import { PositionPicker } from '../../_shared/components/PositionPicker';
import { BrutalistSettingsSection } from '../../_shared/components/BrutalistSettingsSection';

export function HeartrateSettingsForm({
  state,
  update,
  reset,
  privateKey,
  onCopy,
}: {
  state: HeartrateSettings;
  update: (k: keyof HeartrateSettings, v: unknown) => void;
  reset: () => void;
  privateKey: string;
  onCopy: () => void;
}) {
  return (
    <>
      {/* Tema & Font */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {HEARTRATE_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="fonts-hr" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Outfit" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="fonts-hr">{HEARTRATE_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Size</span><input type="number" min={12} max={120} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 32)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi</span><select value={state.anim} onChange={(e) => update('anim', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{HEARTRATE_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{a.label}</option>)}</select></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Accent</span><input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span><div className="mt-1 flex gap-1"><input type="color" value={state.bg === 'transparent' ? '#161616' : state.bg} onChange={(e) => update('bg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('bg', 'transparent')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${state.bg === 'transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></div></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Opacity BG - {state.bgOpacity}%</span><input type="range" min={0} max={100} value={state.bgOpacity} onChange={(e) => update('bgOpacity', parseInt(e.target.value) || 100)} className="mt-1 w-full accent-white" /></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Teks Color</span><div className="mt-1 flex gap-1"><input type="color" value={state.textColor || '#ffffff'} onChange={(e) => update('textColor', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('textColor', '')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${!state.textColor ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Auto</button></div></label>
          <div className="bg-black/30 border border-white/5 rounded-xl p-2">
            <PositionPicker value={state.pos || 'center'} onChange={(v) => update('pos', v)} />
          </div>
        </div>
      </div>

      {/* Hyperate */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Heart className="w-4 h-4 text-red-400" /> Hyperate</h2>
        <div className="space-y-3 bg-red-500/5 border border-red-500/15 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Channel ID (override)</span>
            <input value={state.hyperateId} onChange={(e) => update('hyperateId', e.target.value)} placeholder="kosong = pakai Connection • contoh: 99c877 / hr:99c877" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono placeholder:text-gray-600" />
            <span className="text-[10px] text-gray-500 mt-1 block">Topic <code className="bg-white/10 px-1 rounded text-white">hr:99c877</code> - harus sama dengan yang di-join via Phoenix.</span>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">WebSocket URL (override)</span>
            <input value={(state as unknown as { hyperateWs: string }).hyperateWs || ''} onChange={(e) => update('hyperateWs' as keyof HeartrateSettings, e.target.value)} placeholder="kosong = pakai Connection • wss://app.hyperate.io/socket/websocket?token=..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono placeholder:text-gray-600" />
            <span className="text-[10px] text-gray-500 mt-1 block">Kosongkan untuk pakai URL dari Connection. Full URL dengan <code className="bg-white/10 px-1 rounded">?token=</code> diperlukan untuk auth.</span>
          </label>
          <div className="bg-black/30 border border-white/5 rounded-xl p-2 text-[10px] text-gray-400 leading-relaxed">
            <span className="text-white font-bold">Cara dapat:</span> <span className="text-white">app.hyperate.io</span> → device → copy <span className="text-white font-mono">Channel ID</span> (99c877) + <span className="text-white">WebSocket URL</span> (<code className="bg-white/10 px-1 rounded">wss://...?token=...</code>). Isi keduanya di <span className="text-white">Connection</span> biar semua widget auto-connect.
          </div>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">Simulate (preview tanpa device)</span>
            <input type="checkbox" checked={(state as unknown as { simulate?: boolean }).simulate as boolean} onChange={(e) => update('simulate' as keyof HeartrateSettings, e.target.checked)} className="w-4 h-4 accent-white" />
          </label>
        </div>
      </div>

      {state.theme === 'brutalist' && <BrutalistSettingsSection state={state as unknown as Record<string, unknown>} update={update as unknown as (k: string, v: unknown) => void} />}

      {/* Label & Layout */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Type className="w-4 h-4 text-cyan-400" /> Label & Layout</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Label</span><input value={state.label} onChange={(e) => update('label', e.target.value)} placeholder="HEART RATE" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Unit</span><input value={state.unit} onChange={(e) => update('unit', e.target.value)} placeholder="BPM" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Label</span><input type="checkbox" checked={state.showLabel} onChange={(e) => update('showLabel', e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Unit</span><input type="checkbox" checked={state.showUnit} onChange={(e) => update('showUnit', e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Icon</span><input type="checkbox" checked={state.showIcon} onChange={(e) => update('showIcon', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Icon Style</span><select value={state.iconStyle} onChange={(e) => update('iconStyle', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white"><option value="heart" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Heart</option><option value="pulse" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Pulse / Activity</option><option value="activity" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Zap</option></select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Border Radius - {state.borderRadius}px</span><input type="range" min={0} max={32} value={state.borderRadius} onChange={(e) => update('borderRadius', parseInt(e.target.value) || 16)} className="mt-1 w-full accent-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Padding - {state.padding}px</span><input type="range" min={8} max={32} value={state.padding} onChange={(e) => update('padding', parseInt(e.target.value) || 16)} className="mt-1 w-full accent-white" /></label>
          </div>
        </div>
      </div>

      {/* Threshold warna */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" /> Threshold Warna</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Low BPM ({state.lowBpm})</span><input type="range" min={40} max={100} value={state.lowBpm} onChange={(e) => update('lowBpm', parseInt(e.target.value) || 60)} className="mt-1 w-full accent-white" /><input type="color" value={state.lowColor} onChange={(e) => update('lowColor', e.target.value)} className="mt-1 w-full h-8 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">High BPM ({state.highBpm})</span><input type="range" min={100} max={180} value={state.highBpm} onChange={(e) => update('highBpm', parseInt(e.target.value) || 140)} className="mt-1 w-full accent-white" /><input type="color" value={state.highColor} onChange={(e) => update('highColor', e.target.value)} className="mt-1 w-full h-8 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Mid Color (normal)</span><input type="color" value={state.midColor} onChange={(e) => update('midColor', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Alert saat melebihi threshold</span><input type="checkbox" checked={state.alertHigh} onChange={(e) => update('alertHigh', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          {state.alertHigh && <label className="block"><span className="text-[11px] font-bold text-gray-300">Alert Threshold - {state.alertThreshold} BPM</span><input type="range" min={120} max={200} value={state.alertThreshold} onChange={(e) => update('alertThreshold', parseInt(e.target.value) || 150)} className="mt-1 w-full accent-white" /></label>}
        </div>
      </div>

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Settings2 className="w-4 h-4 text-violet-400" /> History</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Show History Sparkline</span><input type="checkbox" checked={state.showHistory} onChange={(e) => update('showHistory', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          {state.showHistory && <label className="block"><span className="text-[11px] font-bold text-gray-300">History Length - {state.historyLength}</span><input type="range" min={10} max={60} value={state.historyLength} onChange={(e) => update('historyLength', parseInt(e.target.value) || 20)} className="mt-1 w-full accent-white" /></label>}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={reset} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
        <button onClick={onCopy} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5" /> Copy URL</button>
      </div>
    </>
  );
}
