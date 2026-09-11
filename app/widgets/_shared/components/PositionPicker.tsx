'use client';

import { WIDGET_POSITIONS, normalizePosition, type WidgetPosition } from '../constants/positions';
import { Crosshair } from 'lucide-react';

// Global 3x3 picker — dipakai semua widget (timer, chat, poll, etc.)
// Live preview langsung mensimulasikan via iframe ?pos=...&simulate=1
export function PositionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (pos: WidgetPosition) => void;
}) {
  const cur = normalizePosition(value);
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-bold text-gray-300 flex items-center gap-2">
        <Crosshair className="w-3.5 h-3.5 text-violet-400" /> Posisi di OBS — klik grid
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2 bg-black/30 border border-white/10 rounded-xl w-fit">
        {WIDGET_POSITIONS.map((p) => {
          const active = cur === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              title={p.label}
              className={`w-9 h-9 rounded-lg border text-[10px] font-black uppercase transition-all
                ${active ? 'bg-white text-black border-white shadow' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
            >
              {p.value === 'center' ? '•' : p.value.toUpperCase()}
            </button>
          );
        })}
      </div>
      <div className="text-[10px] text-gray-500">
        Aktif: <span className="text-white font-bold">{cur.toUpperCase()}</span> — t=atas, b=bawah, l=kiri, r=kanan, tl/tr/bl/br pojok, center tengah. Langsung terlihat di live preview (iframe simulate).
      </div>
    </div>
  );
}
