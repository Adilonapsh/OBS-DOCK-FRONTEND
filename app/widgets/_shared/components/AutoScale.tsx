'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

// AutoScale — fixed design width yang otomatis di-zoom agar ngikutin viewport.
// - Anak di-render di dalam kotak fix selebar `baseWidth` px (mis. 420, sesuai max-w asli tema).
// - Default: zoom = availW / baseW → lebar SELALU ngikutin window (penuh selebar viewport).
//   Tinggi di-cap max 100vh (overflow hidden, konten kepotong seperti di OBS).
// - ?fit=both → fit penuh: zoom = min(availW / baseW, availH / baseH),
//   widget dikecilin sampai muat seluruhnya dalam layar (lebar bisa小于 viewport).
// - Override via URL: ?base=480 ?scale=1.5 ?autoscale=0/1 ?maxScale=3 ?fit=both
// - Prop defaultEnabled={false} → ukuran fix natural (tidak di-zoom) kecuali
//   dipaksa via ?autoscale=1 / ?scale=. Cocok untuk widget kecil seperti QR.
//
// Contoh: <AutoScale defaultBase={420} baseWidth={420}>{renderTheme()}</AutoScale>

function posJustify(pos: string | null): string {
  const p = (pos || 'center').toLowerCase().replace(/[_\s-]+/g, '');
  if (['tl', 'l', 'bl', 'left', 'topleft', 'bottomleft'].includes(p)) return 'flex-start';
  if (['tr', 'r', 'br', 'right', 'topright', 'bottomright'].includes(p)) return 'flex-end';
  return 'center';
}

// Cari boks selebar & setinggi viewport ke atas (display root: fixed inset-0 / h-screen / w-screen).
// Mengembalikan content-box (sudah dikurangi padding p-2/p-4/p-6) agar zoom pas tanpa overflow.
function viewportBox(el: HTMLElement | null): { w: number; h: number } {
  if (typeof window === 'undefined') return { w: 0, h: 0 };
  let node: HTMLElement | null = el;
  let depth = 0;
  while (node && depth < 12) {
    const cw = node.clientWidth;
    const ch = node.clientHeight;
    if (cw >= window.innerWidth * 0.9 && ch >= window.innerHeight * 0.9) {
      const cs = getComputedStyle(node);
      const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      return { w: Math.max(0, cw - padX), h: Math.max(0, ch - padY) };
    }
    node = node.parentElement;
    depth += 1;
  }
  return { w: window.innerWidth, h: window.innerHeight };
}

export function AutoScale({
  defaultBase,
  baseWidth,
  defaultEnabled = true,
  children,
  className,
  style,
}: {
  defaultBase: number;
  baseWidth?: number;
  defaultEnabled?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const searchParams = useSearchParams();
  const baseParam = searchParams ? parseFloat(searchParams.get('base') || '') : NaN;
  const scaleParam = searchParams ? parseFloat(searchParams.get('scale') || '') : NaN;
  const maxScaleParam = searchParams ? parseFloat(searchParams.get('maxScale') || '') : NaN;
  const autoscaleParam = searchParams ? (searchParams.get('autoscale') || searchParams.get('autoScale') || '') : '';
  const fitParam = searchParams ? (searchParams.get('fit') || '').toLowerCase() : '';
  const posParam = searchParams ? searchParams.get('pos') : null;

  const base = Number.isFinite(baseParam) && baseParam > 0 ? baseParam : baseWidth || defaultBase;
  const manual = Number.isFinite(scaleParam) && scaleParam > 0 ? scaleParam : null;
  const maxScale = Number.isFinite(maxScaleParam) && maxScaleParam > 0 ? maxScaleParam : null;
  const autoRaw = autoscaleParam.toLowerCase();
  const enabled =
    manual != null
      ? true
      : autoRaw === '1' || autoRaw === 'on' || autoRaw === 'true'
        ? true
        : autoRaw === '0' || autoRaw === 'off' || autoRaw === 'false'
          ? false
          : defaultEnabled;
  const fitBoth = fitParam === 'both';

  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<number>(1);
  const [zoom, setZoom] = useState<number>(1);

  useEffect(() => {
    if (manual != null) {
      zoomRef.current = manual;
      setZoom(manual);
      return;
    }
    if (!enabled || !(base > 0)) {
      zoomRef.current = 1;
      setZoom(1);
      return;
    }
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    const compute = () => {
      const box = viewportBox(wrap);
      const availW = box.w > 0 ? box.w : window.innerWidth;
      const availH = box.h > 0 ? box.h : window.innerHeight;
      let z = availW / base;
      if (fitBoth) {
        // Tinggi natural = tinggi ter-zoom saat ini dibagi zoom saat ini (zoom itu linear).
        const cur = zoomRef.current > 0 ? zoomRef.current : 1;
        const naturalH = inner.offsetHeight > 0 ? inner.offsetHeight / cur : 0;
        if (naturalH > 0 && availH > 0) z = Math.min(z, availH / naturalH);
      }
      if (maxScale != null) z = Math.min(z, maxScale);
      if (!Number.isFinite(z) || z <= 0) return;
      z = Math.max(0.05, z);
      if (Math.abs(z - zoomRef.current) > 0.001) {
        zoomRef.current = z;
        setZoom(z);
      }
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(inner);
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
  }, [base, enabled, manual, maxScale, fitBoth]);

  if (!enabled && manual == null) return <>{children}</>;

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ width: '100%', maxHeight: '100vh', overflow: 'hidden', display: 'flex', justifyContent: posJustify(posParam), ...style }}
    >
      <div
        ref={innerRef}
        style={{ width: base, maxWidth: base, flexShrink: 0, zoom: `${zoom}` } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
