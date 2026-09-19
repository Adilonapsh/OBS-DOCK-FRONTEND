import { Eye } from 'lucide-react';
import type { ViewCounterThemeProps } from './types';
import { PLATFORM_META, fmtCount } from './shared';

export default function StandardTheme({ counts, total, font, fontSize, accent, bg, showLabel, showBreakdown, inline, emptyLabel }: ViewCounterThemeProps) {
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const pillBg = bg === 'transparent' ? 'transparent' : bg;
  if (inline) {
    return (
      <div className="vc-font flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 max-w-full" style={{ fontFamily: `'${font}', sans-serif`, background: pillBg }}>
        <Eye className="w-4 h-4 shrink-0" style={{ color: accent }} />
        <span className="text-white font-black tabular-nums" style={{ fontSize: Math.max(14, fontSize - 8) }}>{fmtCount(total)}</span>
        {showLabel && <span className="text-white/50 text-[10px] font-black uppercase tracking-widest hidden sm:inline">Watching</span>}
        {showBreakdown && rows.map(([p, n]) => {
          const meta = PLATFORM_META[p] || PLATFORM_META.tiktok;
          return (
            <span key={p} className="flex items-center gap-1 shrink-0" title={meta.label}>
              <img src={meta.logo} alt={meta.label} className="w-5 h-5 object-contain invert" />
              <span className="text-white text-[10px] font-black tabular-nums">{fmtCount(n)}</span>
            </span>
          );
        })}
        {showBreakdown && rows.length === 0 && <span className="text-white/40 text-[9px] font-bold">{emptyLabel}</span>}
      </div>
    );
  }
  return (
    <div className="vc-font flex items-center gap-2 px-3 py-2 border border-white/10 rounded-full shadow-xl max-w-full" style={{ fontFamily: `'${font}', sans-serif`, background: pillBg }}>
      <Eye className="w-4 h-4 shrink-0" style={{ color: accent }} />
      <span className="text-white font-black tabular-nums leading-none" style={{ fontSize: Math.max(14, fontSize - 6) }}>{fmtCount(total)}</span>
      {showLabel && <span className="text-white/50 text-[9px] font-black uppercase tracking-widest hidden sm:inline">Watching</span>}
      {showBreakdown && rows.length > 0 && <span className="w-px h-4 bg-white/10 shrink-0" />}
      {showBreakdown && rows.map(([p, n]) => {
        const meta = PLATFORM_META[p] || PLATFORM_META.tiktok;
        return (
          <span key={p} className="flex items-center gap-1 shrink-0" title={meta.label}>
            <img src={meta.logo} alt={meta.label} className="w-5 h-5 object-contain invert" />
            <span className="text-white text-[10px] font-black tabular-nums">{fmtCount(n)}</span>
          </span>
        );
      })}
      {showBreakdown && rows.length === 0 && (
        <span className="text-white/40 text-[9px] font-bold">{emptyLabel}</span>
      )}
    </div>
  );
}
