import type { GoalThemeProps } from './types';

export default function Minimal({ title, current, target, percent, goalType, font, fontSize, accent, showLabel, showCounts, showBar }: GoalThemeProps) {
  return (
    <div className="w-full max-w-[420px] flex flex-col gap-1.5" style={{ fontFamily: `'${font}', sans-serif` }}>
      {showLabel && <div className="text-white font-black text-[11px] uppercase tracking-widest" style={{ fontSize: Math.max(10, fontSize - 6) }}>{title}</div>}
      {showCounts && (
        <div className="flex items-baseline gap-2">
          <span className="text-white font-black tabular-nums leading-none" style={{ fontSize }}>{current.toLocaleString()}</span>
          <span className="text-white/50 font-bold text-[11px]">/ {target.toLocaleString()}</span>
          <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: accent, color: '#fff' }}>{percent}%</span>
        </div>
      )}
      {showBar && (
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, background: accent }} />
        </div>
      )}
      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: accent }}>{goalType} goal</div>
    </div>
  );
}
