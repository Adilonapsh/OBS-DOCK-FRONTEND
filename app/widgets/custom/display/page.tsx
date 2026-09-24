'use client';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getBoolParam, getStringParam } from '../../_shared/utils/url';
import { renderTemplate, buildTemplateData } from '../../_shared/utils/template';
import { useLiveTemplateData } from '../../_shared/hooks/useLiveTemplateData';

type Layer = { id: string; type: string; x:number; y:number; w:number; h:number; template:string; css:string; visible:boolean; js?: string; anim?: string; opacity?: number; rotate?: number; scale?: number; zIndex?: number; radius?: number; shadow?: boolean; bg?: string };

function CustomInner() {
  const searchParams = useSearchParams();
  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);
  const obsMode = getBoolParam(params, 'obs', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', getStringParam(params, 'room', '')));
  const layersParam = searchParams.get('layers');
  const [layers, setLayers] = useState<Layer[]>([]);

  // Live sync: {{cover}} = thumbnail YT asli / SMTC art, {{timer}} = sisa real,
  // {{username}}/{{message}} = chat terakhir, {{question}}/{{polls}} = poll aktif, dst.
  const { data: live } = useLiveTemplateData({
    privateKey,
    simulate,
    smtcAddress: params.get('smtcBridgeAddress') || '',
    smtcPort: params.get('smtcBridgePort') || '5000',
  });

  // Base = demo + ?params URL, lalu timpa dengan live (yang non-kosong menang).
  const data = useMemo(() => {
    const base = buildTemplateData(params);
    const merged: Record<string, any> = { ...base };
    for (const [k, v] of Object.entries(live)) {
      if (v !== '' && v !== null && v !== undefined) merged[k] = v;
    }
    merged.date = new Date().toLocaleDateString('id-ID');
    merged.time = new Date().toLocaleTimeString('id-ID');
    merged.clock = new Date().toLocaleTimeString('id-ID');
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, live]);

  useEffect(() => {
    if (layersParam) {
      try { const arr = JSON.parse(decodeURIComponent(layersParam)); if (Array.isArray(arr)) setLayers(arr); } catch { try { setLayers(JSON.parse(layersParam)); } catch {} }
    } else {
      try { const raw = localStorage.getItem('custom-overlay-layers'); if (raw) setLayers(JSON.parse(raw)); } catch {}
    }
  }, [layersParam]);

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <div className={`${obsMode ? 'fixed inset-0 w-screen h-screen bg-transparent overflow-hidden' : 'w-full min-h-screen bg-[#0a0a0a] p-4'}`} style={{ background: obsMode ? 'transparent' : '#0a0a0a' }}>
        <div className="relative w-full h-full min-h-[540px] bg-black/20 border border-white/5 rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {layers.filter(l=>l.visible).map(l => (
            <div
              key={`${l.id}-${(l as any).js}-${(l as any).anim}-${(l as any).opacity}-${(l as any).rotate}`}
              className="absolute overflow-hidden"
              style={{
                left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%`, height: `${l.h}%`,
                background: (l as any).bg && (l as any).bg !== 'transparent' ? (l as any).bg : undefined,
                opacity: ((l as any).opacity ?? 100)/100,
                transform: `rotate(${(l as any).rotate||0}deg) scale(${(l as any).scale||1})`,
                zIndex: (l as any).zIndex||1,
                borderRadius: `${(l as any).radius||0}px`,
                boxShadow: (l as any).shadow ? '0 8px 24px rgba(0,0,0,0.4)' : undefined,
                animation: !(l as any).js && (l as any).anim ? `${(l as any).anim} 0.52s cubic-bezier(0.16,1,0.3,1) both` : undefined
              } as any}
              ref={el => { if (el && (l as any).js) { try { const fn = new Function('el', (l as any).js); const target = el.querySelector('.layer-content') as HTMLElement | null; if (target) fn(target); else fn(el); } catch {} } }}
            >
              <style dangerouslySetInnerHTML={{ __html: l.css }} />
              <div className="layer-content w-full h-full text-white text-sm" dangerouslySetInnerHTML={{ __html: renderTemplate(l.template, data) }} />
            </div>
          ))}
          {layers.length===0 && <div className="absolute inset-0 grid place-items-center text-white/40 text-sm">No layers - add di /widgets/editor</div>}
        </div>
      </div>
    </>
  );
}

export default function CustomDisplayPage() {
  return <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60">Loading…</div>}><CustomInner /></Suspense>;
}
