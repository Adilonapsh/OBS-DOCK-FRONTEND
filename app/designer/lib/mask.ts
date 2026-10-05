'use client';
// Clipping mask geometris ala AE/Photoshop — LIVE, tanpa rasterisasi.
// Target dipotong mengikuti geometri layer sumber dalam koordinat canvas yang sama,
// sehingga ikut animasi/keyframe (cukup evaluasi ulang tiap frame).
//
// - Sumber shape rect  → inset() tepat (termasuk radius → round px)
// - Sumber shape ellipse → ellipse() tepat
// - Sumber lain (teks/gambar/line) → kotak pembatasnya (bukan per-piksel alpha;
//   matte alpha/luma per-piksel butuh rasterisasi = pekerjaan lanjutan)
// - Irisan selalu di dalam target → inset selalu ≥ 0
// - Tak beririsan sama sekali → null (panggil render null / sembunyikan)

export type MaskTarget = { x: number; y: number; w: number; h: number };

export type MaskSourceGeom =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; radius?: number }
  | { kind: 'ellipse'; x: number; y: number; w: number; h: number };

const f2 = (n: number) => Math.round(n * 100) / 100;

/** clip-path CSS untuk target, atau null bila tak beririsan (sembunyikan layer). */
export function computeClipPath(target: MaskTarget, source: MaskSourceGeom): string | null {
  if (!(target.w > 0) || !(target.h > 0)) return null;

  if (source.kind === 'ellipse') {
    if (!(source.w > 0) || !(source.h > 0)) return null;
    const cx = source.x + source.w / 2;
    const cy = source.y + source.h / 2;
    // Tolak cepat bila box tak bersinggungan sama sekali.
    if (
      cx + source.w / 2 <= target.x ||
      cx - source.w / 2 >= target.x + target.w ||
      cy + source.h / 2 <= target.y ||
      cy - source.h / 2 >= target.y + target.h
    ) {
      return null;
    }
    const rcx = ((cx - target.x) / target.w) * 100;
    const rcy = ((cy - target.y) / target.h) * 100;
    const rx = ((source.w / 2) / target.w) * 100;
    const ry = ((source.h / 2) / target.h) * 100;
    return `ellipse(${f2(rx)}% ${f2(ry)}% at ${f2(rcx)}% ${f2(rcy)}%)`;
  }

  const ix0 = Math.max(target.x, source.x);
  const iy0 = Math.max(target.y, source.y);
  const ix1 = Math.min(target.x + target.w, source.x + source.w);
  const iy1 = Math.min(target.y + target.h, source.y + source.h);
  if (ix1 <= ix0 || iy1 <= iy0) return null;
  const top = f2(((iy0 - target.y) / target.h) * 100);
  const right = f2(((target.x + target.w - ix1) / target.w) * 100);
  const bottom = f2(((target.y + target.h - iy1) / target.h) * 100);
  const left = f2(((ix0 - target.x) / target.w) * 100);
  const round = source.radius && source.radius > 0 ? ` round ${Math.max(0, Math.round(source.radius))}px` : '';
  return `inset(${top}% ${right}% ${bottom}% ${left}%${round})`;
}
