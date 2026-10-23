'use client';

import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import { ExternalLink, Monitor, RefreshCw, GripVertical, Trophy } from 'lucide-react';
import { useDonationLeaderboardSettings } from './hooks/useDonationLeaderboardSettings';
import { useWidgetPageShell } from '../_shared/hooks/useWidgetPage';
import { WidgetPageModals, toggleShowKey } from '../_shared/components/WidgetPageModals';
import { buildDonationLeaderboardUrl } from './config';
import { WidgetShell } from '../_shared/components/WidgetShell';
import { UrlBar } from '../_shared/components/UrlBar';
import { DonationLeaderboardSettingsForm } from './components/DonationLeaderboardSettingsForm';

function DonationLeaderboardSettingsInner() {
  const { state, update, reset, privateKey, loadFromUrl } = useDonationLeaderboardSettings();
  const shell = useWidgetPageShell(loadFromUrl);

  const widgetUrl = useMemo(() => buildDonationLeaderboardUrl(typeof window !== 'undefined' ? `${window.location.origin}/widgets/donation-leaderboard/display` : '', state) + (privateKey ? `&key=${privateKey}` : ''), [state, privateKey]);
  const obsUrl = useMemo(() => `${widgetUrl}&obs=1`, [widgetUrl]);
  const previewUrl = useMemo(() => buildDonationLeaderboardUrl('/widgets/donation-leaderboard/display', state), [state]);
  const simulateUrl = useMemo(() => `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}simulate=1`, [previewUrl]);

  const handleCopy = () => shell.copy(obsUrl);

  return (
    <>
      <WidgetShell
        sidebarOpen={shell.sidebarOpen}
        setSidebarOpen={shell.setSidebarOpen}
        user={shell.user}
        headerIcon={<Trophy className="w-4 h-4 text-white" />}
        title="Donation Leaderboard"
        subtitle="Top donatur — agregat donasi per room (Saweria/TipTap/dll)"
        headerActions={
          <>
            <button onClick={() => shell.setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => shell.setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </>
        }
        urlBar={<UrlBar obsUrl={obsUrl} showKey={shell.showKey} onToggleKey={() => toggleShowKey(shell, obsUrl)} copied={shell.copied} onCopy={handleCopy} />}
        settingsPanel={<DonationLeaderboardSettingsForm state={state} update={update} reset={reset} privateKey={privateKey} onCopy={handleCopy} />}
        previewPanel={
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview - {state.theme} • Top {state.limit}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} • {state.fontSize}px • OBS = transparan</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px] grid place-items-center p-4">
              <iframe key={simulateUrl} src={simulateUrl} className="absolute inset-0 w-full h-full border-0 bg-transparent" title="leaderboard-preview" />
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Leaderboard session (50 donasi terakhir). Tempel URL OBS sebagai Browser Source.</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <a href={obsUrl} target="_blank" className="h-9 bg-white text-black rounded-xl font-black uppercase flex items-center justify-center gap-1.5"><Monitor className="w-3 h-3" /> Buka OBS</a>
              <Link href="/widgets" className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">Widgets</Link>
              <button onClick={() => window.open(previewUrl, '_blank')} className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white"><ExternalLink className="w-3 h-3" /> Popout</button>
            </div>
            <a
              href={obsUrl}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData('text/plain', obsUrl); e.dataTransfer.setData('text/uri-list', obsUrl); e.dataTransfer.effectAllowed = 'copy'; }}
              title="Tahan & drag langsung ke OBS Sources"
              className="mt-2 h-9 flex items-center justify-center gap-1.5 bg-white text-black border border-dashed border-zinc-300 hover:border-white rounded-xl text-[10px] font-black uppercase cursor-grab active:cursor-grabbing select-none"
            >
              <GripVertical className="w-3.5 h-3.5" /> Drag ke OBS
            </a>
          </>
        }
      />

      <WidgetPageModals shell={shell} onReset={reset} />
    </>
  );
}

export default function DonationLeaderboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <DonationLeaderboardSettingsInner />
    </Suspense>
  );
}
