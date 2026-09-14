'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import StandardTheme from '../themes/Standard';
import MinimalTheme from '../themes/Minimal';
import CuteTheme from '../themes/Cute';

function normPlatform(p?: string): string {
  const v = (p || '').toLowerCase();
  if (v.includes('twitch')) return 'twitch';
  if (v.includes('youtube') || v === 'yt') return 'youtube';
  if (v.includes('kick')) return 'kick';
  return 'tiktok';
}

function VcIdle({ active, accent, children }: { active: boolean; accent: string; children: React.ReactNode }) {
  if (!active) return <>{children}</>;
  return (
    <div className="vc-idle" style={{ '--vc-accent': accent } as React.CSSProperties}>
      <div className="vc-idle-inner">{children}</div>
    </div>
  );
}

function ViewCounterInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const fontSize = Math.max(12, Math.min(96, getIntParam(params, 'fontSize', 28)));
  const accent = getStringParam(params, 'accent', '#8b5cf6');
  const bg = getStringParam(params, 'bg', '#000000');
  const showLabel = getBoolParam(params, 'showLabel', true);
  const showBreakdown = getBoolParam(params, 'showBreakdown', true);
  const inline = getBoolParam(params, 'inline', false);
  const idleFx = getStringParam(params, 'idleFx', 'none');
  const pos = getStringParam(params, 'pos', 'bl');
  const posStyle = getPositionStyle(pos);

  const [counts, setCounts] = useState<Record<string, number>>((): Record<string, number> =>
    simulate ? { tiktok: 1284, twitch: 342, youtube: 517 } : {},
  );
  const [connected, setConnected] = useState(simulate);

  useEffect(() => loadGoogleFont(font, '400;700;900', 'vc-font'), [font]);

  useEffect(() => {
    if (simulate) return; // mode simulate — demo data lokal, tidak perlu socket
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    socket.on('connect', () => { setConnected(true); socket.emit('join-room', room); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('tiktok-roomUser', (data: Record<string, unknown>) => {
      const d = data as { viewerCount?: number; totalUser?: number };
      const n = Number(d.viewerCount ?? d.totalUser);
      if (!Number.isNaN(n)) setCounts((prev) => ({ ...prev, tiktok: n }));
    });
    socket.on('sb-viewers', (data: Record<string, unknown>) => {
      const d = data as { platform?: string; viewers?: number };
      const n = Number(d.viewers);
      if (!Number.isNaN(n)) setCounts((prev) => ({ ...prev, [normPlatform(d.platform)]: n }));
    });
    return () => { socket.disconnect(); };
  }, [privateKey, simulate]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const fontFamily = `'${font}', sans-serif`;
  const emptyLabel = simulate ? '' : connected ? 'Menunggu data…' : 'Menghubungkan…';
  const themeProps = { counts, total, font, fontSize, accent, bg, showLabel, showBreakdown, inline, emptyLabel };

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent" style={{ fontFamily }}>
      <style>{`.vc-font { font-family: '${font}', sans-serif; }
        .vc-idle { position: relative; padding: 2px; border-radius: 999px; overflow: hidden; }
        .vc-idle::before { content: ''; position: absolute; inset: -60%; background: conic-gradient(from 0deg, transparent 0%, var(--vc-accent, #8b5cf6) 15%, transparent 32%, transparent 55%, var(--vc-accent, #8b5cf6) 70%, transparent 88%); animation: vcSpin 3s linear infinite; }
        .vc-idle > .vc-idle-inner { position: relative; border-radius: 999px; }
        @keyframes vcSpin { to { transform: rotate(360deg); } }`}</style>
      <div className="w-full h-full flex" style={posStyle as React.CSSProperties}>
        <VcIdle active={idleFx === 'gradient'} accent={accent}>
          {theme === 'minimal' ? (
            <MinimalTheme {...themeProps} />
          ) : theme === 'cute' ? (
            <CuteTheme {...themeProps} />
          ) : (
            <StandardTheme {...themeProps} />
          )}
        </VcIdle>
        {!obsMode && !simulate && !connected && rows.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">Menghubungkan…</div>
        )}
      </div>
    </div>
  );
}

export default function ViewCounterDisplayPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-transparent" />}>
      <ViewCounterInner />
    </Suspense>
  );
}
