'use client';

import { Palette, Target, Type, Clock, Monitor } from 'lucide-react';
import { GOALS_THEMES, GOALS_FONTS, GOAL_TYPES, GOALS_ANIMS, type GoalsSettings } from '../config';
import { PositionPicker } from '../../_shared/components/PositionPicker';

type Props = {
  state: GoalsSettings;
  update: (k: keyof GoalsSettings, v: unknown) => void;
};

export function GoalSettingsForm({ state, update }: Props) {
  return (
    <>
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {GOALS_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font</span>
            <input list="goals-fonts" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Outfit" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="goals-fonts">{GOALS_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Size</span><input type="number" min={10} max={48} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 16)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Accent</span><span className="mt-1 flex gap-2"><input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" /><input type="text" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" /></span></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span><span className="mt-1 flex gap-2"><input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={(e) => update('bg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" /><button onClick={() => update('bg', 'transparent')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${state.bg === 'transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></span></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi</span><select value={state.anim} onChange={(e) => update('anim', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{GOALS_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select></label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" /> Goal</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Jenis Goal</span>
            <select value={state.goalType} onChange={(e) => {
              const v = e.target.value;
              const titles: Record<string,string> = { follow: 'Follower Goal', subs: 'Subscriber Goal', like: 'Like Goal' };
              update('goalType', v);
              update('title', titles[v] || v);
            }} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {GOAL_TYPES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
            </select>
            <span className="text-[10px] text-gray-500 mt-1 block">
              {state.goalType === 'follow' && 'Follow TikTok + Twitch + YouTube + Kick'}
              {state.goalType === 'subs' && 'Subs / Member / GiftSub (Twitch/YouTube/Kick + TikTok)'}
              {state.goalType === 'like' && 'Like TikTok (❤️)'}
            </span>
          </label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Judul Goal</span><input type="text" value={state.title} onChange={(e) => update('title', e.target.value)} placeholder="Follower Goal" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Target</span><input type="number" min={1} max={100000} value={state.target} onChange={(e) => update('target', Math.max(1, parseInt(e.target.value) || 1))} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Saat Ini</span><input type="number" min={0} max={100000} value={state.current} onChange={(e) => update('current', Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
          </div>
          <p className="text-[10px] text-gray-500">Current bertambah otomatis dari livestream (follow/subs/like). Bisa juga edit manual.</p>
        </div>
      </div>

      {state.theme === 'brutalist' && (
        <div className="space-y-3">
          <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-yellow-400" /> Brutalist — Neo Brutalist</h2>
          <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
            <div>
              <span className="text-[11px] font-bold text-gray-300">Preset Cepat</span>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    update('brutalistBg' as any, '#FFFFFF');
                    update('brutalistTextColor' as any, '#000000');
                    update('brutalistBadgeBg' as any, '#FFFFFF');
                    update('brutalistBorderColor' as any, '#000000');
                  }}
                  className="p-2 bg-white text-black text-[10px] font-black border-2 border-black"
                >
                  Classic White
                </button>
                <button
                  onClick={() => {
                    update('brutalistBg' as any, '#FFE600');
                    update('brutalistTextColor' as any, '#000000');
                    update('brutalistBadgeBg' as any, '#00E5FF');
                    update('brutalistBorderColor' as any, '#000000');
                  }}
                  className="p-2 bg-[#FFE600] text-black text-[10px] font-black border-2 border-black"
                >
                  Cyber Yellow
                </button>
                <button
                  onClick={() => {
                    update('brutalistBg' as any, '#FF6B8B');
                    update('brutalistTextColor' as any, '#FFFFFF');
                    update('brutalistBadgeBg' as any, '#000000');
                    update('brutalistBorderColor' as any, '#000000');
                  }}
                  className="p-2 bg-[#FF6B8B] text-black text-[10px] font-black border-2 border-black"
                >
                  Pop Pink
                </button>
                <button
                  onClick={() => {
                    update('brutalistBg' as any, '#18181B');
                    update('brutalistTextColor' as any, '#FFFFFF');
                    update('brutalistBadgeBg' as any, '#FFE600');
                    update('brutalistBorderColor' as any, '#000000');
                  }}
                  className="p-2 bg-black text-white text-[10px] font-black border-2 border-white"
                >
                  Manga Dark
                </button>
                <button
                  onClick={() => {
                    update('brutalistBg' as any, '#00F5D4');
                    update('brutalistTextColor' as any, '#000000');
                    update('brutalistBadgeBg' as any, '#FFFFFF');
                    update('brutalistBorderColor' as any, '#000000');
                  }}
                  className="p-2 bg-[#00F5D4] text-black text-[10px] font-black border-2 border-black"
                >
                  Vibrant Mint
                </button>
                <button
                  onClick={() => {
                    update('brutalistBg' as any, '#9D4EDD');
                    update('brutalistTextColor' as any, '#FFFFFF');
                    update('brutalistBadgeBg' as any, '#00E5FF');
                    update('brutalistBorderColor' as any, '#000000');
                  }}
                  className="p-2 bg-[#9D4EDD] text-white text-[10px] font-black border-2 border-black"
                >
                  Neo Violet
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] font-bold text-gray-300">Bubble BG</span>
                <span className="mt-1 flex gap-2">
                  <input type="color" value={(state as any).brutalistBg || '#FFFFFF'} onChange={(e) => update('brutalistBg' as any, e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
                  <input type="text" value={(state as any).brutalistBg || '#FFFFFF'} onChange={(e) => update('brutalistBg' as any, e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
                </span>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-gray-300">Text</span>
                <span className="mt-1 flex gap-2">
                  <input type="color" value={(state as any).brutalistTextColor || '#000000'} onChange={(e) => update('brutalistTextColor' as any, e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
                  <input type="text" value={(state as any).brutalistTextColor || '#000000'} onChange={(e) => update('brutalistTextColor' as any, e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
                </span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] font-bold text-gray-300">Badge BG</span>
                <span className="mt-1 flex gap-2">
                  <input type="color" value={(state as any).brutalistBadgeBg || '#FFFFFF'} onChange={(e) => update('brutalistBadgeBg' as any, e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
                  <input type="text" value={(state as any).brutalistBadgeBg || '#FFFFFF'} onChange={(e) => update('brutalistBadgeBg' as any, e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
                </span>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-gray-300">Border</span>
                <span className="mt-1 flex gap-2">
                  <input type="color" value={(state as any).brutalistBorderColor || '#000000'} onChange={(e) => update('brutalistBorderColor' as any, e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
                  <input type="text" value={(state as any).brutalistBorderColor || '#000000'} onChange={(e) => update('brutalistBorderColor' as any, e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
                </span>
              </label>
            </div>
            <label className="block">
              <span className="text-[11px] font-bold text-gray-300">Shadow — {(state as any).brutalistShadow ?? 6}px</span>
              <input type="range" min={0} max={14} value={(state as any).brutalistShadow ?? 6} onChange={(e) => update('brutalistShadow' as any, parseInt(e.target.value) || 6)} className="mt-1 w-full accent-white cursor-pointer" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
                <span className="text-[11px] font-bold text-white">Halftone</span>
                <input type="checkbox" checked={(state as any).brutalistHalftone ?? true} onChange={(e) => update('brutalistHalftone' as any, e.target.checked)} className="w-4 h-4 accent-white" />
              </label>
              <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
                <span className="text-[11px] font-bold text-white">Tail</span>
                <input type="checkbox" checked={(state as any).brutalistTail ?? true} onChange={(e) => update('brutalistTail' as any, e.target.checked)} className="w-4 h-4 accent-white" />
              </label>
              <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
                <span className="text-[11px] font-bold text-white">Italic</span>
                <input type="checkbox" checked={(state as any).brutalistItalic ?? true} onChange={(e) => update('brutalistItalic' as any, e.target.checked)} className="w-4 h-4 accent-white" />
              </label>
              <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
                <span className="text-[11px] font-bold text-white">UPPERCASE</span>
                <input type="checkbox" checked={(state as any).brutalistUppercase ?? true} onChange={(e) => update('brutalistUppercase' as any, e.target.checked)} className="w-4 h-4 accent-white" />
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Type className="w-4 h-4 text-cyan-400" /> Tampilan</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-3 gap-2">
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Label</span><input type="checkbox" checked={state.showLabel} onChange={(e) => update('showLabel', e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Angka</span><input type="checkbox" checked={state.showCounts} onChange={(e) => update('showCounts', e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Bar</span><input type="checkbox" checked={state.showBar} onChange={(e) => update('showBar', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={(state as unknown as { pos: string }).pos || 'center'} onChange={(v) => update('pos' as keyof GoalsSettings, v)} />
        </div>
      </div>
    </>
  );
}
