import { Eye } from 'lucide-react';
import type { ViewCounterThemeProps } from './types';
import { PLATFORM_META, fmtCount } from './shared';

export default function CuteTheme({ counts, total, font, fontSize, showLabel, showBreakdown, inline, emptyLabel }: ViewCounterThemeProps) {
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const family = `'Nunito','Quicksand','${font}', sans-serif`;
  if (inline) {
    return (
      <div className="vc-font flex items-center gap-2 px-3 py-2 rounded-full max-w-full" style={{ fontFamily: family, background: 'linear-gradient(90deg, #c4a2f8 0%, #fca4d4 100%)' }}>
        <Eye className="w-4 h-4 shrink-0 text-white" />
        <span className="text-white font-black tabular-nums" style={{ fontSize: Math.max(14, fontSize - 8) }}>{fmtCount(total)}</span>
        {showBreakdown && rows.map(([p, n]) => {
          const meta = PLATFORM_META[p] || PLATFORM_META.tiktok;
          return (
            <span key={p} className="flex items-center gap-1 shrink-0" title={meta.label}>
              <img src={meta.logo} alt={meta.label} className="w-5 h-5 object-contain" />
              <span className="text-white text-[10px] font-black tabular-nums">{fmtCount(n)}</span>
            </span>
          );
        })}
        {showBreakdown && rows.length === 0 && <span className="text-white/70 text-[9px] font-bold">{emptyLabel}</span>}
      </div>
    );
  }
  return (
    <div className="vc-font w-[190px] rounded-3xl overflow-hidden border border-[#fca4d4]/30 shadow-xl" style={{ fontFamily: family, background: 'linear-gradient(160deg, #2a2440 0%, #1e1d2b 100%)' }}>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <Eye className="w-3.5 h-3.5 shrink-0 text-[#f5a8d0]" />
        {showLabel && <span className="font-black uppercase text-[9px] tracking-widest" style={{ color: '#a8a3ce' }}>Watching</span>}
      </div>
      <div className="px-3 text-white font-black tabular-nums leading-none" style={{ fontSize }}>{fmtCount(total)}</div>
      {showBreakdown && (
        <div className="px-3 py-2 space-y-1.5">
          {rows.length === 0 && <div className="text-[10px] font-bold" style={{ color: '#a8a3ce' }}>{emptyLabel}</div>}
          {rows.map(([p, n]) => {
            const meta = PLATFORM_META[p] || PLATFORM_META.tiktok;
            return (
              <div key={p} className="flex items-center gap-1.5 rounded-xl px-2 py-1" style={{ background: 'rgba(46,44,69,0.8)' }}>
                <img src={meta.logo} alt={meta.label} title={meta.label} className="w-4 h-4 object-contain shrink-0" />
                <span className="text-[10px] font-black tabular-nums" style={{ color: '#d8cded' }}>{fmtCount(n)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
