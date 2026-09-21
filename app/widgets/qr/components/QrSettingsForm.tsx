'use client';

import { QR_THEMES, QR_LEVELS, QR_FONTS, type QrSettings } from '../config';
import { PositionPicker } from '../../_shared/components/PositionPicker';
import { Palette, Type, Monitor, QrCode, ImagePlus, Trash2 } from 'lucide-react';

type Props = {
  state: QrSettings;
  update: (k: keyof QrSettings, v: unknown) => void;
};

export function QrSettingsForm({ state, update }: Props) {
  const handleLogoFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 128;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        update('logo', canvas.toDataURL('image/png'));
        update('showLogo', true);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(f);
  };

  return (
    <>
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><QrCode className="w-4 h-4 text-white" /> Isi QR</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Link / Teks (isi QR)</span>
            <input value={state.value} onChange={(e) => update('value', e.target.value)} placeholder="https://saweria.co/username" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Caption bawah QR</span>
            <input value={state.label} onChange={(e) => update('label', e.target.value)} placeholder="SCAN UNTUK DONASI" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
          </label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Tampilkan caption</span><input type="checkbox" checked={state.showLabel} onChange={(e) => update('showLabel', e.target.checked)} className="w-4 h-4 accent-white" /></label>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><ImagePlus className="w-4 h-4 text-amber-400" /> Logo Tengah</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          {state.logo ? (
            <div className="flex items-center gap-3 p-2.5 bg-black/30 rounded-xl border border-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.logo} alt="logo QR" className="w-12 h-12 rounded-lg object-contain bg-white p-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-white text-[11px] font-bold truncate">Logo terpasang</div>
                <div className="text-gray-500 text-[10px]">ECC otomatis H agar tetap ke-scan</div>
              </div>
              <button onClick={() => update('logo', '')} className="p-2 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-xl text-gray-400 hover:text-red-400" title="Hapus logo">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-1.5 p-4 bg-black/30 rounded-xl border border-dashed border-white/15 cursor-pointer hover:border-white/30 hover:bg-black/50">
              <ImagePlus className="w-5 h-5 text-gray-400" />
              <span className="text-[11px] font-bold text-gray-300">Upload logo (PNG/JPG)</span>
              <span className="text-[10px] text-gray-500">Otomatis dikompres ≤128px</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleLogoFile(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          )}
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">atau URL gambar</span>
            <input value={state.logo} onChange={(e) => { update('logo', e.target.value); if (e.target.value) update('showLogo', true); }} placeholder="https://…/logo.png" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
          </label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Tampilkan logo</span><input type="checkbox" checked={state.showLogo} onChange={(e) => update('showLogo', e.target.checked)} className="w-4 h-4 accent-white" /></label>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {QR_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="qr-fonts" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="qr-fonts">{QR_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Ukuran caption</span><input type="number" min={10} max={64} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 16)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Ukuran QR (px)</span><input type="number" min={64} max={512} step={8} value={state.size} onChange={(e) => update('size', Math.max(64, Math.min(512, parseInt(e.target.value) || 200)))} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Error Correction</span>
            <select value={state.level} onChange={(e) => update('level', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {QR_LEVELS.map((l) => <option key={l.value} value={l.value} className="bg-zinc-900">{l.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Type className="w-4 h-4 text-violet-400" /> Warna</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Aksen</span>
            <span className="mt-1 flex gap-2">
              <input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 cursor-pointer shrink-0" />
              <input type="text" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">QR depan</span>
              <span className="mt-1 flex gap-2">
                <input type="color" value={state.fg} onChange={(e) => update('fg', e.target.value)} className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 cursor-pointer shrink-0" />
                <input type="text" value={state.fg} onChange={(e) => update('fg', e.target.value)} className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
              </span>
            </label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">QR belakang</span>
              <span className="mt-1 flex gap-2">
                <input type="color" value={state.qrBg} onChange={(e) => update('qrBg', e.target.value)} className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 cursor-pointer shrink-0" />
                <input type="text" value={state.qrBg} onChange={(e) => update('qrBg', e.target.value)} className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
              </span>
            </label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Background card</span>
            <span className="mt-1 flex gap-2">
              <input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={(e) => update('bg', e.target.value)} className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 cursor-pointer shrink-0" />
              <input type="text" value={state.bg} onChange={(e) => update('bg', e.target.value)} placeholder="transparent" className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={(state as unknown as { pos: string }).pos || 'center'} onChange={(v) => update('pos', v)} />
        </div>
      </div>
    </>
  );
}
