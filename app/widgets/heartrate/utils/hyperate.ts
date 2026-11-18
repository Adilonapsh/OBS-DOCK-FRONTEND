// Hyperate client - 1:1 dengan source resmi hyperate (object protocol, bukan array)
// WS: wss://app.hyperate.io/socket/websocket?token=bnQ1FoJmfiRprrSUJzrFxt8x8BbllHyqIWq4LsRjV7aCrLuLot6QyCQM9NZRkd9z
// -> {topic:"hr:99c877", event:"phx_join", payload:{}, ref:1}
// <- {topic:"hr:99c877", event:"phx_reply", payload:{status:"ok",response:{}}, ref:1}
// <- {topic:"hr:99c877", event:"hr_update", payload:{hr:74}}  (topic filter wajib)
// heartbeat: {topic:"phoenix", event:"heartbeat", payload:{}, ref:2} tiap 30_000 ms

export const HYPERATE_WS_BASE = 'wss://app.hyperate.io/socket/websocket';
export const HYPERATE_DEFAULT_TOKEN = 'bnQ1FoJmfiRprrSUJzrFxt8x8BbllHyqIWq4LsRjV7aCrLuLot6QyCQM9NZRkd9z';
export const HR_MIN = 25;
export const HR_MAX = 230;
export const HEARTBEAT_MS = 30_000;

export type HyperateParsed = {
  channelId: string;
  wsUrl: string | null;
  token: string | null;
};

export function parseHyperateInput(raw: string): HyperateParsed {
  const v = raw.trim();
  if (!v) return { channelId: '', wsUrl: null, token: null };
  if (v.startsWith('wss://') || v.startsWith('ws://')) {
    try {
      const u = new URL(v);
      const token = u.searchParams.get('token') || null;
      const pathId = u.pathname.split('/').filter(Boolean).pop() || '';
      const channelId = pathId.startsWith('hr:') ? pathId.slice(3) : '';
      return { channelId, wsUrl: v, token };
    } catch {
      return { channelId: '', wsUrl: v, token: null };
    }
  }
  const cleaned = v.replace(/^hr:/, '');
  if (cleaned.length > 24 && /^[A-Za-z0-9+/=_-]+$/.test(cleaned)) {
    return { channelId: '', wsUrl: null, token: cleaned };
  }
  return { channelId: cleaned, wsUrl: null, token: null };
}

export function normalizeBpm(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < HR_MIN || rounded > HR_MAX) return null;
  return rounded;
}

export function getChannelIdFromPath(): string {
  if (typeof window === 'undefined') return 'internal-testing';
  const segs = window.location.pathname.replace(/\/+$/, '').split('/');
  const last = segs[segs.length - 1] || '';
  try { return decodeURIComponent(last) || 'internal-testing'; } catch { return last || 'internal-testing'; }
}

export type HyperateController = {
  connect: () => void;
  disconnect: () => void;
  onHr: (cb: (hr: number) => void) => () => void;
  onStatus: (cb: (s: string) => void) => () => void;
  getChannelId: () => string;
};

export type CreateHyperateOpts = string | { channelId?: string | null; wsUrl?: string | null; token?: string | null };

function resolveOpts(input: CreateHyperateOpts): { channelId: string; wsUrl: string | null; token: string | null } {
  if (typeof input === 'string') {
    const p = parseHyperateInput(input);
    if (p.wsUrl) return { channelId: p.channelId, wsUrl: p.wsUrl, token: p.token };
    if (p.token) return { channelId: '', wsUrl: null, token: p.token };
    return { channelId: p.channelId, wsUrl: null, token: null };
  }
  return {
    channelId: (input.channelId || '').replace(/^hr:/, ''),
    wsUrl: input.wsUrl || null,
    token: input.token || null,
  };
}

