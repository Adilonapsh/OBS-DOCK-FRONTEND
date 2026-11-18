import type { DonationLeaderboardThemeProps } from './types';

export const themeMeta = { value: 'minimal', label: 'Minimal - Bar' } as const;

export default function MinimalTheme({ entries, font, fontSize, accent, textColor, title, showAmount }: DonationLeaderboardThemeProps) {
  const text = textColor || '#ffffff';
  if (entries.length === 0) {
    return <div className="text-white/40 text-[11px] font-bold" style={{ fontFamily: `'${font}', sans-serif` }}>Belum ada donasi</div>;
  }
  const max = Math.max(...entries.map((e) => e.total), 1);
  return (
    <div className="w-full space-y-2" style={{ fontFamily: `'${font}', sans-serif` }}>
      <div className="text-white font-black uppercase tracking-widest text-[10px] opacity-60">{title}</div>
      {entries.map((e, i) => {
        const pct = Math.round((e.total / max) * 100);
        return (
          <div key={e.donorName + i} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black">
              <span style={{ color: text, fontSize }} className="truncate">#{i + 1} {e.donorName}</span>
              {showAmount && <span style={{ color: accent }}>{e.amountFormatted}</span>}
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
