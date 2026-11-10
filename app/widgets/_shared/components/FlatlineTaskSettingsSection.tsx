'use client';
import { TASK_FLATLINE_PRESETS } from '../constants/flatlineTask';

type Props = {
  state: Record<string, unknown>;
  update: (k: string, v: unknown) => void;
};

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
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

export function FlatlineTaskSettingsSection({ state, update }: Props) {
  const pill = (state.taskFlatPill as string) || '#2b2f4a';
  const bright = (state.taskFlatBright as string) || '#ffffff';
  const dim = (state.taskFlatDim as string) || '#4b5171';
  const line = (state.taskFlatLine as string) || '#ffffff';
  const lineDone = (state.taskFlatLineDone as string) || '#8c92b3';
  const page = (state.taskFlatPage as string) || '#8c90d5';
  const chevron = (state.taskFlatChevron as boolean) ?? true;
  const uppercase = (state.taskFlatUppercase as boolean) ?? true;

  return (
    <div className="space-y-3">
      <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2">Flatline- Task Pill</h2>
      <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
        <div>
          <span className="text-[11px] font-bold text-gray-300">Preset Cepat</span>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {TASK_FLATLINE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  update('taskFlatPill', preset.pill);
                  update('taskFlatBright', preset.bright);
                  update('taskFlatDim', preset.dim);
                  update('taskFlatLine', preset.line);
                  update('taskFlatLineDone', preset.lineDone);
                  update('taskFlatPage', preset.page);
                }}
                className="p-2 text-[10px] font-black rounded-xl border border-white/10 hover:opacity-90"
                style={{ background: preset.pill, color: preset.bright }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-gray-300">Text Color- Terang & Redup (wipe)</span>
          <div className="mt-1 grid grid-cols-2 gap-2.5 sm:gap-3">
            <ColorField label="Bright (aktif)" value={bright} onChange={(val) => update('taskFlatBright', val)} />
            <ColorField label="Dim (selesai)" value={dim} onChange={(val) => update('taskFlatDim', val)} />
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-gray-300">Background Color- Pill & Page</span>
          <div className="mt-1 grid grid-cols-2 gap-2.5 sm:gap-3">
            <ColorField label="Pill (navy)" value={pill} onChange={(val) => update('taskFlatPill', val)} />
            <ColorField label="Page BG (preview)" value={page} onChange={(val) => update('taskFlatPage', val)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <ColorField label="Line (jalan)" value={line} onChange={(val) => update('taskFlatLine', val)} />
          <ColorField label="Line (done)" value={lineDone} onChange={(val) => update('taskFlatLineDone', val)} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">Chevron &gt;&gt;</span>
            <input type="checkbox" checked={chevron} onChange={(e) => update('taskFlatChevron', e.target.checked)} className="w-4 h-4 accent-white" />
          </label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">UPPERCASE</span>
            <input type="checkbox" checked={uppercase} onChange={(e) => update('taskFlatUppercase', e.target.checked)} className="w-4 h-4 accent-white" />
          </label>
        </div>
        <p className="text-[10px] text-gray-500">Klik pill = checklist: teks terang ter-wipe kiri-ke-kanan jadi redup + garis strikethrough. Page BG cuma buat preview- di OBS tetap transparan.</p>
      </div>
    </div>
  );
}
