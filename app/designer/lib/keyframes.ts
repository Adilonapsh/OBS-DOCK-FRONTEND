'use client';
// Keyframe ala After Effects: simpan nilai properti di detik t,
// evaluasi dengan interpolasi linear. Dipakai editor preview,
// timeline, dan display OBS (satu code path → selalu cocok).

import type { DesignerLayer, DesignerLayerType, Keyframe, KeyframeValue, KeyProp, LayerEase, LayerKeyframes, Bezier } from './types';
import { uid } from './types';

export type KeyPropKind = 'number' | 'pair' | 'color' | 'discrete';

export const KEY_PROP_LIST: { id: KeyProp; label: string; kind: KeyPropKind; types: DesignerLayerType[]; unit?: string }[] = [
  { id: 'position', label: 'Position', kind: 'pair', types: ['text', 'image', 'shape', 'ticker', 'clock'], unit: 'px' },
  { id: 'opacity', label: 'Opacity', kind: 'number', types: ['text', 'image', 'shape', 'ticker', 'clock'], unit: '%' },
  { id: 'rotation', label: 'Rotation', kind: 'number', types: ['text', 'image', 'shape', 'ticker', 'clock'], unit: '°' },
  { id: 'size', label: 'Size', kind: 'pair', types: ['text', 'image', 'shape', 'ticker', 'clock'], unit: 'px' },
  { id: 'fontSize', label: 'Font Size', kind: 'number', types: ['text', 'ticker', 'clock'], unit: 'px' },
  { id: 'fontWeight', label: 'Font Weight', kind: 'number', types: ['text', 'ticker', 'clock'] },
  { id: 'color', label: 'Color', kind: 'color', types: ['text', 'ticker', 'clock', 'shape'] },
  { id: 'strokeWidth', label: 'Stroke Width', kind: 'number', types: ['text'], unit: 'px' },
  { id: 'stroke', label: 'Stroke', kind: 'color', types: ['text'] },
  { id: 'borderWidth', label: 'Border Width', kind: 'number', types: ['shape'], unit: 'px' },
  { id: 'borderColor', label: 'Border Color', kind: 'color', types: ['shape'] },
  { id: 'radius', label: 'Radius', kind: 'number', types: ['shape'], unit: 'px' },
  { id: 'speed', label: 'Speed', kind: 'number', types: ['ticker'], unit: 's' },
  { id: 'fontFamily', label: 'Font', kind: 'discrete', types: ['text', 'ticker', 'clock'] },
  { id: 'text', label: 'Text', kind: 'discrete', types: ['text', 'ticker'] },
  { id: 'src', label: 'Image', kind: 'discrete', types: ['image'] },
];

/** Daftar prop yang bisa di-keyframe untuk satu tipe layer. */
export function propsForLayer(type: DesignerLayerType): KeyProp[] {
  return KEY_PROP_LIST.filter((p) => p.types.includes(type)).map((p) => p.id);
}

export function propMeta(prop: KeyProp): { label: string; kind: KeyPropKind; unit?: string } {
  return KEY_PROP_LIST.find((p) => p.id === prop) ?? { label: prop, kind: 'number' as KeyPropKind };
}

export const EASE_OPTIONS: { id: LayerEase; label: string }[] = [
  { id: 'linear', label: 'Linear' },
  { id: 'easeIn', label: 'Ease In' },
  { id: 'easeOut', label: 'Ease Out' },
  { id: 'easeInOut', label: 'Ease In-Out' },
  { id: 'custom', label: 'Custom (Bezier)' },
];

/** Padanan cubic-bezier tiap preset (seperti CSS). */
export const PRESET_BEZIERS: Record<Exclude<LayerEase, 'custom'>, Bezier> = {
  linear: { x1: 0, y1: 0, x2: 1, y2: 1 },
  easeIn: { x1: 0.42, y1: 0, x2: 1, y2: 1 },
  easeOut: { x1: 0, y1: 0, x2: 0.58, y2: 1 },
  easeInOut: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
};

/** Kurva efektif sebuah keyframe (custom tersimpan, atau padanan presetnya). */
export function effectiveBezier(key: Keyframe): Bezier {
  if (key.ease === 'custom') {
    return key.bezier ?? { ...PRESET_BEZIERS.easeInOut };
  }
  return PRESET_BEZIERS[key.ease ?? 'linear'];
}

