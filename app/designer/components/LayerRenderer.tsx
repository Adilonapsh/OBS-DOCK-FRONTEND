'use client';
// Renderer 1:1 dipakai editor canvas + OBS display.
// Arsitektur ala AE, dua lapis per layer:
// - OUTER: geometri dari keyframes (position/opacity/rotation di detik `time`).
//   Plain inline style → aman diupdate tiap frame tanpa restart animasi.
// - INNER: animasi masuk preset (elegant/slide/...) via CSS.
//   `entranceOffset` fix per mount; hanya berubah saat remount (Play/scrub/edit timing).
// Keduanya compose (outer × inner), jadi timeline keyframe + animasi preset
// tidak saling menimpa — preview selalu cocok dengan timeline.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DesignerLayer } from '../lib/types';
import { DESIGN_W, DESIGN_H } from '../lib/types';
import { evalDiscrete, evalStyleAt } from '../lib/keyframes';
import { computeClipPath, type MaskSourceGeom } from '../lib/mask';
import { ANIM_MAP, KEYFRAMES_CSS, animDuration } from '../../widgets/_shared/constants/animations';
import { loadGoogleFont } from '../../widgets/_shared/utils/font';
import { renderTemplate, getTemplateDemoData, type TemplateData } from '../../widgets/_shared/utils/template';

/** Text ala OBS: box otomatis ngepas mengikuti isi teks (default nyala). */
export function isAutoTextLayer(layer: DesignerLayer): boolean {
  return layer.type === 'text' && (layer.props.autoSize ?? true);
}

/**
 * Box teks auto-size: ukuran = hasil ukur, posisi dikoreksi alignment supaya
 * teks center/right tidak bergeser saat isi berubah (anchor tengah/kanan box awal).
 */
export function autoTextBox(
  layer: DesignerLayer,
  measured: { w: number; h: number } | null
): { x: number; w: number; h: number } {
  if (!isAutoTextLayer(layer) || !measured) return { x: layer.x, w: layer.w, h: layer.h };
  const align = layer.props.align ?? 'left';
  const dx = align === 'center' ? (layer.w - measured.w) / 2 : align === 'right' ? layer.w - measured.w : 0;
  return { x: layer.x + dx, w: measured.w, h: measured.h };
}

export type RenderedBox = { x: number; y: number; w: number; h: number; rotation: number; opacity: number };

/**
 * Kotak tampil aktual satu layer: posisi/size ter-evaluasi (size keys,
 * auto-text measure + anchor alignment) + rotasi/opacity. Sumbu = sumbu box
 * (belum di-rotate); untuk interaksi, rotate dengan origin tengah seperti renderer.
 */
export function renderedBox(
  layer: DesignerLayer,
  time: number,
  measured?: { w: number; h: number } | null
): RenderedBox {
  const s = evalStyleAt(layer, time);
  const auto = isAutoTextLayer(layer) && measured != null;
  const tb = auto ? autoTextBox(layer, measured ?? null) : null;
  return {
    x: s.x + (auto && tb ? tb.x - layer.x : 0),
    y: s.y,
    w: auto && tb ? tb.w : s.w,
    h: auto && tb ? tb.h : s.h,
    rotation: s.rotation,
    opacity: s.opacity,
  };
}

