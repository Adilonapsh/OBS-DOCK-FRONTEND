'use client';

/* eslint-disable @next/next/no-img-element */

import type { ValorantSkinProps } from './types';
import { RollingCode } from './RollingCode';

export const themeMeta = { value: 'brutalist', label: 'Brutalist - Neo Brutalist' } as const;

// Skin neo-brutalist: chrome flat + border tebal + hard shadow,
// aksen (rank/WL/winrate/streak/progress) ngikut warna tier.
export default function BrutalistTheme(p: ValorantSkinProps) {
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
        <style>{`@keyframes valoFloat{0%{transform:translateY(0)}50%{transform:translateY(-5px)}100%{transform:translateY(0)}}
        @keyframes valoPop{to{opacity:1;transform:scale(1)}}
        @keyframes valoPopIcon{to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes valoUp{to{opacity:1;transform:translateY(0)}}
        `}</style>
        <div className="relative flex items-center gap-4 rounded-2xl px-4 py-3.5 overflow-hidden" style={{ background: bg, border: edge, boxShadow: hard }}>
          {p.promo && (
            <div className="absolute inset-0 z-40 flex items-center justify-center gap-3 px-4" style={{ background: `${bg}f2`, backdropFilter: 'blur(6px)' }}>
              {p.promo.iconUrl ? <img key={`${p.promo.direction}-${p.promo.tierName}`} src={p.promo.iconUrl} alt="rank" className="w-[52px] h-[52px] object-contain shrink-0" style={{ opacity: 0, transform: 'scale(0.5) translateY(12px)', animation: 'valoPopIcon 0.55s cubic-bezier(0.175,0.885,0.32,1.275) forwards 0.15s', filter: `drop-shadow(3px 3px 0 ${border})` }} /> : null}
              <div className="flex flex-col min-w-0">
                <div className={`text-[10px] font-black tracking-[0.25em] ${upCls}`} style={{ color: ink, opacity: 0, transform: 'translateY(10px)', animation: 'valoUp 0.5s ease forwards 0.1s' }}>
                  {p.promo.direction === 'up' ? 'RANK UP' : 'RANK DOWN'}
                </div>
                <div className={`text-[19px] font-black tracking-wide truncate ${upCls} ${itCls}`} style={{ color: tier, textShadow: `2px 2px 0 ${border}`, opacity: 0, transform: 'scale(0.85)', animation: 'valoPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards 0.3s' }}>
                  {p.promo.tierName.toUpperCase()}
                </div>
              </div>
            </div>
          )}
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
            {p.showPartyCode && p.partyCode ? (
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider ${upCls}`} style={{ color: ink, background: badgeBg, border: `2px solid ${border}` }}>PARTY</span>
                <RollingCode code={p.partyCode} charStyle={{ fontSize: 14, fontWeight: 900, color: tier, letterSpacing: '0.1em', textShadow: `1px 1px 0 ${border}` }} />
              </div>
            ) : null}
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
          {p.showPartyCode && p.partyCode ? (
            <div className="flex justify-center mt-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl" style={{ background: bg, border: `2px solid ${border}`, boxShadow: hardSm }}>
                <span className={`text-[10px] font-black tracking-[0.2em] ${upCls}`} style={{ color: ink }}>PARTY CODE</span>
                <RollingCode code={p.partyCode} charStyle={{ fontSize: 18, fontWeight: 900, color: tier, letterSpacing: '0.12em', textShadow: numShadow }} />
              </div>
            </div>
          ) : null}
          <div className={`text-center mt-3 text-[11px] font-black tracking-[0.2em] ${upCls}`} style={{ color: ink }}>
            {p.updatedAt ? `UPDATED ${p.updatedAt}` : 'LOADING...'} • AUTO-REFRESH ON
          </div>
        </div>
      </div>
    </div>
  );
}
