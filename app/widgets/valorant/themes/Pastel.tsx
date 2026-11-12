'use client';

/* eslint-disable @next/next/no-img-element */

import { pastelBgFor, PASTEL_BORDER } from '../utils/pastelTiers';
import type { ValorantSkinProps } from './types';
import { RollingCode } from './RollingCode';

export const themeMeta = { value: 'pastel', label: 'Pastel - Cute Card' } as const;

// BG pastel ngikut base tier + border slate + teks putih, sesuai referensi.
// RR count + ghost bar tetap jalan (ghost = tint gelap di belakang fill putih).
export default function PastelTheme(p: ValorantSkinProps) {
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
          @keyframes pastelPopIcon{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
          .pastel-bounce{animation:pastelBounce 0.5s ease;}
          .pastel-bounce .pastel-mini-icon{transform:scale(1.25);}
          .pastel-shake{animation:pastelShake 0.4s cubic-bezier(.36,.07,.19,.97) both;}
        `}</style>
        <div key={p.promo ? `${p.promo.direction}-${p.promo.tierName}` : 'idle'} className={animCls} style={{ backgroundColor: promoBg, backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '15px 15px', border: `4px solid ${border}`, borderRadius: 20, boxShadow: '0 15px 30px rgba(0,0,0,0.15)', padding: 16, position: 'relative', overflow: 'hidden', transition: 'background-color 0.5s ease' }}>
          {p.promo && (
            <div className="absolute inset-0 z-40 flex items-center justify-center gap-3 px-4" style={{ background: promoBg, borderRadius: 'inherit' }}>
              {p.promo.iconUrl ? <img key={`promo-${p.promo.direction}-${p.promo.tierName}`} src={p.promo.iconUrl} alt="rank" style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0, opacity: 0, animation: 'pastelPopIcon 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards', filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.6))' }} /> : null}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: border, textTransform: 'uppercase' }}>
                  {p.promo.direction === 'up' ? 'Rank Up ▲' : 'Rank Down ▼'}
                </div>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', textTransform: 'uppercase', textShadow: '0 2px 6px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.promo.tierName}
                </div>
              </div>
            </div>
          )}
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
          {p.showPartyCode && p.partyCode ? (
            <div className="flex items-center justify-center" style={{ gap: 8, marginTop: 10, position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: border, letterSpacing: 1.5 }}>PARTY</span>
              <span style={{ background: 'rgba(255,255,255,0.35)', borderRadius: 8, padding: '3px 10px' }}>
                <RollingCode code={p.partyCode} charStyle={{ fontSize: 15, fontWeight: 900, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
              </span>
            </div>
          ) : null}
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

        {p.showPartyCode && p.partyCode ? (
          <div className="flex items-center justify-center" style={{ padding: '0 32px 22px', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: border, opacity: 0.8 }}>PARTY CODE</span>
            <span style={{ background: 'rgba(255,255,255,0.35)', borderRadius: 10, padding: '4px 12px' }}>
              <RollingCode code={p.partyCode} charStyle={{ fontSize: 20, fontWeight: 900, color: '#ffffff', letterSpacing: '0.1em', textShadow: '0 2px 4px rgba(0,0,0,0.18)' }} />
            </span>
          </div>
        ) : null}

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
