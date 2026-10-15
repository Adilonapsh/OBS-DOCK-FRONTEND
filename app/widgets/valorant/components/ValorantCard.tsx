'use client';

import type { BrutalistSettings } from '../../_shared/constants/brutalist';
import { pastelBgFor, PASTEL_BORDER } from '../utils/pastelTiers';
import { ValorantCircle } from './ValorantCircle';

export type PromoState = { direction: 'up' | 'down'; tierName: string; iconUrl: string } | null;

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.startsWith('#') ? hex : `#${hex}`;
  if (c.length > 7) c = c.substring(0, 7);
  const r = parseInt(c.substring(1, 3), 16);
  const g = parseInt(c.substring(3, 5), 16);
  const b = parseInt(c.substring(5, 7), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return [255, 70, 85];
  return [r, g, b];
}

export function ValorantCard(props: {
  view: string;
  font: string;
  riotId: string;
  seasonText: string;
  rankName: string;
  rr: number;
  ghostRr: number;
  iconUrl: string;
  themeColor: string;
  wins: number;
  losses: number;
  winrate: number;
  shield: number;
  showStreak: boolean;
  showWinrate: boolean;
  showSeason: boolean;
  updatedAt: string;
  promo: PromoState;
  themeMode: string;
  brutalist?: BrutalistSettings | null;
  pastelMode: string;
  pastelBg: string;
}) {
  const { view, font, riotId, seasonText, rankName, rr, ghostRr, iconUrl, themeColor, wins, losses, winrate, shield, showStreak, showWinrate, showSeason, updatedAt, promo, themeMode, brutalist } = props;
  const [r, g, b] = hexToRgb(themeColor);
  const cssVars = {
    '--theme-color': themeColor,
    '--theme-color-alpha': `rgba(${r}, ${g}, ${b}, 0.25)`,
    '--theme-color-alpha-strong': `rgba(${r}, ${g}, ${b}, 0.4)`,
  } as React.CSSProperties;
  const family = `'${font}', 'Inter', sans-serif`;
  const progress = Math.min(100, Math.max(0, (rr / 100) * 100));
  const ghostProgress = Math.min(100, Math.max(0, (ghostRr / 100) * 100));

  // View circle: standalone circular RR overlay (port HTML ref) - independen dari themeMode,
  // warna ngikut themeColor (auto = warna tier | custom = accent).
  if (view === 'circle') {
    return <ValorantCircle font={font} rr={rr} iconUrl={iconUrl} themeColor={themeColor} rankName={rankName} />;
  }

  // Skin neo-brutalist: chrome flat + border tebal + hard shadow,
  // aksen (rank/WL/winrate/streak/progress) ngikut warna tier.
  if (themeMode === 'brutalist' && brutalist) {
    return <BrutalistCard {...props} r={r} g={g} b={b} progress={progress} family={family} />;
  }

  // Skin pastel (cute card): bg pastel ngikut tier + border slate + teks putih.
  if (themeMode === 'pastel') {
    return <PastelCard {...props} r={r} g={g} b={b} progress={progress} family={family} />;
  }

  if (view === 'mini') {
    return (
      <div style={{ ...cssVars, fontFamily: family }} className="w-full max-w-[440px]">
        <style>{`@keyframes valoFloat{0%{transform:translateY(0)}50%{transform:translateY(-5px)}100%{transform:translateY(0)}}`}</style>
        <div className="relative flex items-center gap-5 rounded-[20px] px-4 py-4 overflow-hidden" style={{ background: '#1c1d22', boxShadow: `0 0 25px -5px rgba(${r},${g},${b},0.4), inset 0 0 0 1.5px rgba(${r},${g},${b},0.4)` }}>
          <div className="absolute inset-0 pointer-events-none opacity-100" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative w-[65px] h-[65px] shrink-0 grid place-items-center">
            <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, rgba(${r},${g},${b},0.4) 0%, transparent 70%)` }} />
            {iconUrl ? <img src={iconUrl} alt="rank" className="relative z-10 w-full h-full object-contain" style={{ filter: `drop-shadow(0 0 8px rgba(${r},${g},${b},0.4))`, animation: 'valoFloat 4s ease-in-out infinite' }} /> : null}
          </div>
          <div className="relative z-10 flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <div className="text-[18px] font-black uppercase tracking-wide truncate" style={{ color: themeColor, textShadow: `0 0 10px rgba(${r},${g},${b},0.25)` }}>{rankName}</div>
              {riotId ?               <div className="ml-auto text-[10px] font-black uppercase tracking-wider truncate" style={{ color: themeColor, textShadow: `0 0 8px rgba(${r},${g},${b},0.4)` }}>{riotId}</div> : null}
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

// ---- Neo-brutalist skin (theme=brutalist) ------------------------------------
// Layout & data sama persis dengan skin standar, chromenya diganti:
// background flat + border hitam tebal + hard shadow kotak. Aksen
// (rank / RR / W-L / winrate / streak / progress) ngikut warna tier.
type SkinProps = React.ComponentProps<typeof ValorantCard> & { r: number; g: number; b: number; progress: number; family: string };

function BrutalistCard(p: SkinProps) {
  const b = p.brutalist!;
  const bg = b.brutalistBg;
  const ink = b.brutalistTextColor;
  const badgeBg = b.brutalistBadgeBg;
  const border = b.brutalistBorderColor;
  const sh = Math.max(0, b.brutalistShadow);
  const hard = sh > 0 ? `${sh}px ${sh}px 0 ${border}` : 'none';
  const sm = Math.max(2, sh - 3);
  const hardSm = sh > 0 ? `${sm}px ${sm}px 0 ${border}` : 'none';
  const upCls = b.brutalistUppercase ? 'uppercase' : '';
  const itCls = b.brutalistItalic ? 'italic' : '';
  const edge = `3px solid ${border}`;
  const halftone = b.brutalistHalftone
    ? { backgroundImage: `radial-gradient(${border}26 1.4px, transparent 1.4px)`, backgroundSize: '13px 13px' }
    : {};
  const numShadow = `2px 2px 0 ${border}`;
  const tier = p.themeColor;
  const ghostP = Math.min(100, Math.max(0, (p.ghostRr / 100) * 100));

  const promo = p.promo && (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center" style={{ background: `${bg}f2`, backdropFilter: 'blur(6px)' }}>
      {p.promo.iconUrl ? <img src={p.promo.iconUrl} alt="rank" className="w-[130px] h-[130px] object-contain mb-3" style={{ opacity: 0, transform: 'scale(0.5) translateY(20px)', animation: 'valoPopIcon 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards 0.35s', filter: `drop-shadow(3px 3px 0 ${border})` }} /> : null}
      <div className={`text-[13px] font-black tracking-[0.3em] ${upCls}`} style={{ color: ink, opacity: 0, transform: 'translateY(15px)', animation: 'valoUp 0.6s ease forwards 0.2s' }}>
        {p.promo.direction === 'up' ? 'PROMOTION SECURED' : 'DEMOTION'}
      </div>
      <div className={`text-[60px] font-black tracking-[4px] ${upCls} ${itCls}`} style={{ color: tier, textShadow: `3px 3px 0 ${border}`, opacity: 0, transform: 'scale(0.8)', animation: 'valoPop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards 0.5s' }}>
        {p.promo.direction === 'up' ? 'RANK UP' : 'RANK DOWN'}
      </div>
      <div className={`mt-2 px-3 py-1 text-[13px] font-black tracking-[0.2em] ${upCls}`} style={{ color: ink, background: badgeBg, border: edge, boxShadow: hardSm, opacity: 0, animation: 'valoUp 0.6s ease forwards 1s' }}>
        NEW RANK • {p.promo.tierName.toUpperCase()}
      </div>
    </div>
  );

  if (p.view === 'mini') {
    return (
      <div style={{ fontFamily: p.family }} className="w-full max-w-[440px]">
        <style>{`@keyframes valoFloat{0%{transform:translateY(0)}50%{transform:translateY(-5px)}100%{transform:translateY(0)}}`}</style>
        <div className="relative flex items-center gap-4 rounded-2xl px-4 py-3.5 overflow-hidden" style={{ background: bg, border: edge, boxShadow: hard }}>
          <div className="absolute inset-0 pointer-events-none" style={halftone} />
          <div className="relative w-[60px] h-[60px] shrink-0 grid place-items-center rounded-xl" style={{ background: badgeBg, border: edge, boxShadow: hardSm }}>
            {p.iconUrl ? <img src={p.iconUrl} alt="rank" className="relative z-10 w-full h-full object-contain p-1" /> : null}
          </div>
          <div className="relative z-10 flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className={`text-[17px] font-black tracking-wide truncate ${upCls} ${itCls}`} style={{ color: tier, textShadow: numShadow }}>{p.rankName}</div>
              {p.riotId ? <div className={`ml-auto px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider truncate ${upCls}`} style={{ color: ink, background: badgeBg, border: `2px solid ${border}` }}>{p.riotId}</div> : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-[10px] rounded-md overflow-hidden relative" style={{ background: `${ink}1a`, border: `2px solid ${border}` }}>
                <div className="absolute inset-y-0 left-0" style={{ width: `${ghostP}%`, background: '#ffffff' }} />
                <div className="relative h-full" style={{ width: `${p.progress}%`, background: tier }} />
              </div>
              <div className="text-[13px] font-black whitespace-nowrap" style={{ color: ink }}><span style={{ color: tier, textShadow: numShadow }}>{p.rr}</span> RR</div>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-extrabold" style={{ color: ink }}>
              <span className={`px-2 py-0.5 rounded-lg ${upCls}`} style={{ background: badgeBg, border: `2px solid ${border}`, boxShadow: hardSm }}>
                W/L <span className="font-black" style={{ color: tier }}>{p.wins}/{p.losses}</span>
              </span>
              {p.showWinrate && (
                <span className={`px-2 py-0.5 rounded-lg ${upCls}`} style={{ background: badgeBg, border: `2px solid ${border}`, boxShadow: hardSm }}>
                  <span className="font-black" style={{ color: tier }}>{p.winrate}%</span>
                </span>
              )}
              {p.shield > 0 && <span className="px-2 py-0.5 rounded-lg font-black" style={{ background: badgeBg, border: `2px solid ${border}` }}>🛡️ {p.shield}</span>}
              {p.showStreak && p.wins >= 2 && <span className="px-2 py-0.5 rounded-lg font-black" style={{ background: badgeBg, border: `2px solid ${border}`, color: tier }}>🔥 {p.wins}</span>}
              <span className="ml-auto text-[10px] font-bold" style={{ color: ink }}>{p.updatedAt}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: p.family }} className="w-full max-w-[650px]">
      <style>{`
        @keyframes valoFloat{0%{transform:translateY(0)}50%{transform:translateY(-8px)}100%{transform:translateY(0)}}
        @keyframes valoPop{to{opacity:1;transform:scale(1)}}
        @keyframes valoPopIcon{to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes valoUp{to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div className="relative rounded-2xl overflow-hidden" style={{ background: bg, border: edge, boxShadow: hard }}>
        <div className="absolute inset-0 pointer-events-none" style={halftone} />
        {promo}

        <div className="relative z-10 p-[26px]">
          <div className="flex justify-between items-center gap-2 mb-7">
            {p.riotId ? <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black tracking-[0.2em] truncate ${upCls}`} style={{ color: ink, background: badgeBg, border: edge, boxShadow: hardSm }}>{p.riotId}</div> : <div />}
            {p.showSeason && <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black tracking-[0.2em] truncate ${upCls}`} style={{ color: ink, background: badgeBg, border: edge, boxShadow: hardSm }}>{p.seasonText || 'VALORANT'}</div>}
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-7">
            <div className="relative w-[132px] h-[132px] shrink-0 grid place-items-center rounded-2xl" style={{ background: badgeBg, border: edge, boxShadow: hardSm }}>
              {p.iconUrl ? <img src={p.iconUrl} alt="rank" className="relative z-10 w-full h-full object-contain p-2" /> : null}
            </div>
            <div className="flex-1 w-full mt-1">
              <div className={`text-xs font-black tracking-[0.15em] mb-1 ${upCls}`} style={{ color: ink }}>CURRENT RANK</div>
              <h1 className={`text-4xl font-black tracking-wide mb-5 ${upCls} ${itCls}`} style={{ color: tier, textShadow: `3px 3px 0 ${border}` }}>{p.rankName}</h1>
              <div className="flex justify-between items-end mb-2">
                <div className={`text-xs font-black tracking-[0.1em] flex items-center gap-1.5 ${upCls}`} style={{ color: ink }}>
                  RANK RATING
                  {p.shield > 0 && <span className="text-xs px-2 py-0.5 rounded-lg font-black" style={{ color: ink, background: badgeBg, border: `2px solid ${border}` }}>🛡️ {p.shield}</span>}
                </div>
                <div className="text-sm font-black tracking-wider" style={{ color: ink }}><span className="text-base" style={{ color: tier, textShadow: numShadow }}>{p.rr}</span> / 100 RR</div>
              </div>
              <div className="w-full h-[14px] rounded-lg overflow-hidden relative" style={{ background: `${ink}1a`, border: edge }}>
                <div className="absolute inset-y-0 left-0" style={{ width: `${ghostP}%`, background: '#ffffff' }} />
                <div className="relative h-full" style={{ width: `${p.progress}%`, background: tier }} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-[26px] py-[22px]" style={{ background: badgeBg, borderTop: edge }}>
          <div className="flex justify-between items-center mb-5 px-4">
            <div className="flex-1 flex flex-col items-center">
              <div className={`text-xs font-black tracking-[0.2em] mb-1.5 ${upCls}`} style={{ color: ink }}>W / L</div>
              <div className="text-3xl font-black tracking-wider" style={{ color: tier, textShadow: numShadow }}>{p.wins}<span style={{ color: ink, textShadow: 'none' }}>/</span>{p.losses}</div>
            </div>
            <div className="w-[3px] self-stretch" style={{ background: border }} />
            <div className="flex-1 flex flex-col items-center">
              <div className={`text-xs font-black tracking-[0.2em] mb-1.5 ${upCls}`} style={{ color: ink }}>WINRATE</div>
              <div className="text-3xl font-black tracking-wider" style={{ color: tier, textShadow: numShadow }}>{p.showWinrate ? `${p.winrate}%` : '—'}</div>
            </div>
          </div>
          {p.showStreak && (
            <div className="flex justify-center">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-black tracking-[0.2em] ${upCls}`} style={{ color: tier, background: bg, border: `2px solid ${border}`, boxShadow: hardSm }}>
                <span className="text-[15px]">🔥</span> {p.wins} WIN STREAK
              </div>
            </div>
          )}
          <div className={`text-center mt-3 text-[11px] font-black tracking-[0.2em] ${upCls}`} style={{ color: ink }}>
            {p.updatedAt ? `UPDATED ${p.updatedAt}` : 'LOADING...'} • AUTO-REFRESH ON
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Pastel skin (theme=pastel, cute card) ----------------------------------
// BG pastel ngikut base tier + border slate + teks putih, sesuai referensi.
// RR count + ghost bar tetap jalan (ghost = tint gelap di belakang fill putih).
function PastelCard(p: SkinProps) {
  const bg = pastelBgFor(p.rankName, p.pastelMode, p.pastelBg);
  const border = PASTEL_BORDER;
  const edge = `5px solid ${border}`;
  const ghostP = Math.min(100, Math.max(0, (p.ghostRr / 100) * 100));
  const sparkle = (
    <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: '#ffffff', opacity: 0.95, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
  const promoBg = p.promo ? pastelBgFor(p.promo.tierName, p.pastelMode, p.pastelBg) : bg;

  if (p.view === 'mini') {
    const animCls = p.promo ? (p.promo.direction === 'up' ? 'pastel-bounce' : 'pastel-shake') : '';
    return (
      <div style={{ fontFamily: p.family }} className="w-full max-w-[380px]">
        <style>{`
          @keyframes pastelBounce{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}
          @keyframes pastelShake{10%,90%{transform:translate3d(-1px,0,0)}20%,80%{transform:translate3d(2px,0,0)}30%,50%,70%{transform:translate3d(-4px,0,0)}40%,60%{transform:translate3d(4px,0,0)}}
          .pastel-bounce{animation:pastelBounce 0.5s ease;}
          .pastel-bounce .pastel-mini-icon{transform:scale(1.25);}
          .pastel-shake{animation:pastelShake 0.4s cubic-bezier(.36,.07,.19,.97) both;}
        `}</style>
        <div className={animCls} style={{ backgroundColor: bg, backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '15px 15px', border: `4px solid ${border}`, borderRadius: 20, boxShadow: '0 15px 30px rgba(0,0,0,0.15)', padding: 16, position: 'relative', overflow: 'hidden', transition: 'background-color 0.5s ease' }}>
          <div className="flex items-center" style={{ gap: 16, position: 'relative', zIndex: 2 }}>
            <div className="pastel-mini-icon" style={{ width: 60, height: 60, flexShrink: 0, transition: 'transform 0.4s ease' }}>
              {p.iconUrl ? <img src={p.iconUrl} alt="rank" style={{ width: '100%', height: '100%', filter: `drop-shadow(0 0 10px ${bg}) brightness(1.05)` }} /> : null}
            </div>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <div className="flex items-center justify-between">
                <span className="flex items-center truncate" style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)', textTransform: 'uppercase', gap: 6 }}>
                  {p.rankName}
                  <span style={{ width: 16, height: 16, display: 'inline-flex', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', fill: '#ffffff', opacity: 0.95 }}><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
                  </span>
                </span>
                {p.riotId ? <span className="truncate" style={{ fontSize: 11, fontWeight: 800, color: border, background: 'rgba(255,255,255,0.4)', padding: '3px 8px', borderRadius: 6 }}>{p.riotId}</span> : null}
              </div>
              <div className="flex items-center" style={{ gap: 10 }}>
                <div className="flex-1 relative overflow-hidden" style={{ height: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 99 }}>
                  <div className="absolute inset-y-0 left-0" style={{ width: `${ghostP}%`, background: 'rgba(0,0,0,0.3)', borderRadius: 99 }} />
                  <div className="relative h-full" style={{ width: `${p.progress}%`, background: '#ffffff', borderRadius: 99, boxShadow: '0 0 10px rgba(255,255,255,0.4)' }} />
                </div>
                <span className="whitespace-nowrap" style={{ fontSize: 14, fontWeight: 900, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{p.rr}/100</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2" style={{ gap: 8, marginTop: 14, borderTop: `4px solid ${border}`, paddingTop: 12, position: 'relative', zIndex: 2 }}>
            <div className="text-center" style={{ background: 'rgba(0,0,0,0.06)', padding: 8, borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: border, opacity: 0.8, marginBottom: 2 }}>W / L</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{p.wins}/{p.losses}</div>
            </div>
            <div className="text-center" style={{ background: 'rgba(0,0,0,0.06)', padding: 8, borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: border, opacity: 0.8, marginBottom: 2 }}>WINRATE</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{p.showWinrate ? `${p.winrate}%` : '—'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: p.family }} className="w-full max-w-[520px]">
      <style>{`
        @keyframes pastelPopIcon{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
      `}</style>
      <div className="relative flex flex-col" style={{ background: bg, border: edge, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', transition: 'background-color 0.5s ease' }}>
        {p.promo && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center" style={{ background: promoBg, borderRadius: 'inherit', transition: 'background-color 0.4s ease' }}>
            {p.promo.iconUrl ? <img src={p.promo.iconUrl} alt="rank" style={{ width: 110, height: 110, marginBottom: 16, opacity: 0, animation: 'pastelPopIcon 0.8s cubic-bezier(0.175,0.885,0.32,1.275) forwards', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' }} /> : null}
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: border, marginBottom: 4, textTransform: 'uppercase' }}>
              {p.promo.direction === 'up' ? 'PROMOTION SECURED' : 'DEMOTION RISK'}
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: 2, textTransform: 'uppercase', textShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
              {p.promo.direction === 'up' ? 'RANK UP' : 'RANK DOWN'}
            </div>
          </div>
        )}

        <div className="absolute whitespace-nowrap" style={{ top: -20, left: '50%', transform: 'translateX(-50%)', background: border, color: '#ffffff', fontSize: 16, fontWeight: 900, letterSpacing: 0.5, padding: '8px 24px', borderRadius: 99, zIndex: 10 }}>
          CURRENT RANK 🤍
        </div>

        <div className="flex items-center relative" style={{ padding: '36px 32px 28px 32px', gap: 24 }}>
          <div style={{ width: 100, height: 100, flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', filter: `drop-shadow(0 0 20px ${bg}) brightness(1.05)` }}>
            {p.iconUrl ? <img src={p.iconUrl} alt={p.rankName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : null}
          </div>
          <div className="flex-1 w-full flex flex-col justify-center" style={{ gap: 12 }}>
            <div className="flex items-center justify-between">
              <span className="flex items-center uppercase" style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', letterSpacing: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)', gap: 12 }}>
                {p.rankName}
                {sparkle}
              </span>
            </div>
            <div className="flex items-center" style={{ gap: 16 }}>
              <div className="flex-1 relative overflow-hidden" style={{ height: 14, background: 'rgba(0,0,0,0.2)', borderRadius: 99 }}>
                <div className="absolute inset-y-0 left-0" style={{ width: `${ghostP}%`, background: 'rgba(0,0,0,0.3)', borderRadius: 99 }} />
                <div className="relative h-full" style={{ width: `${p.progress}%`, background: '#ffffff', borderRadius: 99, boxShadow: '0 0 10px rgba(255,255,255,0.4)' }} />
              </div>
              <span className="whitespace-nowrap" style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{p.rr}/100</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2" style={{ borderTop: edge, background: 'rgba(0,0,0,0.05)', borderBottomLeftRadius: 19, borderBottomRightRadius: 19 }}>
          <div className="text-center whitespace-nowrap" style={{ padding: '20px 0', fontSize: 22, fontWeight: 900, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.15)', letterSpacing: 0.5, borderRight: edge }}>
            W/L {p.wins}/{p.losses}
          </div>
          <div className="text-center whitespace-nowrap" style={{ padding: '20px 0', fontSize: 22, fontWeight: 900, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.15)', letterSpacing: 0.5 }}>
            WR {p.showWinrate ? `${p.winrate}%` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
