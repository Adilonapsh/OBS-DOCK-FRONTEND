'use client';

import { Palette, Monitor, Copy, Megaphone } from 'lucide-react';
import { TICKER_THEMES, TICKER_FONTS, TICKER_DIRECTIONS, type TickerSettings } from '../config';
import { PositionPicker } from '../../_shared/components/PositionPicker';
import { BrutalistSettingsSection } from '../../_shared/components/BrutalistSettingsSection';

export function TickerSettingsForm({
  state,
  update,
  reset,
  onCopy,
}: {
  state: TickerSettings;
  update: (k: keyof TickerSettings, v: unknown) => void;
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
              {TICKER_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="fonts" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="fonts">{TICKER_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Size - {state.fontSize}px</span><input type="range" min={10} max={40} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 16)} className="mt-1 w-full accent-white" /></label>
        </div>
      </div>

      {/* Isi ticker */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Megaphone className="w-4 h-4 text-cyan-400" /> Isi Ticker</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Teks (1 baris = 1 item)</span>
            <textarea value={state.items} onChange={(e) => update('items', e.target.value)} rows={4} placeholder={'Pengumuman 1\nPengumuman 2'} className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Separator</span><input value={state.separator} onChange={(e) => update('separator', e.target.value)} maxLength={4} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Arah</span><select value={state.direction} onChange={(e) => update('direction', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{TICKER_DIRECTIONS.map((d) => <option key={d.value} value={d.value} className="bg-zinc-900">{d.label}</option>)}</select></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Kecepatan - {state.speed}s/loop</span><input type="range" min={5} max={60} value={state.speed} onChange={(e) => update('speed', parseInt(e.target.value) || 20)} className="mt-1 w-full accent-white" /><span className="text-[10px] text-gray-500">Makin kecil makin cepat</span></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Badge (pill INFO)</span><input type="checkbox" checked={state.showBadge} onChange={(e) => update('showBadge', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          {state.showBadge && (
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Teks Badge</span><input value={state.badgeText} onChange={(e) => update('badgeText', e.target.value)} maxLength={12} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
          )}
        </div>
      </div>

      {state.theme === 'brutalist' && (
        <BrutalistSettingsSection state={state as unknown as Record<string, unknown>} update={update as unknown as (k: string, v: unknown) => void} />
      )}

      {/* Warna */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" /> Warna</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Accent</span><input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span><div className="mt-1 flex gap-1"><input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={(e) => update('bg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('bg', 'transparent')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${state.bg === 'transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></div></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Teks</span><div className="mt-1 flex gap-1"><input type="color" value={state.textColor || '#ffffff'} onChange={(e) => update('textColor', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('textColor', '')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${!state.textColor ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Auto</button></div><span className="text-[10px] text-gray-500">Auto = bawaan tiap tema</span></label>
        </div>
      </div>

      {/* Posisi - Global */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={state.pos || 'b'} onChange={(v) => update('pos', v)} />
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3">
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-3">
          <div className="text-cyan-300 font-black uppercase text-[10px]">Cara Pakai di OBS</div>
          <div className="text-gray-400 text-[11px] leading-relaxed mt-1">Copy URL di atas → OBS → Browser Source (lebar 800+, tinggi 80) → teks jalan loop otomatis. Cocok untuk pengumuman, sponsor, atau rules di bawah layar.</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={reset} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
        <button onClick={onCopy} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5" /> Copy URL</button>
      </div>
    </>
  );
}
