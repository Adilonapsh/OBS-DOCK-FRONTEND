'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

export type DonationPlatform = 'saweria' | 'tiptap' | 'trakteer' | 'bagibagi' | 'socialbuzz' | 'tako' | 'sibagi' | 'generic';
export const DONATION_PLATFORMS: DonationPlatform[] = ['saweria','tiptap','trakteer','bagibagi','socialbuzz','tako','sibagi'];

export type TimerTier = { amount: number; minutes: number };

export type DonationEntry = {
  enabled: boolean;
  token: string; // webhook verification token -> dikirim di header
  // Integrasi widget (dibaca backend saat donasi masuk):
  eventEnabled?: boolean; // tampil di Event overlay & Goals (default true)
  timerEnabled?: boolean; // donasi menambah waktu timer (default false)
  timerTiers?: TimerTier[]; // aturan "Rp X = Y menit", bisa banyak (default [{2000,1}])
  songPriority?: boolean; // request lagu donatur (mediaShareUrl) masuk prioritas (default false)
  goalEnabled?: boolean; // donasi dihitung di donation goal (default true)
  // legacy (otomatis migrasi ke timerTiers)
  timerRpPerMinute?: number;
  timerSecondsPer10k?: number;
};

export const DEFAULT_TIMER_RP_PER_MINUTE = 2000;
export const DEFAULT_TIMER_TIERS: TimerTier[] = [{ amount: 2000, minutes: 1 }];
export const MAX_TIMER_TIERS = 10;

export function sanitizeTimerTiers(raw: unknown): TimerTier[] {
  if (!Array.isArray(raw)) return [];
  const out: TimerTier[] = [];
  for (const t of raw.slice(0, MAX_TIMER_TIERS)) {
    const amount = Math.floor(Number((t as any)?.amount) || 0);
    const minutes = Math.floor(Number((t as any)?.minutes) || 0);
    if (amount >= 1 && amount <= 1000000000 && minutes >= 1 && minutes <= 1440) {
      if (!out.some((x) => x.amount === amount)) out.push({ amount, minutes });
    }
  }
  return out.sort((a, b) => a.amount - b.amount);
}

// Preview bonus detik untuk nominal berapa pun (sama persis rumus backend):
// tier tertinggi yang terpenuhi; di bawah tier terkecil pakai rate tier terkecil.
export function previewTimerBonus(tiers: TimerTier[], amount: number): { seconds: number; tier: TimerTier | null } {
  const valid = sanitizeTimerTiers(tiers);
  const amt = Math.floor(Number(amount) || 0);
  if (valid.length === 0 || amt <= 0) return { seconds: 0, tier: null };
  const desc = [...valid].sort((a, b) => b.amount - a.amount);
  const tier = desc.find((t) => amt >= t.amount) ?? desc[desc.length - 1];
  return { seconds: Math.min(86400, Math.floor((amt * tier.minutes * 60) / tier.amount)), tier };
}

export type DonationMap = Record<DonationPlatform, DonationEntry>;

export const DONATION_LOGOS: Record<DonationPlatform, string> = {
  saweria: '/assets/logo/saweria.png',
  tiptap: '/assets/logo/tiptap.ico',
  trakteer: '/assets/logo/trakteer.png',
  bagibagi: '/assets/logo/bagibagi.png',
  socialbuzz: '/assets/logo/sociabuzz.png',
  tako: '/assets/logo/tako.png',
  sibagi: '/assets/logo/sibagi.webp',
  generic: '/assets/logo/saweria.png',
};

function defaultEntry(): DonationEntry {
  return { enabled: false, token: '', eventEnabled: true, timerEnabled: false, timerTiers: [...DEFAULT_TIMER_TIERS], timerRpPerMinute: DEFAULT_TIMER_RP_PER_MINUTE, songPriority: false, goalEnabled: true };
}

export const DONATION_DEFAULTS: DonationMap = {
  saweria:    defaultEntry(),
  tiptap:     defaultEntry(),
  trakteer:   defaultEntry(),
  bagibagi:   defaultEntry(),
  socialbuzz: defaultEntry(),
  tako:       defaultEntry(),
  sibagi:     defaultEntry(),
  generic:    defaultEntry(),
};

const STORAGE_KEY = 'donation-map';

