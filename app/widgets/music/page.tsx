'use client';

import { useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { io, type Socket } from 'socket.io-client';
import { ExternalLink, Monitor, Music } from 'lucide-react';
import { useMusicSettings } from './hooks/useMusicSettings';
import { useWidgetPageShell } from '../_shared/hooks/useWidgetPage';
import { WidgetPageModals, toggleShowKey } from '../_shared/components/WidgetPageModals';
import { buildMusicUrl } from './config';
import { WidgetShell } from '../_shared/components/WidgetShell';
import { UrlBar } from '../_shared/components/UrlBar';
import { MusicSettingsForm } from './components/MusicSettingsForm';
import { normalizePosition } from '../_shared/constants/positions';
import { getSocketUrl } from '../_shared/utils/socket';

function MusicSettingsInner() {
  const { state, update, reset, privateKey, loadFromUrl } = useMusicSettings();
  const shell = useWidgetPageShell(loadFromUrl);
  const songSocket = useRef<Socket | null>(null);
  const hydrated = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sinkron setting request (command/filter/blacklist) ke server.
  // Muat sekali dari server, dorong perubahan dengan debounce.
  useEffect(() => {
    const s = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    songSocket.current = s;
    const room = privateKey || 'global';
    s.on('connect', () => {
      s.emit('join-room', room);
      s.emit('song-get', { privateKey: room });
    });
    s.on('song-update', (st: any) => {
      if (hydrated.current || !st?.settings) return;
      hydrated.current = true;
      const sv = st.settings;
      if (typeof sv.command === 'string' && sv.command !== state.command) update('command', sv.command);
      if (typeof sv.nsfwFilter === 'boolean' && sv.nsfwFilter !== state.nsfwFilter) update('nsfwFilter', sv.nsfwFilter);
      if (Array.isArray(sv.blacklist)) {
        const text = sv.blacklist.join('\n');
        if (text !== state.songBlacklist) update('songBlacklist', text);
      }
    });
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      s.disconnect();
      songSocket.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privateKey]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      songSocket.current?.emit('song-settings', {
        privateKey: privateKey || 'global',
        command: state.command,
        nsfwFilter: state.nsfwFilter,
        blacklist: String(state.songBlacklist || '').split('\n'),
      });
    }, 800);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [state.command, state.nsfwFilter, state.songBlacklist, privateKey]);

  const widgetUrl = useMemo(() => buildMusicUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/music/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  const previewUrl = useMemo(() => {
    const base = buildMusicUrl('/widgets/music/display', state);
    return `${base}${base.includes('?') ? '&' : '?'}simulate=1`;
  }, [state]);
  const simulateUrl = previewUrl;

  const handleCopy = () => shell.copy(obsUrl);

  return (
    <>
      <WidgetShell
        sidebarOpen={shell.sidebarOpen}
        setSidebarOpen={shell.setSidebarOpen}
        user={shell.user}
        headerIcon={<Music className="w-4 h-4 text-white" />}
        title={<>Music / Song Request</>}
        subtitle="Now playing + queue lagu — audio diputar di OBS via widget display"
        headerActions={
          <>
            <button onClick={() => shell.setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Defaults</button>
            <button onClick={() => shell.setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </>
        }
        urlBar={<UrlBar obsUrl={obsUrl} showKey={shell.showKey} onToggleKey={() => toggleShowKey(shell, obsUrl)} copied={shell.copied} onCopy={handleCopy} />}
        settingsPanel={<MusicSettingsForm state={state} update={update} />}
        previewPanel={
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview — {state.theme} • pos:{normalizePosition((state as unknown as { pos: string }).pos || 'bl')}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • !song &lt;url&gt;</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px]">
              <iframe key={simulateUrl} src={simulateUrl} className="absolute inset-0 w-full h-full border-0 bg-transparent" title="music-preview" />
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Tambah lagu via chat !song &lt;url&gt; (YouTube / MP3). Kontrol play / next dari dock.</div>
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

export default function MusicPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <MusicSettingsInner />
    </Suspense>
  );
}
