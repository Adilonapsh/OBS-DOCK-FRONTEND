// Client khusus widget Valorant- SEMUA request lewat backend sendiri
// (NEXT_PUBLIC_BACKEND_URL → /api/valo/*), tidak pernah direct ke
// vaccie.pythonanywhere.com supaya bebas CORS di OBS Browser Source.

import { getSocketUrl } from '../../_shared/utils/socket';

export type ValoTier = {
  tierName: string;
  color: string;
  largeIcon: string;
  smallIcon: string;
};

function backendBase(): string {
  return getSocketUrl().replace(/\/$/, '');
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`backend ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractResponse(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && 'response' in (data as Record<string, unknown>)) {
    return String((data as Record<string, unknown>).response || '');
  }
  return typeof data === 'string' ? data : String(data ?? '');
}

export async function fetchValoRank(p: { username: string; tag: string; region: string; platform: string }): Promise<string> {
  const base = backendBase();
  const q = `username=${encodeURIComponent(p.username)}&tag=${encodeURIComponent(p.tag)}&region=${encodeURIComponent(p.region)}&platform=${encodeURIComponent(p.platform)}&lang=en`;
  const data = await getJson(`${base}/api/valo/rank?${q}`);
  return extractResponse(data);
}

export async function fetchValoHistory(p: { username: string; tag: string; region: string; platform: string }): Promise<string> {
  const base = backendBase();
  const q = `username=${encodeURIComponent(p.username)}&tag=${encodeURIComponent(p.tag)}&region=${encodeURIComponent(p.region)}&platform=${encodeURIComponent(p.platform)}`;
  const data = await getJson(`${base}/api/valo/history?${q}`);
  return extractResponse(data);
}

export async function fetchValoMmr(p: { username: string; tag: string; region: string }): Promise<{ text: string; shield: number }> {
  const base = backendBase();
  const q = `username=${encodeURIComponent(p.username)}&tag=${encodeURIComponent(p.tag)}&region=${encodeURIComponent(p.region)}`;
  const data = await getJson(`${base}/api/valo/mmr?${q}`);
  const text = extractResponse(data);
  const m = text.match(/🛡️\s*(\d+)/);
  return { text, shield: m ? parseInt(m[1], 10) : 0 };
}

export async function fetchValoTiers(): Promise<{ tiers: ValoTier[] }> {
  const base = backendBase();
  const data = (await getJson(`${base}/api/valo/tiers`)) as { data?: Array<{ tiers: ValoTier[] }> };
  const list = data?.data;
  if (!list || !Array.isArray(list) || list.length === 0) throw new Error('tiers kosong');
  return { tiers: list[list.length - 1].tiers };
}

export async function fetchValoSeason(): Promise<string> {
  const base = backendBase();
  try {
    const data = (await getJson(`${base}/api/valo/seasons`)) as { data?: Array<{ uuid: string; displayName: string; type: string; parentUuid?: string; startTime: string; endTime: string }> };
    const now = new Date();
    const acts = (data?.data || []).filter((s) => {
      if (s.type !== 'EAresSeasonType::Act') return false;
      const st = new Date(s.startTime);
      const en = new Date(s.endTime);
      return st <= now && en > now;
    });
    if (acts.length === 0) return '';
    const act = acts[0];
    const ep = (data?.data || []).find((s) => s.uuid === act.parentUuid);
    if (ep) return `${ep.displayName.toUpperCase()} · ${act.displayName.toUpperCase()}`;
    return act.displayName.toUpperCase();
  } catch {
    return '';
  }
}

export function parseRankString(rankString: string): { rankName: string; rr: number; shield: number } {
  let rankName = 'Unranked';
  let rr = 0;
  let shield = 0;
  const sm = rankString.match(/🛡️\s*(\d+)/);
  if (sm) shield = parseInt(sm[1], 10);
  const m = rankString.match(/(.*?),\s*RR:\s*(\d+)/i);
  if (m) {
    rankName = m[1].trim();
    rr = parseInt(m[2], 10);
  } else if (rankString.trim()) {
    // fallback: plain text "Silver 3, RR: 67 (-14)" atau sejenisnya
    const m2 = rankString.match(/([A-Za-z]+\s*\d?)/);
    if (m2) rankName = m2[1].trim();
  }
  return { rankName, rr, shield };
}

export function parseHistoryString(historyString: string): { wins: number; losses: number } {
  const m = historyString.match(/(\d+)\s*W\s*-\s*(\d+)\s*L/i);
  if (m) return { wins: parseInt(m[1], 10), losses: parseInt(m[2], 10) };
  return { wins: 0, losses: 0 };
}
