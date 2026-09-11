'use client';

import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import { ExternalLink, Monitor, Sparkles, RefreshCw, Gift, Heart, UserPlus } from 'lucide-react';
import { useEventSettings } from './hooks/useEventSettings';
import { useWidgetPageShell } from '../_shared/hooks/useWidgetPage';
import { WidgetPageModals, toggleShowKey } from '../_shared/components/WidgetPageModals';
import { buildEventUrl } from './config';
import { WidgetShell } from '../_shared/components/WidgetShell';
import { UrlBar } from '../_shared/components/UrlBar';
import { EventSettingsForm } from './components/EventSettingsForm';
import { EventPreview } from './components/EventPreview';
import { KEYFRAMES_CSS } from '../_shared/constants/animations';
import { getPositionStyle } from '../_shared/constants/positions';

function EventSettingsInner() {
  const { state, update, reset, privateKey, loadFromUrl } = useEventSettings();
  const shell = useWidgetPageShell(loadFromUrl);

  const widgetUrl = useMemo(() => buildEventUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/event/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  const previewUrl = useMemo(() => buildEventUrl('/widgets/event/display', state), [state]);

  const handleCopy = () => shell.copy(obsUrl);

  return (
    <>
      <style>{KEYFRAMES_CSS}</style>
      <WidgetShell
        sidebarOpen={shell.sidebarOpen}
        setSidebarOpen={shell.setSidebarOpen}
        user={shell.user}
        headerIcon={<Gift className="w-4 h-4 text-white" />}
        title={<>Event Overlay <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white text-black rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Live</span></>}
        subtitle="Join • Gift • Like — dari server.ts tiktok-member/gift/like (TikTok + Streamer.bot)"
        headerActions={
          <>
            <button onClick={() => shell.setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => shell.setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </>
        }
        urlBar={<UrlBar obsUrl={obsUrl} showKey={shell.showKey} onToggleKey={() => toggleShowKey(shell, obsUrl)} copied={shell.copied} onCopy={handleCopy} />}
        settingsPanel={<EventSettingsForm state={state} update={update} reset={reset} privateKey={privateKey} onCopy={handleCopy} />}
        previewPanel={
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview — {state.theme} • {state.anim} <span className="hidden sm:inline-flex gap-1">{state.showJoin && <UserPlus className="w-3 h-3 text-green-400" />}{state.showGift && <Gift className="w-3 h-3 text-[#FE2C55]" />}{state.showLike && <Heart className="w-3 h-3 text-pink-400" />}</span></div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • {state.maxEvents} events</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px] flex p-4" style={getPositionStyle((state as any).pos || (state as any).verticalAlignment || 'bl') as any}>
              <EventPreview state={state} />
              <div className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/60 backdrop-blur px-2 py-1 rounded-full text-white/60 border border-white/10 pointer-events-none">SIMULASI • {state.theme} • {state.font} • {(state as any).pos || 'bl'}</div>
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Preview simulasi — data real di OBS (<code className="bg-white/10 px-1 rounded text-white">…/event/display?obs=1</code>) via socket.</div>
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

export default function EventPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <EventSettingsInner />
    </Suspense>
  );
}
