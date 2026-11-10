'use client';

/* eslint-disable @next/next/no-img-element */

import type { ValorantSkinProps } from './types';

export const themeMeta = { value: 'auto', label: 'Auto - ikut warna rank' } as const;

export default function StandardTheme(props: ValorantSkinProps) {
  const { view, family, riotId, seasonText, rankName, rr, ghostRr, iconUrl, themeColor, wins, losses, winrate, shield, showStreak, showWinrate, showSeason, updatedAt, promo } = props;
  const [r, g, b] = [props.r, props.g, props.b];
  const progress = props.progress;
  const cssVars = {
    '--theme-color': themeColor,
    '--theme-color-alpha': `rgba(${r}, ${g}, ${b}, 0.25)`,
    '--theme-color-alpha-strong': `rgba(${r}, ${g}, ${b}, 0.4)`,
  } as React.CSSProperties;
  const ghostProgress = Math.min(100, Math.max(0, (ghostRr / 100) * 100));

  if (view === 'mini') {
    return (
      <div style={{ ...cssVars, fontFamily: family }} className="w-full max-w-[440px]">
        <style>{`@keyframes valoFloat{0%{transform:translateY(0)}50%{transform:translateY(-5px)}100%{transform:translateY(0)}}
        @keyframes valoPop{to{opacity:1;transform:scale(1)}}
        @keyframes valoPopIcon{to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes valoUp{to{opacity:1;transform:translateY(0)}}
        `}</style>
        <div className="relative flex items-center gap-5 rounded-[20px] px-4 py-4 overflow-hidden" style={{ background: '#1c1d22', boxShadow: `0 0 25px -5px rgba(${r},${g},${b},0.4), inset 0 0 0 1.5px rgba(${r},${g},${b},0.4)` }}>
          {promo && (
            <div className="absolute inset-0 z-40 flex items-center justify-center gap-3 px-4" style={{ background: `radial-gradient(circle at center, rgba(${r},${g},${b},0.55) 0%, rgba(10,10,15,0.94) 100%)`, backdropFilter: 'blur(8px)', borderRadius: 'inherit' }}>
              {promo.iconUrl ? <img key={`${promo.direction}-${promo.tierName}`} src={promo.iconUrl} alt="rank" className="w-[56px] h-[56px] object-contain shrink-0" style={{ opacity: 0, transform: 'scale(0.5) translateY(12px)', animation: 'valoPopIcon 0.55s cubic-bezier(0.175,0.885,0.32,1.275) forwards 0.15s', filter: `drop-shadow(0 0 14px ${themeColor})` }} /> : null}
              <div className="flex flex-col min-w-0">
                <div className="text-[10px] font-extrabold tracking-[0.25em] text-white" style={{ opacity: 0, transform: 'translateY(10px)', animation: 'valoUp 0.5s ease forwards 0.1s' }}>
                  {promo.direction === 'up' ? 'RANK UP ▲' : 'RANK DOWN ▼'}
                </div>
                <div className="text-[20px] font-black tracking-wide truncate" style={{ color: themeColor, textShadow: `0 0 12px rgba(${r},${g},${b},0.5)`, opacity: 0, transform: 'scale(0.85)', animation: 'valoPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards 0.3s' }}>
                  {promo.tierName.toUpperCase()}
                </div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none opacity-100" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative w-[65px] h-[65px] shrink-0 grid place-items-center">
            <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, rgba(${r},${g},${b},0.4) 0%, transparent 70%)` }} />
            {iconUrl ? <img src={iconUrl} alt="rank" className="relative z-10 w-full h-full object-contain" style={{ filter: `drop-shadow(0 0 8px rgba(${r},${g},${b},0.4))`, animation: 'valoFloat 4s ease-in-out infinite' }} /> : null}
          </div>
          <div className="relative z-10 flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <div className="text-[18px] font-black uppercase tracking-wide truncate" style={{ color: themeColor, textShadow: `0 0 10px rgba(${r},${g},${b},0.25)` }}>{rankName}</div>
              {riotId ? <div className="ml-auto text-[10px] font-black uppercase tracking-wider truncate" style={{ color: themeColor, textShadow: `0 0 8px rgba(${r},${g},${b},0.4)` }}>{riotId}</div> : null}
              {shield > 0 && <div className="text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-white/20 bg-white/10" style={{ color: themeColor, textShadow: `0 0 8px rgba(${r},${g},${b},0.4)` }}>🛡️ {shield}</div>}
              {showStreak && wins >= 2 && <div className="text-[11px] font-extrabold px-2 py-0.5 rounded-full border" style={{ background: `rgba(${r},${g},${b},0.15)`, color: themeColor, borderColor: `rgba(${r},${g},${b},0.3)` }}>🔥 {wins}</div>}
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-2 rounded bg-white/10 overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${ghostProgress}%`, background: 'rgba(255,255,255,0.85)' }} />
                <div className="relative h-full rounded" style={{ width: `${progress}%`, background: themeColor, boxShadow: `0 0 8px ${themeColor}` }} />
              </div>
              <div className="text-[13px] font-black min-w-[56px] text-right" style={{ color: themeColor, textShadow: `0 0 10px rgba(${r},${g},${b},0.5)` }}><span className="text-[15px]">{rr}</span> RR</div>
            </div>
            <div className="flex items-center gap-3 text-[12px] font-black bg-white/[0.07] border border-white/15 rounded-lg px-2.5 py-1.5" style={{ color: themeColor, textShadow: `0 0 8px rgba(${r},${g},${b},0.4)` }}>
              <span className="tracking-wider">W/L: <span className="font-black">{wins}</span> <span>/</span> <span className="font-black">{losses}</span></span>
              {showWinrate && <span className="tracking-wider">• Winrate: <span className="font-black">{winrate}%</span></span>}
              <span className="ml-auto text-[10px] font-bold bg-black/40 border border-white/20 rounded px-1.5 py-0.5 whitespace-nowrap" style={{ color: themeColor }}>{updatedAt}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...cssVars, fontFamily: family }} className="w-full max-w-[650px]">
      <style>{`
        @keyframes valoFloat{0%{transform:translateY(0)}50%{transform:translateY(-8px)}100%{transform:translateY(0)}}
        @keyframes valoPop{to{opacity:1;transform:scale(1)}}
        @keyframes valoPopIcon{to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes valoUp{to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div className="relative rounded-[20px] overflow-hidden border border-white/5" style={{ background: '#14151a', boxShadow: `0 0 50px -15px rgba(${r},${g},${b},0.4), inset 0 0 0 1px rgba(${r},${g},${b},0.4)` }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '45px 45px' }} />

        {promo && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center" style={{ background: `radial-gradient(circle at center, rgba(${r},${g},${b},0.5) 0%, rgba(10,10,15,0.95) 100%)`, backdropFilter: 'blur(12px)' }}>
            {promo.iconUrl ? <img src={promo.iconUrl} alt="rank" className="w-[140px] h-[140px] object-contain mb-4" style={{ opacity: 0, transform: 'scale(0.5) translateY(20px)', animation: 'valoPopIcon 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards 0.35s', filter: `drop-shadow(0 0 25px ${themeColor})` }} /> : null}
            <div className="text-[14px] font-extrabold tracking-[0.3em] text-white" style={{ opacity: 0, transform: 'translateY(15px)', animation: 'valoUp 0.6s ease forwards 0.2s' }}>
              {promo.direction === 'up' ? 'PROMOTION SECURED' : 'DEMOTION'}
            </div>
            <div className="text-[68px] font-black tracking-[4px] text-[#ece8e1] my-2" style={{ opacity: 0, transform: 'scale(0.8)', animation: 'valoPop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards 0.5s' }}>
              {promo.direction === 'up' ? 'RANK UP' : 'RANK DOWN'}
            </div>
            <div className="text-[14px] font-extrabold tracking-[0.2em] text-[#b0b0b0]" style={{ opacity: 0, animation: 'valoUp 0.6s ease forwards 1s' }}>
              NEW RANK • {promo.tierName.toUpperCase()}
            </div>
          </div>
        )}

        <div className="relative z-10 p-[30px]">
          <div className="flex justify-between items-center text-[11px] font-black tracking-[0.2em] mb-8" style={{ color: themeColor, textShadow: `0 0 8px rgba(${r},${g},${b},0.4)` }}>
            {riotId ? <div className="tracking-widest uppercase">{riotId}</div> : <div />}
            {showSeason && <div>{seasonText || 'VALORANT'}</div>}
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative w-[140px] h-[140px] shrink-0 grid place-items-center">
              <div className="absolute w-[120%] h-[120%] rounded-full" style={{ background: `radial-gradient(circle, rgba(${r},${g},${b},0.4) 0%, transparent 60%)` }} />
              {iconUrl ? <img src={iconUrl} alt="rank" className="relative z-10 w-full h-full object-contain" style={{ filter: `drop-shadow(0 0 15px rgba(${r},${g},${b},0.4))`, animation: 'valoFloat 4s ease-in-out infinite' }} /> : null}
            </div>
            <div className="flex-1 w-full mt-2">
              <div className="text-xs font-black tracking-[0.15em] mb-1" style={{ color: themeColor, textShadow: `0 0 8px rgba(${r},${g},${b},0.4)` }}>CURRENT RANK</div>
              <h1 className="text-4xl font-black uppercase tracking-wide mb-6" style={{ color: themeColor, textShadow: `0 0 15px rgba(${r},${g},${b},0.25)` }}>{rankName}</h1>
              <div className="flex justify-between items-end mb-2">
                <div className="text-xs font-black tracking-[0.1em] flex items-center gap-1.5" style={{ color: themeColor, textShadow: `0 0 8px rgba(${r},${g},${b},0.4)` }}>
                  RANK RATING
                  {shield > 0 && <span className="text-xs bg-white/10 px-2 py-0.5 rounded font-bold" style={{ color: themeColor }}>🛡️ {shield}</span>}
                </div>
                <div className="text-sm font-black tracking-wider" style={{ color: themeColor, textShadow: `0 0 12px rgba(${r},${g},${b},0.5)` }}><span className="text-lg">{rr}</span> / 100 RR</div>
              </div>
              <div className="w-full h-3 rounded-[10px] overflow-hidden border border-white/10 bg-white/5 relative">
                <div className="absolute inset-y-0 left-0 rounded-[10px]" style={{ width: `${ghostProgress}%`, background: 'rgba(255,255,255,0.85)' }} />
                <div className="relative h-full rounded-[10px]" style={{ width: `${progress}%`, background: themeColor, boxShadow: `0 0 10px ${themeColor}` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 px-[30px] py-[25px]" style={{ background: '#1b1d24' }}>
          <div className="flex justify-between items-center mb-6 px-4">
            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs font-black tracking-[0.2em] mb-2" style={{ color: themeColor, textShadow: `0 0 8px rgba(${r},${g},${b},0.4)` }}>W / L</div>
              <div className="text-3xl font-black tracking-wider" style={{ color: themeColor, textShadow: `0 0 14px rgba(${r},${g},${b},0.5)` }}>{wins}<span>/</span>{losses}</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs font-black tracking-[0.2em] mb-2" style={{ color: themeColor, textShadow: `0 0 8px rgba(${r},${g},${b},0.4)` }}>WINRATE</div>
              <div className="text-3xl font-black tracking-wider" style={{ color: themeColor, textShadow: `0 0 14px rgba(${r},${g},${b},0.5)` }}>{showWinrate ? `${winrate}%` : '—'}</div>
            </div>
          </div>
          {showStreak && (
            <div className="flex justify-center items-center gap-2 text-xs font-black tracking-[0.2em]" style={{ color: themeColor, textShadow: `0 0 10px rgba(${r},${g},${b},0.5)` }}>
              <span className="text-[16px]">🔥</span> {wins} WIN STREAK
            </div>
          )}
          <div className="text-center mt-3 text-[11px] font-black tracking-[0.2em]" style={{ color: themeColor, textShadow: `0 0 10px rgba(${r},${g},${b},0.5)` }}>
            {updatedAt ? `UPDATED ${updatedAt}` : 'LOADING...'} • AUTO-REFRESH ON
          </div>
        </div>
      </div>
    </div>
  );
}
