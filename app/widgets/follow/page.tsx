'use client';

import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import { ExternalLink, Monitor, Sparkles, RefreshCw, Heart } from 'lucide-react';
import { useFollowSettings } from './hooks/useFollowSettings';
import { useWidgetPageShell } from '../_shared/hooks/useWidgetPage';
import { WidgetPageModals, toggleShowKey } from '../_shared/components/WidgetPageModals';
import { buildFollowUrl } from './config';
import { WidgetShell } from '../_shared/components/WidgetShell';
import { UrlBar } from '../_shared/components/UrlBar';
import { FollowSettingsForm } from './components/FollowSettingsForm';
import { FollowPreview } from './components/FollowPreview';
import { KEYFRAMES_CSS } from '../_shared/constants/animations';
import { getPositionStyle } from '../_shared/constants/positions';

function FollowSettingsInner() {
  const { state, update, reset, privateKey, loadFromUrl } = useFollowSettings();
  const shell = useWidgetPageShell(loadFromUrl);

  const widgetUrl = useMemo(() => buildFollowUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/follow/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  const previewUrl = useMemo(() => buildFollowUrl('/widgets/follow/display', state), [state]);

  const handleCopy = () => shell.copy(obsUrl);

  return (
    <>
      <style>{KEYFRAMES_CSS}</style>
      <WidgetShell
        sidebarOpen={shell.sidebarOpen}
        setSidebarOpen={shell.setSidebarOpen}
        user={shell.user}
        headerIcon={<Heart className="w-4 h-4 text-white fill-white" />}
        title={<>Follow Overlay <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-pink-500 text-white rounded-full"><Heart className="w-3 h-3 fill-white" /> Live</span></>}
        subtitle="Follow alert + suara — dari server.ts tiktok-follow/member (TikTok + Streamer.bot)"
        headerActions={
          <>
            <button onClick={() => shell.setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => shell.setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </>
        }
        urlBar={<UrlBar obsUrl={obsUrl} showKey={shell.showKey} onToggleKey={() => toggleShowKey(shell, obsUrl)} copied={shell.copied} onCopy={handleCopy} />}
        settingsPanel={<FollowSettingsForm state={state} update={update} reset={reset} privateKey={privateKey} onCopy={handleCopy} />}
        previewPanel={
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview — {state.theme} • {state.anim} • pos:{(state as any).pos || 'bl'}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • {state.maxFollows} follows • suara {(state as unknown as { soundEnabled: boolean }).soundEnabled ? 'ON' : 'OFF'} • pos:{(state as any).pos || 'bl'}</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px] p-4 flex" style={getPositionStyle((state as any).pos || 'bl') as any}>
              <FollowPreview state={state} />
              <div className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/60 backdrop-blur px-2 py-1 rounded-full text-white/60 border border-white/10 pointer-events-none">SIMULASI • {state.theme} • suara • pos:{(state as any).pos || 'bl'}</div>
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Preview simulasi — data real di OBS (<code className="bg-white/10 px-1 rounded text-white">…/follow/display?obs=1</code>) + suara (allow audio di Browser Source).</div>
          </>
        }
      />

      <WidgetPageModals shell={shell} onReset={reset} />
    </>
  );
}

export default function FollowPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <FollowSettingsInner />
    </Suspense>
  );
}
