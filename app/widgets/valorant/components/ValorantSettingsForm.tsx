'use client';

import { Palette, Monitor, Copy, User, Eye } from 'lucide-react';
import { VALORANT_FONTS, VALORANT_THEMES, type ValorantSettings } from '../config';
import { PositionPicker } from '../../_shared/components/PositionPicker';
import { BrutalistSettingsSection } from '../../_shared/components/BrutalistSettingsSection';

export function ValorantSettingsForm({
  state,
  update,
  reset,
  onCopy,
}: {
  state: ValorantSettings;
  update: (k: keyof ValorantSettings, v: unknown) => void;
  reset: () => void;
  onCopy: () => void;
}) {
  return (
    <>
      {/* Akun Valorant */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><User className="w-4 h-4 text-white" /> Akun Valorant</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-bold text-gray-300">Username</span>
              <input value={state.username} onChange={(e) => update('username', e.target.value)} placeholder="adilonapsh" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-gray-300">Tag</span>
              <input value={state.tag} onChange={(e) => update('tag', e.target.value)} placeholder="7580" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-bold text-gray-300">Region</span>
              <select value={state.region} onChange={(e) => update('region', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                {['ap', 'na', 'eu', 'latam', 'br', 'kr'].map((r) => <option key={r} value={r} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{r}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-gray-300">Platform</span>
              <select value={state.platform} onChange={(e) => update('platform', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                <option value="pc" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">pc</option>
                <option value="console" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">console</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-bold text-gray-300">View</span>
              <select value={state.view} onChange={(e) => update('view', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                <option value="regular" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Regular - Card</option>
                <option value="mini" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Mini - Overlay</option>
                <option value="circle" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Circle - RR Ring</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-gray-300">Refresh (detik)</span>
              <input type="number" min={0} max={300} value={state.refresh} onChange={(e) => update('refresh', parseInt(e.target.value, 10) || 0)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
              <span className="text-[10px] text-gray-500">0 = auto-refresh mati</span>
            </label>
          </div>
        </div>
      </div>

      {/* Tema & Font */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Theme</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {VALORANT_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="valorant-fonts" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="valorant-fonts">{VALORANT_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
        </div>
      </div>

      {/* Warna */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" /> Warna</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Accent {state.theme === 'auto' ? '(dipakai saat theme = custom)' : ''}</span>
            <span className="mt-1 flex gap-2">
              <input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
              <input type="text" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
            </span>
          </label>
          <p className="text-[10px] text-gray-500">Mode <code className="bg-white/10 px-1 rounded text-white">auto</code> = W/L, winrate, streak & glow ngikut warna tier rank. Mode <code className="bg-white/10 px-1 rounded text-white">custom</code> = pakai accent ini. Mode <code className="bg-white/10 px-1 rounded text-white">brutalist</code> = skin neo-brutalist (aksen ngikut warna tier). Mode <code className="bg-white/10 px-1 rounded text-white">pastel</code> = cute card, BG pastel otomatis ngikut tier.</p>
        </div>
      </div>

      {/* Brutalist- Neo Brutalist */}
      {state.theme === 'brutalist' && (
        <BrutalistSettingsSection
          state={state as unknown as Record<string, unknown>}
          update={update as unknown as (k: string, v: unknown) => void}
        />
      )}

      {/* Pastel- sumber warna */}
      {state.theme === 'pastel' && (
        <div className="space-y-3">
          <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-pink-300" /> Pastel- Cute Card</h2>
          <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
            <label className="block">
              <span className="text-[11px] font-bold text-gray-300">Sumber Warna</span>
              <select value={state.pastelMode} onChange={(e) => update('pastelMode', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                <option value="tier" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Tier - otomatis ngikut rank</option>
                <option value="custom" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Custom - warna pilihan sendiri</option>
              </select>
            </label>
            {state.pastelMode === 'custom' && (
              <label className="block">
                <span className="text-[11px] font-bold text-gray-300">Warna Pastel</span>
                <span className="mt-1 flex gap-2">
                  <input type="color" value={state.pastelBg} onChange={(e) => update('pastelBg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
                  <input type="text" value={state.pastelBg} onChange={(e) => update('pastelBg', e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
                </span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Posisi - Global */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={(state as unknown as { pos: string }).pos || 'center'} onChange={(v) => update('pos' as keyof ValorantSettings, v)} />
        </div>
      </div>

      {/* Data & tampilan */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Eye className="w-4 h-4 text-cyan-400" /> Data & Tampilan</h2>
        <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
          <ToggleRow label="Win Streak" desc="Baris 🔥 + badge di mini (min. 2 win)" checked={Boolean(state.showStreak)} onChange={(v) => update('showStreak', v)} />
          <ToggleRow label="Winrate" desc="Angka % di samping W/L" checked={Boolean(state.showWinrate)} onChange={(v) => update('showWinrate', v)} />
          <ToggleRow label="Season" desc="Label episode · act di card regular" checked={Boolean(state.showSeason)} onChange={(v) => update('showSeason', v)} />
          <ToggleRow label="Username" desc="Nama Riot ID di header card" checked={Boolean(state.showUsername)} onChange={(v) => update('showUsername', v)} />
          <ToggleRow label="Tag" desc="Tag #0000 di belakang username" checked={Boolean(state.showTag)} onChange={(v) => update('showTag', v)} />
        </div>
      </div>

      <p className="text-[10px] text-gray-500 leading-relaxed text-center">Semua fetch lewat backend <code className="bg-white/10 px-1 rounded text-white">/api/valo/*</code> (server-side, bebas CORS). Auto-refresh {state.refresh > 0 ? `tiap ${state.refresh}s` : 'mati'} + animasi RANK UP/DOWN saat tier berubah.</p>

      <div className="flex gap-2">
        <button onClick={reset} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
        <button onClick={onCopy} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5" /> Copy URL</button>
      </div>
    </>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
      <span className="text-[11px] font-bold text-white">{label}{desc ? <span className="text-[9px] font-normal text-gray-400 block">{desc}</span> : null}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-white shrink-0" />
    </label>
  );
}
