'use client';

import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import { ExternalLink, Monitor, RefreshCw, GripVertical, Share2 } from 'lucide-react';
import { useSocialRotatorSettings } from './hooks/useSocialRotatorSettings';
import { useWidgetPageShell } from '../_shared/hooks/useWidgetPage';
import { WidgetPageModals, toggleShowKey } from '../_shared/components/WidgetPageModals';
import { buildSocialRotatorUrl } from './config';
import { WidgetShell } from '../_shared/components/WidgetShell';
import { UrlBar } from '../_shared/components/UrlBar';
import { SocialRotatorSettingsForm } from './components/SocialRotatorSettingsForm';
import { KEYFRAMES_CSS } from '../_shared/constants/animations';
import { getPositionStyle } from '../_shared/constants/positions';

function SocialRotatorInner() {
  const { state, update, reset, privateKey, loadFromUrl } = useSocialRotatorSettings();
  const shell = useWidgetPageShell(loadFromUrl);

  const widgetUrl = useMemo(() => buildSocialRotatorUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/social-rotator/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  const previewUrl = useMemo(() => buildSocialRotatorUrl('/widgets/social-rotator/display', state), [state]);
  const simulateUrl = useMemo(() => `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}simulate=1`, [previewUrl]);

  const handleCopy = () => shell.copy(obsUrl);

  return (
    <>
      <style>{KEYFRAMES_CSS}</style>
      <WidgetShell
        sidebarOpen={shell.sidebarOpen}
        setSidebarOpen={shell.setSidebarOpen}
        user={shell.user}
        headerIcon={<Share2 className="w-4 h-4 text-white" />}
        title={<>Social Rotator <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white text-black rounded-full">Rotasi</span></>}
        subtitle="Rotasi handle sosial - Instagram/TikTok/YouTube/Twitch/Discord, 4 tema, interval 2-20s, posisi global"
        headerActions={
          <>
            <button onClick={() => shell.setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => shell.setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </>
        }
        urlBar={<UrlBar obsUrl={obsUrl} showKey={shell.showKey} onToggleKey={() => toggleShowKey(shell, obsUrl)} copied={shell.copied} onCopy={handleCopy} />}
        settingsPanel={<SocialRotatorSettingsForm state={state} update={update} />}
        previewPanel={
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview - {state.theme} • simulate • pos:{(state as any).pos || 'bl'}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • {state.duration}s • pos:{(state as any).pos || 'bl'}</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[280px] flex p-4" style={getPositionStyle((state as any).pos || 'bl') as any}>
              <div className="absolute inset-2 border border-white/5 rounded-xl pointer-events-none opacity-15">
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-1">
                  {(['tl','t','tr','l','center','r','bl','b','br'] as const).map((p) => (
                    <div key={p} className={`rounded-md ${(state as any).pos === p || ((state as any).pos || 'bl') === p ? 'bg-white/10 border border-white/20' : 'bg-white/[0.03]'}`} />
                  ))}
                </div>
              </div>
              <iframe key={simulateUrl} src={simulateUrl} className="relative w-full h-full border-0 bg-transparent" title="social-rotator-preview" />
              <div className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/60 backdrop-blur px-2 py-1 rounded-full text-white/60 border border-white/10 pointer-events-none">SIMULATE • {state.theme} • pos:{(state as any).pos || 'bl'}</div>
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Live preview & OBS pakai <code className="bg-white/10 px-1 rounded text-white">.../social-rotator/display</code> yang sama - posisi global (t,l,b,r, tl/tr/bl/br) langsung tersimulasi.</div>
          </>
        }
      />
      <WidgetPageModals shell={shell} onReset={reset} />
    </>
  );
}

export default function SocialRotatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <SocialRotatorInner />
    </Suspense>
  );
}
