import type { GoalThemeProps } from './types';

export default function Plain({ title, current, target, percent, goalType, font, fontSize, showLabel, showCounts }: GoalThemeProps) {
  return (
    <div className="flex flex-col" style={{ fontFamily: `'${font}', sans-serif` }}>
      {showLabel && <span className="text-white/60 font-black uppercase tracking-widest" style={{ fontSize: Math.max(10, fontSize - 8) }}>{title}</span>}
      {showCounts ? (
        <span className="text-white font-black tabular-nums leading-none" style={{ fontSize }}>
          {current.toLocaleString()} / {target.toLocaleString()} <span className="text-white/40 text-[10px]">({percent}%)</span>
          <span className="ml-2 text-[10px] font-bold uppercase" style={{ color: '#8b5cf6' }}>{goalType}</span>
        </span>
      ) : (
        <span className="text-white font-black text-[11px] uppercase">{goalType} {percent}%</span>
      )}
    </div>
  );
}
