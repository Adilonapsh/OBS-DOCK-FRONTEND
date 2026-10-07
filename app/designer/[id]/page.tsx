'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FaArrowLeft, FaCopy, FaCheck, FaEye,
  FaArrowPointer, FaFont, FaImage,
  FaSquare, FaBullhorn, FaClock,
} from 'react-icons/fa6';
import type { DesignerDoc, DesignerLayer, KeyProp, KeyframeValue, LayerEase } from '../lib/types';
import { uid } from '../lib/types';
import { EASE_OPTIONS, PRESET_BEZIERS, currentPropValue, effectiveBezier, evalLayerAt, evalStyleAt, mergeKeysAt, moveKeyframe, parseColor, propMeta, removeKeyframe, setKeyframe, toggleWatch, updateKeyframe } from '../lib/keyframes';
import { loadDoc, saveDoc, buildDisplayUrl } from '../lib/store';
import { newTextLayer, newShapeLayer, newImageLayer } from '../lib/presets';
import { DesignerStage, isAutoTextLayer, renderedBox } from '../components/LayerRenderer';
import KeyframeTimeline, { type DiamondSel } from '../components/KeyframeTimeline';
import SpeedGraph from '../components/SpeedGraph';
import BezierEditor from '../components/BezierEditor';
import PsdImportDialog from '../components/PsdImportDialog';
import { ANIM_MAP, ANIM_OUT_MAP } from '../../widgets/_shared/constants/animations';
import { WIDGET_FONTS } from '../../widgets/_shared/constants/fonts';
import { gooeyToast } from "goey-toast";
import ConfirmModal from "../../components/ConfirmModal";

const ANIM_IN_OPTIONS = ['elegant', 'softPop', 'blur', 'luxe', 'slideUp', 'slideLeft', 'slideRight', 'pop', 'fade', 'flip', ''];
const ANIM_OUT_OPTIONS = ['elegant', 'softPop', 'blur', 'luxe', 'slideUp', 'slideLeft', 'slideRight', 'pop', 'fade', 'flip', ''];

const SIZE_PRESETS = [
  { id: 'fhd', label: '1920×1080', w: 1920, h: 1080 },
  { id: 'hd', label: '1280×720', w: 1280, h: 720 },
  { id: 'vertical', label: '1080×1920', w: 1080, h: 1920 },
  { id: 'square', label: '1080×1080', w: 1080, h: 1080 },
];

const TOOLS: { id: DesignerLayer['type'] | 'select'; label: string; icon: React.ElementType }[] = [
  { id: 'select', label: 'Select', icon: FaArrowPointer },
  { id: 'text', label: 'Text', icon: FaFont },
  { id: 'image', label: 'Image', icon: FaImage },
  { id: 'shape', label: 'Shape', icon: FaSquare },
  { id: 'ticker', label: 'Ticker', icon: FaBullhorn },
  { id: 'clock', label: 'Clock', icon: FaClock },
];

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

// Handle transform ala OBS: 8 kotak resize + 1 lingkaran rotate.
const HANDLES: { id: ResizeHandle; x: string; y: string; cursor: string }[] = [
  { id: 'nw', x: '0%', y: '0%', cursor: 'nwse-resize' },
  { id: 'n', x: '50%', y: '0%', cursor: 'ns-resize' },
  { id: 'ne', x: '100%', y: '0%', cursor: 'nesw-resize' },
  { id: 'e', x: '100%', y: '50%', cursor: 'ew-resize' },
  { id: 'se', x: '100%', y: '100%', cursor: 'nwse-resize' },
  { id: 's', x: '50%', y: '100%', cursor: 'ns-resize' },
  { id: 'sw', x: '0%', y: '100%', cursor: 'nesw-resize' },
  { id: 'w', x: '0%', y: '50%', cursor: 'ew-resize' },
];

