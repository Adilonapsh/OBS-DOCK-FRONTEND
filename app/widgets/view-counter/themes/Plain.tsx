import type { ViewCounterThemeProps } from './types';
import { PLATFORM_META, fmtCount } from './shared';

export default function PlainTheme({ counts, total, font, fontSize, accent, showLabel, showBreakdown, inline, emptyLabel }: ViewCounterThemeProps) {
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const family = `'${font}', sans-serif`;
  const labelSize = Math.max(10, Math.round(fontSize * 0.4));

  if (inline) {
    return (
      <div className="vc-font flex items-baseline gap-2" style={{ fontFamily: family, animation: 'fadeIn 0.4s ease both' }}>
        <span className="text-white font-black tabular-nums leading-none" style={{ fontSize }}>{fmtCount(total)}</span>
        {showLabel && <span className="font-black uppercase tracking-widest shrink-0" style={{ color: accent, fontSize: labelSize }}>Watching</span>}
        {showBreakdown && rows.map(([p, n]) => {
          const meta = PLATFORM_META[p] || PLATFORM_META.tiktok;
          return <span key={p} className="text-white/70 font-bold tabular-nums shrink-0" style={{ fontSize: labelSize }} title={meta.label}>{meta.label} {fmtCount(n)}</span>;
        })}
        {showBreakdown && rows.length === 0 && <span className="text-white/40 font-bold" style={{ fontSize: labelSize }}>{emptyLabel}</span>}
      </div>
    );
  }

  return (
    <div className="vc-font flex flex-col" style={{ fontFamily: family, animation: 'fadeIn 0.4s ease both' }}>
      <span className="text-white font-black tabular-nums leading-none" style={{ fontSize }}>{fmtCount(total)}</span>
      {showLabel && <span className="font-black uppercase tracking-widest" style={{ color: accent, fontSize: labelSize }}>Watching</span>}
      {showBreakdown && rows.length > 0 && (
        <div className="flex flex-col mt-1">
          {rows.map(([p, n]) => {
            const meta = PLATFORM_META[p] || PLATFORM_META.tiktok;
            return <span key={p} className="text-white/70 font-bold tabular-nums" style={{ fontSize: labelSize }}>{meta.label} {fmtCount(n)}</span>;
          })}
        </div>
      )}
      {showBreakdown && rows.length === 0 && <span className="text-white/40 font-bold" style={{ fontSize: labelSize }}>{emptyLabel}</span>}
    </div>
  );
}
