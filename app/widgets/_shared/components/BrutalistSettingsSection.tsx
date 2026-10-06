'use client';
import { BRUTALIST_PRESETS } from '../constants/brutalist';

type Props = {
  state: Record<string, unknown>;
  update: (k: string, v: unknown) => void;
};

export function BrutalistSettingsSection({ state, update }: Props) {
  const bg = (state.brutalistBg as string) || '#FFFFFF';
  const textColor = (state.brutalistTextColor as string) || '#000000';
  const badgeBg = (state.brutalistBadgeBg as string) || '#FFFFFF';
  const borderColor = (state.brutalistBorderColor as string) || '#000000';
  const shadow = (state.brutalistShadow as number) ?? 6;
  const halftone = (state.brutalistHalftone as boolean) ?? true;
  const tail = (state.brutalistTail as boolean) ?? true;
  const italic = (state.brutalistItalic as boolean) ?? true;
  const uppercase = (state.brutalistUppercase as boolean) ?? true;

  return (
    <div className="space-y-3">
      <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"> Brutalist — Neo Brutalist</h2>
      <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
        <div>
          <span className="text-[11px] font-bold text-gray-300">Preset Cepat</span>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {BRUTALIST_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  update('brutalistBg', preset.bg);
                  update('brutalistTextColor', preset.text);
                  update('brutalistBadgeBg', preset.badge);
                  update('brutalistBorderColor', preset.border);
                }}
                className="p-2 text-[10px] font-black border-2 border-black hover:opacity-90"
                style={{ background: preset.bg, color: preset.text }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Bubble Background</span>
            <span className="mt-1 flex gap-2">
              <input type="color" value={bg} onChange={(e) => update('brutalistBg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
              <input type="text" value={bg} onChange={(e) => update('brutalistBg', e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
            </span>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Text Color</span>
            <span className="mt-1 flex gap-2">
              <input type="color" value={textColor} onChange={(e) => update('brutalistTextColor', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
              <input type="text" value={textColor} onChange={(e) => update('brutalistTextColor', e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
            </span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Badge BG</span>
            <span className="mt-1 flex gap-2">
              <input type="color" value={badgeBg} onChange={(e) => update('brutalistBadgeBg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
              <input type="text" value={badgeBg} onChange={(e) => update('brutalistBadgeBg', e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
            </span>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Border Color</span>
            <span className="mt-1 flex gap-2">
              <input type="color" value={borderColor} onChange={(e) => update('brutalistBorderColor', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
              <input type="text" value={borderColor} onChange={(e) => update('brutalistBorderColor', e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
            </span>
          </label>
        </div>
        <label className="block">
          <span className="text-[11px] font-bold text-gray-300">Shadow Offset — {shadow}px</span>
          <input type="range" min={0} max={14} value={shadow} onChange={(e) => update('brutalistShadow', parseInt(e.target.value) || 6)} className="mt-1 w-full accent-white cursor-pointer" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">Halftone Dots</span>
            <input type="checkbox" checked={halftone} onChange={(e) => update('brutalistHalftone', e.target.checked)} className="w-4 h-4 accent-white" />
          </label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">Bubble Tail</span>
            <input type="checkbox" checked={tail} onChange={(e) => update('brutalistTail', e.target.checked)} className="w-4 h-4 accent-white" />
          </label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">Italic</span>
            <input type="checkbox" checked={italic} onChange={(e) => update('brutalistItalic', e.target.checked)} className="w-4 h-4 accent-white" />
          </label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">UPPERCASE</span>
            <input type="checkbox" checked={uppercase} onChange={(e) => update('brutalistUppercase', e.target.checked)} className="w-4 h-4 accent-white" />
          </label>
        </div>
      </div>
    </div>
  );
}
