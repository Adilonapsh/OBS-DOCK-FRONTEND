'use client';
import { useEffect, useRef, useState } from 'react';
import type { InfoSlidesThemeProps } from './types';

const GOLD_LIGHT = '#d8c690';
const GOLD_MAIN = '#b49f63';
const GOLD_DARK = '#6e6038';

// Esports — panel emas + konten gelap + title tab, sekuens staged yang
// diulang tiap ganti slide. Adaptasi gaya poll Esports ke info slides.
export default function EsportsTheme({ slides, index, font, fontSize, showBadge, showProgress, showArrows, onPrev, onNext }: InfoSlidesThemeProps) {
  const [phase, setPhase] = useState(0); // 1 bg-title, 2 logo, 3 expand, 4 lines, 5 data, 6 title
  const [out, setOut] = useState(false); // animasi keluar tiap ganti slide
  const [shown, setShown] = useState(index); // index yang sedang ditampilkan (tertinggal saat out)
  const timers = useRef<number[]>([]);
  const first = useRef(true);
  const safeShown = slides.length ? Math.min(shown, slides.length - 1) : 0;

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
    // 1. Out dulu (konten lama) → 2. ganti index+badge sambil slide-up → 3. sekuens in lagi
    setOut(true);
    timers.current.push(window.setTimeout(() => {
      setShown(index);
      setOut(false);
      setPhase(0);
      startIn();
    }, 450));
    return () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  }, [index, slides.length]);

  const slide = slides[safeShown];
  const ff = `'${font}', 'Inter', sans-serif`;
  const teko = `'Teko', '${font}', sans-serif`;

  if (!slide) return <div className="info-esports-theme" style={{ width: 640, maxWidth: '100%', height: 170 }} />;

  return (
    <div className="info-esports-theme" style={{ fontFamily: ff, color: 'white', paddingTop: 34 }}>
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
        {/* Konten slide-up tiap ganti index (key = slide yang tampil) */}
        <div key={safeShown} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', animation: 'esports-idx-up 0.5s cubic-bezier(0.25, 1, 0.5, 1)' }}>
        {/* Title tab */}
        <div style={{ width: '100%', height: 30, overflow: 'hidden', position: 'absolute', top: -30, display: 'flex', justifyContent: 'center', zIndex: 1 }}>
          <div
            style={{
              width: '100%',
              background: 'rgba(18,18,18,0.95)',
              color: GOLD_LIGHT,
              fontWeight: 900,
              fontSize: 16,
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
            {slide.title || 'INFO'}
          </div>
        </div>

        {/* Panel utama */}
        <div
          style={{
            display: 'flex',
            height: 170,
            width: phase >= 3 ? 640 : phase >= 1 ? 220 : 0,
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
          {/* Panel emas: gambar/badge + counter */}
          <div
            style={{
              width: 220,
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
            {slide.image ? (
              <img
                src={slide.image}
                alt={slide.title}
                style={{
                  maxHeight: 64,
                  maxWidth: 150,
                  objectFit: 'contain',
                  marginBottom: 6,
                  borderRadius: 4,
                  opacity: phase >= 2 ? 1 : 0,
                  transform: phase >= 2 ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.05s',
                }}
              />
            ) : null}
            <div style={{ fontFamily: teko, fontSize: 34, fontWeight: 500, lineHeight: 1, opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.2s' }}>
              {safeShown + 1} / {slides.length}
            </div>
            <div style={{ background: 'white', color: GOLD_DARK, fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 2, letterSpacing: 1, marginTop: 4, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.3s' }}>
              {(slide.badge || 'INFO').toUpperCase()}
            </div>
          </div>

          {/* Panel konten: badge + judul + desc */}
          <div
            style={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '12px 24px',
              backgroundColor: '#121212',
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              minWidth: 0,
              opacity: phase >= 5 ? 1 : 0,
              transform: phase >= 5 ? 'translate(0,0)' : 'translateY(10px)',
              transition: 'all 0.5s ease',
            }}
          >
            {showBadge && slide.badge ? (
              <span style={{ fontSize: 11, fontWeight: 700, color: GOLD_MAIN, letterSpacing: 2, lineHeight: 1.2 }}>
                {slide.badge.toUpperCase()}
              </span>
            ) : null}
            <span style={{ fontSize: Math.max(20, fontSize + 8), fontWeight: 900, color: 'white', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {slide.title}
            </span>
            <div
              style={{
                height: 2,
                backgroundColor: GOLD_MAIN,
                width: '100%',
                margin: '6px 0',
                transformOrigin: 'left',
                transform: phase >= 4 ? 'scaleX(1)' : 'scaleX(0)',
                transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            />
            <span style={{ fontSize: Math.max(12, fontSize), color: 'rgba(255,255,255,0.65)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
              {slide.desc}
            </span>
          </div>

          {showArrows && (
            <div style={{ position: 'absolute', right: 10, bottom: 10, display: 'flex', gap: 6, zIndex: 6 }}>
              <button onClick={onPrev} aria-label="Prev" style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', background: 'transparent', color: GOLD_LIGHT, border: '1px solid rgba(216,198,144,0.5)', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 900 }}>‹</button>
              <button onClick={onNext} aria-label="Next" style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', background: GOLD_MAIN, color: '#111', border: '1px solid rgba(216,198,144,0.5)', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 900 }}>›</button>
            </div>
          )}
        </div>
        </div>

        {/* Dots progress */}
        {showProgress && slides.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {slides.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === safeShown ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === safeShown ? GOLD_MAIN : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.4s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
