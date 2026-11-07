'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import { parseBrutalistParams } from '../../_shared/constants/brutalist';
import { AutoScale } from '../../_shared/components/AutoScale';
import { HeartratePreview } from '../components/HeartratePreview';
import { createHyperateClient } from '../utils/hyperate';
import type { HeartrateSettings } from '../config';
import { HEARTRATE_DEFAULTS } from '../config';

function HeartrateInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);

  const theme = getStringParam(params, 'theme', HEARTRATE_DEFAULTS.theme);
  const font = getStringParam(params, 'font', HEARTRATE_DEFAULTS.font);
  const fontSize = getIntParam(params, 'fontSize', HEARTRATE_DEFAULTS.fontSize);
  const accent = getStringParam(params, 'accent', HEARTRATE_DEFAULTS.accent);
  const bg = getStringParam(params, 'bg', HEARTRATE_DEFAULTS.bg);
  const bgOpacity = getIntParam(params, 'bgOpacity', HEARTRATE_DEFAULTS.bgOpacity);
  const textColor = getStringParam(params, 'textColor', HEARTRATE_DEFAULTS.textColor);
  const pos = getStringParam(params, 'pos', HEARTRATE_DEFAULTS.pos);
  const hyperateIdParam = getStringParam(params, 'hyperateId', HEARTRATE_DEFAULTS.hyperateId);
  const hyperateWsParam = getStringParam(params, 'hyperateWs', (HEARTRATE_DEFAULTS as unknown as { hyperateWs: string }).hyperateWs || '');
  const label = getStringParam(params, 'label', HEARTRATE_DEFAULTS.label);
  const unit = getStringParam(params, 'unit', HEARTRATE_DEFAULTS.unit);
  const showLabel = getBoolParam(params, 'showLabel', HEARTRATE_DEFAULTS.showLabel);
  const showUnit = getBoolParam(params, 'showUnit', HEARTRATE_DEFAULTS.showUnit);
  const showIcon = getBoolParam(params, 'showIcon', HEARTRATE_DEFAULTS.showIcon);
  const iconStyle = getStringParam(params, 'iconStyle', HEARTRATE_DEFAULTS.iconStyle);
  const lowBpm = getIntParam(params, 'lowBpm', HEARTRATE_DEFAULTS.lowBpm);
  const highBpm = getIntParam(params, 'highBpm', HEARTRATE_DEFAULTS.highBpm);
  const lowColor = getStringParam(params, 'lowColor', HEARTRATE_DEFAULTS.lowColor);
  const midColor = getStringParam(params, 'midColor', HEARTRATE_DEFAULTS.midColor);
  const highColor = getStringParam(params, 'highColor', HEARTRATE_DEFAULTS.highColor);
  const anim = getStringParam(params, 'anim', HEARTRATE_DEFAULTS.anim);
  const showHistory = getBoolParam(params, 'showHistory', HEARTRATE_DEFAULTS.showHistory);
  const historyLength = getIntParam(params, 'historyLength', HEARTRATE_DEFAULTS.historyLength);
  const borderRadius = getIntParam(params, 'borderRadius', HEARTRATE_DEFAULTS.borderRadius);
  const padding = getIntParam(params, 'padding', HEARTRATE_DEFAULTS.padding);
  const alertHigh = getBoolParam(params, 'alertHigh', HEARTRATE_DEFAULTS.alertHigh);
  const alertThreshold = getIntParam(params, 'alertThreshold', HEARTRATE_DEFAULTS.alertThreshold);
  const brutalist = parseBrutalistParams((k) => params.get(k));

  const settings: HeartrateSettings = {
    theme, font, fontSize, accent, bg, bgOpacity, textColor, pos,
    hyperateId: hyperateIdParam, label, unit, showLabel, showUnit, showIcon, iconStyle,
    lowBpm, highBpm, lowColor, midColor, highColor, anim, showHistory, historyLength,
    ...brutalist as unknown as Record<string, unknown>,
    simulate, layout: getStringParam(params, 'layout', 'horizontal'), borderRadius, padding, alertHigh, alertThreshold,
  } as HeartrateSettings;
  // inject ws untuk preview
  (settings as unknown as Record<string, unknown>).hyperateWs = hyperateWsParam;

  const [bpm, setBpm] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('idle');
  const [resolvedChannelId, setResolvedChannelId] = useState(hyperateIdParam);
  const [resolvedWsUrl, setResolvedWsUrl] = useState(hyperateWsParam);
  const clientRef = useRef<ReturnType<typeof createHyperateClient> | null>(null);

  // resolve hyperate: URL param > localStorage (connection page)
  useEffect(() => {
    if (hyperateIdParam && hyperateWsParam) {
      setResolvedChannelId(hyperateIdParam);
      setResolvedWsUrl(hyperateWsParam);
      return;
    }
    if (hyperateIdParam && !hyperateWsParam) {
      // ada id tapi ws kosong, coba cari ws di storage
      setResolvedChannelId(hyperateIdParam);
    }
    try {
      const raw = localStorage.getItem('hyperate-config');
      if (raw) {
        const j = JSON.parse(raw) as { channelId?: string; id?: string; tokenUrl?: string; wsUrl?: string; token?: string };
        const cfgChannel = (j.channelId || j.id || '').replace(/^hr:/, '');
        const cfgWs = j.tokenUrl || j.wsUrl || j.token || '';
        if (!hyperateIdParam && cfgChannel) setResolvedChannelId(cfgChannel);
        if (!hyperateWsParam && cfgWs) setResolvedWsUrl(cfgWs);
        else if (cfgWs && hyperateIdParam && !hyperateWsParam) setResolvedWsUrl(cfgWs);
      }
    } catch {}
    try {
      const bId = sessionStorage.getItem('hyperate-id');
      const bTok = sessionStorage.getItem('hyperate-token');
      if (bId && !hyperateIdParam) setResolvedChannelId(bId.replace(/^hr:/, ''));
      if (bTok && !hyperateWsParam) setResolvedWsUrl(bTok);
    } catch {}
  }, [hyperateIdParam, hyperateWsParam]);

  useEffect(() => { loadGoogleFont(font, '400;700;900', 'heartrate-font'); }, [font]);

  // Socket.io relay
  useEffect(() => {
    if (simulate) return;
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    socket.on('connect', () => { socket.emit('join-room', room); });
    socket.on('heartrate-update', (data: { bpm?: number; hr?: number }) => {
      const v = typeof data?.bpm === 'number' ? data.bpm : data?.hr;
      if (typeof v === 'number' && Number.isFinite(v)) {
        setBpm(Math.round(v));
        setConnected(true);
        setStatus('socket');
      }
    });
    return () => { socket.disconnect(); };
  }, [privateKey, simulate]);

  // Direct Hyperate
  useEffect(() => {
    if (simulate) {
      let cur = 78;
      const t = setInterval(() => {
        cur += Math.round((Math.random() - 0.5) * 8);
        cur = Math.max(62, Math.min(168, cur));
        setBpm(cur);
        setConnected(true);
        setStatus('simulate');
      }, 1200);
      return () => clearInterval(t);
    }
    if (!resolvedChannelId) { setStatus('no-id'); return; }
    if (!resolvedWsUrl) { setStatus('no-token'); return; }
    let client: ReturnType<typeof createHyperateClient>;
    try {
      client = createHyperateClient({ channelId: resolvedChannelId, wsUrl: resolvedWsUrl });
    } catch { return; }
    clientRef.current = client;
    const offHr = client.onHr((hr) => { setBpm(hr); setConnected(true); });
    const offSt = client.onStatus((s) => setStatus(s));
    client.connect();
    return () => {
      offHr(); offSt();
      client.disconnect();
      clientRef.current = null;
    };
  }, [resolvedChannelId, resolvedWsUrl, simulate]);

  const isAlert = alertHigh && bpm !== null && bpm >= alertThreshold;
  const posStyle = getPositionStyle(pos);

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;700;900&display=swap'); html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; } ${isAlert ? '@keyframes alertBlink{0%,100%{filter:brightness(1)}50%{filter:brightness(1.25) drop-shadow(0 0 12px rgba(239,68,68,0.8))}}' : ''} `}</style>
      <div
        id="heartrate-display-root"
        className={`${obsMode ? `fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-2` : `w-full min-h-screen bg-[#0a0a0a] flex p-4`}`}
        style={{ ...posStyle, background: obsMode ? 'transparent' : '#0a0a0a', fontFamily: `'${font}', sans-serif` } as unknown as React.CSSProperties}
      >
        {!obsMode && !connected && bpm === null && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest text-center max-w-[90%]">
            {resolvedChannelId && resolvedWsUrl ? `Menghubungkan Hyperate... ${status} • hr:${resolvedChannelId}` : !resolvedChannelId ? 'Butuh Channel ID (99c877) - isi di Connection' : 'Butuh WebSocket URL (wss://...?token=...) - isi di Connection'} • privateKey={privateKey ? `${privateKey.slice(0, 6)}…` : 'global'}
          </div>
        )}
        {!obsMode && (
          <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">
            HEARTRATE • {theme} • {connected ? (simulate ? 'simulate' : 'live') : status} {bpm !== null ? `• ${bpm} ${unit}` : ''}
          </div>
        )}
        <div style={isAlert ? { animation: 'alertBlink 0.9s ease-in-out infinite' } : undefined}>
          <AutoScale defaultBase={420} baseWidth={420}>
            <HeartratePreview bpm={bpm} settings={settings} connected={connected} simulate={simulate} />
          </AutoScale>
        </div>
      </div>
    </>
  );
}

export default function HeartrateDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading heartrate…</div>}>
      <HeartrateInner />
    </Suspense>
  );
}
