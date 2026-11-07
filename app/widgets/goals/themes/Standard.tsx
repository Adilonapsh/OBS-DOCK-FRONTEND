import type { GoalThemeProps } from './types';
import { Users, Heart, Star } from 'lucide-react';

export default function Standard({ title, current, target, percent, goalType, font, fontSize, accent, bg, showLabel, showCounts, showBar }: GoalThemeProps) {
  const Icon = goalType === 'like' ? Heart : goalType === 'subs' ? Star : Users;
  const barBg = bg && bg !== 'transparent' ? bg : 'rgba(22,22,22,0.9)';
  const labelMap: Record<string, string> = { follow: 'Followers', subs: 'Subscribers', like: 'Likes' };
  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-white/10 overflow-hidden shadow-2xl" style={{ fontFamily: `'${font}', sans-serif`, background: barBg }}>
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10" style={{ background: `${accent}18` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: accent }}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {showLabel && <div className="text-white font-black text-[12px] leading-none tracking-tight">{title}</div>}
          <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{labelMap[goalType] || goalType} Goal</div>
        </div>
        {showCounts && <div className="text-white font-black text-sm tabular-nums">{current.toLocaleString()} / {target.toLocaleString()}</div>}
      </div>
      {showBar && (
        <div className="p-3">
          <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${percent}%`, background: accent }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] font-black text-white/60">{percent}%</span>
            <span className="text-[10px] font-bold text-white/40">{target - current > 0 ? `${(target - current).toLocaleString()} lagi` : 'Tercapai! 🎉'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
