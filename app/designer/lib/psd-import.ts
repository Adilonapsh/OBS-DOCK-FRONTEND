'use client';
// Import Photoshop (.psd/.psb) → DesignerLayer. Parser: ag-psd (readPsd + getLayerCanvas).
//
// Urutan: ag-psd `children` = urutan file = bottom-first (konvensi Photoshop,
// sesuai cara GIMP membaca: record pertama = layer paling bawah).
// Jadi children[0] → zIndex terkecil. Grup di-flatten ("Grup / Layer").
//
// Batasan jujur (diringkas ke UI sesudah import):
// - adjustment layers di-skip (tak ada piksel); mask & pattern-overlay diabaikan
// - blend mode eksotis (dissolve, dsb) → normal
// - fontSize points ≈ px; nama font dibersihkan seperlunya (browser fallback bila tak ada)
// - smart object / shape vektor tanpa raster → di-raster via canvas bila ada, bila tidak di-skip
// - rotasi dari matriks transform teks tidak dibaca (butuh dekomposisi matriks)

import { readPsd, getLayerCanvas, type BlendMode, type Color, type Layer, type Psd } from 'ag-psd';
import type { DesignerLayer } from './types';
import { uid } from './types';

export type PsdSkipped = { name: string; reason: string };

export type PsdImportResult = {
  layers: DesignerLayer[];
  canvasW: number;
  canvasH: number;
  skipped: PsdSkipped[];
  warnings: string[];
};

export const PSD_MAX_BYTES = 150 * 1024 * 1024;

const BLEND_MAP: Partial<Record<BlendMode, string>> = {
  normal: 'normal',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  darken: 'darken',
  lighten: 'lighten',
  'color dodge': 'color-dodge',
  'linear dodge': 'lighten',
  'lighter color': 'lighten',
  'color burn': 'color-burn',
  'linear burn': 'multiply',
  'darker color': 'darken',
  'hard light': 'hard-light',
  'soft light': 'soft-light',
  'vivid light': 'hard-light',
  'linear light': 'hard-light',
  'pin light': 'hard-light',
  difference: 'difference',
  exclusion: 'exclusion',
  hue: 'hue',
  saturation: 'saturation',
  color: 'color',
  luminosity: 'luminosity',
};

function num(v: unknown, fb: number): number {
  return typeof v === 'number' && isFinite(v) ? v : fb;
}

