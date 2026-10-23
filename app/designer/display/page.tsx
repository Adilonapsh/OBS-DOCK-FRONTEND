'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DesignerLayer } from '../lib/types';
import { DESIGN_W, DESIGN_H } from '../lib/types';
import { loadDoc, decodeLayers } from '../lib/store';
import { DesignerStage } from '../components/LayerRenderer';
import { getBoolParam, getIntParam } from '../../widgets/_shared/utils/url';
import { buildTemplateData } from '../../widgets/_shared/utils/template';

// Skala canvas 1920x1080 agar pas di Browser Source ukuran apa pun.
// Pola sama seperti widget: ?obs=1 transparan, ?simulate=1 preview tanpa chrome.
function Display() {
  const sp = useSearchParams();
  const designId = sp.get('designId') ?? '';
  const layersParam = sp.get('layers');
  const obs = getBoolParam(sp, 'obs', false);
  const simulate = getBoolParam(sp, 'simulate', false) || getBoolParam(sp, 'preview', false);
  const isObs = obs || (!simulate && getBoolParam(sp, 'transparent', false));
  const [scale, setScale] = useState(1);
  const [tick, setTick] = useState(0);
  // Jam jalan: keyframes dievaluasi live agar OBS cocok dengan preview editor.
  // Animasi masuk CSS jalan natural dari mount (entranceOffset 0, tanpa remount).
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const loop = () => {
      setElapsed((performance.now() - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const layers: DesignerLayer[] = useMemo(() => {
    const fromUrl = decodeLayers(layersParam);
    if (fromUrl) return fromUrl;
    if (typeof window !== 'undefined' && designId) {
      const d = loadDoc(designId);
      if (d) return d.layers;
    }
    return [];
  }, [layersParam, designId, tick]);

  const canvasW = useMemo(() => {
    const fromUrl = getIntParam(sp, 'cw', 0);
    if (fromUrl >= 320 && fromUrl <= 7680) return fromUrl;
    if (typeof window !== 'undefined' && designId) {
      const d = loadDoc(designId);
      if (d?.canvasW) return d.canvasW;
    }
    return DESIGN_W;
  }, [sp, designId, tick]);

  const canvasH = useMemo(() => {
    const fromUrl = getIntParam(sp, 'ch', 0);
    if (fromUrl >= 320 && fromUrl <= 4320) return fromUrl;
    if (typeof window !== 'undefined' && designId) {
      const d = loadDoc(designId);
      if (d?.canvasH) return d.canvasH;
    }
    return DESIGN_H;
  }, [sp, designId, tick]);

  // Live reload saat editor menyimpan (tab sama / storage event)
  useEffect(() => {
    if (isObs) return;
    const onStorage = () => setTick((t) => t + 1);
    window.addEventListener('storage', onStorage);
    const t = setInterval(() => setTick((x) => x + 1), 2000);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(t);
    };
  }, [isObs]);

  const data = useMemo(() => {
    const params = new URLSearchParams(sp.toString());
    return buildTemplateData(params);
  }, [sp]);

  useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / canvasW, window.innerHeight / canvasH);
      setScale(isFinite(s) && s > 0 ? s : 1);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [canvasW, canvasH]);

  useEffect(() => {
    if (!isObs) return;
    const css = 'html,body{margin:0!important;padding:0!important;background:transparent!important;overflow:hidden!important;}';
    const el = document.createElement('style');
    el.setAttribute('data-designer-obs', '1');
    el.textContent = css;
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, [isObs]);

  if (isObs) {
    return (
      <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: 'transparent', overflow: 'hidden' }}>
        <div
          style={{
            width: canvasW,
            height: canvasH,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            left: (window.innerWidth - canvasW * scale) / 2,
            top: (window.innerHeight - canvasH * scale) / 2,
          }}
        >
          <DesignerStage layers={layers} data={data} canvasW={canvasW} canvasH={canvasH} time={elapsed} entranceOffset={0} />
        </div>
      </div>
    );
  }

  // Preview fullscreen: canvas fit-contain di tengah layar hitam, tanpa chrome.
  // Mode OBS (?obs=1) di atas sudah viewport-filling transparan - tidak diubah.
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div
        style={{
          width: canvasW,
          height: canvasH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          left: Math.max(0, (window.innerWidth - canvasW * scale) / 2),
          top: Math.max(0, (window.innerHeight - canvasH * scale) / 2),
        }}
      >
        <DesignerStage layers={layers} data={data} canvasW={canvasW} canvasH={canvasH} time={elapsed} entranceOffset={0} />
      </div>
      {!layers.length && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
          Tidak ada layers. Buka editor, lalu Copy OBS URL.
        </div>
      )}
    </div>
  );
}

export default function DesignerDisplayPage() {
  return (
    <Suspense>
      <Display />
    </Suspense>
  );
}

// Hindari prerender statis (pakai useSearchParams + localStorage)
export const dynamic = 'force-dynamic';
