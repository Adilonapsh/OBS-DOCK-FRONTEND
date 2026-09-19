'use client';
import { Palette, Share2, Clock, Type, Eye } from 'lucide-react';
import { SOCIAL_ROTATOR_THEMES, SOCIAL_ROTATOR_ANIMS, SOCIAL_PLATFORMS, type SocialRotatorSettings, type SocialItem, parseSocials } from '../config';
import { WIDGET_FONTS } from '../../_shared/constants/fonts';
import { PositionPicker } from '../../_shared/components/PositionPicker';

export function SocialRotatorSettingsForm({ state, update }: { state: SocialRotatorSettings; update: (k: keyof SocialRotatorSettings, v: unknown) => void }) {
  const socials = parseSocials(state.socialsJson);
  const setSocials = (next: SocialItem[]) => update('socialsJson', JSON.stringify(next));
  const addSocial = () => setSocials([...socials, { id: Math.random().toString(36).slice(2, 6), platform: 'instagram', handle: '@username', label: 'Instagram', accent: '#E4405F' }]);
  const removeSocial = (id: string) => setSocials(socials.filter((s) => s.id !== id));
  const updateSocial = (id: string, patch: Partial<SocialItem>) => setSocials(socials.map((s) => s.id === id ? { ...s, ...patch } : s));

  return (
    <>
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {SOCIAL_ROTATOR_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="fonts-social" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="fonts-social">{WIDGET_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Size</span><input type="number" min={10} max={28} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 14)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi</span><select value={state.anim} onChange={(e) => update('anim', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{SOCIAL_ROTATOR_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select></label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" /> Warna</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Accent</span><input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Text Color</span><input type="color" value={state.textColor} onChange={(e) => update('textColor', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span><div className="mt-1 flex gap-1"><input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={(e) => update('bg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('bg', 'transparent')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${state.bg === 'transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></div></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Opacity - {state.bgOpacity}%</span><input type="range" min={10} max={100} value={state.bgOpacity} onChange={(e) => update('bgOpacity', parseInt(e.target.value))} className="mt-1 w-full accent-white" /></label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Share2 className="w-4 h-4 text-sky-400" /> Socials</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          {socials.map((s) => (
            <div key={s.id} className="bg-black/30 border border-white/10 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <select value={s.platform} onChange={(e) => updateSocial(s.id, { platform: e.target.value, label: SOCIAL_PLATFORMS.find((p) => p.value === e.target.value)?.label || e.target.value })} className="flex-1 h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white">
                  {SOCIAL_PLATFORMS.map((p) => <option key={p.value} value={p.value} className="bg-zinc-900">{p.label}</option>)}
                </select>
                <input type="color" value={s.accent || state.accent} onChange={(e) => updateSocial(s.id, { accent: e.target.value })} className="w-8 h-8 rounded-lg p-1 bg-black/40 border border-white/10" />
                <button onClick={() => removeSocial(s.id)} className="h-8 px-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 rounded-lg text-[10px] font-black text-red-300">Hapus</button>
              </div>
              <input value={s.handle} onChange={(e) => updateSocial(s.id, { handle: e.target.value })} placeholder="@username" className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-sm text-white" />
              <input value={s.label || ''} onChange={(e) => updateSocial(s.id, { label: e.target.value })} placeholder="Label (Instagram)" className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white" />
            </div>
          ))}
          <button onClick={addSocial} className="w-full h-8 bg-white text-black rounded-xl text-xs font-black uppercase">+ Tambah Social</button>
          <div className="text-[10px] text-gray-500">Maks 10 • drag belum support, urutan sesuai list.</div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Rotasi</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Durasi per item (detik)</span><input type="number" min={2} max={20} value={state.duration} onChange={(e) => update('duration', parseInt(e.target.value) || 4)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5"><span className="text-[11px] font-bold text-white">Auto Rotate</span><input type="checkbox" checked={state.autoRotate} onChange={(e) => update('autoRotate', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <div className="grid grid-cols-3 gap-2">
            <label className="flex items-center gap-2 p-2 bg-black/30 rounded-lg border border-white/5 text-[11px] font-bold text-white"><input type="checkbox" checked={state.showIcon} onChange={(e) => update('showIcon', e.target.checked)} className="w-3 h-3 accent-white" /> Icon</label>
            <label className="flex items-center gap-2 p-2 bg-black/30 rounded-lg border border-white/5 text-[11px] font-bold text-white"><input type="checkbox" checked={state.showLabel} onChange={(e) => update('showLabel', e.target.checked)} className="w-3 h-3 accent-white" /> Label</label>
            <label className="flex items-center gap-2 p-2 bg-black/30 rounded-lg border border-white/5 text-[11px] font-bold text-white"><input type="checkbox" checked={state.showHandle} onChange={(e) => update('showHandle', e.target.checked)} className="w-3 h-3 accent-white" /> Handle</label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Eye className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={(state as any).pos || 'center'} onChange={(v) => update('pos', v)} />
        </div>
      </div>
    </>
  );
}
