'use client';

import { useEffect, useState } from 'react';
import type { HeartrateThemeProps } from './types';

export const themeMeta = { value: 'glass', label: 'Glass - Modern Health' } as const;

export default function GlassTheme({ bpm, settings, connected, simulate = false }: HeartrateThemeProps) {
  // MIN/MAX realtime - selalu dipanggil (rules of hooks).
  const [minSeen, setMinSeen] = useState<number | null>(null);
  const [maxSeen, setMaxSeen] = useState<number | null>(null);
  useEffect(() => {
    if (bpm === null || !Number.isFinite(bpm)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- perilaku lama dipertahankan (min/max realtime)
    setMinSeen((prev) => (prev === null ? bpm : Math.min(prev, bpm)));
    setMaxSeen((prev) => (prev === null ? bpm : Math.max(prev, bpm)));
  }, [bpm]);

  // Glass - Modern Health Widgets: bg bisa diubah dari Settings → Background (jika transparent pakai default #939cfc)
  const bgMain = settings.bg && settings.bg !== 'transparent' ? settings.bg : '#939cfc';
  const bgMainAlpha = settings.bgOpacity ? Math.round((settings.bgOpacity / 100) * 255).toString(16).padStart(2, '0') : 'CC';
  const isLive = connected && bpm !== null;
  const minLabel = minSeen ?? settings.lowBpm;
  const maxLabel = maxSeen ?? settings.highBpm;

  return (
    <div className="relative w-full max-w-[360px] flex flex-col gap-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      {/* wrapper dengan bg grid b1b9ff seperti body HTML - untuk OBS transparent kita buat card standalone */}
      <div
        className="widget-card w-full h-[360px] rounded-[2.5rem] p-8 flex flex-col justify-between shadow-lg border border-white/20 relative overflow-hidden group"
        style={{ backgroundColor: `${bgMain}${bgMainAlpha}`, backdropFilter: 'blur(12px)' }}
      >
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
        <div className="flex flex-col relative z-10">
          <div className="text-7xl font-bold tracking-tight text-white drop-shadow-sm" style={{ fontFamily: "'Space Grotesk', monospace", letterSpacing: '-0.02em', lineHeight: 1 }}>{bpm ?? '--'}</div>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-6 h-0.5 bg-white/80 rounded-full" />
            <span className="text-[10px] font-bold tracking-widest text-white/80 uppercase">{connected ? (simulate ? 'SIMULATE' : 'LIVE') : 'OFFLINE'}</span>
            {isLive && <span className="w-2 h-2 bg-[#6ee7b7] rounded-full shadow-[0_0_8px_#6ee7b7] animate-pulse ml-1" />}
          </div>
        </div>
        <div className="flex flex-col gap-3 relative z-10">
          <div className="text-xl font-semibold tracking-widest text-white/90 uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>MAX {maxLabel}</div>
          <div className="text-xs font-semibold tracking-wider text-white/70 uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>MIN {minLabel}</div>
          <div className="flex items-center gap-2 pt-1">
            <div className="w-4 h-4 bg-white rounded-sm shadow-sm" />
            <div className="w-4 h-4 border-2 border-white rounded-sm bg-transparent" />
          </div>
        </div>
      </div>
      {/* varian kecil opsional - tampil di preview saja sebagai referensi */}
      {simulate && (
        <div className="hidden md:flex gap-4">
          <div className="widget-card flex-1 h-[120px] rounded-[2rem] p-5 flex flex-col justify-between shadow-lg border border-white/10 relative overflow-hidden" style={{ backgroundColor: '#4f537bcc', backdropFilter: 'blur(12px)' }}>
            <div className="flex justify-between items-start">
              <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#e8dbcb' }}>{minLabel}</div>
              <div className="w-2.5 h-2.5 bg-[#6ee7b7] rounded-full shadow-[0_0_8px_#6ee7b7]" />
            </div>
            <div className="text-xs font-semibold tracking-wider text-white/70">MIN {minLabel}</div>
          </div>
          <div className="widget-card flex-1 h-[120px] rounded-[2rem] p-5 flex flex-col justify-between shadow-lg border border-white/10 relative overflow-hidden" style={{ backgroundColor: '#4a4f78E6', backdropFilter: 'blur(12px)' }}>
            <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#ff99cc', filter: 'drop-shadow(0 0 10px rgba(255,153,204,0.3))' }}>{maxLabel}</div>
            <div className="text-xs font-semibold tracking-wider text-white/80">MAX {maxLabel}</div>
          </div>
        </div>
      )}
      <style>{`@keyframes heartbeat { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }`}</style>
    </div>
  );
}
