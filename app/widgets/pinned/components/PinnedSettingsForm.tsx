'use client';

import { Palette, Type, Clock, Monitor, MessageSquare } from 'lucide-react';
import { PINNED_THEMES, PINNED_FONTS, PINNED_ANIMS, PINNED_BORDER_FX, PINNED_KB_THEMES, PINNED_KB_CAPS, type PinnedSettings } from '../config';
import { PositionPicker } from '../../_shared/components/PositionPicker';

type Props = {
  state: PinnedSettings;
  update: (k: keyof PinnedSettings, v: unknown) => void;
};

export function PinnedSettingsForm({ state, update }: Props) {
  return (
    <>
      {/* Tema & Font */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {PINNED_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="pinned-fonts" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="pinned-fonts">{PINNED_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Size</span><input type="number" min={10} max={32} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 15)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Masuk</span><select value={state.anim} onChange={(e) => update('anim', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{PINNED_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select></label>
          </div>
      {state.theme === 'perchar' && (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-white">Letter Delay <span className="font-mono text-gray-400">{state.charDelayMs}ms</span></span>
            <input type="range" min={0} max={200} step={5} value={state.charDelayMs} onChange={(e) => update('charDelayMs', parseInt(e.target.value) || 0)} className="w-32 accent-white cursor-pointer" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-white">Fade Duration <span className="font-mono text-gray-400">{Number(state.charDurationS).toFixed(2)}s</span></span>
            <input type="range" min={0.05} max={1.5} step={0.05} value={Number(state.charDurationS)} onChange={(e) => update('charDurationS', parseFloat(e.target.value) || 0.35)} className="w-32 accent-white cursor-pointer" />
          </div>
        </>
      )}

      {(state.theme === 'typing' || state.theme === 'monkey') && (
        <>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold text-white">Durasi per Huruf <span className="font-mono text-gray-400">{state.typingMs}ms</span></span>
          <input type="range" min={10} max={500} step={10} value={state.typingMs} onChange={(e) => update('typingMs', parseInt(e.target.value) || 60)} className="w-32 accent-white cursor-pointer" />
        </div>
        {state.theme === 'monkey' && (
        <>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Style Keyboard</span>
            <select value={state.kbTheme} onChange={(e) => update('kbTheme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {PINNED_KB_THEMES.map((k) => (
                <option key={k.value} value={k.value} className="bg-zinc-900">{k.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer self-end"><span className="text-[11px] font-bold text-white">Underglow</span><input type="checkbox" checked={state.kbGlow} onChange={(e) => update('kbGlow', e.target.checked)} className="w-4 h-4 accent-white" /></label>
        </div>
        <label className="block"><span className="text-[11px] font-bold text-gray-300">Style Keycaps</span>
          <select value={state.kbCaps} onChange={(e) => update('kbCaps', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
            {PINNED_KB_CAPS.map((k) => (
              <option key={k.value} value={k.value} className="bg-zinc-900">{k.label}</option>
            ))}
          </select>
        </label>
        </>
        )}
        </>
      )}
        </div>
      </div>

      {/* Warna */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Type className="w-4 h-4 text-violet-400" /> Warna</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
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
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Opacity BG ({state.bgOpacity}%)</span><input type="range" min={10} max={100} step={5} value={state.bgOpacity} onChange={(e) => update('bgOpacity', parseInt(e.target.value) || 100)} className="mt-1 w-full accent-white cursor-pointer" /></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Micro Animation (Border)</span><select value={state.borderFx} onChange={(e) => update('borderFx', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{PINNED_BORDER_FX.map((b) => <option key={b.value} value={b.value} className="bg-zinc-900">{b.label}</option>)}</select></label>
          {state.borderFx !== 'none' && (
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Warna Efek (kosong = ikut aksen)</span>
              <span className="mt-1 flex gap-2">
                <input type="color" value={state.borderFxColor || state.accent} onChange={(e) => update('borderFxColor', e.target.value)} className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 cursor-pointer shrink-0" />
                <input type="text" value={state.borderFxColor} onChange={(e) => update('borderFxColor', e.target.value)} placeholder="ikut aksen" className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
              </span>
            </label>
          )}
          {state.theme === 'monkey' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Teks Aktif</span>
                <span className="mt-1 flex gap-2">
                  <input type="color" value={state.mkText.length === 9 ? state.mkText.slice(0, 7) : state.mkText} onChange={(e) => update('mkText', e.target.value)} className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 cursor-pointer shrink-0" />
                  <input type="text" value={state.mkText} onChange={(e) => update('mkText', e.target.value)} className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
                </span>
              </label>
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Teks Redup</span>
                <span className="mt-1 flex gap-2">
                  <input type="color" value={state.mkDim.length === 9 ? state.mkDim.slice(0, 7) : state.mkDim} onChange={(e) => update('mkDim', e.target.value + '40')} className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 cursor-pointer shrink-0" />
                  <input type="text" value={state.mkDim} onChange={(e) => update('mkDim', e.target.value)} className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Animasi */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> Tampilan</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Avatar</span><input type="checkbox" checked={state.showAvatar} onChange={(e) => update('showAvatar', e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Logo Platform</span><input type="checkbox" checked={state.showPlatform} onChange={(e) => update('showPlatform', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          </div>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Timestamp</span><input type="checkbox" checked={state.showTimestamp} onChange={(e) => update('showTimestamp', e.target.checked)} className="w-4 h-4 accent-white" /></label>
        </div>
      </div>

      {/* Posisi */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={(state as unknown as { pos: string }).pos || 'bl'} onChange={(v) => update('pos', v)} />
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><MessageSquare className="w-4 h-4 text-gray-400" /> Pin</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <p className="text-[11px] text-gray-500 leading-relaxed">Pin chat dari dock (klik pesan → Pin). Widget ini ikut realtime. Unpin dari dock untuk melepas.</p>
        </div>
      </div>
    </>
  );
}
