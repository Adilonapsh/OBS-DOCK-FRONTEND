'use client';

import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import { ExternalLink, Monitor, Sparkles, RefreshCw, GripVertical, Layers } from 'lucide-react';
import { useInfoSlidesSettings } from './hooks/useInfoSlidesSettings';
import { useWidgetPageShell } from '../_shared/hooks/useWidgetPage';
import { WidgetPageModals, toggleShowKey } from '../_shared/components/WidgetPageModals';
import { buildInfoSlidesUrl } from './config';
import { WidgetShell } from '../_shared/components/WidgetShell';
import { UrlBar } from '../_shared/components/UrlBar';
import { InfoSlidesSettingsForm } from './components/InfoSlidesSettingsForm';
import { KEYFRAMES_CSS } from '../_shared/constants/animations';

function InfoSlidesInner() {
  const { state, update, reset, privateKey, setPrivateKey, loadFromUrl } = useInfoSlidesSettings();
  const shell = useWidgetPageShell(loadFromUrl);

  const widgetUrl = useMemo(() => buildInfoSlidesUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/info-slides/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  const previewUrl = useMemo(() => buildInfoSlidesUrl('/widgets/info-slides/display', state), [state]);

  const handleCopy = () => shell.copy(obsUrl);

  return (
    <>
      <style>{KEYFRAMES_CSS}</style>
      <WidgetShell
        sidebarOpen={shell.sidebarOpen}
        setSidebarOpen={shell.setSidebarOpen}
        user={shell.user}
        headerIcon={<Layers className="w-4 h-4 text-white" />}
        title={<>Info Slides <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white text-black rounded-full"><span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />Loop</span></>}
        subtitle="Sponsor / Rules Loop — 5-10 slide auto-rotate 2-30s, 3 tema (Clean/Boxed/Glass)"
        headerActions={
          <>
            <button onClick={() => shell.setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => shell.setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </>
        }
        urlBar={<UrlBar obsUrl={obsUrl} showKey={shell.showKey} onToggleKey={() => toggleShowKey(shell, obsUrl)} copied={shell.copied} onCopy={handleCopy} />}
        settingsPanel={<InfoSlidesSettingsForm state={state} update={update} reset={reset} />}
        previewPanel={
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview — {state.theme} • {state.anim} • {state.duration}s</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • {state.autoRotate ? 'auto' : 'manual'}</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[260px]">
              <iframe key={previewUrl} src={previewUrl} className="absolute inset-0 w-full h-full border-0 bg-transparent" title="info-slides-preview" />
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Copy OBS URL & tambah sebagai Browser Source (transparent). 5-10 slide loop.</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <a href={obsUrl} target="_blank" className="h-9 bg-white text-black rounded-xl font-black uppercase flex items-center justify-center gap-1.5"><Monitor className="w-3 h-3" /> Buka OBS (real)</a>
              <Link href="/widgets" className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">Widgets</Link>
              <button onClick={() => window.open(previewUrl, '_blank')} className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white"><ExternalLink className="w-3 h-3" /> Popout</button>
            </div>
          </>
        }
      />

      <WidgetPageModals shell={shell} onReset={reset} />
    </>
  );
}

export default function InfoSlidesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <InfoSlidesInner />
    </Suspense>
  );
}