function MenuItem({
  label,
  shortcut,
  checked,
  disabled,
  danger,
  onClick,
}: {
  label: string;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-[12px] rounded-none transition-colors disabled:opacity-40 disabled:pointer-events-none ${
        danger ? 'text-white hover:bg-white/10' : 'text-gray-200 hover:bg-white/10'
      }`}
    >
      <span className="w-4 shrink-0 flex justify-center">{checked ? <FaCheck className="w-3 h-3 text-white" /> : null}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-[10px] text-gray-500">{shortcut}</span>}
    </button>
  );
}

function MenuSep() {
  return <div className="my-1 border-t border-white/10" />;
}

// Input angka yang tahan ketikan intermediate ("-", "", "12.") dan tidak pernah
// menulis NaN ke state - sumber bug "input tak bisa diubah" + layer hilang.
// Commit live saat valid; revert tampilan saat blur bila tak valid.
function NumInput({
  value,
  onCommit,
  ...rest
}: {
  value: number;
  onCommit: (n: number) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onCommit' | 'type'>) {
  const [text, setText] = useState<string | null>(null);
  // Ikuti nilai luar saat berubah dari tempat lain (drag, tombol, keyframe).
  useEffect(() => {
    setText(null);
  }, [value]);
  const shown = text ?? (Number.isFinite(value) ? String(value) : '');
  const tryCommit = (raw: string): boolean => {
    const t = raw.trim();
    if (t === '' || t === '-' || t === '+' || t === '.' || t === '-.' || t === '+.' || t.endsWith('.') || /e[+-]?$/i.test(t)) return false;
    const n = Number(t);
    if (!Number.isFinite(n)) return false;
    onCommit(n);
    return true;
  };
  return (
    <input
      type="number"
      {...rest}
      value={shown}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        tryCommit(raw);
      }}
      onBlur={() => setText(null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

function nextZ(layers: DesignerLayer[]): number {
  return layers.reduce((m, l) => Math.max(m, l.zIndex), 0) + 1;
}

function clampCanvas(v: number, min: number, max: number): number {
  const n = Math.round(Number(v));
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function Editor() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [doc, setDoc] = useState<DesignerDoc | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Multi-select: primary = selectedId, sisanya di extraIds.
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const selIds = useMemo(
    () => [selectedId, ...extraIds].filter((x): x is string => !!x),
    [selectedId, extraIds]
  );
  const selSet = useMemo(() => new Set(selIds), [selIds]);
  const clearSelection = () => {
    setSelectedId(null);
    setExtraIds([]);
  };
  // Klik biasa = seleksi tunggal; Ctrl/Cmd/Shift+klik = toggle ke set.
  const toggleSelect = (id: string) => {
    if (selectedId === id) {
      const [next, ...rest] = extraIds;
      setSelectedId(next ?? null);
      setExtraIds(rest);
    } else if (extraIds.includes(id)) {
      setExtraIds(extraIds.filter((x) => x !== id));
    } else if (selectedId) {
      setExtraIds([...extraIds, id]);
    } else {
      setSelectedId(id);
    }
  };
  const [copied, setCopied] = useState(false);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [playKey, setPlayKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scrub, setScrub] = useState(0);
  const [selectedDiamond, setSelectedDiamond] = useState<DiamondSel>(null);
  const [dataVars, setDataVars] = useState({ username: 'Rizky Pratama', message: 'Narasumber - Ahli Strategi', title: 'LIVE SPECIAL', teamA: 'TIM A', teamB: 'TIM B', scoreA: '2', scoreB: '1' });
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; mode: 'move' | ResizeHandle | 'rotate'; startX: number; startY: number; orig: DesignerLayer; cw: number; ch: number; sx0?: number; sy0?: number; bw0?: number; bh0?: number } | null>(null);
  // Ukuran teks terukur (auto-size ala OBS) per layer - untuk hit-box & overlay.
  const [textSizes, setTextSizes] = useState<Record<string, { w: number; h: number }>>({});
  const handleLayerSize = useCallback((lid: string, w: number, h: number) => {
    setTextSizes((prev) => {
      const p = prev[lid];
      if (p && p.w === w && p.h === h) return prev;
      return { ...prev, [lid]: { w, h } };
    });
  }, []);
  // Garis snap tengah canvas (ala OBS) saat drag.
  const [snap, setSnap] = useState({ v: false, h: false });

  useEffect(() => {
    if (!id) return;
    const d = loadDoc(id);
    if (d) {
      setDoc(d);
      setSelectedId(d.layers[0]?.id ?? null);
      setScrub(0);
      setPlaying(false);
      // Reset history tiap ganti dokumen.
      pastRef.current = [];
      futureRef.current = [];
      lastSnapRef.current = null;
      setHistVer((v) => v + 1);
    }
  }, [id]);

  useEffect(() => {
    if (doc) saveDoc(doc);
  }, [doc]);

  // Playback ala AE: rAF memajukan seeker, canvas + playhead jalan bareng.
  // Stage TIDAK remount tiap frame (key stabil saat playing) sehingga
  // animasi masuk CSS jalan natural + keyframes dievaluasi live.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      let done = false;
      setScrub((s) => {
        const n = s + dt;
        if (n >= windowSecsRef.current) {
          done = true;
          return windowSecsRef.current;
        }
        return Math.round(n * 100) / 100;
      });
      if (done) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    setScrub(0);
    setPlaying(true);
    setPlayKey((k) => k + 1);
  };

  // Spasi = play/pause, Delete = hapus diamond terpilih, Ctrl+D = duplikat layer,
  // Esc = tutup menu / deselect (kecuali sedang mengetik).
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName ?? '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el?.isContentEditable ?? false)) return;
      if (e.key === 'Escape') {
        if (openMenu) setOpenMenu(null);
        else clearSelection();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (selIds.length > 0) {
          pushHistory();
          duplicateLayers(selIds);
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDiamond) {
        e.preventDefault();
        removeKeyframeKeepSelection(selectedDiamond.layerId, selectedDiamond.prop, selectedDiamond.keyId);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selIds.length > 0) {
          e.preventDefault();
          pushHistory();
          removeLayers(selIds);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, selectedDiamond, selectedId, openMenu]);

  const canvasW = doc?.canvasW ?? 1920;
  const canvasH = doc?.canvasH ?? 1080;
  const durationSecs = doc?.timelineSecs ?? 8;
  const maxDelay = doc?.layers.reduce((m, l) => Math.max(m, l.delay ?? 0), 0) ?? 0;
  const maxOut = doc?.layers.reduce((m, l) => (l.out != null ? Math.max(m, l.out) : m), 0) ?? 0;
  const maxKeyT = doc?.layers.reduce((m, l) => {
    const ks = Object.values(l.keyframes ?? {}).flat();
    return ks.reduce((mm, k) => Math.max(mm, k.t), m);
  }, 0) ?? 0;
  const windowSecs = Math.max(durationSecs, Math.ceil(maxDelay + 1), Math.ceil(maxOut + 1), Math.ceil(maxKeyT + 1));
  const windowSecsRef = useRef(windowSecs);
  windowSecsRef.current = windowSecs;
  const scrubRef = useRef(scrub);
  scrubRef.current = scrub;
  const docRef = useRef<DesignerDoc | null>(null);
  docRef.current = doc;

  // ---- Undo/Redo ----
  // Model: snapshot SELURUH doc (layers + canvas + timeline) per aksi.
  // pushHistory() dipanggil di titik commit: awal tiap drag gesture,
  // aksi diskrit, dan focus pertama ke kontrol (ditangkap di root).
  // Guard perbandingan referensi bikin pemanggilan ganda jadi no-op.
  const HIST_CAP = 50;
  const pastRef = useRef<DesignerDoc[]>([]);
  const futureRef = useRef<DesignerDoc[]>([]);
  const lastSnapRef = useRef<DesignerDoc | null>(null);
  const [histVer, setHistVer] = useState(0);
  const snapshotDoc = (d: DesignerDoc): DesignerDoc => JSON.parse(JSON.stringify(d)) as DesignerDoc;
  const pushHistory = () => {
    const cur = docRef.current;
    if (!cur || cur === lastSnapRef.current) return;
    pastRef.current.push(snapshotDoc(cur));
    if (pastRef.current.length > HIST_CAP) pastRef.current.shift();
    futureRef.current = [];
    lastSnapRef.current = cur;
    setHistVer((v) => v + 1);
  };
  const reconcileSelection = (d: DesignerDoc) => {
    if (selectedId && !d.layers.some((l) => l.id === selectedId)) setSelectedId(null);
    setExtraIds((prev) => {
      const kept = prev.filter((x) => d.layers.some((l) => l.id === x));
      return kept.length === prev.length ? prev : kept;
    });
    setSelectedDiamond((prev) => {
      if (!prev) return prev;
      const keys = d.layers.find((l) => l.id === prev.layerId)?.keyframes?.[prev.prop] ?? [];
      return keys.some((k) => k.id === prev.keyId) ? prev : null;
    });
  };
  const undo = () => {
    const cur = docRef.current;
    if (!cur || pastRef.current.length === 0) return;
    futureRef.current.push(snapshotDoc(cur));
    const prev = pastRef.current.pop()!;
    lastSnapRef.current = prev;
    setDoc(prev);
    reconcileSelection(prev);
    setHistVer((v) => v + 1);
  };
  const redo = () => {
    const cur = docRef.current;
    if (!cur || futureRef.current.length === 0) return;
    pastRef.current.push(snapshotDoc(cur));
    const next = futureRef.current.pop()!;
    lastSnapRef.current = next;
    setDoc(next);
    reconcileSelection(next);
    setHistVer((v) => v + 1);
  };
  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;
  // Hash timing: perubahan delay / anim / visible / keyframes me-remount stage
  // supaya preview canvas selalu sesuai timeline di posisi seeker saat ini.
  // Perubahan geometri (x/y/w/h) & teks TIDAK masuk hash biar drag/edit tidak restart animasi.
  const timingHash = useMemo(
    () => doc?.layers.map((l) => `${l.id}:${l.delay ?? 0}:${l.animIn}:${l.animOut}:${l.visible}:${l.out ?? '∞'}:${JSON.stringify(l.keyframes ?? null)}`).join('|') ?? '',
    [doc]
  );
  const selected = useMemo(() => doc?.layers.find((l) => l.id === selectedId) ?? null, [doc, selectedId]);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  // Tinggi panel timeline (px) - bisa di-resize via splitter, tersimpan lokal.
  const [timelineH, setTimelineH] = useState(() => {
    if (typeof window === 'undefined') return 300;
    const v = parseInt(localStorage.getItem('designer-timeline-h') ?? '', 10);
    return isNaN(v) ? 300 : Math.max(140, Math.min(800, v));
  });
  useEffect(() => {
    try {
      localStorage.setItem('designer-timeline-h', String(timelineH));
    } catch {}
  }, [timelineH]);
  // Opsi tampilan canvas (menu View) - tersimpan lokal.
  const [viewOpts, setViewOpts] = useState(() => {
    const d = { dots: true, grid: true, snap: true };
    try {
      const raw = localStorage.getItem('designer-view');
      if (raw) return { ...d, ...(JSON.parse(raw) as Partial<typeof d>) };
    } catch {}
    return d;
  });
  useEffect(() => {
    try {
      localStorage.setItem('designer-view', JSON.stringify(viewOpts));
    } catch {}
  }, [viewOpts]);
  const fileRef = useRef<HTMLInputElement>(null);
  const psdFileRef = useRef<HTMLInputElement>(null);
  const [psdFile, setPsdFile] = useState<File | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ layers: DesignerLayer[]; canvasW?: number; canvasH?: number } | null>(null);
  // Zoom canvas independen dari ukuran section (default 50%, tersimpan lokal).
  // 'fit' = ikuti ruang tersisa (opsional, bukan default).
  const ZOOM_STEPS = [25, 50, 75, 100];
  const [zoom, setZoom] = useState<number | 'fit'>(() => {
    if (typeof window === 'undefined') return 50;
    const raw = localStorage.getItem('designer-zoom') ?? '';
    if (raw === 'fit') return 'fit';
    const n = parseInt(raw, 10);
    return ZOOM_STEPS.includes(n) ? n : 50;
  });
  useEffect(() => {
    try {
      localStorage.setItem('designer-zoom', String(zoom));
    } catch {}
  }, [zoom]);
  const zoomStep = (dir: 1 | -1) => {
    const cur = zoom === 'fit' ? 100 : zoom;
    const next = dir === 1 ? ZOOM_STEPS.find((z) => z > cur) : [...ZOOM_STEPS].reverse().find((z) => z < cur);
    if (next !== undefined) setZoom(next);
  };
  // Mode 'fit' (opsional): canvas mengikuti ruang tersisa, diukur via ResizeObserver.
  // Mode persen: ukuran canvas fix = resolusi × zoom, area yang scroll.
  const fitRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = fitRef.current;
    if (!el || zoom !== 'fit') return;
    const compute = () => {
      if (window.innerWidth < 1024) {
        setFit((p) => (p.w === 0 && p.h === 0 ? p : { w: 0, h: 0 }));
        return;
      }
      const r = el.getBoundingClientRect();
      const ar = canvasW / canvasH;
      const availW = Math.max(0, r.width - 24);
      const availH = Math.max(0, r.height - 24);
      const w = Math.max(50, Math.floor(Math.min(availW, availH * ar)));
      const h = Math.max(50, Math.floor(Math.min(availH, availW / ar)));
      setFit((p) => (p.w === w && p.h === h ? p : { w, h }));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [canvasW, canvasH, zoom]);
  // Ukuran tampil + skala konten: isi SELALU di-render pada resolusi desain
  // (font/border presisi px), lalu sekotak-kotaknya di-scale via transform.
  // Hasilnya konten ikut mengecil/membesar proporsional di semua level zoom -
  // sama seperti output OBS yang me-render 1:1 lalu di-scale.
  const dispW = zoom === 'fit' ? fit.w : Math.max(50, Math.round(canvasW * (zoom / 100)));
  const contentScale = dispW > 0 ? dispW / canvasW : 0;
  const dispH = contentScale > 0 ? Math.max(50, Math.round(canvasH * contentScale)) : 0;
  const canvasBg = viewOpts.dots
    ? {
        background: '#000',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }
    : { background: '#000' };
  const canvasOuterStyle: React.CSSProperties =
    dispW > 0
      ? { ...canvasBg, width: dispW, height: dispH }
      : { ...canvasBg, width: '100%', aspectRatio: `${canvasW} / ${canvasH}` };
  const canvasInnerStyle: React.CSSProperties = {
    position: 'relative',
    width: canvasW,
    height: canvasH,
    transform: contentScale > 0 ? `scale(${contentScale})` : undefined,
    transformOrigin: 'top left',
  };
  const obsUrl = doc ? buildDisplayUrl(origin, doc, { withLayers: true }) : '';
  const previewUrl = doc ? `/designer/display?designId=${doc.id}&simulate=1&cw=${doc.canvasW}&ch=${doc.canvasH}&layers=${encodeURIComponent(JSON.stringify(doc.layers))}` : '';

  const patchDoc = (fn: (d: DesignerDoc) => DesignerDoc) => setDoc((d) => (d ? fn(d) : d));
  const patchLayer = (lid: string, patch: Partial<DesignerLayer> | ((l: DesignerLayer) => DesignerLayer)) => {
    patchDoc((d) => ({
      ...d,
      layers: d.layers.map((l) => {
        if (l.id !== lid) return l;
        const next = typeof patch === 'function' ? (patch as (l: DesignerLayer) => DesignerLayer)(l) : { ...l, ...patch };
        return next;
      }),
    }));
  };
  const patchProps = (lid: string, props: Record<string, unknown>) => {
    patchLayer(lid, (l) => ({ ...l, props: { ...l.props, ...props } }));
  };

  // Keyframe: catat nilai properti saat ini di detik seeker (semua kind prop).
  const handleAddKey = (lid: string, prop: KeyProp) => {
    const layer = doc?.layers.find((l) => l.id === lid);
    if (!layer) return;
    pushHistory();
    patchLayer(lid, (l) => ({ ...l, keyframes: setKeyframe(l.keyframes, prop, scrubRef.current, currentPropValue(l, prop, scrubRef.current)) }));
  };

  const handleToggleWatch = (lid: string, prop: KeyProp) => {
    pushHistory();
    patchLayer(lid, (l) => ({ ...l, keyframes: toggleWatch(l.keyframes, prop) }));
  };

  // Tulis nilai base - atau keyframe di detik seeker bila stopwatch prop-nya nyala.
  // keyValue = nilai BARU (untuk pair, panggil dengan komponen lain dari nilai kini).
  const recordProp = (lid: string, prop: KeyProp, basePatch: Record<string, unknown>, keyValue: KeyframeValue) => {
    patchLayer(lid, (l) => {
      if (l.keyframes?.[prop] !== undefined) {
        return { ...l, keyframes: setKeyframe(l.keyframes, prop, scrubRef.current, keyValue) };
      }
      return { ...l, props: { ...l.props, ...basePatch } };
    });
  };

  const handleDiamondJump = (lid: string, _prop: KeyProp, t: number, keyId: string) => {
    setPlaying(false);
    setSelectedId(lid);
    setExtraIds([]);
    setSelectedDiamond({ layerId: lid, prop: _prop, keyId });
    setScrub(t);
  };

  // Hapus keyframe TAPI seleksi pindah ke keyframe terdekat yang tersisa
  // (di properti yang sama) supaya panel ease tidak hilang begitu saja.
  // Hanya jadi null kalau sudah tidak ada keyframe tersisa.
  const removeKeyframeKeepSelection = (lid: string, prop: KeyProp, keyId: string) => {
    pushHistory();
    const layer = docRef.current?.layers.find((l) => l.id === lid);
    const doomed = layer?.keyframes?.[prop]?.find((k) => k.id === keyId);
    const rest = (layer?.keyframes?.[prop] ?? []).filter((k) => k.id !== keyId);
    patchLayer(lid, (l) => ({ ...l, keyframes: removeKeyframe(l.keyframes, prop, keyId) }));
    if (doomed && rest.length > 0) {
      const nearest = rest.reduce((a, b) => (Math.abs(b.t - doomed.t) < Math.abs(a.t - doomed.t) ? b : a));
      setSelectedDiamond({ layerId: lid, prop, keyId: nearest.id });
    } else {
      setSelectedDiamond(null);
    }
  };

  const handleDiamondDelete = (lid: string, prop: KeyProp, keyId: string) => {
    removeKeyframeKeepSelection(lid, prop, keyId);
  };

  const handleKeyframeMove = (lid: string, prop: KeyProp, keyId: string, t: number) => {
    patchLayer(lid, (l) => ({ ...l, keyframes: moveKeyframe(l.keyframes, prop, keyId, t) }));
  };

  // Dipanggil sekali saat drop selesai: gabungkan key yang menempel (<0.04s).
  const handleKeyframeCommit = (lid: string, prop: KeyProp, keyId: string) => {
    patchLayer(lid, (l) => ({ ...l, keyframes: mergeKeysAt(l.keyframes, prop, keyId) }));
  };

  // Edit dari graph: pindah waktu + ubah nilai sekaligus (drag titik 2 arah).
  const handleGraphEdit = (lid: string, prop: KeyProp, keyId: string, t: number, v: KeyframeValue) => {
    patchLayer(lid, (l) => ({ ...l, keyframes: updateKeyframe(moveKeyframe(l.keyframes, prop, keyId, t), prop, keyId, { v }) }));
  };

  const setCanvasSize = (w: number, h: number) => {
    patchDoc((d) => ({ ...d, canvasW: clampCanvas(w, 320, 7680), canvasH: clampCanvas(h, 320, 4320) }));
  };

  const addLayer = (type: DesignerLayer['type']) => {
    if (!doc) return;
    pushHistory();
    const z = nextZ(doc.layers);
    const cx = Math.round(canvasW / 2);
    const cy = Math.round(canvasH / 2);
    let layer: DesignerLayer;
    if (type === 'text') layer = { ...newTextLayer(z), id: uid('layer'), x: cx - 260, y: cy - 45 };
    else if (type === 'shape') layer = { ...newShapeLayer(z), id: uid('layer'), x: cx - 200, y: cy - 80 };
    else if (type === 'image') layer = { ...newImageLayer(z), id: uid('layer'), x: cx - 160, y: cy - 120 };
    else if (type === 'ticker') {
      layer = { ...newTextLayer(z), id: uid('layer'), name: 'Ticker baru', type: 'ticker', x: 40, y: canvasH - 90, w: canvasW - 80, h: 70, props: { text: 'Teks berjalan • {{message}}', fontFamily: 'Outfit', fontSize: 40, fontWeight: 700, color: '#ffffff', align: 'left', speed: 22 } };
    } else {
      layer = { ...newTextLayer(z), id: uid('layer'), name: 'Jam baru', type: 'clock', x: canvasW - 320, y: 80, w: 240, h: 60, props: { fontFamily: 'JetBrains Mono', fontSize: 34, fontWeight: 700, color: '#ffffff', align: 'right', showSeconds: true } };
    }
    patchDoc((d) => ({ ...d, layers: [...d.layers, layer] }));
    setSelectedId(layer.id);
    setExtraIds([]);
  };

  const handleTool = (toolId: string) => {
    setActiveTool(toolId);
    if (toolId === 'select') {
      clearSelection();
      return;
    }
    addLayer(toolId as DesignerLayer['type']);
    setActiveTool('select');
  };

  const removeLayers = (ids: string[]) => {
    if (ids.length === 0) return;
    pushHistory();
    const gone = new Set(ids);
    patchDoc((d) => ({ ...d, layers: d.layers.filter((l) => !gone.has(l.id)) }));
    const restExtra = extraIds.filter((x) => !gone.has(x));
    if (selectedId && gone.has(selectedId)) {
      // Primary ikut terhapus → promosikan sisa pertama agar tak ada seleksi yatim.
      const [next, ...rest] = restExtra;
      setSelectedId(next ?? null);
      setExtraIds(rest);
    } else {
      setExtraIds(restExtra);
    }
  };
  const removeLayer = (lid: string) => removeLayers([lid]);

  const moveZ = (lid: string, dir: 1 | -1) => {
  const d0 = docRef.current;
  if (!d0) return;
  const arr0 = [...d0.layers].sort((a, b) => a.zIndex - b.zIndex);
  const i0 = arr0.findIndex((l) => l.id === lid);
  if (i0 < 0 || i0 + dir < 0 || i0 + dir >= arr0.length) return;
  pushHistory();
  patchDoc((d) => {
      const arr = [...d.layers].sort((a, b) => a.zIndex - b.zIndex);
      const i = arr.findIndex((l) => l.id === lid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return d;
      const zi = arr[i].zIndex;
      arr[i] = { ...arr[i], zIndex: arr[j].zIndex };
      arr[j] = { ...arr[j], zIndex: zi };
      return { ...d, layers: arr };
    });
  };

  // Drag-and-drop susun ulang dari timeline (atas = z terbesar, ala Photoshop):
  // pindah layer ke posisi target, lalu normalisasi zIndex mengikuti urutan tampil.
  const handleReorder = (dragId: string, targetId: string) => {
    if (dragId === targetId) return;
    pushHistory();
    patchDoc((d) => {
      const arr = [...d.layers].sort((a, b) => b.zIndex - a.zIndex);
      const from = arr.findIndex((l) => l.id === dragId);
      const to = arr.findIndex((l) => l.id === targetId);
      if (from < 0 || to < 0) return d;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return { ...d, layers: arr.map((l, i) => ({ ...l, zIndex: arr.length - i })) };
    });
  };

  // Util drag mouse generik (move / handle / rotate).
  const trackMouse = (onMove: (ev: MouseEvent) => void) => {
    const onUp = () => {
      dragRef.current = null;
      setSnap({ v: false, h: false });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Drag pindah ala OBS: mulai dari posisi keyframe saat ini + snap ke tengah canvas.
  // Ctrl/Cmd/Shift+klik = toggle multi-select (tanpa drag).
  // Tanpa modifier: drag SEMUA layer terpilih bareng; snap dihitung dari primary.
  const onLayerMouseDown = (e: React.MouseEvent, layer: DesignerLayer) => {
    if (layer.locked) return;
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      toggleSelect(layer.id);
      return;
    }
    const ids = selSet.has(layer.id) ? selIds : [layer.id];
    if (!selSet.has(layer.id)) {
      setSelectedId(layer.id);
      setExtraIds([]);
    }
    const items = ids
      .map((id) => {
        const l = docRef.current?.layers.find((x) => x.id === id);
        if (!l || l.locked) return null;
        const rb = renderedBox(l, scrubRef.current, textSizes[l.id] ?? null);
        const st = evalLayerAt(l, scrubRef.current);
        return { id, sx0: rb.x, sy0: rb.y, bw0: rb.w, bh0: rb.h, adx0: rb.x - st.x };
      })
      .filter((x): x is { id: string; sx0: number; sy0: number; bw0: number; bh0: number; adx0: number } => !!x);
    if (items.length === 0) return;
    pushHistory(); // satu undo-step untuk seluruh gesture drag
    const primary = items[0];
    dragRef.current = { id: primary.id, mode: 'move', startX: e.clientX, startY: e.clientY, orig: { ...layer }, cw: canvasW, ch: canvasH, sx0: primary.sx0, sy0: primary.sy0, bw0: primary.bw0, bh0: primary.bh0 };
    trackMouse((ev) => {
      const dr = dragRef.current;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!dr || !rect || dr.mode !== 'move') return;
      const dx = (ev.clientX - dr.startX) * (dr.cw / rect.width);
      const dy = (ev.clientY - dr.startY) * (dr.ch / rect.height);
      const bw = dr.bw0 ?? dr.orig.w;
      const bh = dr.bh0 ?? dr.orig.h;
      let nx = Math.round(Math.max(0, Math.min(dr.cw - bw, (dr.sx0 ?? dr.orig.x) + dx)));
      let ny = Math.round(Math.max(0, Math.min(dr.ch - bh, (dr.sy0 ?? dr.orig.y) + dy)));
      // Snap tengah (ala OBS, bisa dimatikan via View), toleransi 8px desain.
      const sv = viewOpts.snap && Math.abs(nx + bw / 2 - dr.cw / 2) < 8;
      const sh = viewOpts.snap && Math.abs(ny + bh / 2 - dr.ch / 2) < 8;
      if (sv) nx = Math.round(dr.cw / 2 - bw / 2);
      if (sh) ny = Math.round(dr.ch / 2 - bh / 2);
      setSnap({ v: sv, h: sh });
      const ddx = nx - (dr.sx0 ?? 0);
      const ddy = ny - (dr.sy0 ?? 0);
      for (const it of items) {
        const px = Math.round(it.sx0 + ddx);
        const py = Math.round(it.sy0 + ddy);
        patchLayer(it.id, (l) => {
          // Stopwatch position nyala (ala AE) → drag MENCATAT keyframe di detik seeker.
          // Mati → geser nilai base seperti biasa. Kurangi offset anchor teks auto.
          if (l.keyframes?.position !== undefined) {
            return { ...l, keyframes: setKeyframe(l.keyframes, 'position', scrubRef.current, [px - it.adx0, py]) };
          }
          return { ...l, x: px - it.adx0, y: py };
        });
      }
    });
  };

  // Resize via 8 handle ala OBS (sudut = 2 sumbu, tepi = 1 sumbu).
  // Jalan dalam FRAME LOKAL box (origin = kiri-atas rendered, sumbu = sumbu box),
  // jadi tetap benar saat layer di-rotate. Anchor = sisi lawan, diam di tempat.
  const onHandleDown = (e: React.MouseEvent, layer: DesignerLayer, h: ResizeHandle) => {
    if (layer.locked) return;
    e.stopPropagation();
    setSelectedId(layer.id);
    pushHistory(); // satu undo-step untuk seluruh gesture resize
    const rb = renderedBox(layer, scrubRef.current, textSizes[layer.id] ?? null);
    const rad = (rb.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    dragRef.current = { id: layer.id, mode: h, startX: e.clientX, startY: e.clientY, orig: { ...layer }, cw: canvasW, ch: canvasH };
    const west = h === 'nw' || h === 'w' || h === 'sw';
    const east = h === 'ne' || h === 'e' || h === 'se';
    const north = h === 'nw' || h === 'n' || h === 'ne';
    const south = h === 'sw' || h === 's' || h === 'se';
    trackMouse((ev) => {
      const dr = dragRef.current;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!dr || !rect) return;
      // Delta mouse (px desain) diputar ke frame lokal box.
      const dx = (ev.clientX - dr.startX) * (dr.cw / rect.width);
      const dy = (ev.clientY - dr.startY) * (dr.ch / rect.height);
      const lx = dx * cos + dy * sin;
      const ly = -dx * sin + dy * cos;
      const o = dr.orig;
      if (isAutoTextLayer(o)) {
        // Teks auto-size: extend = scale font (ala OBS), proporsional sumbu handle.
        let f: number | null = null;
        if (east) f = (rb.w + lx) / Math.max(1, rb.w);
        else if (west) f = (rb.w - lx) / Math.max(1, rb.w);
        else if (south) f = (rb.h + ly) / Math.max(1, rb.h);
        else if (north) f = (rb.h - ly) / Math.max(1, rb.h);
        if (f != null && isFinite(f)) {
          const nfs = Math.max(8, Math.round((o.props.fontSize ?? 40) * Math.max(0.1, f)));
          patchLayer(dr.id, (l) => {
            if (l.keyframes?.fontSize !== undefined) {
              return { ...l, keyframes: setKeyframe(l.keyframes, 'fontSize', scrubRef.current, nfs) };
            }
            return { ...l, props: { ...l.props, fontSize: nfs } };
          });
        }
        return;
      }
      const min = 20;
      let nxl = 0;
      let nyl = 0;
      let nw = rb.w;
      let nh = rb.h;
      if (west) {
        nxl = Math.max(-rb.x, Math.min(lx, rb.w - min));
        nw = rb.w - nxl;
      }
      if (east) nw = Math.max(min, rb.w + lx);
      if (north) {
        nyl = Math.max(-rb.y, Math.min(ly, rb.h - min));
        nh = rb.h - nyl;
      }
      if (south) nh = Math.max(min, rb.h + ly);
      // Kembali ke koordinat desain: origin lokal diputar ke frame canvas.
      const nx = rb.x + nxl * cos - nyl * sin;
      const ny = rb.y + nxl * sin + nyl * cos;
      const rx = Math.round(nx);
      const ry = Math.round(ny);
      const rw = Math.round(nw);
      const rh = Math.round(nh);
      patchLayer(dr.id, (l) => {
        const next = { ...l, x: rx, y: ry, w: rw, h: rh };
        let kf = l.keyframes;
        if (kf?.position !== undefined && (west || north)) {
          kf = setKeyframe(kf, 'position', scrubRef.current, [rx, ry]);
        }
        if (kf?.size !== undefined) {
          kf = setKeyframe(kf, 'size', scrubRef.current, [rw, rh]);
        }
        return kf === l.keyframes ? next : { ...next, keyframes: kf };
      });
    });
  };

  // Rotate via lingkaran di atas box ala OBS (tahan Shift = snap 15°).
  // Titik putar = tengah box tampil (termasuk size keys & auto text).
  const onRotateDown = (e: React.MouseEvent, layer: DesignerLayer) => {
    if (layer.locked) return;
    e.stopPropagation();
    setSelectedId(layer.id);
    pushHistory(); // satu undo-step untuk seluruh gesture rotate
    const rb = renderedBox(layer, scrubRef.current, textSizes[layer.id] ?? null);
    dragRef.current = { id: layer.id, mode: 'rotate', startX: 0, startY: 0, orig: { ...layer }, cw: canvasW, ch: canvasH };
    trackMouse((ev) => {
      const dr = dragRef.current;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!dr || !rect) return;
      const cx = rect.left + ((rb.x + rb.w / 2) / dr.cw) * rect.width;
      const cy = rect.top + ((rb.y + rb.h / 2) / dr.ch) * rect.height;
      const ang = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI;
      let rot = (((ang + 90) % 360) + 360) % 360;
      rot = ev.shiftKey ? Math.round(rot / 15) * 15 : Math.round(rot * 10) / 10;
      patchLayer(dr.id, (l) => {
        if (l.keyframes?.rotation !== undefined) {
          return { ...l, keyframes: setKeyframe(l.keyframes, 'rotation', scrubRef.current, rot) };
        }
        return { ...l, rotation: rot };
      });
    });
  };

  const handleImageFile = async (file: File) => {
    if (!selected) return;
    if (file.size > 1_800_000) {
      gooeyToast.warning('Image >1.8MB tidak disarankan (localStorage penuh & URL OBS panjang). Kompres dulu.');
    }
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    patchProps(selected.id, { src: dataUrl });
  };

  const copyObsUrl = () => {
    if (!obsUrl) return;
    navigator.clipboard.writeText(obsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Duplikat semua layer terpilih sekaligus; hasil copy jadi seleksi baru.
  const duplicateLayers = (ids: string[]) => {
    const d = docRef.current;
    if (!d || ids.length === 0) return;
    const copies: DesignerLayer[] = [];
    let z = nextZ(d.layers);
    for (const lid of ids) {
      const src = d.layers.find((l) => l.id === lid);
      if (!src) continue;
      copies.push({
        ...src,
        id: uid('layer'),
        name: `${src.name} copy`,
        x: src.x + 24,
        y: src.y + 24,
        zIndex: z++,
        props: { ...src.props },
        keyframes: src.keyframes ? (JSON.parse(JSON.stringify(src.keyframes)) as DesignerLayer['keyframes']) : undefined,
      });
    }
    if (copies.length === 0) return;
    pushHistory();
    patchDoc((prev) => ({ ...prev, layers: [...prev.layers, ...copies] }));
    setSelectedId(copies[0].id);
    setExtraIds(copies.slice(1).map((c) => c.id));
  };

  const exportJSON = () => {
    if (!doc) return;
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${((doc.name || 'design').replace(/[^\w\- ]+/g, '').trim() || 'design')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setOpenMenu(null);
  };

  const importJSONFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const layers = (Array.isArray(parsed) ? parsed : (parsed as { layers?: unknown }).layers) as DesignerLayer[] | undefined;
      if (!Array.isArray(layers) || layers.length === 0 || !layers.every((l) => l && typeof (l as DesignerLayer).type === 'string')) {
        throw new Error('invalid');
      }
      const full = (Array.isArray(parsed) ? {} : parsed) as { canvasW?: unknown; canvasH?: unknown };
      setPendingImport({
        layers,
        canvasW: typeof full.canvasW === 'number' ? clampCanvas(full.canvasW, 320, 7680) : undefined,
        canvasH: typeof full.canvasH === 'number' ? clampCanvas(full.canvasH, 320, 4320) : undefined,
      });
      setShowImportConfirm(true);
    } catch {
      gooeyToast.error('File JSON tidak valid untuk designer.');
    }
    setOpenMenu(null);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    pushHistory();
    patchDoc((d) => ({
      ...d,
      layers: pendingImport.layers.map((l) => ({ ...l, id: uid('layer') })),
      canvasW: pendingImport.canvasW ?? d.canvasW,
      canvasH: pendingImport.canvasH ?? d.canvasH,
    }));
    setSelectedId(null);
    setExtraIds([]);
    setPendingImport(null);
  };

  if (!doc) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="font-black">Desain tidak ditemukan</div>
          <Link href="/designer" className="text-gray-300 text-sm underline">Kembali ke list</Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen lg:h-screen bg-[#0a0a0a] text-white flex flex-col lg:overflow-hidden"
      // Tangkap fokus pertama ke kontrol mana pun sebagai titik commit:
      // mutasi berikutnya tercatat sebagai satu undo-step. Guard di
      // pushHistory bikin ini no-op bila belum ada mutasi.
      onFocusCapture={() => pushHistory()}
    >
      <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center gap-2 px-3 shrink-0">
        <Link href="/designer" className="p-1.5 text-gray-400 hover:text-white"><FaArrowLeft className="w-4 h-4" /></Link>
        <input
          value={doc.name}
          onChange={(e) => patchDoc((d) => ({ ...d, name: e.target.value }))}
          className="bg-transparent font-black text-sm w-48 outline-none border-b border-transparent focus:border-white"
        />
        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded whitespace-nowrap">{canvasW}×{canvasH} • {doc.layers.length} layers</span>
        <div className="ml-auto flex items-center gap-2">
          <Link href={previewUrl} target="_blank" className="flex items-center gap-1.5 text-[11px] font-black bg-white/10 px-3 py-2 rounded-lg"><FaEye className="w-3.5 h-3.5" /> Preview</Link>
          <button
            onClick={copyObsUrl}
            className="flex items-center gap-1.5 text-[11px] font-black bg-white text-black px-3 py-2 rounded-lg"
          >
            {copied ? <FaCheck className="w-3.5 h-3.5" /> : <FaCopy className="w-3.5 h-3.5" />} {copied ? 'Copied!' : 'Copy OBS URL'}
          </button>
        </div>
      </header>

      {/* Menu bar ala aplikasi desktop */}
      <div className="h-9 shrink-0 bg-[#0d0d0d] border-b border-white/5 flex items-center gap-0.5 px-2 text-[12px] relative z-40">
        {(['File', 'Edit', 'View'] as const).map((m) => (
          <div key={m} className="relative shrink-0">
            <button
              onClick={() => setOpenMenu((o) => (o === m ? null : m))}
              onMouseEnter={() => {
                if (openMenu) setOpenMenu(m);
              }}
              className={`px-3 py-1.5 rounded-md ${openMenu === m ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'}`}
            >
              {m}
            </button>
            {openMenu === m && (
              <div className="absolute left-0 top-full mt-1 w-60 bg-[#161616] border border-white/10 rounded-lg shadow-2xl py-1 z-50">
                {m === 'File' && (
                  <>
                    <MenuItem label="New Title…" onClick={() => { setOpenMenu(null); router.push('/designer'); }} />
                    <MenuSep />
                    <MenuItem label="Copy OBS URL" shortcut="URL+layers" onClick={() => { copyObsUrl(); setOpenMenu(null); }} />
                    <MenuItem label="Open Preview" onClick={() => { setOpenMenu(null); if (previewUrl) window.open(previewUrl, '_blank'); }} />
                    <MenuSep />
                    <MenuItem label="Export JSON…" onClick={exportJSON} />
                    <MenuItem label="Import JSON…" onClick={() => { setOpenMenu(null); fileRef.current?.click(); }} />
                    <MenuItem label="Import PSD…" onClick={() => { setOpenMenu(null); psdFileRef.current?.click(); }} />
                  </>
                )}
                {m === 'Edit' && (
                  <>
                    <MenuItem label="Undo" shortcut="Ctrl+Z" disabled={!canUndo} onClick={() => { undo(); setOpenMenu(null); }} />
                    <MenuItem label="Redo" shortcut="Ctrl+Shift+Z" disabled={!canRedo} onClick={() => { redo(); setOpenMenu(null); }} />
                    <MenuSep />
                    <MenuItem label="Duplicate Layer" shortcut="Ctrl+D" disabled={!selected} onClick={() => { if (selIds.length > 0) { pushHistory(); duplicateLayers(selIds); } setOpenMenu(null); }} />
                    <MenuItem label="Delete Layer" shortcut="Del" danger disabled={!selected} onClick={() => { if (selIds.length > 0) { pushHistory(); removeLayers(selIds); } setOpenMenu(null); }} />
                    <MenuSep />
                    <MenuItem label="Deselect" shortcut="Esc" disabled={!selected} onClick={() => { clearSelection(); setOpenMenu(null); }} />
                  </>
                )}
                {m === 'View' && (
                  <>
                    <MenuItem label="Titik-titik canvas" checked={viewOpts.dots} onClick={() => setViewOpts((v) => ({ ...v, dots: !v.dots }))} />
                    <MenuItem label="Grid thirds" checked={viewOpts.grid} onClick={() => setViewOpts((v) => ({ ...v, grid: !v.grid }))} />
                    <MenuItem label="Snap tengah" checked={viewOpts.snap} onClick={() => setViewOpts((v) => ({ ...v, snap: !v.snap }))} />
                    <MenuSep />
                    {ZOOM_STEPS.map((z) => (
                      <MenuItem key={z} label={`Zoom ${z}%`} checked={zoom === z} onClick={() => { setZoom(z); setOpenMenu(null); }} />
                    ))}
                    <MenuItem label="Zoom Fit" checked={zoom === 'fit'} onClick={() => { setZoom('fit'); setOpenMenu(null); }} />
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {openMenu && <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) importJSONFile(f);
        }}
      />
      <input
        ref={psdFileRef}
        type="file"
        accept=".psd,.psb"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) setPsdFile(f);
        }}
      />
      <PsdImportDialog
        file={psdFile}
        doneLabel="Tambahkan ke Canvas"
        onClose={() => setPsdFile(null)}
        onDone={(res) => {
          setPsdFile(null);
          setOpenMenu(null);
          pushHistory();
          patchDoc((d) => {
            const maxZ = d.layers.reduce((m, l) => Math.max(m, l.zIndex), 0);
            return { ...d, layers: [...d.layers, ...res.layers.map((l, i) => ({ ...l, zIndex: maxZ + i + 1 }))] };
          });
        }}
      />

      <div className="flex-1 grid lg:grid-cols-[60px_1fr_330px] min-h-0 lg:overflow-hidden">
        {/* Toolbar kiri ala Photoshop: hanya tool tambah layer */}
        <aside className="bg-[#121212] border-r border-white/5 py-3 flex lg:flex-col items-center gap-1.5 overflow-x-auto lg:overflow-y-auto custom-scrollbar max-h-[calc(100vh-56px)] lg:max-h-none lg:h-full">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTool(t.id)}
              title={t.id === 'select' ? 'Select / Move' : `Tambah ${t.label}`}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-colors ${
                activeTool === t.id ? 'bg-white/15 border-white/50 text-white' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <t.icon className="w-[18px] h-[18px]" />
              <span className="text-[8px] font-black uppercase leading-none">{t.label}</span>
            </button>
          ))}
        </aside>

        {/* Canvas (ukuran fix dari zoom, area yang scroll) + splitter + timeline */}
        <main className="bg-[#0a0a0a] min-h-0 flex flex-col lg:h-full lg:overflow-hidden" onClick={() => clearSelection()}>
          <div ref={fitRef} className="p-4 lg:p-3 lg:flex-1 lg:min-h-0 overflow-auto custom-scrollbar flex">
            <div
              ref={canvasRef}
              className="relative rounded-xl overflow-hidden border border-white/10 m-auto shrink-0"
              style={canvasOuterStyle}
              onClick={(e) => e.stopPropagation()}
            >
              {viewOpts.grid && (
                <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '33.33% 33.33%' }} />
              )}
              {/* Isi di-render pada resolusi desain lalu di-scale → font/border ikut resize */}
              <div style={canvasInnerStyle}>
              <div key={playing ? `play-${playKey}-${timingHash}` : `scrub-${scrub}-${timingHash}`} className="absolute inset-0">
                <DesignerStage layers={doc.layers} data={dataVars} selectedId={null} canvasW={canvasW} canvasH={canvasH} time={scrub} entranceOffset={playing ? 0 : scrub} onLayerSize={handleLayerSize} />
              </div>
              {doc.layers.map((l) => {
                // Hit-area transparan = box tampil aktual (posisi/size ter-evaluasi, ikut rotate).
                const hb = renderedBox(l, scrub, textSizes[l.id] ?? null);
                return (
                <div
                  key={'hit_' + l.id}
                  onMouseDown={(e2) => onLayerMouseDown(e2, l)}
                  className="absolute"
                  style={{ left: `${(hb.x / canvasW) * 100}%`, top: `${(hb.y / canvasH) * 100}%`, width: `${(hb.w / canvasW) * 100}%`, height: `${(hb.h / canvasH) * 100}%`, zIndex: l.zIndex + 1000, cursor: l.locked ? 'default' : 'move', transform: hb.rotation ? `rotate(${hb.rotation}deg)` : undefined }}
                  title={`${l.name} - drag untuk pindah${l.keyframes?.position !== undefined ? ' (stopwatch nyala: tercatat sebagai keyframe)' : ''}`}
                />
                );
              })}
              </div>
              {/* Garis snap tengah canvas (ala OBS) */}
              {selected && (snap.v || snap.h) && (
                <>
                  {snap.v && <div className="absolute top-0 bottom-0 w-px bg-white/90 pointer-events-none" style={{ left: '50%', zIndex: 5000 }} />}
                  {snap.h && <div className="absolute left-0 right-0 h-px bg-white/90 pointer-events-none" style={{ top: '50%', zIndex: 5000 }} />}
                </>
              )}
              {/* Kotak seleksi ala OBS: ikut rotate, border merah + 8 handle + rotate */}
              {selected && (() => {
                const sb = renderedBox(selected, scrub, textSizes[selected.id] ?? null);
                return (
                <div
                  className="absolute"
                  style={{
                    left: `${(sb.x / canvasW) * 100}%`,
                    top: `${(sb.y / canvasH) * 100}%`,
                    width: `${(sb.w / canvasW) * 100}%`,
                    height: `${(sb.h / canvasH) * 100}%`,
                    zIndex: selected.zIndex + 2000,
                    transform: sb.rotation ? `rotate(${sb.rotation}deg)` : undefined,
                  }}
                >
                  <div
                    className="absolute inset-0 border-2 border-white cursor-move"
                    onMouseDown={(ev) => onLayerMouseDown(ev, selected)}
                    title={`${selected.name} - drag untuk pindah`}
                  />
                  {!selected.locked && HANDLES.map((hh) => (
                    <div
                      key={hh.id}
                      onMouseDown={(ev) => onHandleDown(ev, selected, hh.id)}
                      title="Resize"
                      className="absolute w-2.5 h-2.5 bg-white border-2 border-black"
                      style={{ left: hh.x, top: hh.y, transform: 'translate(-50%, -50%)', cursor: hh.cursor }}
                    />
                  ))}
                  {!selected.locked && (
                    <div className="absolute flex flex-col items-center" style={{ left: '50%', top: 0, transform: 'translate(-50%, -100%)' }}>
                      <div
                        onMouseDown={(ev) => onRotateDown(ev, selected)}
                        title="Rotate (tahan Shift = snap 15°)"
                        className="w-3 h-3 rounded-full bg-white border-2 border-black cursor-grab"
                      />
                      <div className="w-0.5 h-4 bg-white" />
                    </div>
                  )}
                </div>
                );
              })()}
              {/* Kotak seleksi tambahan (multi-select): garis putus-putus, tanpa handle */}
              {extraIds.map((id) => {
                const l = doc?.layers.find((x) => x.id === id);
                if (!l) return null;
                const eb = renderedBox(l, scrub, textSizes[l.id] ?? null);
                return (
                  <div
                    key={'mulsel_' + id}
                    className="absolute pointer-events-none border-2 border-dashed border-white/60"
                    style={{
                      left: `${(eb.x / canvasW) * 100}%`,
                      top: `${(eb.y / canvasH) * 100}%`,
                      width: `${(eb.w / canvasW) * 100}%`,
                      height: `${(eb.h / canvasH) * 100}%`,
                      zIndex: l.zIndex + 2000,
                      transform: eb.rotation ? `rotate(${eb.rotation}deg)` : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>
          {/* Splitter: drag vertikal untuk resize tinggi timeline */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const startY = e.clientY;
              const startH = timelineH;
              const max = Math.max(260, window.innerHeight - 56 - 220);
              const onMove = (ev: MouseEvent) => {
                setTimelineH(Math.round(Math.max(140, Math.min(max, startH + (startY - ev.clientY)))));
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
            onClick={(e) => e.stopPropagation()}
            title="Drag untuk resize timeline"
            className="hidden lg:flex items-center justify-center h-2.5 shrink-0 cursor-row-resize hover:bg-white/20 transition-colors"
          >
            <div className="w-20 h-1 rounded bg-white/15" />
          </div>
          {/* Panel timeline: tinggi diatur user via splitter, scroll mandiri di dalam */}
          <div
            className="px-4 pb-4 lg:px-3 lg:pb-2 shrink-0 lg:overflow-hidden lg:h-[var(--tlh)] lg:flex lg:flex-col"
            style={{ '--tlh': `${timelineH}px` } as React.CSSProperties}
          >
            <div onClick={(e) => e.stopPropagation()} className="lg:flex-1 lg:min-h-0 lg:overflow-hidden">
              <KeyframeTimeline
                docId={doc.id}
                layers={doc.layers}
                selectedId={selectedId}
                playKey={playKey}
                playing={playing}
                scrub={scrub}
                durationSecs={durationSecs}
                windowSecs={windowSecs}
                selectedDiamond={selectedDiamond}
                onSelect={(lid) => setSelectedId(lid)}
                onToggleSelect={toggleSelect}
                multiIds={extraIds}
                onDelay={(lid, nd) => patchLayer(lid, (l) => {
                  // Geser span [in → out] - durasi tampil dipertahankan.
                  const d = nd - (l.delay ?? 0);
                  return { ...l, delay: nd, out: l.out != null ? Math.max(nd + 0.2, Math.round((l.out + d) * 10) / 10) : l.out };
                })}
                onResizeOut={(lid, out) => patchLayer(lid, (l) => ({ ...l, out }))}
                onPlay={togglePlay}
                onPlayEnd={() => setPlaying(false)}
                onScrub={(t) => {
                  setPlaying(false);
                  setScrub((prev) => (prev === t ? prev : t));
                }}
                onDuration={(secs) => patchDoc((d) => ({ ...d, timelineSecs: secs }))}
                onToggleWatch={handleToggleWatch}
                onAddKey={handleAddKey}
                onDiamondJump={handleDiamondJump}
                onDiamondDelete={handleDiamondDelete}
                onKeyframeMove={handleKeyframeMove}
                onKeyframeCommit={handleKeyframeCommit}
                onGestureStart={pushHistory}
                onToggleVisible={(lid) => { pushHistory(); patchLayer(lid, (l) => ({ ...l, visible: !l.visible })); }}
                onToggleLocked={(lid) => { pushHistory(); patchLayer(lid, (l) => ({ ...l, locked: !l.locked })); }}
                onDelete={removeLayer}
                onMoveZ={moveZ}
                onReorder={handleReorder}
                zoom={zoom}
                zoomSteps={ZOOM_STEPS}
                zoomText={zoom === 'fit' ? (dispW > 0 ? `${dispW}×${dispH} px` : 'mengikuti section') : `${dispW}×${dispH} px`}
                onZoom={setZoom}
                onZoomStep={zoomStep}
              />
            </div>
            <div className="text-[11px] text-gray-500 mt-2 shrink-0">Drag layer untuk pindah (snap tengah otomatis) • 8 kotak = resize (teks auto-size = scale font) • lingkaran atas = rotate (Shift = snap 15°) • spasi = play/pause • stopwatch nyala + geser = keyframe tercatat.</div>
          </div>
        </main>

        {/* Panel kanan: canvas + properties + data (kelola layer dari timeline) */}
        <aside className="bg-[#121212] border-l border-white/5 p-3 space-y-4 overflow-y-auto custom-scrollbar max-h-[calc(100vh-56px)]">
          <section className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Canvas</div>
            <div className="grid grid-cols-2 gap-1.5">
              {SIZE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setCanvasSize(p.w, p.h)}
                  className={`text-[11px] font-bold px-2 py-1.5 rounded-lg ${canvasW === p.w && canvasH === p.h ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <NumInput value={canvasW} min={320} max={7680} onCommit={(n) => setCanvasSize(n, canvasH)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs" />
              <span className="text-gray-500 text-xs">×</span>
              <NumInput value={canvasH} min={320} max={4320} onCommit={(n) => setCanvasSize(canvasW, n)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs" />
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Properties</div>
            {!selected ? (
              <div className="text-xs text-gray-500">Pilih layer di canvas / timeline untuk edit properti.</div>
            ) : (
              <>
                <input value={selected.name} onChange={(e) => patchLayer(selected.id, { name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-sm font-bold" />
                {extraIds.length > 0 && (
                  <div className="text-[11px] text-gray-200 bg-white/5 border border-white/15 rounded-lg px-2 py-1.5">
                    {extraIds.length + 1} layer terpilih - panel ini edit primary “{selected.name}”. Drag di canvas menggerakkan semuanya.
                  </div>
                )}
                {selected.type === 'text' && (
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selected.props.autoSize ?? true}
                      onChange={(e) => patchProps(selected.id, { autoSize: e.target.checked })}
                    />
                    Auto size - box ngepas ke teks (ala OBS)
                  </label>
                )}
                <div className="grid grid-cols-4 gap-1.5">
                  {(['x', 'y'] as const).map((k) => (
                    <label key={k} className="block">
                      <span className="text-[10px] text-gray-500 uppercase">{k}{(k === 'x' || k === 'y') && selected.keyframes?.position !== undefined ? ' ◆' : ''}</span>
                      <NumInput
                        value={Math.round(selected[k])}
                        onCommit={(n) => {
                          // Stopwatch position nyala → ketik angka = keyframe di detik seeker.
                          if ((k === 'x' || k === 'y') && selected.keyframes?.position !== undefined) {
                            const cur = evalLayerAt(selected, scrubRef.current);
                            const v: [number, number] = k === 'x' ? [n, Math.round(cur.y)] : [Math.round(cur.x), n];
                            patchLayer(selected.id, (l) => ({ ...l, keyframes: setKeyframe(l.keyframes, 'position', scrubRef.current, v) }));
                          } else {
                            patchLayer(selected.id, { [k]: n } as Partial<DesignerLayer>);
                          }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs"
                      />
                    </label>
                  ))}
                  {isAutoTextLayer(selected) ? (
                    <>
                      {(['w', 'h'] as const).map((k) => (
                        <div key={k} title="Ketik angka untuk atur manual (otomatis mematikan Auto size)">
                          <span className="text-[10px] text-gray-500 uppercase">{k} auto</span>
                          <NumInput
                            value={Math.round((k === 'w' ? textSizes[selected.id]?.w : textSizes[selected.id]?.h) ?? selected[k])}
                            onCommit={(n) => {
                              if (selected.keyframes?.size !== undefined) {
                                const cur = evalStyleAt(selected, scrubRef.current);
                                const v: [number, number] = k === 'w' ? [n, Math.round(cur.h)] : [Math.round(cur.w), n];
                                patchLayer(selected.id, (l) => ({ ...l, props: { ...l.props, autoSize: false }, keyframes: setKeyframe(l.keyframes, 'size', scrubRef.current, v) }));
                              } else {
                                patchLayer(selected.id, (l) => ({ ...l, props: { ...l.props, autoSize: false }, [k]: n } as DesignerLayer));
                              }
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs"
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {(['w', 'h'] as const).map((k) => (
                        <label key={k} className="block">
                          <span className="text-[10px] text-gray-500 uppercase">{k}{selected.keyframes?.size !== undefined ? ' ◆' : ''}</span>
                          <NumInput
                            value={Math.round(selected[k])}
                            onCommit={(n) => {
                              if (selected.keyframes?.size !== undefined) {
                                const cur = evalStyleAt(selected, scrubRef.current);
                                const v: [number, number] = k === 'w' ? [n, Math.round(cur.h)] : [Math.round(cur.w), n];
                                patchLayer(selected.id, (l) => ({ ...l, keyframes: setKeyframe(l.keyframes, 'size', scrubRef.current, v) }));
                              } else {
                                patchLayer(selected.id, { [k]: n } as Partial<DesignerLayer>);
                              }
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs"
                          />
                        </label>
                      ))}
                    </>
                  )}
                </div>
                {/* Layer sepenuhnya di luar canvas = tak bisa diklik: tawarkan bawa kembali */}
                {(() => {
                  const sb = renderedBox(selected, scrub, textSizes[selected.id] ?? null);
                  const off = sb.x + sb.w <= 0 || sb.y + sb.h <= 0 || sb.x >= canvasW || sb.y >= canvasH;
                  if (!off) return null;
                  return (
                    <button
                      onClick={() => {
                        const nx = Math.round((canvasW - sb.w) / 2);
                        const ny = Math.round((canvasH - sb.h) / 2);
                        if (selected.keyframes?.position !== undefined) {
                          patchLayer(selected.id, (l) => ({ ...l, keyframes: setKeyframe(l.keyframes, 'position', scrubRef.current, [nx, ny]) }));
                        } else {
                          patchLayer(selected.id, { x: nx, y: ny });
                        }
                      }}
                      className="w-full text-[11px] font-black bg-white text-black rounded-lg px-3 py-2 hover:bg-gray-200"
                    >
                      Layer di luar canvas - Pusatkan
                    </button>
                  );
                })()}
                <div className="grid grid-cols-3 gap-1.5">
                  <label className="block"><span className="text-[10px] text-gray-500">Opacity{selected.keyframes?.opacity !== undefined ? ' ◆' : ''}</span>
                    <NumInput
                      min={0}
                      max={100}
                      value={selected.opacity}
                      onCommit={(n) => {
                        if (selected.keyframes?.opacity !== undefined) {
                          patchLayer(selected.id, (l) => ({ ...l, keyframes: setKeyframe(l.keyframes, 'opacity', scrubRef.current, n) }));
                        } else {
                          patchLayer(selected.id, { opacity: n });
                        }
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs"
                    /></label>
                  <label className="block"><span className="text-[10px] text-gray-500">Rotate°{selected.keyframes?.rotation !== undefined ? ' ◆' : ''}</span>
                    <NumInput
                      value={selected.rotation}
                      onCommit={(n) => {
                        if (selected.keyframes?.rotation !== undefined) {
                          patchLayer(selected.id, (l) => ({ ...l, keyframes: setKeyframe(l.keyframes, 'rotation', scrubRef.current, n) }));
                        } else {
                          patchLayer(selected.id, { rotation: n });
                        }
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs"
                    /></label>
                  <label className="block"><span className="text-[10px] text-gray-500">Z</span>
                    <NumInput value={selected.zIndex} onCommit={(n) => patchLayer(selected.id, { zIndex: n })} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs" /></label>
                </div>
                <label className="block"><span className="text-[10px] text-gray-500">Blend</span>
                  <select value={selected.props.blendMode ?? 'normal'} onChange={(e) => patchProps(selected.id, { blendMode: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
                    {['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select></label>
                <label className="block"><span className="text-[10px] text-gray-500">Mask (clipping)</span>
                  <select
                    value={selected.maskSource ?? ''}
                    onChange={(e) => patchLayer(selected.id, { maskSource: e.target.value || undefined })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs"
                    title="Potong tampil layer ini mengikuti geometri layer sumber (live, ikut animasi)"
                  >
                    <option value="">(tanpa mask)</option>
                    {(doc?.layers ?? [])
                      .filter((l) => l.id !== selected.id)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.type})
                        </option>
                      ))}
                  </select></label>
                {selected.maskSource && !(doc?.layers ?? []).some((l) => l.id === selected.maskSource) && (
                  <div className="text-[11px] text-gray-300">Sumber mask tidak ditemukan (mungkin sudah dihapus).</div>
                )}
                <div className="text-[10px] text-gray-500">Shape = presisi (rounded/ellipse); teks/gambar = kotaknya. Sumber boleh di-hidden, mask tetap jalan.</div>
                <div>
                  <span className="text-[10px] text-gray-500">Crop tepi (px, visual saja)</span>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {([
                      ['cropL', 'L'],
                      ['cropR', 'R'],
                      ['cropT', 'T'],
                      ['cropB', 'B'],
                    ] as const).map(([k, short]) => (
                      <label key={k} className="block">
                        <span className="text-[10px] text-gray-500 uppercase">{short}</span>
                        <NumInput
                          value={selected.props[k] ?? 0}
                          onCommit={(n) => patchProps(selected.id, { [k]: Math.max(0, n) })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <label className="block"><span className="text-[10px] text-gray-500">Anim In</span>
                    <select value={selected.animIn} onChange={(e) => patchLayer(selected.id, { animIn: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
                      <option value="">(none)</option>
                      {ANIM_IN_OPTIONS.filter(Boolean).map((a) => <option key={a} value={a}>{ANIM_MAP[a] ?? a}</option>)}
                    </select></label>
                  <label className="block"><span className="text-[10px] text-gray-500">Anim Out</span>
                    <select value={selected.animOut} onChange={(e) => patchLayer(selected.id, { animOut: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
                      <option value="">(none)</option>
                      {ANIM_OUT_OPTIONS.filter(Boolean).map((a) => <option key={a} value={a}>{ANIM_OUT_MAP[a] ?? a}</option>)}
                    </select></label>
                </div>
                <label className="block"><span className="text-[10px] text-gray-500">Mulai tampil (detik)</span>
                  <NumInput min={0} max={30} step={0.1} value={selected.delay ?? 0} onCommit={(n) => {
                    const nd = Math.max(0, n);
                    patchLayer(selected.id, (l) => {
                      const d = nd - (l.delay ?? 0);
                      return { ...l, delay: nd, out: l.out != null ? Math.max(nd + 0.2, Math.round((l.out + d) * 10) / 10) : l.out };
                    });
                  }} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs" /></label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-400 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selected.out == null}
                      onChange={(e) => patchLayer(selected.id, { out: e.target.checked ? null : Math.round(((selected.delay ?? 0) + 4) * 10) / 10 })}
                    />
                    Sampai akhir
                  </label>
                  {selected.out != null && (
                    <label className="block flex-1"><span className="text-[10px] text-gray-500">Selesai (detik) - out-point</span>
                      <NumInput min={0.2} max={300} step={0.1} value={selected.out} onCommit={(n) => patchLayer(selected.id, { out: Math.max((selected.delay ?? 0) + 0.2, n) })} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs" /></label>
                  )}
                </div>

                {(selected.type === 'text' || selected.type === 'ticker' || selected.type === 'clock') && (
                  <div className="space-y-2 bg-white/5 rounded-xl p-2.5">
                      {selected.type !== 'clock' && (
                      <label className="block"><span className="text-[10px] text-gray-500">Text{selected.keyframes?.text !== undefined ? ' ◆' : ''} - dukung {`{{username}} {{message}} {{title}}`}</span>
                        <textarea value={selected.props.text ?? ''} onChange={(e) => recordProp(selected.id, 'text', { text: e.target.value }, e.target.value)} rows={2} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs" /></label>
                    )}
                    <div className="grid grid-cols-2 gap-1.5">
                      <label className="block"><span className="text-[10px] text-gray-500">Font{selected.keyframes?.fontFamily !== undefined ? ' ◆' : ''}</span>
                        <select value={selected.props.fontFamily ?? 'Outfit'} onChange={(e) => recordProp(selected.id, 'fontFamily', { fontFamily: e.target.value }, e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
                          {WIDGET_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select></label>
                      <label className="block"><span className="text-[10px] text-gray-500">Align</span>
                        <select value={selected.props.align ?? 'left'} onChange={(e) => patchProps(selected.id, { align: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
                          <option value="left">left</option><option value="center">center</option><option value="right">right</option>
                        </select></label>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <label className="block"><span className="text-[10px] text-gray-500">Size{selected.keyframes?.fontSize !== undefined ? ' ◆' : ''}</span>
                        <NumInput value={selected.props.fontSize ?? 40} onCommit={(n) => recordProp(selected.id, 'fontSize', { fontSize: n }, n)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs" /></label>
                      <label className="block"><span className="text-[10px] text-gray-500">Weight{selected.keyframes?.fontWeight !== undefined ? ' ◆' : ''}</span>
                        <select value={selected.props.fontWeight ?? 700} onChange={(e) => recordProp(selected.id, 'fontWeight', { fontWeight: Number(e.target.value) }, Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs">
                          {[400, 700, 900].map((w) => <option key={w} value={w}>{w}</option>)}
                        </select></label>
                      <label className="block"><span className="text-[10px] text-gray-500">Color{selected.keyframes?.color !== undefined ? ' ◆' : ''}</span>
                        <input type="color" value={selected.props.color ?? '#ffffff'} onChange={(e) => recordProp(selected.id, 'color', { color: e.target.value }, e.target.value)} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg" /></label>
                    </div>
                    {selected.type === 'text' && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <label className="block"><span className="text-[10px] text-gray-500">Stroke px{selected.keyframes?.strokeWidth !== undefined ? ' ◆' : ''}</span>
                          <NumInput min={0} max={20} value={selected.props.strokeWidth ?? 0} onCommit={(n) => recordProp(selected.id, 'strokeWidth', { strokeWidth: n }, n)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs" /></label>
                        <label className="block"><span className="text-[10px] text-gray-500">Stroke color{selected.keyframes?.stroke !== undefined ? ' ◆' : ''}</span>
                          <input type="color" value={selected.props.stroke ?? '#000000'} onChange={(e) => recordProp(selected.id, 'stroke', { stroke: e.target.value }, e.target.value)} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg" /></label>
                      </div>
                    )}
                    {selected.type === 'ticker' && (
                      <label className="block"><span className="text-[10px] text-gray-500">Speed (detik/loop){selected.keyframes?.speed !== undefined ? ' ◆' : ''}</span>
                        <NumInput min={5} max={120} value={selected.props.speed ?? 22} onCommit={(n) => recordProp(selected.id, 'speed', { speed: n }, n)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs" /></label>
                    )}
                    {selected.type === 'clock' && (
                      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.props.showSeconds !== false} onChange={(e) => patchProps(selected.id, { showSeconds: e.target.checked })} /> Tampilkan detik</label>
                    )}
                    {selected.type === 'text' && (
                      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!selected.props.shadow} onChange={(e) => patchProps(selected.id, { shadow: e.target.checked })} /> Shadow</label>
                    )}
                  </div>
                )}

                {selected.type === 'shape' && (
                  <div className="space-y-2 bg-white/5 rounded-xl p-2.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <label className="block"><span className="text-[10px] text-gray-500">Bentuk</span>
                        <select value={selected.props.shape ?? 'rect'} onChange={(e) => patchProps(selected.id, { shape: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
                          <option value="rect">rect</option><option value="ellipse">ellipse</option><option value="line">line</option>
                        </select></label>
                      <label className="block"><span className="text-[10px] text-gray-500">Radius{selected.keyframes?.radius !== undefined ? ' ◆' : ''}</span>
                        <NumInput value={selected.props.radius ?? 0} onCommit={(n) => recordProp(selected.id, 'radius', { radius: n }, n)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs" /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <label className="block"><span className="text-[10px] text-gray-500">Fill{selected.keyframes?.color !== undefined ? ' ◆' : ''}</span>
                        <input type="color" value={selected.props.fill ?? '#ffffff'} onChange={(e) => recordProp(selected.id, 'color', { fill: e.target.value }, e.target.value)} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg" /></label>
                      <label className="block"><span className="text-[10px] text-gray-500">Fill opacity</span>
                        <NumInput min={0} max={100} value={selected.props.bgOpacity ?? 100} onCommit={(n) => patchProps(selected.id, { bgOpacity: n })} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs" /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <label className="block"><span className="text-[10px] text-gray-500">Border px{selected.keyframes?.borderWidth !== undefined ? ' ◆' : ''}</span>
                        <NumInput min={0} max={20} value={selected.props.borderWidth ?? 0} onCommit={(n) => recordProp(selected.id, 'borderWidth', { borderWidth: n }, n)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs" /></label>
                      <label className="block"><span className="text-[10px] text-gray-500">Border color{selected.keyframes?.borderColor !== undefined ? ' ◆' : ''}</span>
                        <input type="color" value={selected.props.borderColor ?? '#ffffff'} onChange={(e) => recordProp(selected.id, 'borderColor', { borderColor: e.target.value }, e.target.value)} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg" /></label>
                    </div>
                  </div>
                )}

                {selected.type === 'image' && (
                  <div className="space-y-2 bg-white/5 rounded-xl p-2.5">
                    <label className="block"><span className="text-[10px] text-gray-500">Image URL / {`{{cover}}`}{selected.keyframes?.src !== undefined ? ' ◆' : ''}</span>
                      <input value={selected.props.src ?? ''} onChange={(e) => recordProp(selected.id, 'src', { src: e.target.value }, e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs" placeholder="https://... atau upload di bawah" /></label>
                    <label className="block text-xs">Upload (max ~1.8MB)
                      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} className="mt-1 block text-[11px]" /></label>
                    <label className="block"><span className="text-[10px] text-gray-500">Fit</span>
                      <select value={selected.props.fit ?? 'contain'} onChange={(e) => patchProps(selected.id, { fit: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
                        <option value="contain">contain</option><option value="cover">cover</option><option value="fill">fill</option>
                      </select></label>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Keyframe terpilih (ala AE): atur waktu + ease keluar menuju key berikutnya */}
          {selectedDiamond && (() => {
            const kl = doc.layers.find((l) => l.id === selectedDiamond.layerId);
            const kk = kl?.keyframes?.[selectedDiamond.prop]?.find((k) => k.id === selectedDiamond.keyId);
            if (!kl || !kk) return null;
            const propLabel = propMeta(selectedDiamond.prop).label;
            const kkKind = propMeta(selectedDiamond.prop).kind;
            const setKKVal = (v: KeyframeValue) => patchLayer(kl.id, (l) => ({ ...l, keyframes: updateKeyframe(l.keyframes, selectedDiamond.prop, kk.id, { v }) }));
            return (
              <section className="space-y-2 bg-white/5 border border-white/15 rounded-none p-2.5">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-200">Keyframe - {kl.name} • {propLabel}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <label className="block"><span className="text-[10px] text-gray-500">Detik</span>
                    <NumInput
                      min={0} step={0.1} value={kk.t}
                      onCommit={(n) => patchLayer(kl.id, (l) => {
                        const moved = moveKeyframe(l.keyframes, selectedDiamond.prop, kk.id, n);
                        return { ...l, keyframes: mergeKeysAt(moved, selectedDiamond.prop, kk.id) };
                      })}
                      className="w-full bg-black/40 border border-white/10 rounded-none px-2 py-1 text-xs"
                    /></label>
                  {kkKind !== 'discrete' ? (
                    <label className="block"><span className="text-[10px] text-gray-500">Ease keluar</span>
                    <select
                      value={kk.ease ?? 'linear'}
                      onChange={(e) => {
                        const v = e.target.value as LayerEase;
                        patchLayer(kl.id, (l) => {
                          const cur = l.keyframes?.[selectedDiamond.prop]?.find((k) => k.id === kk.id);
                          const patch: Partial<{ ease: LayerEase; bezier: { x1: number; y1: number; x2: number; y2: number } }> = { ease: v };
                          // Pindah ke Custom: inisialisasi handle dari kurva saat ini biar tidak lompat.
                          if (v === 'custom' && !cur?.bezier) {
                            const ce = cur?.ease ?? 'linear';
                            patch.bezier = { ...(ce === 'custom' ? PRESET_BEZIERS.linear : PRESET_BEZIERS[ce]) };
                          }
                          return { ...l, keyframes: updateKeyframe(l.keyframes, selectedDiamond.prop, kk.id, patch) };
                        });
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-none px-2 py-1 text-xs"
                    >
                      {EASE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select></label>
                  ) : (
                    <div className="text-[10px] text-gray-500 self-end pb-1">Hold (ganti seketika)</div>
                  )}
                </div>
                {kkKind !== 'discrete' && (
                  <BezierEditor
                    value={effectiveBezier(kk)}
                    editable={(kk.ease ?? 'linear') === 'custom'}
                    onChange={(b) => patchLayer(kl.id, (l) => ({ ...l, keyframes: updateKeyframe(l.keyframes, selectedDiamond.prop, kk.id, { bezier: b }) }))}
                    onGestureStart={pushHistory}
                  />
                )}
                {/* Editor nilai keyframe sesuai kind (number / pair / color / discrete) */}
                {kkKind === 'number' && (
                  <label className="block"><span className="text-[10px] text-gray-500">Nilai{propMeta(selectedDiamond.prop).unit ? ` (${propMeta(selectedDiamond.prop).unit})` : ''}</span>
                    <NumInput
                      value={typeof kk.v === 'number' ? kk.v : 0}
                      onCommit={(n) => setKKVal(n)}
                      className="w-full bg-black/40 border border-white/10 rounded-none px-2 py-1 text-xs"
                    /></label>
                )}
                {kkKind === 'pair' && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {([0, 1] as const).map((i) => {
                      const cur = Array.isArray(kk.v) ? kk.v : [0, 0];
                      const sub = selectedDiamond.prop === 'size' ? (i === 0 ? 'W' : 'H') : i === 0 ? 'X' : 'Y';
                      return (
                        <label key={i} className="block"><span className="text-[10px] text-gray-500">{sub} (px)</span>
                          <NumInput
                            value={Math.round(cur[i])}
                            onCommit={(n) => setKKVal(i === 0 ? [n, cur[1]] : [cur[0], n])}
                            className="w-full bg-black/40 border border-white/10 rounded-none px-2 py-1 text-xs"
                          /></label>
                      );
                    })}
                  </div>
                )}
                {kkKind === 'color' && (() => {
                  const cur = typeof kk.v === 'string' ? kk.v : '#ffffff';
                  return parseColor(cur) ? (
                    <label className="block"><span className="text-[10px] text-gray-500">Warna</span>
                      <input type="color" value={cur} onChange={(e) => setKKVal(e.target.value)} className="w-full h-8 bg-black/40 border border-white/10 rounded-none" /></label>
                  ) : (
                    <label className="block"><span className="text-[10px] text-gray-500">Warna (teks)</span>
                      <input value={cur} onChange={(e) => setKKVal(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-none px-2 py-1 text-xs" /></label>
                  );
                })()}
                {kkKind === 'discrete' && (
                  <label className="block"><span className="text-[10px] text-gray-500">Nilai (ganti seketika)</span>
                    <input value={typeof kk.v === 'string' ? kk.v : ''} onChange={(e) => setKKVal(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-none px-2 py-1 text-xs" /></label>
                )}
                <button
                  onClick={() => removeKeyframeKeepSelection(kl.id, selectedDiamond.prop, kk.id)}
                  className="text-[11px] font-black text-gray-300 hover:text-white"
                >
                  Hapus keyframe ini
                </button>
              </section>
            );
          })()}

          {/* Graph editor ala AE untuk layer terpilih (value + speed, bisa di-drag) */}
          {selected && (
            <section className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Graph - {selected.name}</div>
              <SpeedGraph
                layer={selected}
                windowSecs={windowSecs}
                scrub={scrub}
                canvasW={canvasW}
                canvasH={canvasH}
                onGraphEdit={handleGraphEdit}
                onMarkerSelect={handleDiamondJump}
                onKeyframeCommit={handleKeyframeCommit}
                onGestureStart={pushHistory}
              />
            </section>
          )}

          <section className="space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Data live (preview)</div>
            {Object.entries(dataVars).map(([k, v]) => (
              <label key={k} className="block">
                <span className="text-[10px] text-gray-500">{`{{${k}}}`}</span>
                <input value={v} onChange={(e) => setDataVars((s) => ({ ...s, [k]: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs" />
              </label>
            ))}
          </section>
        </aside>
      </div>
      <ConfirmModal
        open={showImportConfirm}
        onClose={() => {
          setShowImportConfirm(false);
          setPendingImport(null);
        }}
        onConfirm={confirmImport}
        title="Import Layer?"
        description={pendingImport ? `Import ${pendingImport.layers.length} layer? Layer saat ini akan diganti.` : "Import layer? Layer saat ini akan diganti."}
        confirmLabel="Import"
        variant="default"
      />
    </div>
  );
}

export default function DesignerEditorPage() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}
