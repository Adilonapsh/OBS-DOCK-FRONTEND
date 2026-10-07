// GT-style Designer - tipe inti. Terpisah dari widgets.
// Koordinat selalu px dalam canvas 1920x1080 (ala vMix GT Designer).

export const DESIGN_W = 1920;
export const DESIGN_H = 1080;

export type DesignerLayerType = 'text' | 'image' | 'shape' | 'ticker' | 'clock';

export type ShapeKind = 'rect' | 'ellipse' | 'line';

// Keyframe ala After Effects: nilai properti di detik t.
// position v = [x, y] px, opacity v = 0-100, rotation v = derajat.
// Easing per keyframe (berlaku untuk segmen KELUAR menuju keyframe berikutnya).
// 'custom' = pakai kurva cubic-bezier di field `bezier` (handle draggable).
export type LayerEase = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'custom';

export type Bezier = { x1: number; y1: number; x2: number; y2: number };

export type KeyframeValue = number | [number, number] | string;

export type Keyframe = {
  id: string;
  t: number; // detik
  v: KeyframeValue;
  ease?: LayerEase;
  bezier?: Bezier;
};

export type LayerKeyframes = {
  position?: Keyframe[];
  opacity?: Keyframe[];
  rotation?: Keyframe[];
  size?: Keyframe[];
  fontSize?: Keyframe[];
  fontWeight?: Keyframe[];
  color?: Keyframe[];
  strokeWidth?: Keyframe[];
  stroke?: Keyframe[];
  borderWidth?: Keyframe[];
  borderColor?: Keyframe[];
  radius?: Keyframe[];
  speed?: Keyframe[];
  fontFamily?: Keyframe[];
  text?: Keyframe[];
  src?: Keyframe[];
};

export type KeyProp =
  | 'position' | 'opacity' | 'rotation' | 'size'
  | 'fontSize' | 'fontWeight' | 'color'
  | 'strokeWidth' | 'stroke'
  | 'borderWidth' | 'borderColor' | 'radius'
  | 'speed'
  | 'fontFamily' | 'text' | 'src';

export type DesignerLayer = {
  id: string;
  name: string;
  type: DesignerLayerType;
  visible: boolean;
  locked: boolean;
  // px di canvas 1920x1080
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number; // deg
  opacity: number; // 0-100
  zIndex: number;
  animIn: string; // key dari ANIM_MAP, '' = none
  animOut: string; // key dari ANIM_OUT_MAP, '' = none
  /** Jeda detik sebelum animasi masuk jalan (in-point layer). */
  delay: number;
  /** Detik layer hilang dari canvas (out-point). null = tampil sampai akhir timeline. */
  out: number | null;
  /** Clipping mask: potong tampil layer ini mengikuti geometri layer sumber (live).
   *  Shape presisi (rect/rounded/ellipse); teks/gambar mengikuti kotaknya. */
  maskSource?: string;
  /** Keyframe ala AE. Stopwatch nyala = array ada (boleh kosong). */
  keyframes?: LayerKeyframes;
  props: {
    // text / ticker / clock
    text?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    align?: 'left' | 'center' | 'right';
    stroke?: string;
    strokeWidth?: number;
    shadow?: boolean;
    // text
    autoSize?: boolean; // box ngepas ke isi teks ala OBS (default true)
    // ticker
    speed?: number; // detik per loop
    // clock
    showSeconds?: boolean;
    // shape
    shape?: ShapeKind;
    fill?: string;
    borderColor?: string;
    borderWidth?: number;
    radius?: number;
    // image
    src?: string;
    fit?: 'cover' | 'contain' | 'fill';
    // umum
    bg?: string;
    bgOpacity?: number; // 0-100
    padding?: number;
    // crop tepi (px desain, visual saja, kompos dengan mask)
    cropL?: number;
    cropR?: number;
    cropT?: number;
    cropB?: number;
    /** CSS mix-blend-mode (dari Photoshop import / manual). */
    blendMode?: string;
  };
};

export type DesignerDoc = {
  id: string;
  name: string;
  privateKey: string;
  layers: DesignerLayer[];
  updatedAt: number;
  /** Resolusi canvas yang diatur user. Default 1920x1080. */
  canvasW: number;
  canvasH: number;
  /** Panjang timeline editor (detik). Default 8. Opsional biar doc lama tetap jalan. */
  timelineSecs?: number;
};

export function uid(prefix = 'layer'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
