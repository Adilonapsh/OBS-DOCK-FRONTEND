'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ExternalLink, Monitor, Sparkles, RefreshCw, GripVertical, MessageSquare } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useChatSettings } from './hooks/useChatSettings';
import { useCopy } from '../_shared/hooks/useCopy';
import { buildChatUrl } from './config';
import { WidgetShell } from '../_shared/components/WidgetShell';
import { UrlBar } from '../_shared/components/UrlBar';
import { ChatSettingsForm } from './components/ChatSettingsForm';
import { ChatPreview } from './components/ChatPreview';
import { KEYFRAMES_CSS } from '../_shared/constants/animations';
import { getPositionStyle } from '../_shared/constants/positions';

function ChatSettingsInner() {
  const supabase = createClient();
  const { state, update, reset, privateKey, setPrivateKey, loadFromUrl } = useChatSettings();
  const { copied, copy } = useCopy();
  const [user, setUser] = useState<unknown>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoadPopup, setShowLoadPopup] = useState(false);
  const [loadUrl, setLoadUrl] = useState('');
  const [showDefaultsConfirm, setShowDefaultsConfirm] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  const widgetUrl = useMemo(() => buildChatUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/chat/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  const previewUrl = useMemo(() => buildChatUrl('/widgets/chat/display', state), [state]);

  const handleCopy = () => copy(obsUrl);
  const handleLoad = () => {
    try {
      loadFromUrl(loadUrl);
      setShowLoadPopup(false);
    } catch {
      alert('URL tidak valid');
    }
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
        headerIcon={<MessageSquare className="w-4 h-4 text-white" />}
        title={
          <>
            Chat Overlay <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white text-black rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Live</span>
          </>
        }
        subtitle="TikTok + Streamer.bot (Twitch / YouTube / Kick) — via server.ts tiktok-chat"
        headerActions={
          <>
            <button onClick={() => setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </>
        }
        urlBar={<UrlBar obsUrl={obsUrl} showKey={showKey} onToggleKey={toggleShowKey} copied={copied} onCopy={handleCopy} />}
        settingsPanel={<ChatSettingsForm state={state} update={update} reset={reset} privateKey={privateKey} onCopy={handleCopy} />}
        previewPanel={
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview — {state.theme} • {state.anim}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • {state.maxMessages} msgs • OBS = data real</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px] p-4 flex" style={getPositionStyle((state as any).pos || 'bl') as any}>
              <ChatPreview state={state} />
              <div className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/60 backdrop-blur px-2 py-1 rounded-full text-white/60 border border-white/10 pointer-events-none">SIMULASI • {state.theme} • {state.font} • pos:{(state as any).pos || 'bl'} {state.horizontal ? '• HORIZONTAL' : ''}</div>
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Preview simulasi — data real hanya di OBS (<code className="bg-white/10 px-1 rounded text-white">…/chat/display?obs=1</code>) yang terhubung via socket.</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <a href={obsUrl} target="_blank" className="h-9 bg-white text-black rounded-xl font-black uppercase flex items-center justify-center gap-1.5"><Monitor className="w-3 h-3" /> Buka OBS (real)</a>
              <Link href="/widgets" className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">Widgets</Link>
              <button onClick={() => window.open(previewUrl, '_blank')} className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white"><ExternalLink className="w-3 h-3" /> Popout Style</button>
            </div>
          </>
        }
      />

      {showLoadPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowLoadPopup(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[480px] space-y-4">
            <h2 className="text-white font-black">Load Settings</h2>
            <p className="text-xs text-gray-500">Paste widget URL yang sudah ada</p>
            <input value={loadUrl} onChange={(e) => setLoadUrl(e.target.value)} placeholder="https://.../widgets/chat/display?..." className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
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
            <p className="text-xs text-gray-500">Reset style ke defaults?</p>
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

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <ChatSettingsInner />
    </Suspense>
  );
}