export function hexToRgba(hex: string, opacity100: number): string {
  const o = Math.max(0, Math.min(100, opacity100)) / 100;
  if (!hex || hex === 'transparent') return 'transparent';
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (full.length !== 6) return hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${o})`;
}

function entranceStyle(l: DesignerLayer, entranceOffset: number): React.CSSProperties {
  const key = ANIM_MAP[l.animIn] || l.animIn;
  // Delay negatif valid di CSS: animasi dianggap sudah berjalan/finish.
  const delay = (l.delay ?? 0) - entranceOffset;
  if (!key) return { width: '100%', height: '100%' };
  return {
    width: '100%',
    height: '100%',
    animation: `${key} ${animDuration(key)} cubic-bezier(0.16,1,0.3,1) both`,
    animationDelay: `${delay}s`,
  };
}

function useNow(deps: boolean): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!deps) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [deps]);
  return now;
}

export function LayerView({
  layer,
  data,
  selected,
  canvasW = DESIGN_W,
  canvasH = DESIGN_H,
  time = 0,
  entranceOffset = 0,
  onContentSize,
  allLayers = [],
}: {
  layer: DesignerLayer;
  data: TemplateData;
  selected?: boolean;
  canvasW?: number;
  canvasH?: number;
  /** Detik timeline untuk evaluasi keyframes (boleh live tiap frame). */
  time?: number;
  /** Offset snapshot untuk animasi masuk CSS (fix per mount). */
  entranceOffset?: number;
  /** Dilaporkan saat ukuran konten teks terukur (auto-size ala OBS). */
  onContentSize?: (w: number, h: number) => void;
  /** Semua layer (untuk resolusi mask sumber). Default [] = tanpa mask. */
  allLayers?: DesignerLayer[];
}) {
  const hasClock = layer.type === 'clock';
  const now = useNow(hasClock);
  const [fontTick, setFontTick] = useState(0);
  useEffect(() => {
    if (layer.type !== 'text' && layer.type !== 'ticker' && layer.type !== 'clock') return;
    // Muat font base + semua font yang dirujuk keyframe (agar hold-step font tak FOUT).
    const fams = new Set<string>();
    if (layer.props.fontFamily) fams.add(layer.props.fontFamily);
    for (const k of layer.keyframes?.fontFamily ?? []) {
      if (typeof k.v === 'string' && k.v) fams.add(k.v);
    }
    if (fams.size === 0) fams.add(layer.type === 'clock' ? 'JetBrains Mono' : 'Outfit');
    fams.forEach((f) => loadGoogleFont(f));
    // Ukur ulang setelah webfont selesai dimuat (metrik bisa berubah).
    let on = true;
    try {
      document.fonts?.ready
        .then(() => {
          if (on) setFontTick((t) => t + 1);
        })
        .catch(() => {});
    } catch {}
    return () => {
      on = false;
    };
  }, [layer.props.fontFamily, layer.type]);

  const autoText = isAutoTextLayer(layer);
  // Semua nilai teranimasi di detik `time` (satu code path editor + OBS).
  // Teks/src/fontFamily diskrit (hold-step); teks tetap lewat substitusi {{var}} dulu.
  const s = evalStyleAt(layer, time);
  const rawText = layer.type === 'text' ? evalDiscrete(layer.keyframes?.text, renderTemplate(layer.props.text ?? '', data), time) : '';
  const measureRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null);
  const onContentSizeRef = useRef(onContentSize);
  onContentSizeRef.current = onContentSize;
  useLayoutEffect(() => {
    if (!autoText) return;
    const el = measureRef.current;
    if (!el) return;
    const w = Math.max(20, Math.ceil(el.scrollWidth));
    const h = Math.max(20, Math.ceil(el.scrollHeight));
    setMeasured((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    onContentSizeRef.current?.(w, h);
  }, [autoText, rawText, s.fontFamily, s.fontSize, s.fontWeight, s.strokeWidth, fontTick]);

  if (!layer.visible) return null;
  // Out-point: lewat detik ini elemen tidak tampil (di editor maupun OBS).
  // Pre-delay tetap ditangani CSS from-state (jangan null agar delay mount tetap benar).
  const out = layer.out ?? null;
  if (out != null && time > out) return null;

  // Geometri: ukuran box = hasil ukur konten (auto text) atau size terkeyframe.
  // Text auto-size: posisi dikoreksi alignment.
  const tb = autoText ? autoTextBox(layer, measured) : null;
  const boxX = tb ? s.x + (tb.x - layer.x) : s.x;
  const boxW = tb ? tb.w : s.w;
  const boxH = tb ? tb.h : s.h;

  // Clipping mask (live): potong layer ini mengikuti geometri layer sumber
  // di detik yang sama. Mask tetap jalan walau sumbernya di-hidden.
  let maskClipStyle: React.CSSProperties = {};
  let maskedOut = false;
  const maskId = layer.maskSource;
  if (maskId && maskId !== layer.id) {
    const src = (allLayers ?? []).find((l) => l.id === maskId);
    if (src) {
      const ss = evalStyleAt(src, time);
      const sKind = src.type === 'shape' ? (src.props.shape ?? 'rect') : 'rect';
      const geom: MaskSourceGeom =
        sKind === 'ellipse'
          ? { kind: 'ellipse', x: ss.x, y: ss.y, w: ss.w, h: ss.h }
          : {
              kind: 'rect',
              x: ss.x,
              y: ss.y,
              w: ss.w,
              h: ss.h,
              radius: src.type === 'shape' ? ss.radius : 0,
            };
      const clip = computeClipPath({ x: boxX, y: s.y, w: boxW, h: boxH }, geom);
      if (clip === null) maskedOut = true;
      else maskClipStyle = { clipPath: clip };
    }
  }
  if (maskedOut) return null;

  const outer: React.CSSProperties = {
    position: 'absolute',
    left: `${(boxX / canvasW) * 100}%`,
    top: `${(s.y / canvasH) * 100}%`,
    width: `${(boxW / canvasW) * 100}%`,
    height: `${(boxH / canvasH) * 100}%`,
    zIndex: layer.zIndex,
    opacity: s.opacity / 100,
    transform: s.rotation ? `rotate(${s.rotation}deg)` : undefined,
    overflow: 'hidden',
    outline: selected ? '2px solid #ffffff' : 'none',
    outlineOffset: 2,
    ...(layer.props.blendMode && layer.props.blendMode !== 'normal'
      ? { mixBlendMode: layer.props.blendMode as React.CSSProperties['mixBlendMode'] }
      : {}),
    ...maskClipStyle,
  };

  const innerBase = entranceStyle(layer, entranceOffset);
  // Crop tepi L/R/T/B (visual saja, % terhadap box) — kompos dengan mask di outer.
  const cropL = Math.max(0, layer.props.cropL ?? 0);
  const cropR = Math.max(0, layer.props.cropR ?? 0);
  const cropT = Math.max(0, layer.props.cropT ?? 0);
  const cropB = Math.max(0, layer.props.cropB ?? 0);
  const inner: React.CSSProperties =
    cropL + cropR + cropT + cropB > 0 && boxW > 0 && boxH > 0
      ? {
          ...innerBase,
          clipPath: `inset(${Math.round((Math.min(cropT, boxH) / boxH) * 10000) / 100}% ${Math.round((Math.min(cropR, boxW) / boxW) * 10000) / 100}% ${Math.round((Math.min(cropB, boxH) / boxH) * 10000) / 100}% ${Math.round((Math.min(cropL, boxW) / boxW) * 10000) / 100}%)`,
        }
      : innerBase;

  if (layer.type === 'shape') {
    const kind = layer.props.shape ?? 'rect';
    const fill = hexToRgba(s.fill, layer.props.bgOpacity ?? 100);
    const bw = s.borderWidth;
    const bc = s.borderColor;
    const radius = s.radius;
    if (kind === 'line') {
      return (
        <div style={outer}>
          <div style={inner}>
            <div style={{ width: '100%', height: Math.max(2, bw || 4), background: s.fill, marginTop: '48%' }} />
          </div>
        </div>
      );
    }
    return (
      <div style={outer}>
        <div
          style={{
            ...inner,
            background: fill,
            borderRadius: kind === 'ellipse' ? '50%' : radius,
            border: bw > 0 ? `${bw}px solid ${bc}` : 'none',
          }}
        />
      </div>
    );
  }

  if (layer.type === 'image') {
    const src = evalDiscrete(layer.keyframes?.src, renderTemplate(layer.props.src ?? '', data), time);
    if (!src) {
      return (
        <div style={outer}>
          <div style={{ ...inner, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.25)', borderRadius: 12, color: '#888', fontSize: 22 }}>
            No image — upload di panel kanan
          </div>
        </div>
      );
    }
    return (
      <div style={outer}>
        <div style={inner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={layer.name} style={{ width: '100%', height: '100%', objectFit: layer.props.fit ?? 'contain' }} draggable={false} />
        </div>
      </div>
    );
  }

  if (layer.type === 'ticker') {
    const raw = evalDiscrete(layer.keyframes?.text, renderTemplate(layer.props.text ?? '', data), time);
    const speed = s.speed;
    const fs = s.fontSize;
    return (
      <div style={outer}>
        <div style={{ ...inner, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <style>{`${KEYFRAMES_CSS} @keyframes designerMarquee { from { transform: translateX(100%); } to { transform: translateX(-100%); } }`}</style>
          <div
            style={{
              whiteSpace: 'nowrap',
              fontFamily: `'${s.fontFamily}', sans-serif`,
              fontSize: fs,
              fontWeight: s.fontWeight,
              color: s.color,
              animation: `designerMarquee ${speed}s linear infinite`,
            }}
          >
            {raw}
          </div>
        </div>
      </div>
    );
  }

  if (layer.type === 'clock') {
    const pad = (n: number) => String(n).padStart(2, '0');
    const txt = layer.props.showSeconds === false
      ? `${pad(now.getHours())}:${pad(now.getMinutes())}`
      : `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    return (
      <div style={outer}>
        <div
          style={{
            ...inner,
            display: 'flex',
            alignItems: 'center',
          justifyContent: layer.props.align === 'center' ? 'center' : layer.props.align === 'right' ? 'flex-end' : 'flex-start',
          fontFamily: `'${s.fontFamily}', monospace`,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          color: s.color,
        }}
      >
        {txt}
        </div>
      </div>
    );
  }

  // text (ala OBS: auto-size box ngepas ke isi teks)
  const fs = s.fontSize;
  const tAlign = layer.props.align ?? 'left';
  const tJustify = tAlign === 'center' ? 'center' : tAlign === 'right' ? 'flex-end' : 'flex-start';
  return (
    <div style={outer}>
      <div
        style={{
          ...inner,
          display: 'flex',
          alignItems: 'center',
          justifyContent: tJustify,
        }}
      >
        <div
          ref={autoText ? measureRef : undefined}
          style={{
            fontFamily: `'${s.fontFamily}', sans-serif`,
            fontSize: fs,
            fontWeight: s.fontWeight,
            color: s.color,
            textAlign: tAlign,
            lineHeight: 1.1,
            textShadow: layer.props.shadow ? '0 4px 24px rgba(0,0,0,0.55)' : 'none',
            WebkitTextStroke: s.strokeWidth ? `${s.strokeWidth}px ${s.stroke}` : undefined,
            // Auto-size = point text ala OBS: JANGAN wrap/menyusut mengikuti box,
            // kalau tidak box tidak akan pernah tumbuh melewati lebar awal (terasa seperti limit).
            whiteSpace: autoText ? 'pre' : 'pre-wrap',
            wordBreak: autoText ? 'normal' : 'break-word',
            width: autoText ? 'max-content' : '100%',
            flexShrink: autoText ? 0 : undefined,
            maxWidth: autoText ? 'none' : undefined,
          }}
        >
          {rawText}
        </div>
      </div>
    </div>
  );
}

export function DesignerStage({
  layers,
  data,
  selectedId,
  canvasW = DESIGN_W,
  canvasH = DESIGN_H,
  time = 0,
  entranceOffset = 0,
  onLayerSize,
}: {
  layers: DesignerLayer[];
  data?: TemplateData;
  selectedId?: string | null;
  canvasW?: number;
  canvasH?: number;
  time?: number;
  entranceOffset?: number;
  /** Dilaporkan saat ukuran konten teks terukur (auto-size ala OBS). */
  onLayerSize?: (id: string, w: number, h: number) => void;
}) {
  const merged: TemplateData = { ...getTemplateDemoData(), ...(data ?? {}) };
  const ordered = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <style>{KEYFRAMES_CSS}</style>
      {ordered.map((l) => (
        <LayerView key={l.id} layer={l} data={merged} selected={selectedId === l.id} canvasW={canvasW} canvasH={canvasH} time={time} entranceOffset={entranceOffset} allLayers={layers} onContentSize={onLayerSize ? (w, h) => onLayerSize(l.id, w, h) : undefined} />
      ))}
    </div>
  );
}
