'use client';

import { Palette, Type, Clock, Monitor, Music } from 'lucide-react';
import { MUSIC_THEMES, MUSIC_FONTS, MUSIC_QUEUE_POS, type MusicSettings } from '../config';
import { PositionPicker } from '../../_shared/components/PositionPicker';

type Props = {
  state: MusicSettings;
  update: (k: keyof MusicSettings, v: unknown) => void;
};

export function MusicSettingsForm({ state, update }: Props) {
  return (
    <>
      {/* Tema & Font */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {MUSIC_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="music-fonts" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="music-fonts">{MUSIC_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font Size</span>
            <input type="number" min={10} max={32} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 16)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
          </label>
        </div>
      </div>

      {/* Warna */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Type className="w-4 h-4 text-green-400" /> Warna</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Aksen</span>
            <span className="mt-1 flex gap-2">
              <input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 cursor-pointer shrink-0" />
              <input type="text" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
            </span>
          </label>
        </div>
      </div>

      {/* Tampilan */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> Tampilan</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Queue</span><input type="checkbox" checked={state.showQueue} onChange={(e) => update('showQueue', e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Progress Bar</span><input type="checkbox" checked={state.showProgress} onChange={(e) => update('showProgress', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Max Queue ({state.maxQueue})</span><input type="range" min={1} max={10} step={1} value={state.maxQueue} onChange={(e) => update('maxQueue', parseInt(e.target.value) || 5)} className="mt-1 w-full accent-white cursor-pointer" /></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Posisi Queue</span>
            <select value={(state as unknown as { queuePos: string }).queuePos || 'bottom'} onChange={(e) => update('queuePos' as keyof MusicSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {MUSIC_QUEUE_POS.map((q) => <option key={q.value} value={q.value} className="bg-zinc-900">{q.label}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Auto Hide</span><input type="checkbox" checked={!!(state as unknown as { autoHide: boolean }).autoHide} onChange={(e) => update('autoHide' as keyof MusicSettings, e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Tampil saat Pause</span><input type="checkbox" checked={(state as unknown as { showWhilePaused: boolean }).showWhilePaused !== false} onChange={(e) => update('showWhilePaused' as keyof MusicSettings, e.target.checked)} className="w-4 h-4 accent-white" /></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Durasi Tampil ({(state as unknown as { displayDuration: number }).displayDuration ?? 5}s)</span><input type="range" min={2} max={30} step={1} value={(state as unknown as { displayDuration: number }).displayDuration ?? 5} onChange={(e) => update('displayDuration' as keyof MusicSettings, parseInt(e.target.value) || 5)} className="mt-1 w-full accent-white cursor-pointer" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Masuk</span>
              <select value={(state as unknown as { showAnimation: string }).showAnimation || 'slide-in-from-bottom'} onChange={(e) => update('showAnimation' as keyof MusicSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                {['slide-in-from-bottom', 'slide-in-from-top', 'slide-in-from-left', 'slide-in-from-right', 'fade-in'].map((a) => <option key={a} value={a} className="bg-zinc-900">{a}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Keluar</span>
              <select value={(state as unknown as { hideAnimation: string }).hideAnimation || 'slide-out-bottom'} onChange={(e) => update('hideAnimation' as keyof MusicSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                {['slide-out-bottom', 'slide-out-top', 'slide-out-left', 'slide-out-right', 'fade-out'].map((a) => <option key={a} value={a} className="bg-zinc-900">{a}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Judul</span><input type="checkbox" checked={(state as unknown as { showPrimary: boolean }).showPrimary !== false} onChange={(e) => update('showPrimary' as keyof MusicSettings, e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Peminta</span><input type="checkbox" checked={(state as unknown as { showSecondary: boolean }).showSecondary !== false} onChange={(e) => update('showSecondary' as keyof MusicSettings, e.target.checked)} className="w-4 h-4 accent-white" /></label>
          </div>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Tukar Judul/Peminta</span><input type="checkbox" checked={!!(state as unknown as { swapArtistTrack: boolean }).swapArtistTrack} onChange={(e) => update('swapArtistTrack' as keyof MusicSettings, e.target.checked)} className="w-4 h-4 accent-white" /></label>
        </div>
      </div>

      {/* Warna Kustom */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Type className="w-4 h-4 text-violet-400" /> Warna Kustom</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Aktifkan</span><input type="checkbox" checked={!!(state as unknown as { useCustomColors: boolean }).useCustomColors} onChange={(e) => update('useCustomColors' as keyof MusicSettings, e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Teks/Aksen</span>
              <span className="mt-1 flex gap-2">
                <input type="color" value={(state as unknown as { color1: string }).color1 || '#ffffff'} onChange={(e) => update('color1' as keyof MusicSettings, e.target.value)} className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 cursor-pointer shrink-0" />
                <input type="text" value={(state as unknown as { color1: string }).color1 || '#ffffff'} onChange={(e) => update('color1' as keyof MusicSettings, e.target.value)} className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
              </span>
            </label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span>
              <span className="mt-1 flex gap-2">
                <input type="color" value={(state as unknown as { color2: string }).color2 || '#1d1d1d'} onChange={(e) => update('color2' as keyof MusicSettings, e.target.value)} className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 cursor-pointer shrink-0" />
                <input type="text" value={(state as unknown as { color2: string }).color2 || '#1d1d1d'} onChange={(e) => update('color2' as keyof MusicSettings, e.target.value)} className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
              </span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Lebar Maks (px, 0 = penuh)</span><input type="number" min={0} max={1200} step={10} value={(state as unknown as { maxWidth: number }).maxWidth ?? 500} onChange={(e) => update('maxWidth' as keyof MusicSettings, parseInt(e.target.value) || 0)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Rata Teks</span>
              <select value={(state as unknown as { textAlignment: string }).textAlignment || 'left'} onChange={(e) => update('textAlignment' as keyof MusicSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
                {['left', 'center', 'right'].map((a) => <option key={a} value={a} className="bg-zinc-900">{a}</option>)}
              </select>
            </label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Rata Vertikal</span>
            <select value={(state as unknown as { verticalAlignment: string }).verticalAlignment || 'align-to-center'} onChange={(e) => update('verticalAlignment' as keyof MusicSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {['align-to-top', 'align-to-center', 'align-to-bottom'].map((a) => <option key={a} value={a} className="bg-zinc-900">{a}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Song Request */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Clock className="w-4 h-4 text-green-400" /> Song Request</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Command Chat</span><input type="text" value={state.command} onChange={(e) => update('command', e.target.value)} placeholder="!song" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Filter NSFW</span><input type="checkbox" checked={state.nsfwFilter} onChange={(e) => update('nsfwFilter', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Blacklist Lagu (1 baris 1 kata)</span><textarea value={state.songBlacklist} onChange={(e) => update('songBlacklist', e.target.value)} rows={3} placeholder={"contoh:\ndj remix\nparodi"} className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono" /></label>
          <p className="text-[10px] text-gray-500">Tersimpan ke server (per room). Lagu yang cocok filter/blacklist ditolak otomatis.</p>
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
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Music className="w-4 h-4 text-gray-400" /> Song Request</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <p className="text-[11px] text-gray-500 leading-relaxed">Tambah lagu via chat <span className="text-white font-mono font-bold">!song &lt;url&gt;</span> (YouTube atau MP3 langsung). Kontrol play/pause/next dari dock.</p>
        </div>
      </div>
    </>
  );
}