export function createHyperateClient(input: CreateHyperateOpts): HyperateController & { channelId: string } {
  let { channelId: rawChannelId, wsUrl: rawWsUrl, token: rawToken } = resolveOpts(input);

  let channelId = rawChannelId;
  let wsUrl: string | null = rawWsUrl;
  let token: string | null = rawToken;

  // fallback: baca Connection jika kosong - agar widget tanpa param tetap pakai Connection
  if (typeof window !== 'undefined' && (!channelId || !wsUrl)) {
    try {
      const cfgRaw = localStorage.getItem('hyperate-config');
      if (cfgRaw) {
        const cfg = JSON.parse(cfgRaw) as { channelId?: string; id?: string; wsUrl?: string; tokenUrl?: string; token?: string };
        const cfgChannel = (cfg.channelId || cfg.id || '').replace(/^hr:/, '');
        const cfgWs = cfg.wsUrl || cfg.tokenUrl || '';
        const cfgTok = cfg.token || null;
        if (!channelId && cfgChannel) channelId = cfgChannel;
        if (!wsUrl && cfgWs) wsUrl = cfgWs;
        if (!token && cfgTok) token = cfgTok;
        // jika wsUrl masih kosong tapi token ada di wsUrl query
        if (!token && wsUrl) {
          try { token = new URL(wsUrl).searchParams.get('token'); } catch {}
        }
      }
    } catch {}
  }

  // jika channelId masih kosong, coba ambil dari path seperti source resmi (internal-testing fallback)
  if (!channelId && typeof window !== 'undefined') {
    const pathId = getChannelIdFromPath();
    // hanya pakai pathId jika terlihat seperti hyperate id (alnum 3-20), bukan "display" / "heartrate"
    if (pathId && !['display', 'heartrate', 'widgets', 'connection'].includes(pathId)) {
      channelId = pathId;
    }
  }

  if (!wsUrl && token) wsUrl = `${HYPERATE_WS_BASE}?token=${encodeURIComponent(token)}`;
  if (!wsUrl) wsUrl = `${HYPERATE_WS_BASE}?token=${encodeURIComponent(HYPERATE_DEFAULT_TOKEN)}`;
  if (wsUrl && token && !wsUrl.includes('token=')) {
    const sep = wsUrl.includes('?') ? '&' : '?';
    wsUrl = `${wsUrl}${sep}token=${encodeURIComponent(token)}`;
  }

  let ws: WebSocket | null = null;
  let messageRef = 1;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let shouldReconnect = true;

  // smooth BPM (mirip source: BASELINE 0, step 1 tiap 30ms)
  let currentBPM = 0;
  let targetBPM = 0;
  let smoothTimer: ReturnType<typeof setInterval> | null = null;

  const hrCbs = new Set<(hr: number) => void>();
  const statusCbs = new Set<(s: string) => void>();
  const emitStatus = (s: string) => statusCbs.forEach((cb) => cb(s));
  const emitHrImmediate = (hr: number) => hrCbs.forEach((cb) => cb(hr));

  const startSmooth = (bpm: number) => {
    const norm = normalizeBpm(bpm);
    if (norm == null) return;
    if (norm === targetBPM) return;
    targetBPM = norm;
    if (smoothTimer) clearInterval(smoothTimer);
    const step = targetBPM > currentBPM ? 1 : -1;
    smoothTimer = setInterval(() => {
      if (currentBPM !== targetBPM) {
        currentBPM += step;
        emitHrImmediate(currentBPM);
      } else {
        if (smoothTimer) clearInterval(smoothTimer);
        smoothTimer = null;
      }
    }, 30);
  };

  const sendHeartbeat = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: messageRef++ }));
    }
  };

  const joinChannel = () => {
    if (ws?.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ topic: `hr:${channelId}`, event: 'phx_join', payload: {}, ref: messageRef++ }));
  };

  const leaveChannel = () => {
    try {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ topic: `hr:${channelId}`, event: 'phx_leave', payload: {}, ref: messageRef++ }));
      }
    } catch {}
  };

  const connect = () => {
    if (!channelId) { emitStatus('no-id'); return; }
    if (!wsUrl) { emitStatus('no-token'); return; }
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    shouldReconnect = true;
    try { ws?.close(); } catch {}
    if (heartbeatTimer) clearInterval(heartbeatTimer);

    ws = new WebSocket(wsUrl);
    emitStatus('connecting');

    ws.onopen = () => {
      emitStatus('connected');
      joinChannel();
      heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_MS);
    };

    ws.onmessage = (evt) => {
      let msg: { topic?: string; event?: string; payload?: { hr?: unknown; status?: string }; ref?: unknown } | null = null;
      try { msg = JSON.parse(evt.data as string); } catch { return; }
      if (!msg) return;
      // hanya untuk channel kita - persis seperti source: if (msg.topic !== hr:channelId) return
      // tapi biarkan phoenix heartbeat lewat tanpa filter? source filter ketat, kita ikuti.
      if (msg.topic !== `hr:${channelId}`) {
        // abaikan, kecuali phx_reply untuk join kita tetap di hr:channelId
        return;
      }
      const bpm = normalizeBpm((msg.payload as { hr?: unknown })?.hr);
      if (bpm == null) return;
      // event bisa hr_update atau apapun yang bawa hr - source tidak cek event, hanya payload.hr
      startSmooth(bpm);
      emitStatus('live');
    };

    ws.onerror = () => emitStatus('error');

    ws.onclose = () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = null;
      ws = null;
      if (!shouldReconnect) { emitStatus('closed'); return; }
      emitStatus('reconnecting');
      reconnectTimer = setTimeout(() => connect(), 3000);
    };
  };

  const disconnect = () => {
    shouldReconnect = false;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (smoothTimer) clearInterval(smoothTimer);
    try { leaveChannel(); } catch {}
    try { ws?.close(); } catch {}
    ws = null;
    emitStatus('disconnected');
  };

  // cleanup seperti source
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      try { leaveChannel(); } catch {}
      try { ws?.close(); } catch {}
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (smoothTimer) clearInterval(smoothTimer);
    });
  }

  return {
    channelId,
    getChannelId: () => channelId,
    connect,
    disconnect,
    onHr: (cb) => { hrCbs.add(cb); return () => hrCbs.delete(cb); },
    onStatus: (cb) => { statusCbs.add(cb); return () => statusCbs.delete(cb); },
  };
}
