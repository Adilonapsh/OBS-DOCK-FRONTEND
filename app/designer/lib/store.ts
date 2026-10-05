'use client';
// Store lokal untuk Designer. Sengaja terpisah dari widget settings.
// MVP: localStorage. Display OBS di mesin yang sama langsung jalan.
// Untuk lintas mesin / share: pakai ?layers= (desain kecil) — lihat buildDisplayUrl.

import type { DesignerDoc, DesignerLayer } from './types';
import { uid } from './types';

const LIST_KEY = 'designer-docs';
const DOC_PREFIX = 'designer-doc-';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function listDocs(): DesignerDoc[] {
  if (typeof window === 'undefined') return [];
  const ids = safeParse<string[]>(localStorage.getItem(LIST_KEY), []);
  const docs: DesignerDoc[] = [];
  for (const id of ids) {
    const d = loadDoc(id);
    if (d) docs.push(d);
  }
  docs.sort((a, b) => b.updatedAt - a.updatedAt);
  return docs;
}

export function loadDoc(id: string): DesignerDoc | null {
  if (typeof window === 'undefined') return null;
  const d = safeParse<DesignerDoc | null>(localStorage.getItem(DOC_PREFIX + id), null);
  if (!d) return null;
  // Migrasi doc lama yang belum punya resolusi canvas
  if (!d.canvasW || !d.canvasH) {
    d.canvasW = 1920;
    d.canvasH = 1080;
  }
  // Migrasi layer lama yang belum punya out-point
  if (Array.isArray(d.layers)) {
    for (const l of d.layers) {
      const anyL = l as unknown as { out?: number | null };
      if (anyL.out === undefined) l.out = null;
    }
  }
  // Sembuhkan angka korup (NaN dari input lama) agar layer tak hilang/tak bisa diklik.
  if (Array.isArray(d.layers)) {
    const num = (v: unknown, fb: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fb);
    for (const l of d.layers) {
      l.x = num(l.x, 100);
      l.y = num(l.y, 100);
      l.w = num(l.w, 600);
      l.h = num(l.h, 120);
      l.rotation = num(l.rotation, 0);
      l.opacity = num(l.opacity, 100);
      l.delay = num(l.delay, 0);
      if (l.out !== null && !Number.isFinite(l.out as number)) l.out = null;
      if (l.props && typeof l.props === 'object') {
        const p = l.props as unknown as Record<string, unknown>;
        for (const k of ['fontSize', 'fontWeight', 'strokeWidth', 'borderWidth', 'radius', 'speed', 'bgOpacity']) {
          if (k in p && (typeof p[k] !== 'number' || !Number.isFinite(p[k] as number))) delete p[k];
        }
      }
    }
  }
  return d;
}

export function saveDoc(doc: DesignerDoc): void {
  if (typeof window === 'undefined') return;
  const next: DesignerDoc = { ...doc, updatedAt: Date.now() };
  localStorage.setItem(DOC_PREFIX + next.id, JSON.stringify(next));
  const ids = safeParse<string[]>(localStorage.getItem(LIST_KEY), []);
  if (!ids.includes(next.id)) {
    ids.unshift(next.id);
    localStorage.setItem(LIST_KEY, JSON.stringify(ids));
  }
}

export function deleteDoc(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DOC_PREFIX + id);
  const ids = safeParse<string[]>(localStorage.getItem(LIST_KEY), []);
  localStorage.setItem(LIST_KEY, JSON.stringify(ids.filter((x) => x !== id)));
}

export function createDoc(name: string, layers: DesignerLayer[], privateKey = '', canvasW = 1920, canvasH = 1080): DesignerDoc {
  const doc: DesignerDoc = {
    id: uid('design'),
    name,
    privateKey,
    layers,
    updatedAt: Date.now(),
    canvasW,
    canvasH,
  };
  saveDoc(doc);
  return doc;
}

export function duplicateDoc(src: DesignerDoc): DesignerDoc {
  const copy: DesignerDoc = {
    ...src,
    id: uid('design'),
    name: `${src.name} (copy)`,
    layers: src.layers.map((l) => ({ ...l, id: uid('layer'), props: { ...l.props } })),
    updatedAt: Date.now(),
  };
  saveDoc(copy);
  return copy;
}

// Encode layers ke URL untuk OBS lintas mesin (desain kecil tanpa image besar).
export function encodeLayers(layers: DesignerLayer[]): string {
  return encodeURIComponent(JSON.stringify(layers));
}

export function decodeLayers(raw: string | null): DesignerLayer[] | null {
  if (!raw) return null;
  try {
    const arr = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(arr)) return null;
    return arr as DesignerLayer[];
  } catch {
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return null;
      return arr as DesignerLayer[];
    } catch {
      return null;
    }
  }
}

export function buildDisplayUrl(origin: string, doc: DesignerDoc, opts?: { obs?: boolean; withLayers?: boolean }): string {
  const base = `${origin.replace(/\/$/, '')}/designer/display?designId=${encodeURIComponent(doc.id)}`;
  const key = doc.privateKey ? `&key=${encodeURIComponent(doc.privateKey)}` : '';
  const obs = opts?.obs === false ? '' : '&obs=1';
  const size = `&cw=${doc.canvasW}&ch=${doc.canvasH}`;
  if (!opts?.withLayers) return `${base}${key}${size}${obs}`;
  // withLayers: embed JSON (hati-hati URL panjang kalau ada image base64)
  return `${base}${key}${size}${obs}&layers=${encodeLayers(doc.layers)}`;
}