function sanitize(raw: unknown): DonationMap {
  const out: DonationMap = JSON.parse(JSON.stringify(DONATION_DEFAULTS)) as DonationMap;
  if (raw && typeof raw === 'object') {
    for (const k of DONATION_PLATFORMS.concat(['generic'] as DonationPlatform[])) {
      const e = (raw as Record<string, unknown>)[k];
      if (e && typeof e === 'object') {
        const entry = e as Record<string, unknown>;
        // Migrasi legacy: timerTiers <- timerRpPerMinute <- timerSecondsPer10k
        const legacySec = typeof entry.timerSecondsPer10k === 'number' ? entry.timerSecondsPer10k : 0;
        const legacyRpM = typeof entry.timerRpPerMinute === 'number' && (entry.timerRpPerMinute as number) > 0
          ? Math.max(1, Math.min(100000000, Math.floor(entry.timerRpPerMinute as number)))
          : 0;
        let tiers = sanitizeTimerTiers(entry.timerTiers);
        if (tiers.length === 0) {
          if (legacyRpM > 0) tiers = [{ amount: legacyRpM, minutes: 1 }];
          else if (legacySec > 0) tiers = [{ amount: Math.max(1, Math.round(600000 / legacySec)), minutes: 1 }];
          else tiers = [...DEFAULT_TIMER_TIERS];
        }
        out[k] = {
          enabled: entry.enabled === true,
          token: typeof entry.token === 'string' ? entry.token.slice(0, 500) : '',
          eventEnabled: entry.eventEnabled !== false,
          timerEnabled: entry.timerEnabled === true || legacySec > 0,
          timerTiers: tiers,
          timerRpPerMinute: legacyRpM > 0 ? legacyRpM : tiers[0].amount,
          songPriority: !!entry.songPriority,
          goalEnabled: entry.goalEnabled !== false,
        };
      }
    }
  }
  return out;
}

function loadCache(): DonationMap {
  if (typeof window === 'undefined') return JSON.parse(JSON.stringify(DONATION_DEFAULTS));
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DONATION_DEFAULTS));
    return sanitize(JSON.parse(raw));
  } catch { return JSON.parse(JSON.stringify(DONATION_DEFAULTS)); }
}

function saveCache(map: DonationMap): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch {}
}

export function donationWebhookUrl(platform: DonationPlatform, privateKey: string): string {
  // Backend generates: /webhook/:platform/:key
  // Frontend will compute based on NEXT_PUBLIC_BACKEND_URL or window.origin
  const base = (() => {
    const env = (process.env.NEXT_PUBLIC_BACKEND_URL || '').trim().replace(/\/$/, '');
    if (env) return env;
    if (typeof window === 'undefined') return 'http://localhost:3000';
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:3000';
    return window.location.origin;
  })();
  const key = privateKey || 'YOUR_PRIVATE_KEY';
  return `${base}/webhook/${platform}/${key}`;
}

export function useDonationMap() {
  const supabase = createClient();
  const [map, setMapState] = useState<DonationMap>(() => loadCache());
  const [userId, setUserId] = useState<string | null>(null);
  const loadedFromDb = useRef(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (!uid) return;
      try {
        const { data: row } = await supabase.from('integration_settings').select('donation_configs').eq('user_id', uid).single();
        const dbMap = (row as any)?.donation_configs;
        if (cancelled) return;
        if (dbMap && typeof dbMap === 'object' && Object.keys(dbMap).length > 0) {
          const clean = sanitize(dbMap);
          loadedFromDb.current = true;
          saveCache(clean);
          setMapState(clean);
        } else loadedFromDb.current = true;
      } catch { if (!cancelled) loadedFromDb.current = true; }
    });
    return () => { cancelled = true; };
  }, [supabase]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) setMapState(loadCache()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((next: DonationMap, uid: string | null) => {
    saveCache(next);
    if (!uid) return;
    supabase.from('integration_settings').upsert({ user_id: uid, donation_configs: next, updated_at: new Date().toISOString() } as any, { onConflict: 'user_id' })
      .then(({ error }) => { if (error) console.error('Gagal simpan donation_configs:', error.message); });
  }, [supabase]);

  const setMap = useCallback((next: DonationMap) => {
    setMapState(next);
    // need userId at call time - read from state via closure; use callback ref
    // untuk aman, ambil dari supabase auth async? simpan uid dari state
    // persist akan pakai userId dari closure terbaru via setMapState callback trick
    // simpler: persist via effect? tapi kita call persist di sini dengan current userId
    // NOTE: userId dari state sudah update
    // eslint-disable-next-line
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      persist(next, uid);
    })();
  }, [persist, supabase]);

  const updateEntry = useCallback((platform: DonationPlatform, patch: Partial<DonationEntry>) => {
    setMapState(prev => {
      const next = { ...prev, [platform]: { ...prev[platform], ...patch } };
      // persist async
      (async () => {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id ?? null;
        persist(next, uid);
      })();
      return next;
    });
  }, [persist, supabase]);

  return { map, setMap, updateEntry, userId };
}
