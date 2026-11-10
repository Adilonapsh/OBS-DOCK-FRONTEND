import type { DonationLeaderboardThemeProps } from './types';

export const themeMeta = { value: 'standard', label: 'Standard - List Card' } as const;

export default function StandardTheme({ entries, font, fontSize, accent, bg, textColor, title, showAmount, showPlatform, showAvatar }: DonationLeaderboardThemeProps) {
  const barBg = bg === 'transparent' ? 'rgba(10,10,10,0.85)' : bg;
  const text = textColor || '#ffffff';
  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-xl"
      style={{ background: barBg, fontFamily: `'${font}', sans-serif`, borderLeft: `4px solid ${accent}` }}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <span className="font-black uppercase tracking-widest text-[11px]" style={{ color: text }}>{title}</span>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: accent, color: '#000' }}>{entries.length} DONATUR</span>
      </div>
      <div className="divide-y divide-white/5">
        {entries.length === 0 ? (
          <div className="px-4 py-6 text-center text-white/40 text-[11px] font-bold">Belum ada donasi — Saweria/TipTap/Trakteer</div>
        ) : (
          entries.map((e, i) => (
            <div key={e.donorName + i} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-6 h-6 rounded-full grid place-items-center text-[10px] font-black shrink-0" style={{ background: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#d97706' : 'rgba(255,255,255,0.08)', color: i < 3 ? '#000' : text }}>{i + 1}</span>
              {showAvatar && (
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(e.donorName)}&background=${accent.replace('#','')}&color=000&size=64`}
                  alt={e.donorName}
                  className="w-7 h-7 rounded-full border border-white/10 shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-black text-[12px] truncate" style={{ color: text, fontSize }}>{e.donorName}</div>
                <div className="text-[10px] text-white/50 font-bold flex gap-1.5">
                  <span>{e.count}× donasi</span>
                  {showPlatform && <span className="capitalize">• {e.platform}</span>}
                </div>
              </div>
              {showAmount && <span className="font-black text-[11px] shrink-0" style={{ color: accent }}>{e.amountFormatted}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
