'use client';
import { useEffect, useRef, useState } from 'react';
import type { GoalThemeProps } from './types';

const LOGO_W = 120;
const VID_BASE_OPACITY = 0.8;
const VID_FADE_SECONDS = 0.9; // fade-out di sisa durasi ini, fade-in lagi saat loop restart

function hexToRgb(hex: string): [number, number, number] {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (!Number.isFinite(n) || full.length !== 6) return [189, 147, 249];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// NeonBar- progress bar video-background ala referensi: logo kiri + fill
// putih animasi + angka font kustom (default Orbitron) + sekuens COMPLETED saat 100%.
// Video diambil dari /video/banner.mp4 (file: FRONTEND/public/video/banner.mp4).
// Tanpa file = background hitam.
export default function NeonBar({ title, current, target, percent, font, fontSize, accent, showLabel, showCounts, showBar, completedText }: GoalThemeProps) {
  const pct = Math.min(100, Math.max(0, Math.round(percent)));
  const [displayed, setDisplayed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const displayedRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [vidDim, setVidDim] = useState(1);

  // Loop mulus: video di-gelapkan (fade to black, bukan putih/transparan)
  // saat mau habis, balik normal lagi saat loop restart
  const onVideoTime = () => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    const remain = v.duration - v.currentTime;
    setVidDim(remain < VID_FADE_SECONDS ? Math.max(0, remain / VID_FADE_SECONDS) : 1);
  };

  useEffect(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setCompleted(false);

    const from = displayedRef.current;
    const dist = pct - from;
    const duration = Math.max(500, Math.abs(dist) * 15);
    let start: number | null = null;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
      const val = from + dist * eased;
      displayedRef.current = val;
      setDisplayed(Math.round(val));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        displayedRef.current = pct;
        setDisplayed(pct);
        if (pct === 100) {
          timers.current.push(window.setTimeout(() => {
            setCompleted(true);
            timers.current.push(window.setTimeout(() => setCompleted(false), 2500));
          }, 800));
        }
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [pct]);

  const [gr, gg, gb] = hexToRgb(accent || '#bd93f9');
  // Font mengikuti setting user; default 'Outfit' (bawaan global) = tetap Orbitron sesuai desain
  const ff = font && font !== 'Outfit' ? `'${font}', 'Orbitron', sans-serif` : `'Orbitron', sans-serif`;
  const doneLabel = (completedText || 'COMPLETED!').slice(0, 40) || 'COMPLETED!';
  const pctSize = Math.round(fontSize * 3); // default 16 -> 48px (3rem)
  const doneSize = Math.round(fontSize * 2.2);

  return (
    <div className="w-full max-w-[800px]">
      <style>{`@keyframes neonbar-pulse-glow{0%{opacity:0.3;transform:scale(0.9)}100%{opacity:0.8;transform:scale(1.1)}}`}</style>
      {showLabel && (
        <div className="flex items-end justify-between mb-1.5 px-0.5">
          <div className="font-black uppercase tracking-widest text-white/90" style={{ fontSize: Math.max(14, fontSize), fontFamily: ff }}>
            {title}
          </div>
          {showCounts && (
            <div className="font-bold text-white/60" style={{ fontSize: Math.max(12, fontSize - 2), fontFamily: ff }}>
              {current.toLocaleString()} / {target.toLocaleString()}
            </div>
          )}
        </div>
      )}
      {showBar ? (
        <div
          className="relative flex overflow-hidden bg-black w-full"
          style={{ height: 100, border: '4px solid rgba(255,255,255,0.2)', borderRadius: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
        >
          <video
            ref={videoRef}
            onTimeUpdate={onVideoTime}
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit: 'cover',
              opacity: VID_BASE_OPACITY,
              zIndex: 0,
              filter: `brightness(${0.6 * vidDim}) contrast(1.2) saturate(1.5)`,
              transition: 'filter 0.25s linear',
              mixBlendMode: 'multiply'
            }}
            autoPlay
            loop
            muted
            playsInline
            src="/video/banner.mp4"
          />
          {/* Logo kiri */}
          <div
            className="relative flex items-center justify-center shrink-0 h-full"
            style={{ width: LOGO_W, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)', zIndex: 20, borderRight: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div
              className="absolute"
              style={{ width: '90%', height: '90%', background: `radial-gradient(circle, rgba(${gr},${gg},${gb},0.3) 0%, rgba(0,0,0,0) 70%)`, zIndex: -1, animation: 'neonbar-pulse-glow 4s ease-in-out infinite alternate' }}
            />
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: 65, height: 65, filter: 'drop-shadow(0px 0px 5px rgba(0,0,0,0.8))' }}>
              <defs>
                <linearGradient id="neonbarLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8be9fd" />
                  <stop offset="50%" stopColor="#bd93f9" />
                  <stop offset="100%" stopColor="#ffb86c" />
                </linearGradient>
              </defs>
              <path d="M 40 30 L 60 30 L 60 45 L 40 45 L 40 55 L 60 55 L 60 70 L 40 70 L 40 60 L 50 60 L 50 50 L 30 50 L 30 40 L 50 40 L 50 30 Z" fill="url(#neonbarLogoGrad)" />
              <path d="M 25 20 L 25 80 L 45 80 L 45 70 L 35 70 L 35 30 L 45 30 L 45 20 Z" fill="url(#neonbarLogoGrad)" />
              <path d="M 75 20 L 75 80 L 55 80 L 55 70 L 65 70 L 65 30 L 55 30 L 55 20 Z" fill="url(#neonbarLogoGrad)" />
            </svg>
          </div>
          {/* Track + fill */}
          <div className="relative flex-1 h-full overflow-hidden" style={{ zIndex: 10 }}>
            <div
              className="h-full bg-white relative flex items-center overflow-hidden"
              style={{ width: `${pct}%`, transition: 'width 0.8s cubic-bezier(0.25, 1, 0.5, 1)', borderRight: '3px solid rgba(255,255,255,0.9)', boxShadow: '5px 0 15px rgba(255,255,255,0.2)' }}
            >
              <span
                className="absolute font-black whitespace-nowrap"
                style={{
                  fontFamily: ff,
                  fontSize: pctSize,
                  color: 'black',
                  letterSpacing: 2,
                  left: '2rem',
                  opacity: displayed <= 0 || completed ? 0 : 1,
                  transition: 'opacity 0.5s ease',
                  WebkitFontSmoothing: 'antialiased',
                }}
              >
                {displayed}%
              </span>
              <span
                className="absolute font-black whitespace-nowrap"
                style={{
                  fontFamily: ff,
                  fontSize: doneSize,
                  color: 'black',
                  letterSpacing: 2,
                  left: '2rem',
                  opacity: completed ? 1 : 0,
                  transform: completed ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease',
                }}
              >
                {doneLabel}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center font-black text-white" style={{ fontFamily: ff, fontSize: Math.max(14, fontSize) }}>
          {title}- {current.toLocaleString()} / {target.toLocaleString()} ({pct}%)
        </div>
      )}
      {!showLabel && showCounts && showBar && (
        <div className="text-center mt-1 font-bold text-white/60" style={{ fontSize: 12 }}>
          {current.toLocaleString()} / {target.toLocaleString()} ({pct}%)
        </div>
      )}
    </div>
  );
}
