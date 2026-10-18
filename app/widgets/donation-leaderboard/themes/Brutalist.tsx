import type { DonationLeaderboardThemeProps } from './types';

export const themeMeta = { value: 'brutalist', label: 'Brutalist' } as const;

export default function BrutalistTheme({ entries, font, accent, title, showAmount, showPlatform }: DonationLeaderboardThemeProps) {
  return (
    <div className="w-full bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3" style={{ fontFamily: `'${font}', sans-serif` }}>
      <div className="bg-black text-white font-black uppercase tracking-widest text-[11px] px-2 py-1 inline-block -rotate-1">{title} — TOP {entries.length}</div>
      <div className="mt-3 space-y-2">
        {entries.length === 0 ? (
          <div className="border-2 border-black border-dashed p-4 text-center font-black text-[11px]">BELUM ADA DONASI</div>
        ) : (
          entries.map((e, i) => (
            <div key={e.donorName + i} className="flex items-center gap-2 border-2 border-black px-2 py-1.5 bg-white">
              <span className="w-6 h-6 grid place-items-center font-black text-[11px] border-2 border-black" style={{ background: accent }}>{i + 1}</span>
              <span className="flex-1 font-black text-[11px] uppercase truncate">{e.donorName}</span>
              {showPlatform && <span className="text-[9px] font-black uppercase border border-black px-1">{e.platform}</span>}
              {showAmount && <span className="font-black text-[11px] px-1.5 py-0.5 border-2 border-black" style={{ background: accent }}>{e.amountFormatted}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
