'use client';

import { useEffect, useState } from 'react';

// Party code di-roll per karakter (slide-up ala slot machine).
// Animasi diputar ulang saat kode berubah dan berkala supaya tetap
// terlihat "rolling" selama widget nongkrong di OBS.
const ROLL_KEYFRAMES = `
@keyframes valoCodeRoll{
  0%{opacity:0;transform:translateY(120%)}
  55%{opacity:1}
  100%{opacity:1;transform:translateY(0)}
}`;

export function RollingCode({
  code,
  className,
  style,
  charStyle,
  intervalMs = 12000,
}: {
  code: string;
  className?: string;
  style?: React.CSSProperties;
  charStyle?: React.CSSProperties;
  intervalMs?: number;
}) {
  const [nonce, setNonce] = useState(0);

  // Kode berubah (mis. di-update dari settings) → roll ulang dari awal.
  useEffect(() => {
    setNonce((n) => n + 1);
  }, [code]);

  // Roll berkala biar animasinya tetap kelihatan di OBS.
  useEffect(() => {
    if (!code) return;
    const t = setInterval(() => setNonce((n) => n + 1), intervalMs);
    return () => clearInterval(t);
  }, [code, intervalMs]);

  if (!code) return null;

  const chars = Array.from(code);

  return (
    <>
      <style>{ROLL_KEYFRAMES}</style>
      <span
        className={className}
        style={{ display: 'inline-flex', overflow: 'hidden', padding: '0.08em 0', ...style }}
      >
        {chars.map((ch, i) => (
          <span
            key={`${nonce}-${i}`}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              animation: 'valoCodeRoll 0.75s cubic-bezier(0.22, 1, 0.36, 1) both',
              animationDelay: `${Math.min(i, 12) * 55}ms`,
              ...charStyle,
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </span>
    </>
  );
}
