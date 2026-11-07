'use client';
// Timeline ala After Effects:
// - Tiap layer = 1 bar ungu full [in → out] = durasi tampil (kepala terang = animasi masuk).
//   Drag bar = geser span, handle kanan = panjang/pendekkan, drag baris = susun ulang.
// - Tiap properti (Position/Opacity/Rotation) punya stopwatch + tombol diamond.
//   Nyalakan stopwatch lalu geser layer / ubah nilai → keyframe tercatat di detik seeker.
//   Diamond: klik = lompat seeker ke sana, double-click = hapus.
// - Penggaris bisa di-scrub, panjang timeline bisa diatur user.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaPlay, FaCaretRight, FaCaretDown, FaStopwatch, FaDiamond,
  FaEye, FaEyeSlash, FaLock, FaUnlock, FaMinus, FaPlus,
  FaTrash, FaChevronUp, FaChevronDown, FaGripVertical,
  FaFont, FaImage, FaSquare, FaBullhorn, FaClock, FaLink,
} from 'react-icons/fa6';
import type { DesignerLayer, Keyframe, KeyProp } from '../lib/types';
import { KEY_PROP_LIST, evalStyleAt, getKeys, isArmed, propsForLayer, EASE_OPTIONS } from '../lib/keyframes';
import { isAutoTextLayer } from './LayerRenderer';
import { ANIM_MAP, animDuration } from '../../widgets/_shared/constants/animations';

function animSeconds(animIn: string): number {
  const key = ANIM_MAP[animIn] || animIn;
  if (!key) return 0;
  const d = animDuration(key);
  const n = parseFloat(d);
  return isNaN(n) ? 0.45 : n;
}

export const TIMELINE_MAX_DELAY = 30;
export const TIMELINE_MIN_SECS = 4;
export const TIMELINE_MAX_SECS = 60;
export const TIMELINE_MAX_OUT = 300;

// Ikon tipe layer (gantikan badge tulisan) - selaras dengan toolbar editor.
const TYPE_ICONS: Record<string, React.ElementType> = {
  text: FaFont,
  image: FaImage,
  shape: FaSquare,
  ticker: FaBullhorn,
  clock: FaClock,
};

export type DiamondSel = { layerId: string; prop: KeyProp; keyId: string } | null;

function propValueText(layer: DesignerLayer, prop: KeyProp, t: number): string {
  const meta = KEY_PROP_LIST.find((p) => p.id === prop);
  const s = evalStyleAt(layer, t);
  switch (prop) {
    case 'position': return `${Math.round(s.x)}, ${Math.round(s.y)}`;
    case 'size': return `${Math.round(s.w)}×${Math.round(s.h)}`;
    case 'opacity': return `${Math.round(s.opacity)}%`;
    case 'rotation': return `${Math.round(s.rotation)}°`;
    case 'fontSize': return `${Math.round(s.fontSize)}px`;
    case 'fontWeight': return `${Math.round(s.fontWeight)}`;
    case 'color': return s.color;
    case 'strokeWidth': return `${Math.round(s.strokeWidth * 10) / 10}px`;
    case 'stroke': return s.stroke;
    case 'borderWidth': return `${Math.round(s.borderWidth * 10) / 10}px`;
    case 'borderColor': return s.borderColor;
    case 'radius': return `${Math.round(s.radius * 10) / 10}px`;
    case 'speed': return `${Math.round(s.speed * 10) / 10}s`;
    case 'fontFamily': return s.fontFamily;
    case 'text': {
      const txt = s.text.length > 18 ? s.text.slice(0, 18) + '…' : s.text;
      return txt || '(kosong)';
    }
    case 'src': return s.src ? '✓' : '-';
    default: return meta?.unit ? `${meta.unit}` : '';
  }
}

