'use client';

import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import { ExternalLink, Monitor, Eye } from 'lucide-react';
import { useViewCounterSettings } from './hooks/useViewCounterSettings';
import { useWidgetPageShell } from '../_shared/hooks/useWidgetPage';
import { WidgetPageModals, toggleShowKey } from '../_shared/components/WidgetPageModals';
import { buildViewCounterUrl } from './config';
import { WidgetShell } from '../_shared/components/WidgetShell';
import { UrlBar } from '../_shared/components/UrlBar';
import { ViewCounterSettingsForm } from './components/ViewCounterSettingsForm';
import { KEYFRAMES_CSS } from '../_shared/constants/animations';
import { normalizePosition } from '../_shared/constants/positions';

function ViewCounterSettingsInner() {
  const { state, update, reset, privateKey, loadFromUrl } = useViewCounterSettings();
  const shell = useWidgetPageShell(loadFromUrl);

  const widgetUrl = useMemo(() => buildViewCounterUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/view-counter/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  const previewUrl = useMemo(() => buildViewCounterUrl('/widgets/view-counter/display', state), [state]);
  const simulateUrl = useMemo(() => `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}simulate=1`, [previewUrl]);

  const handleCopy = () => shell.copy(obsUrl);

  return (
    <>
      <style>{KEYFRAMES_CSS}</style>
      <WidgetShell
        sidebarOpen={shell.sidebarOpen}
        setSidebarOpen={shell.setSidebarOpen}
        user={shell.user}
        headerIcon={<Eye className="w-4 h-4 text-white" />}
        title={<>View Counter</>}
        subtitle="Total penonton TikTok + Twitch + YouTube + Kick"
        headerActions={
          <>
            <button onClick={() => shell.setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Defaults</button>
            <button onClick={() => shell.setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </>
        }
        urlBar={<UrlBar obsUrl={obsUrl} showKey={shell.showKey} onToggleKey={() => toggleShowKey(shell, obsUrl)} copied={shell.copied} onCopy={handleCopy} />}
        settingsPanel={<ViewCounterSettingsForm state={state} update={update} />}
        previewPanel={
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview — {state.theme}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • TikTok + SB</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px]">
              <iframe key={simulateUrl} src={simulateUrl} className="absolute inset-0 w-full h-full border-0 bg-transparent" title="view-counter-preview" />
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">TikTok dari roomUser backend • Twitch/YouTube/Kick dari Streamer.bot via dock. Buka dock + konek SB agar data SB masuk.</div>
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

export default function ViewCounterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <ViewCounterSettingsInner />
    </Suspense>
  );
}