/** Progress y untuk input waktu x pada kurva cubic-bezier (0,0)-(x1,y1)-(x2,y2)-(1,1). */
export function cubicBezierProgress(b: Bezier, x: number): number {
  const cx = clampNum(x, 0, 1);
  const sampleX = (t: number) => 3 * (1 - t) * (1 - t) * t * b.x1 + 3 * (1 - t) * t * t * b.x2 + t * t * t;
  const sampleY = (t: number) => 3 * (1 - t) * (1 - t) * t * b.y1 + 3 * (1 - t) * t * t * b.y2 + t * t * t;
  const sampleDX = (t: number) => 3 * (1 - t) * (1 - t) * b.x1 + 6 * (1 - t) * t * (b.x2 - b.x1) + 3 * t * t * (1 - b.x2);
  let t = cx;
  for (let i = 0; i < 8; i++) {
    const err = sampleX(t) - cx;
    if (Math.abs(err) < 1e-6) break;
    const d = sampleDX(t);
    if (Math.abs(d) < 1e-6) break;
    t -= err / d;
  }
  // Fallback bisection bila Newton tidak konvergen / t keluar rel.
  if (t < 0 || t > 1 || !isFinite(t)) {
    let lo = 0;
    let hi = 1;
    t = cx;
    for (let i = 0; i < 20; i++) {
      t = (lo + hi) / 2;
      if (sampleX(t) < cx) lo = t;
      else hi = t;
    }
  }
  return clampNum(sampleY(clampNum(t, 0, 1)), 0, 1);
}

function clampNum(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

/** Easing efektif satu keyframe untuk progres p (0-1): bezier custom atau preset. */
export function easeProgress(key: Keyframe, p: number): number {
  if (key.ease === 'custom') {
    if (!key.bezier) return clampNum(p, 0, 1);
    return cubicBezierProgress(key.bezier, p);
  }
  const c = clampNum(p, 0, 1);
  switch (key.ease) {
    case 'easeIn':
      return c * c;
    case 'easeOut':
      return 1 - (1 - c) * (1 - c);
    case 'easeInOut':
      return c < 0.5 ? 2 * c * c : 1 - (Math.pow(-2 * c + 2, 2) / 2);
    default:
      return c;
  }
}

export function getKeys(layer: DesignerLayer, prop: KeyProp): Keyframe[] {
  return layer.keyframes?.[prop] ?? [];
}

/** Stopwatch nyala = array keyframes ada (walau masih kosong). */
export function isArmed(layer: DesignerLayer, prop: KeyProp): boolean {
  return layer.keyframes?.[prop] !== undefined;
}

export function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function asNumber(v: number | [number, number] | string): number {
  if (typeof v === 'string') return NaN;
  return Array.isArray(v) ? v[0] : v;
}

function asPair(v: number | [number, number] | string, fallback: [number, number]): [number, number] {
  if (typeof v === 'string') return fallback;
  return Array.isArray(v) ? [v[0], v[1]] : [v, fallback[1]];
}

type RGB = { r: number; g: number; b: number };

/** Parse #rgb / #rrggbb / rgb() / rgba() → RGB. Selain itu null (fallback hold). */
export function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();
  const hex3 = /^#([0-9a-f]{3})$/i.exec(s);
  if (hex3) {
    const h = hex3[1];
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  const hex6 = /^#([0-9a-f]{6})$/i.exec(s);
  if (hex6) {
    const h = hex6[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(s);
  if (rgb) {
    return {
      r: Math.max(0, Math.min(255, parseInt(rgb[1], 10))),
      g: Math.max(0, Math.min(255, parseInt(rgb[2], 10))),
      b: Math.max(0, Math.min(255, parseInt(rgb[3], 10))),
    };
  }
  return null;
}

function toHex(c: RGB): string {
  const h = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

/** Interpolasi warna (RGB lerp + ease). Tak terparse → hold (nilai key terakhir). */
export function evalColor(keys: Keyframe[] | undefined, base: string, t: number): string {
  if (!keys || keys.length === 0) return base;
  const sorted = [...keys].sort((a, b) => a.t - b.t);
  const strOf = (k: Keyframe): string => (typeof k.v === 'string' ? k.v : base);
  if (t <= sorted[0].t) return strOf(sorted[0]);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (t >= a.t && t <= b.t) {
      const ca = parseColor(strOf(a));
      const cb = parseColor(strOf(b));
      if (!ca || !cb) return strOf(a);
      const span = b.t - a.t;
      const p = span <= 0 ? 1 : easeProgress(a, (t - a.t) / span);
      return toHex({ r: lerp(ca.r, cb.r, p), g: lerp(ca.g, cb.g, p), b: lerp(ca.b, cb.b, p) });
    }
  }
  return strOf(sorted[sorted.length - 1]);
}

/** Hold-step untuk nilai diskrit (font, teks, src): nilai key terakhir ≤ t. */
export function evalDiscrete(keys: Keyframe[] | undefined, base: string, t: number): string {
  if (!keys || keys.length === 0) return base;
  let out = base;
  for (const k of [...keys].sort((a, b) => a.t - b.t)) {
    if (k.t <= t && typeof k.v === 'string') out = k.v;
    else if (k.t > t) break;
  }
  return out;
}

export function evalNumber(keys: Keyframe[] | undefined, base: number, t: number): number {
  if (!keys || keys.length === 0) return base;
  const sorted = [...keys].sort((a, b) => a.t - b.t);
  if (t <= sorted[0].t) return asNumber(sorted[0].v);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const p = span <= 0 ? 1 : easeProgress(a, (t - a.t) / span);
      return lerp(asNumber(a.v), asNumber(b.v), p);
    }
  }
  return asNumber(sorted[sorted.length - 1].v);
}

export function evalPair(
  keys: Keyframe[] | undefined,
  base: [number, number],
  t: number
): [number, number] {
  if (!keys || keys.length === 0) return base;
  const sorted = [...keys].sort((a, b) => a.t - b.t);
  if (t <= sorted[0].t) return asPair(sorted[0].v, base);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const p = span <= 0 ? 1 : easeProgress(a, (t - a.t) / span);
      const [ax, ay] = asPair(a.v, base);
      const [bx, by] = asPair(b.v, base);
      return [lerp(ax, bx, p), lerp(ay, by, p)];
    }
  }
  return asPair(sorted[sorted.length - 1].v, base);
}

