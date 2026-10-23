'use client';

import { useMemo, Suspense } from 'react';
import { ExternalLink, Monitor, RefreshCw, Clock } from 'lucide-react';
import { useTimerSettings } from './hooks/useTimerSettings';
import { useWidgetPageShell } from '../_shared/hooks/useWidgetPage';
import { WidgetPageModals, toggleShowKey } from '../_shared/components/WidgetPageModals';
import { buildTimerUrl } from './config';
import { WidgetShell } from '../_shared/components/WidgetShell';
import { UrlBar } from '../_shared/components/UrlBar';
import { TimerSettingsForm } from './components/TimerSettingsForm';
import { KEYFRAMES_CSS } from '../_shared/constants/animations';
import { normalizePosition } from '../_shared/constants/positions';

function TimerSettingsInner() {
  const { state, update, reset, privateKey, loadFromUrl } = useTimerSettings();
  const shell = useWidgetPageShell(loadFromUrl);

  const widgetUrl = useMemo(() => buildTimerUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/timer/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  // 1 file untuk OBS + live preview - preview pakai simulate=1 biar 1 source (display/page.tsx)
  const previewUrl = useMemo(() => buildTimerUrl('/widgets/timer/display', state), [state]);
  const simulateUrl = useMemo(() => `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}simulate=1`, [previewUrl]);

  const handleCopy = () => shell.copy(obsUrl);

  return (
    <>
      <style>{KEYFRAMES_CSS}</style>
      <WidgetShell
        sidebarOpen={shell.sidebarOpen}
        setSidebarOpen={shell.setSidebarOpen}
        user={shell.user}
        headerIcon={<Clock className="w-4 h-4 text-white" />}
        title={<>Focus Timer <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white text-black rounded-full">Pomodoro</span></>}
        subtitle="Timer 50:00 × 3 sesi - desain Moka #594d4a"
        headerActions={
          <>
            <button onClick={() => shell.setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => shell.setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </>
        }
        urlBar={<UrlBar obsUrl={obsUrl} showKey={shell.showKey} onToggleKey={() => toggleShowKey(shell, obsUrl)} copied={shell.copied} onCopy={handleCopy} />}
        settingsPanel={<TimerSettingsForm state={state} update={update} />}
        previewPanel={
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview - {state.theme} • simulate • pos:{normalizePosition((state as unknown as {pos:string}).pos || 'center')}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • {state.focusMinutes}m • {normalizePosition((state as unknown as {pos:string}).pos || 'center')}</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px]">
              <iframe key={simulateUrl} src={simulateUrl} className="absolute inset-0 w-full h-full border-0 bg-transparent" title="timer-preview" />
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Posisi global (t,l,b,r, tl/tr/bl/br, center) - langsung tersimulasi di live preview & OBS pakai <code className="bg-white/10 px-1 rounded text-white">.../timer/display?pos=...</code> yang sama + <code className="bg-white/10 px-1 rounded text-white">simulate=1</code>.</div>
          </>
        }
      />

      <WidgetPageModals shell={shell} onReset={reset} />
    </>
  );
}

export default function TimerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <TimerSettingsInner />
    </Suspense>
  );
}
