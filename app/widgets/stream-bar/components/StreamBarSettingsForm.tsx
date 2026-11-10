'use client';

import { Copy, Gamepad2, ListChecks, Palette, Plus, Radio, Sparkles, Target, Trash2 } from 'lucide-react';
import {
  STREAM_BAR_ACTIVITY_PRESETS,
  STREAM_BAR_FONTS,
  STREAM_BAR_GOAL_FORMATS,
  STREAM_BAR_GOAL_KINDS,
  STREAM_BAR_RULE_ICONS,
  STREAM_BAR_THEMES,
  type StreamBarSettings,
} from '../config';
import type { StreamBarGoal, StreamBarRule } from '../themes/types';

const inputClass = 'mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white';
const labelClass = 'block text-[11px] font-bold text-gray-300';

function num(value: string, fallback = 0): number {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

export function StreamBarSettingsForm({
  state,
  update,
  reset,
  onCopy,
}: {
  state: StreamBarSettings;
  update: (k: keyof StreamBarSettings, v: unknown) => void;
  reset: () => void;
  privateKey: string;
  onCopy: () => void;
}) {
  const setRule = (index: number, patch: Partial<StreamBarRule>) => {
    update('rules', state.rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  };
  const addRule = () => update('rules', [...state.rules, { icon: 'none', html: 'New rule' }]);
  const removeRule = (index: number) => update('rules', state.rules.filter((_, i) => i !== index));

  const setGoal = (index: number, patch: Partial<StreamBarGoal>) => {
    update('goals', state.goals.map((goal, i) => (i === index ? { ...goal, ...patch } : goal)));
  };
  const addGoal = () => update('goals', [...state.goals, { label: 'New goal', current: 0, target: 100, next: 0, unit: '', fmt: 'num', kind: 'custom' }]);
  const removeGoal = (index: number) => update('goals', state.goals.filter((_, i) => i !== index));

  return (
    <>
      {/* Tema & Font */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className={inputClass}>
              {STREAM_BAR_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="stream-bar-fonts" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className={inputClass} />
            <datalist id="stream-bar-fonts">{STREAM_BAR_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Accent (teal)</span>
            <span className="mt-1 flex gap-2">
              <input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
              <input type="text" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
            </span>
          </label>
        </div>
      </div>

      {/* Welcome */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-300" /> Welcome</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block"><span className={labelClass}>Label</span><input value={state.welcomeLabel} onChange={(e) => update('welcomeLabel', e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Judul</span><input value={state.welcomeTitle} onChange={(e) => update('welcomeTitle', e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Subjudul</span><input value={state.welcomeSub} onChange={(e) => update('welcomeSub', e.target.value)} className={inputClass} /></label>
        </div>
      </div>

      {/* Rules marquee */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><ListChecks className="w-4 h-4 text-emerald-300" /> Rules Marquee</h2>
        <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
          {state.rules.map((rule, index) => (
            <div key={index} className="space-y-2 bg-black/30 border border-white/5 rounded-xl p-2.5">
              <div className="flex gap-2 items-center">
                <select value={rule.icon} onChange={(e) => setRule(index, { icon: e.target.value as StreamBarRule['icon'] })} className="h-8 w-28 bg-black/40 border border-white/10 rounded-lg px-2 text-[11px] text-white">
                  {STREAM_BAR_RULE_ICONS.map((icon) => <option key={icon.value} value={icon.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{icon.label}</option>)}
                </select>
                <input value={rule.html} onChange={(e) => setRule(index, { html: e.target.value })} placeholder="Teks rules…" className="flex-1 h-8 bg-black/40 border border-white/10 rounded-lg px-2.5 text-[12px] text-white" />
                <button type="button" onClick={() => removeRule(index)} className="w-8 h-8 shrink-0 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-lg text-gray-400 hover:text-red-300 flex items-center justify-center" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[9px] text-gray-500">Boleh pakai <code className="bg-white/10 px-1 rounded text-white">&lt;b&gt;teks&lt;/b&gt;</code> untuk bold.</p>
            </div>
          ))}
          <button type="button" onClick={addRule} className="w-full h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300 flex items-center justify-center gap-1.5"><Plus className="w-3 h-3" /> Tambah rule</button>
        </div>
      </div>

      {/* Aktivitas */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Radio className="w-4 h-4 text-pink-400" /> Kartu Aktivitas</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className={labelClass}>Preset</span>
            <select value={state.activityPreset} onChange={(e) => update('activityPreset', e.target.value)} className={inputClass}>
              {STREAM_BAR_ACTIVITY_PRESETS.map((p) => <option key={p.value} value={p.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{p.label}</option>)}
            </select>
          </label>
          <label className="block"><span className={labelClass}>Judul (kosong = preset)</span><input value={state.activityTitle} onChange={(e) => update('activityTitle', e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Subjudul (kosong = preset)</span><input value={state.activitySub} onChange={(e) => update('activitySub', e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Gambar cover (URL)</span><input value={state.activityImage} onChange={(e) => update('activityImage', e.target.value)} placeholder="https://…" className={inputClass} /></label>
        </div>
      </div>

      {/* Game */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Gamepad2 className="w-4 h-4 text-violet-300" /> Kartu Game</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">Aktifkan kartu game <span className="text-[9px] font-normal text-gray-400 block">Bergantian dengan now playing tiap 9 detik</span></span>
            <input type="checkbox" checked={state.gameActive} onChange={(e) => update('gameActive', e.target.checked)} className="w-4 h-4 accent-white shrink-0" />
          </label>
          <label className="block"><span className={labelClass}>Nama game</span><input value={state.gameName} onChange={(e) => update('gameName', e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Genre</span><input value={state.gameGenre} onChange={(e) => update('gameGenre', e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Cover game (URL)</span><input value={state.gameCover} onChange={(e) => update('gameCover', e.target.value)} placeholder="https://…" className={inputClass} /></label>
        </div>
      </div>

      {/* Live info */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-amber-300" /> Info Live</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className={labelClass}>Mulai live</span>
            <input type="datetime-local" value={toLocalInput(state.start)} onChange={(e) => update('start', fromLocalInput(e.target.value))} className={inputClass} />
            <span className="text-[10px] text-gray-500">Kosong = ikut jam OBS dari dock. Sebelum dock mengirim durasi, dihitung sejak overlay dibuka (demo memakai contoh 1j 42m).</span>
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => update('start', new Date().toISOString())} className="h-8 flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Set sekarang</button>
            <button type="button" onClick={() => update('start', '')} className="h-8 flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Kosongkan</button>
          </div>
          <label className="block"><span className={labelClass}>Viewers awal (fallback)</span><input type="number" min={0} value={state.viewers} onChange={(e) => update('viewers', num(e.target.value, 0))} className={inputClass} /><span className="text-[10px] text-gray-500">0 = pakai data real TikTok + Streamer.bot (total semua platform). Angka ini hanya tampil sebelum data real masuk.</span></label>
        </div>
      </div>

      {/* Goals */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-emerald-300" /> Goals</h2>
        <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
          {state.goals.map((goal, index) => (
            <div key={index} className="space-y-2 bg-black/30 border border-white/5 rounded-xl p-2.5">
              <div className="flex gap-2 items-center">
                <input value={goal.label} onChange={(e) => setGoal(index, { label: e.target.value })} placeholder="Label goal" className="flex-1 h-8 bg-black/40 border border-white/10 rounded-lg px-2.5 text-[12px] text-white" />
                <button type="button" onClick={() => removeGoal(index)} className="w-8 h-8 shrink-0 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-lg text-gray-400 hover:text-red-300 flex items-center justify-center" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block"><span className="text-[10px] font-bold text-gray-400">Update live dari</span>
                  <select value={goal.kind} onChange={(e) => setGoal(index, { kind: e.target.value as StreamBarGoal['kind'] })} className="mt-1 w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[11px] text-white">
                    {STREAM_BAR_GOAL_KINDS.map((k) => <option key={k.value} value={k.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{k.label}</option>)}
                  </select>
                </label>
                <label className="block"><span className="text-[10px] font-bold text-gray-400">Format</span>
                  <select value={goal.fmt} onChange={(e) => setGoal(index, { fmt: e.target.value as StreamBarGoal['fmt'] })} className="mt-1 w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[11px] text-white">
                    {STREAM_BAR_GOAL_FORMATS.map((f) => <option key={f.value} value={f.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{f.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="block"><span className="text-[10px] font-bold text-gray-400">Current</span><input type="number" min={0} value={goal.current} onChange={(e) => setGoal(index, { current: Math.max(0, num(e.target.value, 0)) })} className="mt-1 w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[11px] text-white" /></label>
                <label className="block"><span className="text-[10px] font-bold text-gray-400">Target</span><input type="number" min={1} value={goal.target} onChange={(e) => setGoal(index, { target: Math.max(1, num(e.target.value, 1)) })} className="mt-1 w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[11px] text-white" /></label>
                <label className="block"><span className="text-[10px] font-bold text-gray-400">Next</span><input type="number" min={0} value={goal.next} onChange={(e) => setGoal(index, { next: Math.max(0, num(e.target.value, 0)) })} className="mt-1 w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[11px] text-white" /></label>
              </div>
              <label className="block"><span className="text-[10px] font-bold text-gray-400">Unit (contoh: followers / subs)</span><input value={goal.unit} onChange={(e) => setGoal(index, { unit: e.target.value })} className="mt-1 w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-[11px] text-white" /></label>
            </div>
          ))}
          <button type="button" onClick={addGoal} className="w-full h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300 flex items-center justify-center gap-1.5"><Plus className="w-3 h-3" /> Tambah goal</button>
          <p className="text-[10px] text-gray-500">Tipe live menambah <b>current</b> otomatis dari event follow/sub/like/donasi real. Goal donasi juga menghitung total historis <code className="bg-white/10 px-1 rounded text-white">donation_logs</code> milik private key. Saat target tercapai, alert “Goal reached” muncul.</p>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-sky-300" /> Tampilan & Rotasi</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className={labelClass}>Gaya progress goal</span>
            <select value={state.goalStyle} onChange={(e) => update('goalStyle', e.target.value)} className={inputClass}>
              <option value="radial" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Radial (ring)</option>
              <option value="bar" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Bar</option>
            </select>
          </label>
          <label className="block"><span className={labelClass}>Rotasi goal - {Math.round(state.goalRotateMs / 1000)}s</span><input type="range" min={2000} max={20000} step={500} value={state.goalRotateMs} onChange={(e) => update('goalRotateMs', num(e.target.value, 6000))} className="mt-1 w-full accent-white cursor-pointer" /></label>
          <label className="block"><span className={labelClass}>Durasi alert - {Math.round(state.alertMs / 1000)}s</span><input type="range" min={3000} max={15000} step={500} value={state.alertMs} onChange={(e) => update('alertMs', num(e.target.value, 7000))} className="mt-1 w-full accent-white cursor-pointer" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">Demo mode <span className="text-[9px] font-normal text-gray-400 block">Putar contoh aktivitas, musik, game, dan alert. Untuk preview.</span></span>
            <input type="checkbox" checked={state.demo} onChange={(e) => update('demo', e.target.checked)} className="w-4 h-4 accent-white shrink-0" />
          </label>
          <p className="text-[10px] text-gray-500">Overlay OBS normalnya pakai <code className="bg-white/10 px-1 rounded text-white">demo=0</code> supaya hanya event live yang tampil.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={reset} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
        <button onClick={onCopy} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5" /> Copy URL</button>
      </div>
    </>
  );
}