/** Nilai penuh satu layer di detik t (dipakai canvas drag, add-key, hit-area). */
export function evalLayerAt(layer: DesignerLayer, t: number): { x: number; y: number; opacity: number; rotation: number } {
  const [x, y] = evalPair(layer.keyframes?.position, [layer.x, layer.y], t);
  return {
    x,
    y,
    opacity: evalNumber(layer.keyframes?.opacity, layer.opacity, t),
    rotation: evalNumber(layer.keyframes?.rotation, layer.rotation, t),
  };
}

/** Semua nilai style teranimasi satu layer di detik t (satu code path renderer + display). */
export type EvalStyle = {
  x: number; y: number; w: number; h: number;
  opacity: number; rotation: number;
  fontSize: number; fontWeight: number; color: string;
  strokeWidth: number; stroke: string;
  fill: string; borderColor: string; borderWidth: number; radius: number;
  speed: number;
  fontFamily: string; text: string; src: string;
};

function numProp(v: number | undefined, fallback: number): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback;
}

function strProp(v: string | undefined, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

export function evalStyleAt(layer: DesignerLayer, t: number): EvalStyle {
  const kf = layer.keyframes;
  const p = layer.props;
  const [sx, sy] = evalPair(kf?.size, [layer.w, layer.h], t);
  // color: text/ticker/clock pakai props.color, shape pakai props.fill
  const colorBase = layer.type === 'shape' ? strProp(p.fill, '#ffffff') : strProp(p.color, '#ffffff');
  return {
    x: evalPair(kf?.position, [layer.x, layer.y], t)[0],
    y: evalPair(kf?.position, [layer.x, layer.y], t)[1],
    w: sx,
    h: sy,
    opacity: evalNumber(kf?.opacity, layer.opacity, t),
    rotation: evalNumber(kf?.rotation, layer.rotation, t),
    fontSize: evalNumber(kf?.fontSize, numProp(p.fontSize, 40), t),
    fontWeight: Math.round(evalNumber(kf?.fontWeight, numProp(p.fontWeight, 700), t)),
    color: evalColor(kf?.color, colorBase, t),
    strokeWidth: evalNumber(kf?.strokeWidth, numProp(p.strokeWidth, 0), t),
    stroke: evalColor(kf?.stroke, strProp(p.stroke, '#000000'), t),
    fill: evalColor(kf?.color, strProp(p.fill, '#ffffff'), t),
    borderColor: evalColor(kf?.borderColor, strProp(p.borderColor, '#ffffff'), t),
    borderWidth: evalNumber(kf?.borderWidth, numProp(p.borderWidth, 0), t),
    radius: evalNumber(kf?.radius, numProp(p.radius, 0), t),
    speed: evalNumber(kf?.speed, numProp(p.speed, 22), t),
    fontFamily: evalDiscrete(kf?.fontFamily, strProp(p.fontFamily, 'Outfit'), t),
    text: evalDiscrete(kf?.text, strProp(p.text, ''), t),
    src: evalDiscrete(kf?.src, strProp(p.src, ''), t),
  };
}

/** Nilai kini satu prop untuk dicatat sebagai keyframe (record path). */
export function currentPropValue(layer: DesignerLayer, prop: KeyProp, t: number): KeyframeValue {
  const s = evalStyleAt(layer, t);
  switch (prop) {
    case 'position': return [Math.round(s.x), Math.round(s.y)];
    case 'size': return [Math.round(s.w), Math.round(s.h)];
    case 'opacity': return Math.round(s.opacity);
    case 'rotation': return Math.round(s.rotation * 10) / 10;
    case 'fontSize': return Math.round(s.fontSize);
    case 'fontWeight': return Math.round(s.fontWeight);
    case 'color': return s.color;
    case 'strokeWidth': return Math.round(s.strokeWidth * 10) / 10;
    case 'stroke': return s.stroke;
    case 'borderWidth': return Math.round(s.borderWidth * 10) / 10;
    case 'borderColor': return s.borderColor;
    case 'radius': return Math.round(s.radius * 10) / 10;
    case 'speed': return Math.round(s.speed * 10) / 10;
    case 'fontFamily': return s.fontFamily;
    case 'text': return s.text;
    case 'src': return s.src;
  }
}

/** Nyalakan/matikan stopwatch. Mati = semua keyframe properti itu dihapus. */
export function toggleWatch(kf: LayerKeyframes | undefined, prop: KeyProp): LayerKeyframes {
  const next: LayerKeyframes = { ...(kf ?? {}) };
  if (next[prop] !== undefined) {
    delete next[prop];
  } else {
    next[prop] = [];
  }
  return next;
}

/** Tambah/update keyframe di detik t (key di waktu yang hampir sama ditimpa). */
export function setKeyframe(kf: LayerKeyframes | undefined, prop: KeyProp, t: number, v: KeyframeValue): LayerKeyframes {
  const next: LayerKeyframes = { ...(kf ?? {}) };
  const arr = [...(next[prop] ?? [])];
  const tt = Math.round(t * 100) / 100;
  const idx = arr.findIndex((k) => Math.abs(k.t - tt) < 0.051);
  if (idx >= 0) {
    arr[idx] = { ...arr[idx], t: tt, v };
  } else {
    arr.push({ id: uid('kf'), t: tt, v, ease: 'linear' });
  }
  arr.sort((a, b) => a.t - b.t);
  next[prop] = arr;
  return next;
}

export function removeKeyframe(kf: LayerKeyframes | undefined, prop: KeyProp, keyId: string): LayerKeyframes {
  const next: LayerKeyframes = { ...(kf ?? {}) };
  next[prop] = (next[prop] ?? []).filter((k) => k.id !== keyId);
  return next;
}

/** Update sebagian field keyframe (waktu / nilai / ease / bezier). */
export function updateKeyframe(
  kf: LayerKeyframes | undefined,
  prop: KeyProp,
  keyId: string,
  patch: Partial<Pick<Keyframe, 't' | 'v' | 'ease' | 'bezier'>>
): LayerKeyframes {
  const next: LayerKeyframes = { ...(kf ?? {}) };
  next[prop] = (next[prop] ?? []).map((k) => (k.id === keyId ? { ...k, ...patch } : k));
  return next;
}
export function moveKeyframe(kf: LayerKeyframes | undefined, prop: KeyProp, keyId: string, t: number): LayerKeyframes {
  // Murni pindah TANPA menghapus key lain — aman dipanggil tiap mousemove saat drag.
  // Penggabungan hanya terjadi eksplisit via mergeKeysAt() saat drop.
  const next: LayerKeyframes = { ...(kf ?? {}) };
  const arr = [...(next[prop] ?? [])];
  const i = arr.findIndex((k) => k.id === keyId);
  if (i < 0) return next;
  const tt = Math.round(Math.max(0, t) * 100) / 100;
  arr[i] = { ...arr[i], t: tt };
  next[prop] = arr;
  return next;
}

/** Hapus key lain yang menempel (<0.04s) pada key yang di-drop. Dipanggil sekali saat mouseup. */
export function mergeKeysAt(kf: LayerKeyframes | undefined, prop: KeyProp, keyId: string): LayerKeyframes {
  const next: LayerKeyframes = { ...(kf ?? {}) };
  const arr = next[prop] ?? [];
  const self = arr.find((k) => k.id === keyId);
  if (!self) return next;
  const survivors = arr.filter((k) => k.id === keyId || Math.abs(k.t - self.t) >= 0.04);
  if (survivors.length === arr.length) return next;
  next[prop] = survivors;
  return next;
}
