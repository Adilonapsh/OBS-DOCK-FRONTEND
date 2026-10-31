'use client';
// Editor kurva cubic-bezier ala AE (handle-based easing).
// Kotak ternormalisasi: sumbu-x = waktu (0→1), sumbu-y = progres (0→1).
// Dua handle draggable: P1 (keluar dari 0,0) dan P2 (masuk ke 1,1).
// Mode preset = kurva tampil tapi handle dikunci.

import { useMemo, useRef } from 'react';
import type { Bezier } from '../lib/types';
import { cubicBezierProgress } from '../lib/keyframes';

const PAD = 12;
const SIZE = 120;

const X = (v: number) => PAD + v * (SIZE - PAD * 2);
const Y = (v: number) => SIZE - PAD - v * (SIZE - PAD * 2);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export default function BezierEditor({
  value,
  editable,
  onChange,
  onGestureStart,
}: {
  value: Bezier;
  editable: boolean;
  onChange: (b: Bezier) => void;
  /** Dipanggil sekali di awal drag handle (untuk commit undo). */
  onGestureStart?: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const d = useMemo(() => {
    let path = '';
    for (let i = 0; i <= 40; i++) {
      const x = i / 40;
      const y = cubicBezierProgress(value, x);
      path += `${i === 0 ? 'M' : 'L'} ${X(x).toFixed(1)},${Y(y).toFixed(1)} `;
    }
    return path;
  }, [value]);

  const dragHandle = (which: 'p1' | 'p2') => (e: React.MouseEvent) => {
    if (!editable) return;
    e.stopPropagation();
    onGestureStart?.();
    const svg = svgRef.current;
    const r = svg?.getBoundingClientRect();
    const wPx = r?.width || 1;
    const hPx = r?.height || 1;
    const left = r?.left ?? 0;
    const top = r?.top ?? 0;
    const onMove = (ev: MouseEvent) => {
      const nx = clamp01((((ev.clientX - left) / wPx) * SIZE - PAD) / (SIZE - PAD * 2));
      const ny = clamp01(1 - ((((ev.clientY - top) / hPx) * SIZE - PAD) / (SIZE - PAD * 2)));
      if (which === 'p1') onChange({ ...value, x1: Math.round(nx * 100) / 100, y1: Math.round(ny * 100) / 100 });
      else onChange({ ...value, x2: Math.round(nx * 100) / 100, y2: Math.round(ny * 100) / 100 });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const dot = editable ? '#ffffff' : '#6b7280';

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full aspect-square bg-black/40 rounded-none border border-white/5 select-none"
      >
        {/* grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <g key={f} stroke="rgba(255,255,255,0.07)" strokeWidth="0.5">
            <line x1={X(f)} x2={X(f)} y1={Y(0)} y2={Y(1)} />
            <line x1={X(0)} x2={X(1)} y1={Y(f)} y2={Y(f)} />
          </g>
        ))}
        {/* diagonal referensi */}
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(1)} stroke="rgba(255,255,255,0.15)" strokeWidth="0.75" strokeDasharray="3 3" />
        {/* kurva */}
        <path d={d} fill="none" stroke="#ffffff" strokeWidth="2" />
        {/* handle */}
        <line x1={X(0)} x2={X(value.x1)} y1={Y(0)} y2={Y(value.y1)} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <line x1={X(1)} x2={X(value.x2)} y1={Y(1)} y2={Y(value.y2)} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <circle
          cx={X(value.x1)}
          cy={Y(value.y1)}
          r={5}
          fill={dot}
          stroke="rgba(0,0,0,0.6)"
          strokeWidth="1"
          style={{ cursor: editable ? 'grab' : 'default' }}
          onMouseDown={dragHandle('p1')}
        >
          <title>P1 - arah keluar</title>
        </circle>
        <circle
          cx={X(value.x2)}
          cy={Y(value.y2)}
          r={5}
          fill={dot}
          stroke="rgba(0,0,0,0.6)"
          strokeWidth="1"
          style={{ cursor: editable ? 'grab' : 'default' }}
          onMouseDown={dragHandle('p2')}
        >
          <title>P2 - arah masuk</title>
        </circle>
      </svg>
      <div className="text-[10px] text-gray-500 mt-1">
        {editable
          ? `cubic-bezier(${value.x1}, ${value.y1}, ${value.x2}, ${value.y2}) - drag handle kuning`
          : 'Pilih ease Custom untuk mengedit handle.'}
      </div>
    </div>
  );
}