function hexOf(c: Color | undefined, fallback: string): string {
  if (!c || typeof c !== 'object') return fallback;
  const o = c as Record<string, unknown>;
  const n = (v: unknown): number | null => (typeof v === 'number' && isFinite(v) ? v : null);
  let r = n(o.r);
  let g = n(o.g);
  let b = n(o.b);
  if (r == null || g == null || b == null) {
    const fr = n(o.fr);
    const fg = n(o.fg);
    const fb = n(o.fb);
    if (fr == null || fg == null || fb == null) return fallback;
    r = fr * 255;
    g = fg * 255;
    b = fb * 255;
  }
  // Nilai float 0-1 yang bukan integer → skala 255 (format float Photoshop).
  const fix = (v: number) => (v <= 1 && !Number.isInteger(v) ? Math.round(v * 255) : Math.round(v));
  const h = (v: number) => Math.max(0, Math.min(255, fix(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function cleanFontName(raw: string | undefined, fallback: string): { family: string; weight: number } {
  if (!raw) return { family: fallback, weight: 400 };
  const name = raw.trim();
  let weight = 400;
  if (/black|heavy|extra|ultra|fat/i.test(name)) weight = 900;
  else if (/bold|demi|semi/i.test(name)) weight = 700;
  let family = name.replace(/(MT|PSMT|PS|OTF|TTF)$/i, '');
  const dash = family.indexOf('-');
  if (dash > 0) family = family.slice(0, dash);
  if (!family) family = fallback;
  return { family, weight };
}

function firstEnabled<T extends { enabled?: boolean }>(arr: T[] | undefined): T | undefined {
  if (!Array.isArray(arr)) return undefined;
  return arr.find((e) => e && e.enabled !== false);
}

type Ctx = {
  layers: DesignerLayer[];
  skipped: PsdSkipped[];
  blendWarned: Set<string>;
  z: number;
};

function mapBlend(l: Layer, ctx: Ctx): string | undefined {
  const mode = l.blendMode;
  if (!mode || mode === 'normal' || mode === 'pass through') return undefined;
  const css = BLEND_MAP[mode];
  if (!css || css === 'normal') {
    if (!ctx.blendWarned.has(mode)) {
      ctx.blendWarned.add(mode);
      ctx.skipped.push({ name: `blend mode "${mode}"`, reason: 'tidak didukung → normal' });
    }
    return undefined;
  }
  return css;
}

function baseOf(l: Layer, name: string, ctx: Ctx): DesignerLayer {
  const x = num(l.left, 0);
  const y = num(l.top, 0);
  const w = Math.max(1, Math.round(num(l.right, x + 1) - x));
  const h = Math.max(1, Math.round(num(l.bottom, y + 1) - y));
  const opRaw = typeof l.opacity === 'number' ? l.opacity : 255;
  const opacity = Math.round(Math.max(0, Math.min(100, opRaw > 1 ? (opRaw / 255) * 100 : opRaw * 100)));
  return {
    id: uid('layer'),
    name,
    type: 'text',
    visible: !l.hidden,
    locked: false,
    x: Math.round(x),
    y: Math.round(y),
    w,
    h,
    rotation: 0,
    opacity,
    zIndex: ++ctx.z,
    animIn: '',
    animOut: '',
    delay: 0,
    out: null,
    props: {},
  };
}

function walk(children: Layer[] | undefined, prefix: string, ctx: Ctx): void {
  if (!children) return;
  for (const l of children) {
    const name = `${prefix}${l.name || 'Layer'}`;
    // Grup → flatten (nama berprefix path grup).
    if (l.children && l.children.length > 0) {
      walk(l.children, `${name} / `, ctx);
      continue;
    }
    if (l.adjustment) {
      ctx.skipped.push({ name, reason: 'adjustment layer (tak ada piksel)' });
      continue;
    }
    const blend = mapBlend(l, ctx);
    const blendProp = blend && blend !== 'normal' ? { blendMode: blend } : {};

    // 1. Text layer → teks editable.
    const t = l.text;
    if (t && typeof t.text === 'string' && t.text.length > 0) {
      const st = t.styleRuns?.find((r) => r.style && (r.style.fontSize != null || r.style.font || r.style.fillColor))?.style ?? t.style;
      const { family, weight } = cleanFontName(st?.font?.name, 'Outfit');
      const fsRaw = typeof st?.fontSize === 'number' && isFinite(st.fontSize) ? st.fontSize : 0;
      const h = Math.max(1, num(l.bottom, 1) - num(l.top, 0));
      const fontSize = fsRaw > 0 ? Math.round(fsRaw) : Math.max(12, Math.round(h * 0.72));
      const fontWeight = st?.fauxBold ? 700 : weight;
      const color = hexOf(st?.fillColor, '#ffffff');
      const base = baseOf(l, name, ctx);
      const strokeFx = firstEnabled(l.effects?.stroke);
      const dropFx = firstEnabled(l.effects?.dropShadow);
      const strokeSize = strokeFx?.fillType === 'color' || strokeFx?.fillType === undefined ? num(strokeFx?.size?.value, 0) : 0;
      base.type = 'text';
      base.props = {
        text: t.text.replace(/\r/g, '\n'),
        fontFamily: family,
        fontSize,
        fontWeight,
        color,
        align: 'left',
        shadow: !!dropFx,
        ...(strokeSize > 0 ? { strokeWidth: Math.round(strokeSize), stroke: hexOf(strokeFx?.color, '#000000') } : {}),
        autoSize: true,
        ...blendProp,
      };
      ctx.layers.push(base);
      continue;
    }

    // 2. Layer berpiksel / smart object (raster) → image.
    let canvas: HTMLCanvasElement | undefined;
    try {
      canvas = getLayerCanvas(l) ?? undefined;
    } catch {
      canvas = undefined;
    }
    if (!canvas) canvas = l.canvas ?? undefined;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      let src: string;
      try {
        src = canvas.toDataURL('image/png');
      } catch {
        ctx.skipped.push({ name, reason: 'gagal encode image' });
        continue;
      }
      const base = baseOf(l, name, ctx);
      base.type = 'image';
      base.w = canvas.width;
      base.h = canvas.height;
      base.props = { src, fit: 'fill', ...blendProp };
      ctx.layers.push(base);
      continue;
    }

    // 3. Shape vektor solid → shape rect.
    const vf = l.vectorFill;
    if (vf && vf.type === 'color' && vf.color) {
      const base = baseOf(l, name, ctx);
      const strokeFx = firstEnabled(l.effects?.stroke);
      const strokeSize = strokeFx ? num(strokeFx.size?.value, 0) : 0;
      base.type = 'shape';
      base.props = {
        shape: 'rect',
        fill: hexOf(vf.color, '#ffffff'),
        bgOpacity: 100,
        radius: 0,
        borderWidth: Math.round(strokeSize),
        borderColor: strokeSize > 0 ? hexOf(strokeFx?.color, '#ffffff') : '#ffffff',
        ...blendProp,
      };
      ctx.layers.push(base);
      continue;
    }

    ctx.skipped.push({ name, reason: 'kosong / tipe tak didukung' });
  }
}

/** Mapping murni Psd terparse → hasil import (bisa di-unit-test tanpa file). */
export function mapPsdLayers(psd: Psd): PsdImportResult {
  const ctx: Ctx = { layers: [], skipped: [], blendWarned: new Set(), z: 0 };
  walk(psd.children, '', ctx);
  const canvasW = Math.max(320, Math.min(7680, Math.round(psd.width || 1920)));
  const canvasH = Math.max(320, Math.min(4320, Math.round(psd.height || 1080)));
  const warnings: string[] = [];
  let bytes = 0;
  for (const l of ctx.layers) {
    if (l.type === 'image' && l.props.src) bytes += l.props.src.length;
  }
  if (bytes > 8 * 1024 * 1024) {
    warnings.push(
      `Image hasil import ±${(bytes / 1048576).toFixed(1)}MB — melebihi kapasitas aman localStorage browser. Pertimbangkan kompres/downscale image di Photoshop lalu import ulang.`
    );
  }
  return { layers: ctx.layers, canvasW, canvasH, skipped: ctx.skipped, warnings };
}

export async function parsePsdFile(file: File): Promise<PsdImportResult> {  if (file.size > PSD_MAX_BYTES) {
    throw new Error(`File ${(file.size / 1048576).toFixed(0)}MB melebihi batas ${PSD_MAX_BYTES / 1048576}MB.`);
  }
  const buf = await file.arrayBuffer();
  // Beri napas ke UI sebelum parse sinkron yang berat.
  await new Promise((r) => setTimeout(r, 30));
  let psd: Psd;
  try {
    psd = readPsd(buf, { skipCompositeImageData: true, skipThumbnail: true });
  } catch (e) {
    throw new Error(`Gagal membaca PSD (${e instanceof Error ? e.message : 'format tak dikenal'}).`);
  }
  const res = mapPsdLayers(psd);
  if (res.layers.length === 0 && res.skipped.length === 0) {
    throw new Error('Tidak ada layer yang terbaca dari file ini.');
  }
  return res;
}
