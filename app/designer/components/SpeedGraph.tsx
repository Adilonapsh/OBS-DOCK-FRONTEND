'use client';
// Graph editor ala AE: kurva properti terhadap waktu yang BISA DIEDIT.
// - Mode Value: nilai properti (X / Y / % / °). Drag titik keyframe:
//   horizontal = waktu, vertikal = nilai.
// - Mode Speed: kecepatan (turunan). Bentuk mengikuti ease tiap segmen.
// Garis vertikal tipis = posisi keyframe, garis ungu = seeker.

import { useMemo, useRef, useState } from 'react';
import type { DesignerLayer, KeyProp, Keyframe, KeyframeValue } from '../lib/types';
import { evalStyleAt, isArmed, type EvalStyle } from '../lib/keyframes';
import { isAutoTextLayer } from './LayerRenderer';

const N = 120;

type Dim = {
  id: string;
  label: string;
  prop: KeyProp;
  comp: 0 | 1 | null; // komponen untuk position (0=x, 1=y), null = skalar
  min: number;
  max: number;
  unit: string;
  color: string;
};

function dimsFor(layer: DesignerLayer, canvasW: number, canvasH: number): Dim[] {
  const out: Dim[] = [];
  const armed = (p: KeyProp) => isArmed(layer, p);
  if (armed('position')) {
    out.push({ id: 'posX', label: 'X', prop: 'position', comp: 0, min: 0, max: canvasW, unit: 'px', color: '#ffffff' });
    out.push({ id: 'posY', label: 'Y', prop: 'position', comp: 1, min: 0, max: canvasH, unit: 'px', color: '#ffffff' });
  }
  if (armed('size') && !isAutoTextLayer(layer)) {
    out.push({ id: 'sizeW', label: 'W', prop: 'size', comp: 0, min: 0, max: canvasW, unit: 'px', color: '#ffffff' });
    out.push({ id: 'sizeH', label: 'H', prop: 'size', comp: 1, min: 0, max: canvasH, unit: 'px', color: '#ffffff' });
  }
  if (armed('opacity')) {
    out.push({ id: 'opacity', label: 'Opacity', prop: 'opacity', comp: null, min: 0, max: 100, unit: '%', color: '#ffffff' });
  }
  if (armed('rotation')) {
    out.push({ id: 'rotation', label: 'Rotation', prop: 'rotation', comp: null, min: -360, max: 360, unit: '°', color: '#ffffff' });
  }
  if (armed('fontSize')) {
    out.push({ id: 'fontSize', label: 'Font Size', prop: 'fontSize', comp: null, min: 0, max: 200, unit: 'px', color: '#ffffff' });
  }
  if (armed('fontWeight')) {
    out.push({ id: 'fontWeight', label: 'Weight', prop: 'fontWeight', comp: null, min: 100, max: 900, unit: '', color: '#ffffff' });
  }
  if (armed('strokeWidth')) {
    out.push({ id: 'strokeWidth', label: 'Stroke', prop: 'strokeWidth', comp: null, min: 0, max: 40, unit: 'px', color: '#ffffff' });
  }
  if (armed('borderWidth')) {
    out.push({ id: 'borderWidth', label: 'Border', prop: 'borderWidth', comp: null, min: 0, max: 40, unit: 'px', color: '#ffffff' });
  }
  if (armed('radius')) {
    out.push({ id: 'radius', label: 'Radius', prop: 'radius', comp: null, min: 0, max: 300, unit: 'px', color: '#ffffff' });
  }
  if (armed('speed')) {
    out.push({ id: 'speed', label: 'Speed', prop: 'speed', comp: null, min: 0, max: 120, unit: 's', color: '#ffffff' });
  }
  return out;
}

function baseOf(layer: DesignerLayer, dim: Dim): number {
  const p = layer.props;
  switch (dim.id) {
    case 'posX': return layer.x;
    case 'posY': return layer.y;
    case 'sizeW': return layer.w;
    case 'sizeH': return layer.h;
    case 'opacity': return layer.opacity;
    case 'rotation': return layer.rotation;
    case 'fontSize': return p.fontSize ?? 40;
    case 'fontWeight': return p.fontWeight ?? 700;
    case 'strokeWidth': return p.strokeWidth ?? 0;
    case 'borderWidth': return p.borderWidth ?? 0;
    case 'radius': return p.radius ?? 0;
    case 'speed': return p.speed ?? 22;
    default: return 0;
  }
}

