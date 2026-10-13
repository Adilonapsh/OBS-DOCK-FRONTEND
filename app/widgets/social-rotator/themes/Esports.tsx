'use client';
import { useEffect, useRef, useState } from 'react';
import type { SocialRotatorThemeProps } from './types';
import { platformLogo, platformGlyph } from '../../_shared/utils/platform';

const GOLD_LIGHT = '#d8c690';
const GOLD_MAIN = '#b49f63';
const GOLD_DARK = '#6e6038';

// Esports — panel emas + konten gelap + title tab, sekuens staged yang
// diulang tiap ganti sosmed. Adaptasi gaya poll Esports ke rotator sosial.
export default function EsportsTheme({ socials, index, font, fontSize, showIcon, showHandle, showLabel, compact = false }: SocialRotatorThemeProps) {
  const [phase, setPhase] = useState(0); // 1 bg-title, 2 logo, 3 expand, 4 lines, 5 data, 6 title
  const [out, setOut] = useState(false); // animasi keluar tiap ganti sosmed
  const [shown, setShown] = useState(index); // index yang tampil (tertinggal saat out)
  const timers = useRef<number[]>([]);
  const first = useRef(true);

  const startIn = () => {
    const seq: Array<[number, number]> = [[1, 60], [2, 560], [3, 1260], [4, 1760], [5, 1960], [6, 2260]];
    for (const [p, ms] of seq) timers.current.push(window.setTimeout(() => setPhase(p), ms));
  };

  useEffect(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (first.current) {
      first.current = false;
      setShown(index);
      startIn();
      return;
    }
    // 1. Out dulu (konten lama) → 2. ganti index sambil slide-up → 3. sekuens in lagi
    setOut(true);
    timers.current.push(window.setTimeout(() => {
      setShown(index);
      setOut(false);
      setPhase(0);
      startIn();
    }, 450));
    return () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  }, [index]);

  const shownIndex = socials.length ? (shown % socials.length) : 0;
  const item = socials.length ? socials[shownIndex] : undefined;
  const ff = `'${font}', 'Inter', sans-serif`;
  const teko = `'Teko', '${font}', sans-serif`;
  const logo = item ? platformLogo(item.platform) : undefined;
  const platformName = (item?.label || item?.platform || 'SOCIAL').toUpperCase();
  // Dimensi compact: background lebih pendek + semua mengecil
  const H = compact ? 92 : 140;
  const GW = compact ? 150 : 220;
  const TAB_H = compact ? 24 : 30;
  const TAB_FONT = compact ? 13 : 16;
  const LOGO_MAX_H = compact ? 40 : 72;
  const LOGO_MAX_W = compact ? 100 : 150;
  const HANDLE_SIZE = compact ? Math.max(24, fontSize + 12) : Math.max(34, fontSize + 24);
  const CONTENT_PAD = compact ? '8px 16px' : '10px 24px';

  return (
    <div className="social-esports-theme" style={{ fontFamily: ff, color: 'white', paddingTop: TAB_H + 4 }}>
      <style>{`@keyframes esports-idx-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: out ? 0 : 1,
          transform: out ? 'translateY(-14px)' : 'none',
          transition: 'opacity 0.4s ease, transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {/* Konten slide-up tiap ganti sosmed (key = yang tampil) */}
        <div key={shownIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', animation: 'esports-idx-up 0.5s cubic-bezier(0.25, 1, 0.5, 1)' }}>
        {/* Title tab */}
        <div style={{ width: '100%', height: TAB_H, overflow: 'hidden', position: 'absolute', top: -TAB_H, display: 'flex', justifyContent: 'center', zIndex: 1 }}>
          <div
            style={{
              width: '100%',
              background: 'rgba(18,18,18,0.95)',
              color: GOLD_LIGHT,
              fontWeight: 900,
              fontSize: TAB_FONT,
              letterSpacing: 2,
              padding: '4px 12px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              boxSizing: 'border-box',
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
              transform: phase >= 6 ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {platformName}
          </div>
        </div>

        {/* Panel utama */}
        <div
          style={{
            display: 'flex',
            height: H,
            width: phase >= 3 ? (compact ? 460 : 640) : phase >= 1 ? GW : 0,
            opacity: phase >= 1 ? 1 : 0,
            backgroundColor: '#121212',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 2,
            transition: 'width 0.8s cubic-bezier(0.25, 1, 0.2, 1), height 0.8s cubic-bezier(0.25, 1, 0.2, 1), opacity 0.3s ease',
          }}
        >
          {/* Panel emas: logo saja */}
          <div
            style={{
              width: GW,
              height: '100%',
              flexShrink: 0,
              background: 'linear-gradient(135deg, #7c724f 0%, #b8a678 40%, #d8c690 60%, #4a4328 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              borderRight: '2px solid rgba(0,0,0,0.5)',
              zIndex: 5,
              color: '#111',
              padding: '0 12px',
            }}
          >
            {showIcon && logo ? (
              <img
                src={logo}
                alt={item?.platform || 'logo'}
                style={{
                  maxHeight: LOGO_MAX_H,
                  maxWidth: LOGO_MAX_W,
                  objectFit: 'contain',
                  opacity: phase >= 2 ? 1 : 0,
                  transform: phase >= 2 ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.05s',
                }}
              />
            ) : (
              <span
                style={{
                  fontFamily: teko,
                  fontSize: LOGO_MAX_H,
                  fontWeight: 700,
                  lineHeight: 1,
                  opacity: phase >= 2 ? 1 : 0,
                  transform: phase >= 2 ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.05s',
                }}
              >
                {platformGlyph(item?.platform || '')}
              </span>
            )}
            <div style={{ background: 'white', color: GOLD_DARK, fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 2, letterSpacing: 1, marginTop: 6, opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.3s' }}>
              FOLLOW
            </div>
          </div>

          {/* Panel konten: handle + label */}
          <div
            style={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: CONTENT_PAD,
              backgroundColor: '#121212',
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              minWidth: 0,
              opacity: phase >= 5 ? 1 : 0,
              transform: phase >= 5 ? 'translate(0,0)' : 'translateY(10px)',
              transition: 'all 0.5s ease',
            }}
          >
            {showLabel && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, lineHeight: 1.2 }}>
                {(item?.label || item?.platform || '').toUpperCase()}
              </span>
            )}
            {showHandle && (
              <span style={{ fontFamily: teko, fontSize: HANDLE_SIZE, fontWeight: 700, color: 'white', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {item?.handle || '-'}
              </span>
            )}
            <div
              style={{
                height: 2,
                backgroundColor: GOLD_MAIN,
                width: '100%',
                margin: '6px 0 0',
                transformOrigin: 'left',
                transform: phase >= 4 ? 'scaleX(1)' : 'scaleX(0)',
                transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
