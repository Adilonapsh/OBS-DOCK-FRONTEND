'use client';

// Helper presentational - track marquee sekali jalan.
// Teks mulai dari luar kanan, selesai di luar kiri, lalu jeda sebentar
// sebelum mengulang lagi dari kanan (tidak seamless seperti sebelumnya).
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

type Props = {
  items: string[];
  separator: string;
  speed: number; // detik sekali jalan
  repeatDelay?: number; // jeda sebelum mulai lagi (detik)
  direction: 'left' | 'right';
  renderItem: (text: string, key: string) => ReactNode;
  className?: string;
};

export function TickerTrack({ items, separator, speed, repeatDelay = 2, direction, renderItem, className }: Props) {
  const list = items.length > 0 ? items : ['Ticker'];
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const animName = `ticker-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [dims, setDims] = useState({ w: 0, cw: 0 });

  useEffect(() => {
    const wrap = wrapRef.current;
    const content = contentRef.current;
    if (!wrap || !content) return;

    const measure = () => {
      const w = wrap.clientWidth;
      const cw = Math.ceil(content.scrollWidth);
      setDims((prev) => (prev.w === w && prev.cw === cw ? prev : { w, cw }));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(content);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const safeSpeed = Math.max(1, Math.min(300, speed || 20));
  const safeGap = Math.max(0, Math.min(60, repeatDelay ?? 2));
  const total = safeSpeed + safeGap;
  const runPct = total > 0 ? (safeSpeed / total) * 100 : 100;
  const ready = dims.w > 0 && dims.cw > 0;

  // Kanan: mulai di luar kiri -> keluar kanan. Kiri: mulai di luar kanan -> keluar kiri.
  const start = direction === 'right' ? -dims.cw : dims.w;
  const end = direction === 'right' ? dims.w : -dims.cw;

  const keyframes = ready
    ? `@keyframes ${animName}{0%{transform:translateX(${start}px)}${runPct.toFixed(4)}%{transform:translateX(${end}px)}100%{transform:translateX(${end}px)}}`
    : '';

  const row = () =>
    list.map((t, i) => (
      <span key={i} className="flex items-center shrink-0">
        {renderItem(t, `item-${i}`)}
        <span className="ticker-sep mx-4 shrink-0" aria-hidden>{separator || '•'}</span>
      </span>
    ));

  return (
    <div ref={wrapRef} className={`overflow-hidden w-full ${className || ''}`}>
      <div
        ref={contentRef}
        className="flex w-max items-center will-change-transform"
        style={
          ready
            ? {
                animationName: animName,
                animationDuration: `${total}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                animationFillMode: 'both',
              }
            : { visibility: 'hidden' }
        }
      >
        {row()}
      </div>
      <style>{keyframes}</style>
    </div>
  );
}