function valueOf(layer: DesignerLayer, dim: Dim, t: number): number {
  const s: EvalStyle = evalStyleAt(layer, t);
  switch (dim.id) {
    case 'posX': return s.x;
    case 'posY': return s.y;
    case 'sizeW': return s.w;
    case 'sizeH': return s.h;
    case 'opacity': return s.opacity;
    case 'rotation': return s.rotation;
    case 'fontSize': return s.fontSize;
    case 'fontWeight': return s.fontWeight;
    case 'strokeWidth': return s.strokeWidth;
    case 'borderWidth': return s.borderWidth;
    case 'radius': return s.radius;
    case 'speed': return s.speed;
    default: return 0;
  }
}

function keysOf(layer: DesignerLayer, dim: Dim): Keyframe[] {
  return layer.keyframes?.[dim.prop] ?? [];
}

function compOfKey(key: Keyframe, dim: Dim, fallback: number): number {
  if (dim.prop === 'position' || dim.prop === 'size') {
    if (Array.isArray(key.v)) return dim.comp === 1 ? key.v[1] : key.v[0];
    return fallback;
  }
  return typeof key.v === 'number' ? key.v : fallback;
}

function withComp(layer: DesignerLayer, dim: Dim, key: Keyframe, nv: number): KeyframeValue {
  if (dim.prop === 'position' || dim.prop === 'size') {
    const fb: [number, number] = dim.prop === 'position' ? [layer.x, layer.y] : [layer.w, layer.h];
    const cur = Array.isArray(key.v) ? key.v : fb;
    const nx = dim.comp === 1 ? cur[0] : Math.round(nv);
    const ny = dim.comp === 1 ? Math.round(nv) : cur[1];
    return [nx, ny];
  }
  return Math.round(nv * 10) / 10;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function SpeedGraph({
  layer,
  windowSecs,
  scrub,
  canvasW,
  canvasH,
  onGraphEdit,
  onMarkerSelect,
  onKeyframeCommit,
  onGestureStart,
}: {
  layer: DesignerLayer;
  windowSecs: number;
  scrub: number;
  canvasW: number;
  canvasH: number;
  onGraphEdit: (layerId: string, prop: KeyProp, keyId: string, t: number, v: KeyframeValue) => void;
  onMarkerSelect: (layerId: string, prop: KeyProp, t: number, keyId: string) => void;
  onKeyframeCommit: (layerId: string, prop: KeyProp, keyId: string) => void;
  /** Dipanggil sekali di awal drag marker (untuk commit undo). */
  onGestureStart?: () => void;
}) {
  const dims = useMemo(() => dimsFor(layer, canvasW, canvasH), [layer, canvasW, canvasH]);
  const [view, setView] = useState<'value' | 'speed'>('value');
  const [dimId, setDimId] = useState('posX');
  const svgRef = useRef<SVGSVGElement>(null);

  const dim = dims.find((d) => d.id === dimId) ?? dims[0];
  const keys = dim ? keysOf(layer, dim) : [];

  const { pts, max, unit } = useMemo(() => {
    if (!dim) return { pts: '', max: 0, unit: '' };
    const dt = windowSecs / N;
    const ys: number[] = [];
    let max = 0;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * windowSecs;
      let y: number;
      if (view === 'value') {
        y = valueOf(layer, dim, t);
      } else {
        const t0 = Math.max(0, t - dt);
        y = Math.abs(valueOf(layer, dim, t) - valueOf(layer, dim, t0)) / Math.max(dt, 1e-6);
        if (y > max) max = y;
      }
      ys.push(y);
    }
    let lo = dim.min;
    let hi = dim.max;
    if (view === 'speed') {
      lo = 0;
      hi = Math.max(max, 1e-6);
    }
    const span = Math.max(hi - lo, 1e-6);
    const pts = ys
      .map((v, i) => {
        const c = clamp((v - lo) / span, -0.05, 1.05);
        return `${((i / N) * 100).toFixed(1)},${(58 - c * 52).toFixed(1)}`;
      })
      .join(' ');
    const unit = view === 'speed' ? (dim.unit ? `${dim.unit}/s` : 'nilai/s') : (dim.unit || '');
    return { pts, max, unit };
  }, [layer, dim, windowSecs, view]);

  if (!dim) {
    return (
      <div className="text-[11px] text-gray-500 bg-white/5 rounded-none p-2.5">
        Nyalakan stopwatch properti di timeline dulu untuk mengedit grafik.
      </div>
    );
  }

  const yOf = (v: number) => {
    const lo = view === 'speed' ? 0 : dim.min;
    const hi = view === 'speed' ? Math.max(max, 1e-6) : dim.max;
    const c = clamp((v - lo) / Math.max(hi - lo, 1e-6), 0, 1);
    return 58 - c * 52;
  };

  const startMarkerDrag = (e: React.MouseEvent, key: Keyframe) => {
    e.stopPropagation();
    onGestureStart?.();
    const svg = svgRef.current;
    const startX = e.clientX;
    const startY = e.clientY;
    const t0 = key.t;
    const r = svg?.getBoundingClientRect();
    const wPx = r?.width || 1;
    const hPx = r?.height || 1;
    let moved = false;
    const onMove = (ev: MouseEvent) => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 3) return;
      moved = true;
      const t = Math.max(0, t0 + ((ev.clientX - startX) / wPx) * windowSecs);
      // Mode speed: kunci nilai (drag horizontal saja). Mode value: kedua sumbu.
      const nv =
        view === 'value'
          ? clamp(dim.max - ((ev.clientY - (r?.top ?? 0)) / hPx) * (dim.max - dim.min), dim.min, dim.max)
          : compOfKey(key, dim, baseOf(layer, dim));
      onGraphEdit(layer.id, dim.prop, key.id, t, withComp(layer, dim, key, nv));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (!moved) onMarkerSelect(layer.id, dim.prop, key.t, key.id);
      else onKeyframeCommit(layer.id, dim.prop, key.id);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => setView('value')}
          className={`text-[10px] font-black px-2 py-1 rounded-none ${view === 'value' ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
        >
          Value
        </button>
        <button
          onClick={() => setView('speed')}
          className={`text-[10px] font-black px-2 py-1 rounded-none ${view === 'speed' ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
        >
          Speed
        </button>
        <span className="w-px h-4 bg-white/10 mx-0.5" />
        {dims.map((d) => (
          <button
            key={d.id}
            onClick={() => setDimId(d.id)}
            className={`text-[10px] font-black px-2 py-1 rounded-none ${d.id === dim.id ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
          >
            {d.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-mono text-gray-500">
          {view === 'speed' ? `maks ${max.toFixed(1)} ${unit}` : `${dim.min}…${dim.max} ${unit}`}
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 100 64"
        preserveAspectRatio="none"
        className="w-full h-24 bg-black/40 rounded-none border border-white/5 select-none"
      >
        <line x1="0" x2="100" y1="58" y2="58" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        <line x1="0" x2="100" y1="32" y2="32" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        {keys.map((k) => (
          <line
            key={`g${k.id}`}
            x1={(k.t / windowSecs) * 100}
            x2={(k.t / windowSecs) * 100}
            y1="0"
            y2="64"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.5"
          />
        ))}
        {pts && <polyline points={pts} fill="none" stroke={dim.color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
        {keys.map((k) => {
          const ky = view === 'value' ? yOf(compOfKey(k, dim, baseOf(layer, dim))) : 32;
          const kx = (k.t / windowSecs) * 100;
          return (
            <g key={k.id} onMouseDown={(e) => startMarkerDrag(e, k)} className="cursor-move">
              <path
                d={`M ${kx},${ky - 2.4} L ${kx + 1.6},${ky} L ${kx},${ky + 2.4} L ${kx - 1.6},${ky} Z`}
                fill={dim.color}
                stroke="rgba(0,0,0,0.6)"
                strokeWidth="0.4"
              />
              <rect x={kx - 4} y={ky - 5} width={8} height={10} fill="transparent" />
            </g>
          );
        })}
        <line
          x1={(scrub / windowSecs) * 100}
          x2={(scrub / windowSecs) * 100}
          y1="0"
          y2="64"
          stroke="#ffffff"
          strokeWidth="1"
        />
      </svg>
      <div className="text-[10px] text-gray-500">
        {view === 'value'
          ? `Value — ${dim.label}. Drag titik: geser = waktu, vertikal = nilai.`
          : `Speed — ${dim.label}. Curam = cepat, landai = lambat (ikuti ease tiap keyframe).`}
      </div>
    </div>
  );
}
