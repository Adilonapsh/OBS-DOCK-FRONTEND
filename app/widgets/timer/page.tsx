'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { ExternalLink, Monitor, RefreshCw, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useTimerSettings } from './hooks/useTimerSettings';
import { useCopy } from '../_shared/hooks/useCopy';
import { buildTimerUrl } from './config';
import { WidgetShell } from '../_shared/components/WidgetShell';
import { UrlBar } from '../_shared/components/UrlBar';
import { TimerSettingsForm } from './components/TimerSettingsForm';
import { KEYFRAMES_CSS } from '../_shared/constants/animations';
import { normalizePosition } from '../_shared/constants/positions';

function TimerSettingsInner() {
  const supabase = createClient();
  const { state, update, reset, privateKey, loadFromUrl } = useTimerSettings();
  const { copied, copy } = useCopy();
  const [user, setUser] = useState<unknown>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoadPopup, setShowLoadPopup] = useState(false);
  const [loadUrl, setLoadUrl] = useState('');
  const [showDefaultsConfirm, setShowDefaultsConfirm] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUser(data.user)); }, [supabase]);

  const widgetUrl = useMemo(() => buildTimerUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/timer/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  // 1 file untuk OBS + live preview — preview pakai simulate=1 biar 1 source (display/page.tsx)
  const previewUrl = useMemo(() => buildTimerUrl('/widgets/timer/display', state), [state]);
  const simulateUrl = useMemo(() => `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}simulate=1`, [previewUrl]);

  const handleCopy = () => copy(obsUrl);
  const handleLoad = () => {
    try { loadFromUrl(loadUrl); setShowLoadPopup(false); } catch { alert('URL tidak valid'); }
  };
  const toggleShowKey = () => {
    if (!showKey && obsUrl.includes('key=')) setShowKeyConfirm(true);
    else setShowKey((v) => !v);
  };

  return (
    <>
      <style>{KEYFRAMES_CSS}</style>
      <WidgetShell
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        headerIcon={<Clock className="w-4 h-4 text-white" />}
        title={<>Focus Timer <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white text-black rounded-full">Pomodoro</span></>}
        subtitle="Timer 50:00 × 3 sesi — desain Moka #594d4a"
        headerActions={
          <>
            <button onClick={() => setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </>
        }
        urlBar={<UrlBar obsUrl={obsUrl} showKey={showKey} onToggleKey={toggleShowKey} copied={copied} onCopy={handleCopy} />}
        settingsPanel={<TimerSettingsForm state={state} update={update} />}
        previewPanel={
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview — {state.theme} • simulate • pos:{normalizePosition((state as unknown as {pos:string}).pos || 'center')}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • {state.focusMinutes}m • {normalizePosition((state as unknown as {pos:string}).pos || 'center')}</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px]">
              <iframe key={simulateUrl} src={simulateUrl} className="absolute inset-0 w-full h-full border-0 bg-transparent" title="timer-preview" />
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Posisi global (t,l,b,r, tl/tr/bl/br, center) — langsung tersimulasi di live preview & OBS pakai <code className="bg-white/10 px-1 rounded text-white">.../timer/display?pos=...</code> yang sama + <code className="bg-white/10 px-1 rounded text-white">simulate=1</code>.</div>
          </>
        }
      />
      {showLoadPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowLoadPopup(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[480px] space-y-4">
            <h2 className="text-white font-black">Load Settings</h2>
            <input value={loadUrl} onChange={(e) => setLoadUrl(e.target.value)} placeholder="https://.../widgets/timer/display?..." className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <div className="flex gap-3">
              <button onClick={() => setShowLoadPopup(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Cancel</button>
              <button onClick={handleLoad} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-sm font-black text-black border border-white">Load</button>
            </div>
          </div>
        </div>
      )}
      {showDefaultsConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowDefaultsConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[380px] space-y-4 text-center">
            <h2 className="text-white font-black">Load Defaults?</h2>
            <div className="flex gap-3">
              <button onClick={() => setShowDefaultsConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">No</button>
              <button onClick={() => { reset(); setShowDefaultsConfirm(false); }} className="flex-1 h-9 bg-white rounded-xl text-sm font-black text-black border border-white">Yes</button>
            </div>
          </div>
        </div>
      )}
      {showKeyConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowKeyConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[380px] space-y-4 text-center">
            <h2 className="text-white font-black">Tampilkan Private Key?</h2>
            <p className="text-[11px] text-gray-400 leading-relaxed">URL mengandung <span className="text-white font-bold">private key</span> rahasia.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowKeyConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Batal</button>
              <button onClick={() => { setShowKey(true); setShowKeyConfirm(false); }} className="flex-1 h-9 bg-white text-black border border-white rounded-xl text-sm font-black">Tampilkan</button>
            </div>
          </div>
        </div>
      )}
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
