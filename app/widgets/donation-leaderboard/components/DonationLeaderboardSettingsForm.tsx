'use client';

import { Palette, Monitor, Copy, Trophy } from 'lucide-react';
import { DONATION_LEADERBOARD_THEMES, DONATION_LEADERBOARD_PERIODS, type DonationLeaderboardSettings } from '../config';
import { WIDGET_FONTS } from '../../_shared/constants/fonts';
import { PositionPicker } from '../../_shared/components/PositionPicker';
import { BrutalistSettingsSection } from '../../_shared/components/BrutalistSettingsSection';

export function DonationLeaderboardSettingsForm({
  state,
  update,
  reset,
  onCopy,
}: {
  state: DonationLeaderboardSettings;
  update: (k: keyof DonationLeaderboardSettings, v: unknown) => void;
  reset: () => void;
  privateKey: string;
  onCopy: () => void;
}) {
  const textColorKey: keyof DonationLeaderboardSettings =
    state.theme === 'brutalist' ? 'brutalistTextColor' : 'textColor';
  const textColor = state[textColorKey] as string;

  return (
    <>
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {DONATION_LEADERBOARD_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="fonts" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="fonts">{WIDGET_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Size - {state.fontSize}px</span><input type="range" min={10} max={32} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 16)} className="mt-1 w-full accent-white" /></label>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Leaderboard</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Judul</span><input value={state.title} onChange={(e) => update('title', e.target.value)} maxLength={30} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Periode</span>
              <select value={(state as any).period || 'all'} onChange={(e) => update('period' as any, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                {DONATION_LEADERBOARD_PERIODS.map((p) => <option key={p.value} value={p.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{p.label}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Top N</span><input type="number" min={1} max={10} value={state.limit} onChange={(e) => update('limit', Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Min Rp</span><input type="number" min={0} value={state.minAmount} onChange={(e) => update('minAmount', Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
          <div className="grid grid-cols-3 gap-2">
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white text-center flex-1">Rp</span><input type="checkbox" checked={state.showAmount} onChange={(e) => update('showAmount', e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white text-center flex-1">Platform</span><input type="checkbox" checked={state.showPlatform} onChange={(e) => update('showPlatform', e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white text-center flex-1">Avatar</span><input type="checkbox" checked={state.showAvatar} onChange={(e) => update('showAvatar', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          </div>
        </div>
      </div>

      {state.theme === 'brutalist' && (
        <BrutalistSettingsSection state={state as unknown as Record<string, unknown>} update={update as unknown as (k: string, v: unknown) => void} />
      )}

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" /> Warna</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Accent</span><input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span><div className="mt-1 flex gap-1"><input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={(e) => update('bg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('bg', 'transparent')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${state.bg === 'transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Trans</button></div></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Teks</span><div className="mt-1 flex gap-1"><input type="color" value={textColor || (state.theme === 'brutalist' ? '#000000' : '#ffffff')} onChange={(e) => update(textColorKey, e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update(textColorKey, '')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${!textColor ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Auto</button></div></label>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={state.pos || 'center'} onChange={(v) => update('pos', v)} />
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3">
        <div className="text-amber-300 font-black uppercase text-[10px]">Top Donatur — Filter Tanggal</div>
        <div className="text-gray-400 text-[11px] leading-relaxed mt-1">Filter <b className="text-white">hari ini/kemarin/minggu/bulan/semua</b> pakai <code className="bg-white/10 px-1 rounded text-white">created_at</code> per donasi (50 terakhir per room + live). Top by total Rp.</div>
      </div>

      <div className="flex gap-2">
        <button onClick={reset} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
        <button onClick={onCopy} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5" /> Copy URL</button>
      </div>
    </>
  );
}
