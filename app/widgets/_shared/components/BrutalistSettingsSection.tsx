'use client';
import { BRUTALIST_PRESETS } from '../constants/brutalist';

type Props = {
  state: Record<string, unknown>;
  update: (k: string, v: unknown) => void;
};

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <label className="block min-w-0">
      <span className="text-[11px] font-bold text-gray-300 block truncate" title={label}>
        {label}
      </span>
      <div className="mt-1 flex items-center gap-1.5 min-w-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0 cursor-pointer"
        />
        <input
          type="text"
          size={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-white/30"
        />
      </div>
    </label>
  );
}

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
      <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"> Brutalist- Neo Brutalist</h2>
      <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
        <div>
          <span className="text-[11px] font-bold text-gray-300">Preset Cepat</span>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {BRUTALIST_PRESETS.map((preset) => {
              const active =
                bg.toLowerCase() === preset.bg.toLowerCase() &&
                textColor.toLowerCase() === preset.text.toLowerCase() &&
                badgeBg.toLowerCase() === preset.badge.toLowerCase() &&
                borderColor.toLowerCase() === preset.border.toLowerCase();
              return (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => {
                    update('brutalistBg', preset.bg);
                    update('brutalistTextColor', preset.text);
                    update('brutalistBadgeBg', preset.badge);
                    update('brutalistBorderColor', preset.border);
                  }}
                  title={`Bubble ${preset.bg} • Text ${preset.text} • Badge ${preset.badge} • Border ${preset.border}`}
                  className="p-2 text-[10px] font-black border-2 hover:opacity-90 transition-transform hover:-translate-y-0.5"
                  style={{
                    background: preset.bg,
                    color: preset.text,
                    borderColor: preset.border,
                    boxShadow: active
                      ? `0 0 0 2px #ffffff, 0 0 0 4px ${preset.border}`
                      : `2px 2px 0px 0px ${preset.border}`,
                  }}
                >
                  <span className="block truncate">{preset.label}</span>
                  <span className="mt-1 flex items-center justify-center gap-1">
                    <span className="w-2.5 h-2.5 border" style={{ background: preset.badge, borderColor: preset.border }} />
                    <span className="w-2.5 h-2.5 border" style={{ background: preset.border, borderColor: preset.border }} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <ColorField
            label="Bubble Background"
            value={bg}
            onChange={(val) => update('brutalistBg', val)}
          />
          <ColorField
            label="Text Color"
            value={textColor}
            onChange={(val) => update('brutalistTextColor', val)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <ColorField
            label="Badge BG"
            value={badgeBg}
            onChange={(val) => update('brutalistBadgeBg', val)}
          />
          <ColorField
            label="Border Color"
            value={borderColor}
            onChange={(val) => update('brutalistBorderColor', val)}
          />
        </div>
        <label className="block">
          <span className="text-[11px] font-bold text-gray-300">Shadow Offset- {shadow}px</span>
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