export default function KeyframeTimeline({
  docId,
  layers,
  selectedId,
  multiIds,
  playKey,
  playing,
  scrub,
  durationSecs,
  windowSecs,
  selectedDiamond,
  zoom,
  zoomSteps,
  zoomText,
  onSelect,
  onToggleSelect,
  onGestureStart,
  onDelay,
  onPlay,
  onPlayEnd,
  onScrub,
  onDuration,
  onToggleWatch,
  onAddKey,
  onDiamondJump,
  onDiamondDelete,
  onKeyframeMove,
  onKeyframeCommit,
  onToggleVisible,
  onToggleLocked,
  onDelete,
  onMoveZ,
  onReorder,
  onResizeOut,
  onZoom,
  onZoomStep,
}: {
  docId: string;
  layers: DesignerLayer[];
  selectedId: string | null;
  multiIds: string[];
  playKey: number;
  playing: boolean;
  scrub: number;
  durationSecs: number;
  windowSecs: number;
  selectedDiamond: DiamondSel;
  zoom: number | 'fit';
  zoomSteps: number[];
  zoomText: string;
  onSelect: (id: string) => void;
  onToggleSelect: (id: string) => void;
  /** Dipanggil sekali di awal tiap drag gesture (untuk commit undo). */
  onGestureStart?: () => void;
  onDelay: (id: string, delay: number) => void;
  onPlay: () => void;
  onPlayEnd: () => void;
  onScrub: (t: number) => void;
  onDuration: (secs: number) => void;
  onToggleWatch: (layerId: string, prop: KeyProp) => void;
  onAddKey: (layerId: string, prop: KeyProp) => void;
  onDiamondJump: (layerId: string, prop: KeyProp, t: number, keyId: string) => void;
  onDiamondDelete: (layerId: string, prop: KeyProp, keyId: string) => void;
  onKeyframeMove: (layerId: string, prop: KeyProp, keyId: string, t: number) => void;
  onKeyframeCommit: (layerId: string, prop: KeyProp, keyId: string) => void;
  onToggleVisible: (layerId: string) => void;
  onToggleLocked: (layerId: string) => void;
  onDelete: (layerId: string) => void;
  onMoveZ: (layerId: string, dir: 1 | -1) => void;
  onReorder: (dragId: string, targetId: string) => void;
  onResizeOut: (layerId: string, out: number) => void;
  onZoom: (z: number | 'fit') => void;
  onZoomStep: (dir: 1 | -1) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  useEffect(() => {
    setExpanded(new Set());
  }, [docId]);

  // Urutan tampil: paling atas = zIndex terbesar (paling depan), ala Photoshop.
  const ordered = useMemo(() => [...layers].sort((a, b) => b.zIndex - a.zIndex), [layers]);

  const ticks = useMemo(() => {
    const step = windowSecs > 20 ? 5 : windowSecs > 12 ? 2 : 1;
    const arr: number[] = [];
    for (let t = 0; t <= windowSecs; t += step) arr.push(t);
    return arr;
  }, [windowSecs]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startBlockDrag = (e: React.MouseEvent, layer: DesignerLayer) => {
    if (layer.locked) return;
    e.stopPropagation();
    onGestureStart?.();
    if (!(e.ctrlKey || e.metaKey || e.shiftKey)) onSelect(layer.id);
    const track = trackRef.current;
    const startX = e.clientX;
    const orig = layer.delay ?? 0;
    const widthPx = track?.getBoundingClientRect().width || 1;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dt = (dx / widthPx) * windowSecs;
      const next = Math.round(Math.max(0, Math.min(TIMELINE_MAX_DELAY, orig + dt)) * 10) / 10;
      onDelay(layer.id, next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Drag handle kanan: memanjangkan / memendekkan out-point (durasi tampil).
  // Dipakai bar [delay → out]; out null ikut di-set eksplisit saat pertama di-drag.
  const startOutDrag = (e: React.MouseEvent, layer: DesignerLayer) => {
    if (layer.locked) return;
    e.stopPropagation();
    onGestureStart?.();
    if (!(e.ctrlKey || e.metaKey || e.shiftKey)) onSelect(layer.id);
    const track = trackRef.current;
    const startX = e.clientX;
    const w0 = windowSecs;
    const delay0 = layer.delay ?? 0;
    const out0 = layer.out ?? w0;
    const widthPx = track?.getBoundingClientRect().width || 1;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dt = (dx / widthPx) * w0;
      const next = Math.round(Math.max(delay0 + 0.2, Math.min(TIMELINE_MAX_OUT, out0 + dt)) * 10) / 10;
      onResizeOut(layer.id, next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const scrubFromClientX = (clientX: number) => {
    const r = rulerRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    const t = Math.round(Math.max(0, Math.min(windowSecs, ((clientX - r.left) / r.width) * windowSecs)) * 10) / 10;
    onScrub(t);
  };

  const onRulerDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrubFromClientX(e.clientX);
    const onMove = (ev: MouseEvent) => scrubFromClientX(ev.clientX);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Drag diamond: pindahkan keyframe ke detik lain. Klik tanpa geser = lompat seeker.
  const startDiamondDrag = (e: React.MouseEvent, layer: DesignerLayer, prop: KeyProp, key: Keyframe) => {
    e.stopPropagation();
    onGestureStart?.();
    const lane = (e.currentTarget as HTMLElement).parentElement;
    const startX = e.clientX;
    const t0 = key.t;
    const w0 = windowSecs;
    const widthPx = lane?.getBoundingClientRect().width || 1;
    let moved = false;
    const onMove = (ev: MouseEvent) => {
      if (!moved && Math.abs(ev.clientX - startX) < 3) return;
      moved = true;
      const dt = ((ev.clientX - startX) / widthPx) * w0;
      onKeyframeMove(layer.id, prop, key.id, Math.max(0, t0 + dt));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (!moved) onDiamondJump(layer.id, prop, key.t, key.id);
      else onKeyframeCommit(layer.id, prop, key.id);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="bg-[#121212] border border-white/5 rounded-none p-3 h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-1 flex-wrap shrink-0">
        <button
          onClick={onPlay}
          title="Play - jalankan dari detik 0 (spasi juga bisa)"
          className="flex items-center gap-1.5 bg-white text-black text-[11px] font-black px-3 py-1.5 rounded-none"
        >
          <FaPlay className="w-3 h-3" /> Play
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Timeline</span>
        {/* Zoom canvas - dipindah ke sini biar area canvas lega */}
        <span className="flex items-center gap-1 text-gray-400" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] font-black uppercase tracking-widest">Zoom</span>
          <button onClick={() => onZoomStep(-1)} title="Perkecil canvas" className="p-1 bg-white/5 hover:bg-white/10 rounded-none text-gray-300">
            <FaMinus className="w-2.5 h-2.5" />
          </button>
          <select
            value={String(zoom)}
            onChange={(e) => onZoom(e.target.value === 'fit' ? 'fit' : Number(e.target.value))}
            title="Level zoom canvas"
            className="bg-black/40 border border-white/10 rounded-none px-1 py-0.5 text-[10px] text-white"
          >
            {zoomSteps.map((z) => (
              <option key={z} value={String(z)}>{z}%</option>
            ))}
            <option value="fit">Fit</option>
          </select>
          <button onClick={() => onZoomStep(1)} title="Perbesar canvas" className="p-1 bg-white/5 hover:bg-white/10 rounded-none text-gray-300">
            <FaPlus className="w-2.5 h-2.5" />
          </button>
          <span className="text-[10px] text-gray-500">{zoomText}</span>
        </span>
        <label className="flex items-center gap-1 text-[10px] text-gray-400 ml-auto">
          Panjang
          <button
            onClick={() => onDuration(Math.max(TIMELINE_MIN_SECS, Math.min(TIMELINE_MAX_SECS, durationSecs - 2)))}
            title="Perpendek timeline 2 detik"
            className="p-1 bg-white/5 hover:bg-white/10 rounded-none text-gray-300"
          >
            <FaMinus className="w-2.5 h-2.5" />
          </button>
          <input
            type="number"
            min={TIMELINE_MIN_SECS}
            max={TIMELINE_MAX_SECS}
            value={durationSecs}
            onChange={(e) => {
              const n = Math.round(Number(e.target.value));
              if (isNaN(n)) return;
              onDuration(Math.max(TIMELINE_MIN_SECS, Math.min(TIMELINE_MAX_SECS, n)));
            }}
            title="Panjang timeline (detik) - bisa diketik langsung"
            className="w-16 bg-black/40 border border-white/10 rounded-none px-2 py-1 text-[11px] text-white"
          />
          <button
            onClick={() => onDuration(Math.max(TIMELINE_MIN_SECS, Math.min(TIMELINE_MAX_SECS, durationSecs + 2)))}
            title="Perpanjang timeline 2 detik"
            className="p-1 bg-white/5 hover:bg-white/10 rounded-none text-gray-300"
          >
            <FaPlus className="w-2.5 h-2.5" />
          </button>
          detik
        </label>
      </div>

      {/* Penggaris detik - area scrub seeker */}
      <div className="flex gap-2 shrink-0">
        <div className="w-56 shrink-0" />
        <div
          ref={rulerRef}
          onMouseDown={onRulerDown}
          title="Drag untuk scrub seeker"
          className="flex-1 relative h-5 cursor-ew-resize bg-black/30 rounded-none overflow-hidden"
        >
          {ticks.map((t) => (
            <span key={t} className="absolute top-0.5 text-[9px] text-gray-500 -translate-x-1/2 pointer-events-none" style={{ left: `${(t / windowSecs) * 100}%` }}>
              {t}s
            </span>
          ))}
          {playing ? (
            <div
              key={playKey}
              onAnimationEnd={onPlayEnd}
              className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
              style={{ animation: `designerPlayhead ${windowSecs}s linear both` }}
            />
          ) : (
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/70 pointer-events-none" style={{ left: `${(scrub / windowSecs) * 100}%` }} />
          )}
          <style>{`@keyframes designerPlayhead { from { left: 0; } to { left: 100%; } }`}</style>
        </div>
      </div>

      {/* Track per layer - mengisi sisa tinggi panel, scroll mandiri */}
      <div className="space-y-1 mt-1 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {ordered.map((l, li) => {
          const delay = l.delay ?? 0;
          // Bar ungu full = BERAPA LAMA elemen tampil di canvas ([in → out]),
          // bukan lama animasinya. out null = sampai akhir timeline.
          // Kepala bar yang lebih terang = porsi animasi masuk.
          const end = l.out ?? windowSecs;
          const dur = animSeconds(l.animIn);
          const barLeft = `${(delay / windowSecs) * 100}%`;
          const barWidth = `${Math.max(1.5, ((end - delay) / windowSecs) * 100)}%`;
          const endPct = `${(end / windowSecs) * 100}%`;
          const active = selectedId === l.id || multiIds.includes(l.id);
          const open = expanded.has(l.id);
          const TypeIcon = TYPE_ICONS[l.type] ?? FaSquare;
          const spanDur = Math.max(0.01, end - delay);
          const animHead = dur > 0 ? Math.min(1, dur / spanDur) : 0;
          const headBg = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)';
          const tailBg = active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)';
          const barBg =
            animHead > 0
              ? `linear-gradient(to right, ${headBg} ${(animHead * 100).toFixed(1)}%, ${tailBg} ${(animHead * 100).toFixed(1)}%)`
              : tailBg;
          return (
            <div key={l.id}>
              {/* Bar layer */}
              <div className="flex gap-2 items-center">
                <div
                  className={`w-56 shrink-0 flex items-center gap-1 px-1 py-1 rounded-none cursor-grab active:cursor-grabbing ${dropTarget === l.id ? 'outline outline-2 outline-white bg-white/15' : active ? 'bg-white/15' : 'bg-white/5 hover:bg-white/10'}`}
                  onClick={(e) => ((e.ctrlKey || e.metaKey || e.shiftKey) ? onToggleSelect(l.id) : onSelect(l.id))}
                  draggable
                  title="Drag untuk susun ulang (z-order)"
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', l.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dropTarget !== l.id) setDropTarget(l.id);
                  }}
                  onDragLeave={() => setDropTarget((t) => (t === l.id ? null : t))}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dragId = e.dataTransfer.getData('text/plain');
                    setDropTarget(null);
                    if (dragId && dragId !== l.id) onReorder(dragId, l.id);
                  }}
                  onDragEnd={() => setDropTarget(null)}
                >
                  <FaGripVertical className="w-3 h-3 text-gray-600 shrink-0" />
                  <button onClick={(e) => { e.stopPropagation(); toggleExpand(l.id); }} className="text-gray-400 hover:text-white p-0.5" title="Buka/tutup properti">
                    {open ? <FaCaretDown className="w-3 h-3" /> : <FaCaretRight className="w-3 h-3" />}
                  </button>
                  <span title={`Layer ${l.type}`} className="text-gray-300 bg-white/10 rounded-none p-1 shrink-0">
                    <TypeIcon className="w-3 h-3" />
                  </span>
                  <span className={`flex-1 truncate text-[10px] font-bold ${active ? 'text-white' : 'text-gray-300'}`}>{l.name}</span>
                  {l.maskSource && (
                    <span
                      className="text-gray-300 shrink-0"
                      title={`Mask ← ${ordered.find((x) => x.id === l.maskSource)?.name ?? '(sumber hilang)'}`}
                    >
                      <FaLink className="w-3 h-3" />
                    </span>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); onToggleVisible(l.id); }} className="text-gray-400 hover:text-white" title="Show/hide">{l.visible ? <FaEye className="w-3 h-3" /> : <FaEyeSlash className="w-3 h-3" />}</button>
                  <button onClick={(e) => { e.stopPropagation(); onToggleLocked(l.id); }} className="text-gray-400 hover:text-white" title="Lock">{l.locked ? <FaLock className="w-3 h-3" /> : <FaUnlock className="w-3 h-3" />}</button>
                  <button onClick={(e) => { e.stopPropagation(); onMoveZ(l.id, 1); }} className="text-gray-400 hover:text-white" title="Naik (z-order)"><FaChevronUp className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onMoveZ(l.id, -1); }} className="text-gray-400 hover:text-white" title="Turun (z-order)"><FaChevronDown className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(l.id); }} className="text-gray-400 hover:text-white" title="Hapus layer"><FaTrash className="w-3 h-3" /></button>
                </div>
                <div className="flex-1 relative h-6 bg-black/40 rounded-none overflow-hidden" ref={li === 0 ? trackRef : undefined}>
                  {ticks.map((t) => (
                    <div key={t} className="absolute top-0 bottom-0 w-px bg-white/5 pointer-events-none" style={{ left: `${(t / windowSecs) * 100}%` }} />
                  ))}
                  {!l.visible ? (
                    <span className="absolute inset-0 flex items-center px-2 text-[9px] text-gray-600">hidden</span>
                  ) : (
                    <>
                      {/* Bar ungu full = durasi tampil [in → out]; kepala terang = animasi masuk */}
                      <div
                        onMouseDown={(e) => startBlockDrag(e, l)}
                        onClick={(e) => ((e.ctrlKey || e.metaKey || e.shiftKey) ? onToggleSelect(l.id) : onSelect(l.id))}
                        title={`${l.name} - tampil ${delay.toFixed(1)}s → ${l.out != null ? l.out.toFixed(1) + 's' : 'akhir'} (drag geser, handle kanan atur panjang)`}
                        className="absolute top-1 bottom-1 rounded-none cursor-ew-resize"
                        style={{ left: barLeft, width: barWidth, background: barBg }}
                      />
                      {/* Porsi animasi masuk digambar sebagai kepala terang via gradient bar */}
                      {/* Handle kanan - panjangkan / pendekkan durasi tampil */}
                      <div
                        onMouseDown={(e) => startOutDrag(e, l)}
                        title="Drag untuk memanjangkan / memendekkan durasi tampil"
                        className="absolute top-0.5 bottom-0.5 w-2 cursor-ew-resize bg-white/70 hover:bg-white rounded-none"
                        style={{ left: endPct, transform: 'translateX(-50%)' }}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Baris properti (twirl terbuka) - hanya prop yang relevan untuk tipe layer */}
              {open && (
                <div className="mt-0.5 space-y-0.5">
                  {propsForLayer(l.type)
                    // Size diabaikan saat autoSize teks nyala (kontrolnya = fontSize).
                    .filter((propId) => propId !== 'size' || !isAutoTextLayer(l))
                    .map((propId) => {
                    const p = KEY_PROP_LIST.find((x) => x.id === propId)!;
                    const armed = isArmed(l, p.id);
                    const keys = getKeys(l, p.id);
                    return (
                      <div key={p.id} className="flex gap-2 items-center">
                        <div className="w-56 shrink-0 flex items-center gap-1 pl-5 pr-1 py-0.5 bg-black/30 rounded-none">
                          <button
                            onClick={() => onToggleWatch(l.id, p.id)}
                            title={armed ? 'Matikan stopwatch (hapus semua keyframe properti ini)' : 'Nyalakan stopwatch (rekam keyframe)'}
                            className={`p-1 rounded-none ${armed ? 'text-white bg-white/15' : 'text-gray-600 hover:text-gray-300'}`}
                          >
                            <FaStopwatch className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] text-gray-400 flex-1">{p.label}</span>
                          <button
                            onClick={() => onAddKey(l.id, p.id)}
                            title={`Tambah keyframe ${p.label} di ${scrub.toFixed(1)}s`}
                            className="p-1 text-gray-600 hover:text-white rounded-none"
                          >
                            <FaDiamond className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[9px] font-mono text-gray-500">{propValueText(l, p.id, scrub)}</span>
                        </div>
                        <div className="flex-1 relative h-5 bg-black/20 rounded-none overflow-hidden">
                          {ticks.map((t) => (
                            <div key={t} className="absolute top-0 bottom-0 w-px bg-white/5 pointer-events-none" style={{ left: `${(t / windowSecs) * 100}%` }} />
                          ))}
                          {keys.map((k) => {
                            const sel = selectedDiamond?.layerId === l.id && selectedDiamond?.prop === p.id && selectedDiamond?.keyId === k.id;
                            return (
                              <button
                                key={k.id}
                                onMouseDown={(e) => startDiamondDrag(e, l, p.id, k)}
                                onDoubleClick={(e) => { e.stopPropagation(); onDiamondDelete(l.id, p.id, k.id); }}
                                title={`Keyframe ${k.t.toFixed(2)}s • ${EASE_OPTIONS.find((o) => o.id === (k.ease ?? 'linear'))?.label ?? ''} - drag = pindahkan, klik = lompat, double-click = hapus`}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 p-1 cursor-ew-resize"
                                style={{ left: `${(k.t / windowSecs) * 100}%` }}
                              >
                                <FaDiamond className={`w-2.5 h-2.5 ${sel ? 'text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]' : 'text-gray-200 hover:text-white'}`} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {ordered.length === 0 && <div className="text-[11px] text-gray-500">Belum ada layer.</div>}
      </div>
    </div>
  );
}
