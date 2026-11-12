'use client';

import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import { ExternalLink, Monitor, RefreshCw, Radio } from 'lucide-react';
import { useStreamBarSettings } from './hooks/useStreamBarSettings';
import { useWidgetPageShell } from '../_shared/hooks/useWidgetPage';
import { WidgetPageModals, toggleShowKey } from '../_shared/components/WidgetPageModals';
import { buildStreamBarUrl } from './config';
import { WidgetShell } from '../_shared/components/WidgetShell';
import { UrlBar } from '../_shared/components/UrlBar';
import { StreamBarSettingsForm } from './components/StreamBarSettingsForm';

function StreamBarSettingsInner() {
  const { state, update, reset, privateKey, loadFromUrl } = useStreamBarSettings();
  const shell = useWidgetPageShell(loadFromUrl);

  const widgetUrl = useMemo(
    () => buildStreamBarUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/stream-bar/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''),
    [state, privateKey],
  );
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  // Preview settings selalu memutar demo supaya activity/now playing/game/alert terlihat.
  const previewUrl = useMemo(
    () => `${buildStreamBarUrl('/widgets/stream-bar/display', { ...state, demo: true })}&simulate=1`,
    [state],
  );

  const handleCopy = () => shell.copy(obsUrl);

  return (
    <>
      <WidgetShell
        sidebarOpen={shell.sidebarOpen}
        setSidebarOpen={shell.setSidebarOpen}
        user={shell.user}
        headerIcon={<Radio className="w-4 h-4 text-white" />}
        title="Stream Bar"
        subtitle="Activity + now playing + game + welcome rules + alert + rotating goals - 1 URL lebar untuk OBS"
        headerActions={
          <>
            <button onClick={() => shell.setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 btn-secondary border rounded-xl text-[10px] font-black uppercase "><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => shell.setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 btn-secondary border rounded-xl text-[10px] font-black uppercase ">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 btn-primary rounded-xl text-[10px] font-black uppercase "><ExternalLink className="w-3 h-3" /> Preview</a>
          </>
        }
        urlBar={<UrlBar obsUrl={obsUrl} showKey={shell.showKey} onToggleKey={() => toggleShowKey(shell, obsUrl)} copied={shell.copied} onCopy={handleCopy} />}
        settingsPanel={<StreamBarSettingsForm state={state} update={update} reset={reset} privateKey={privateKey} onCopy={handleCopy} />}
        previewPanel={
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview - {state.theme} • goal {state.goalStyle} • demo</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • {state.goals.length} goals • {state.rules.length} rules</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px]">
              <iframe key={previewUrl} src={previewUrl} className="absolute inset-0 w-full h-full border-0 bg-transparent" title="stream-bar-preview" />
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Preview demo berjalan otomatis (activity → now playing → game + alert + goals). Data real hanya di OBS (<code className="bg-white/10 px-1 rounded text-white">.../stream-bar/display?obs=1</code>).</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <a href={obsUrl} target="_blank" className="h-9 btn-primary rounded-xl font-black uppercase flex items-center justify-center gap-1.5"><Monitor className="w-3 h-3" /> Buka OBS (real)</a>
              <Link href="/widgets" className="h-9 btn-secondary border rounded-xl font-black uppercase flex items-center justify-center gap-1.5 ">Widgets</Link>
              <button onClick={() => window.open(previewUrl, '_blank')} className="h-9 btn-secondary border rounded-xl font-black uppercase flex items-center justify-center gap-1.5 "><ExternalLink className="w-3 h-3" /> Popout</button>
            </div>
          </>
        }
      />
      <WidgetPageModals shell={shell} onReset={reset} />
    </>
  );
}

export default function StreamBarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <StreamBarSettingsInner />
    </Suspense>
  );
}
