'use client';
import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';
import type { MediaThemeProps } from './types';

function hexToRgb(hex: string): [number, number, number] {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (!Number.isFinite(n) || full.length !== 6) return [255, 117, 140];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// VinylDisc- piringan hitam ala referensi: blur ring warna cover, teks
// melingkar (judul • artis) putar kiri, cover art putar kanan, tonearm opsional.
// Warna ring diambil dari palette vibrant (ala extractAlbumColor referensi,
// tanpa masalah CORS canvas). Shared: dipakai media-player & music request.
export default function VinylDiscTheme(props: MediaThemeProps & { showTonearm?: boolean; showTextRing?: boolean; vinylDiscOutline?: boolean; vinylDiscFollowThumbnail?: boolean; vinylDiscSpin?: number }) {
  const { track, artist, art, palette, accent, playbackStatus, isPausedOverlay, showAlbumArt, showTonearm = true, showTextRing = true, vinylDiscOutline = true, vinylDiscFollowThumbnail = true, vinylDiscSpin = 35 } = props;
  const isPlaying = playbackStatus === 4 && !isPausedOverlay;
  const [artOk, setArtOk] = useState(true);
  useEffect(() => { setArtOk(true); }, [art]);

  // Warna ring: saat "warna sesuai thumbnail" aktif, pakai Vibrant dari cover.
  // Kalau user memakai warna custom / auto color mati, pakai accent dari setting.
  const vibrant = palette?.Vibrant || palette?.LightVibrant;
  const ringAccent = (vinylDiscFollowThumbnail ? vibrant : undefined) || accent || vibrant || '#ff758c';
  const [vr, vg, vb] = hexToRgb(ringAccent);
  const ringBg = `rgba(${vr},${vg},${vb},0.55)`;
  const playState = isPlaying ? 'running' : 'paused';
  const spin = Math.max(5, Math.min(120, vinylDiscSpin || 35));
  const ringText = `${track || '-'} • ${artist || '-'} • `.repeat(3);

  return (
    <div className="vinyldisc-theme w-full flex justify-center">
      <style>{`@keyframes vinyldisc-spin-left{0%{transform:rotate(0deg)}100%{transform:rotate(-360deg)}}@keyframes vinyldisc-spin-right{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes vinyldisc-drop-arm{0%{transform:rotate(15deg);opacity:0}100%{transform:rotate(0deg);opacity:1}}`}</style>
      <div
        className="relative flex items-center justify-center"
        style={{ width: 420, maxWidth: '100%', aspectRatio: '1 / 1' }}
      >
        {/* Blur ring: album art di-blur (fallback warna tema kalau tanpa cover).
            Edge luar dibuat hard: blur di-scale di dalam mask lingkaran */}
        <div
          className="absolute rounded-full pointer-events-none overflow-hidden"
          style={{
            width: '86%',
            height: '86%',
            backgroundColor: ringBg,
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {art && artOk ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${art}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(14px) brightness(0.75)',
                transform: 'scale(1.15)',
                animation: `vinyldisc-spin-left ${spin}s linear infinite`,
                animationPlayState: playState,
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                animation: `vinyldisc-spin-left ${spin}s linear infinite`,
                animationPlayState: playState,
              }}
            />
          )}
          {/* Tint vibrant dari thumbnail di atas blur cover, supaya warna ring
              benar-benar mengikuti cover (bukan cuma putih/abu). */}
          {art && artOk && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background: ringAccent,
                mixBlendMode: 'color',
                opacity: 0.55,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
        {/* Teks melingkar putar kiri + fade mask */}
        {showTextRing && (
          <div
            className="absolute rounded-full pointer-events-none flex items-center justify-center"
            style={{ width: '86%', height: '86%', animation: `vinyldisc-spin-left ${spin}s linear infinite`, animationPlayState: playState }}
          >
            <svg viewBox="0 0 320 320" style={{ width: '100%', height: '100%' }}>
              <defs>
                <path id="vinyldisc-circle" d="M 160, 160 m -130, 0 a 130,130 0 1,1 260,0 a 130,130 0 1,1 -260,0" />
                <linearGradient id="vinyldisc-fade" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.05" />
                  <stop offset="25%" stopColor="white" stopOpacity="1" />
                  <stop offset="75%" stopColor="white" stopOpacity="1" />
                  <stop offset="100%" stopColor="white" stopOpacity="0.05" />
                </linearGradient>
                <mask id="vinyldisc-fademask">
                  <circle cx="160" cy="160" r="150" fill="url(#vinyldisc-fade)" />
                </mask>
              </defs>
              <g mask="url(#vinyldisc-fademask)">
                <text
                  {...(vinylDiscOutline ? {
                    stroke: 'rgba(0,0,0,0.65)',
                    strokeWidth: 3,
                    strokeLinejoin: 'round' as const,
                    paintOrder: 'stroke',
                  } : {})}
                  style={{ fontSize: 14.5, fill: 'white', fontWeight: 900, letterSpacing: 4.5, textTransform: 'uppercase' }}
                >
                  <textPath href="#vinyldisc-circle" startOffset="0%">{ringText}</textPath>
                </text>
              </g>
            </svg>
          </div>
        )}
        {/* Piringan / cover art putar kanan */}
        {showAlbumArt && (
          <div
            className="absolute rounded-full overflow-hidden"
            style={{ width: '60%', height: '60%', zIndex: 2, animation: `vinyldisc-spin-right ${spin}s linear infinite`, animationPlayState: playState, background: '#18181b' }}
          >
            {art && artOk ? (
              <img src={art} alt={track || 'cover'} crossOrigin="anonymous" onError={() => setArtOk(false)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div className="w-full h-full grid place-items-center text-white/40">
                <Music size={64} />
              </div>
            )}
          </div>
        )}
        {/* Tonearm (opsional, animasi drop tiap ganti lagu) */}
        {showTonearm && (
          <div
            key={art || 'no-art'}
            className="absolute pointer-events-none"
            style={{ top: '6%', right: '-5%', width: '33%', height: '62%', zIndex: 10, transformOrigin: 'top right', animation: `vinyldisc-drop-arm 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards` }}
          >
            <svg viewBox="0 0 150 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
              <circle cx="125" cy="35" r="18" fill="#e0e0e0" stroke="#b0b0b0" strokeWidth="4" />
              <circle cx="125" cy="35" r="8" fill="#333" />
              <path d="M 125 50 Q 120 130 65 190 L 45 210" stroke="white" strokeWidth="8" strokeLinecap="round" />
              <path d="M 125 50 Q 120 130 65 190 L 45 210" stroke="#dcdcdc" strokeWidth="2" strokeLinecap="round" />
              <rect x="30" y="200" width="24" height="34" rx="4" fill="white" transform="rotate(-15 42 217)" stroke="#c0c0c0" strokeWidth="2" />
              <rect x="35" y="222" width="14" height="8" rx="2" fill="#111" transform="rotate(-15 42 217)" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
