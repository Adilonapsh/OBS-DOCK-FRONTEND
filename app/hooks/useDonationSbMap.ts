'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { sanitizeParams } from './sbArgs';

// Event donasi (Saweria/TipTap/Trakteer/dll) yang bisa memicu DoAction di Streamer.bot.
// Dieksekusi di dock saat event socket 'donation' masuk dari backend.
export type DonationSbEventKey = 'donation';

export type DonationSbEntry = { enabled: boolean; action: string; params: Record<string, string> };
export type DonationSbMap = Record<DonationSbEventKey, DonationSbEntry>;

export const DONATION_SB_KEYS: DonationSbEventKey[] = ['donation'];

// Variabel yang tersedia (bisa dipakai sebagai {variabel} di parameter custom).
export const DONATION_SB_PARAMS: Record<DonationSbEventKey, string[]> = {
  donation: ['donorName', 'amount', 'amountFormatted', 'currency', 'message', 'platform', 'transactionId'],
};

export const DONATION_SB_DEFAULTS: DonationSbMap = {
  donation: { enabled: false, action: 'Donation_Received', params: {} },
};

export const DONATION_SB_TEST_ARGS: Record<DonationSbEventKey, Record<string, unknown>> = {
  donation: { type: 'donation', donorName: 'TestDonatur', amount: 25000, amountFormatted: 'Rp 25.000', currency: 'IDR', message: 'Semangat terus! (tes)', platform: 'saweria', transactionId: 'test-123' },
};

const STORAGE_KEY = 'donation-sb-map';

function sanitize(raw: unknown): DonationSbMap {
  const out: DonationSbMap = {
    donation: { ...DONATION_SB_DEFAULTS.donation, params: {} },
  };
  if (raw && typeof raw === 'object') {
    for (const k of DONATION_SB_KEYS) {
      const e = (raw as Record<string, unknown>)[k];
      if (e && typeof e === 'object') {
        const entry = e as Record<string, unknown>;
        out[k] = {
          enabled: entry.enabled === true,
          action: typeof entry.action === 'string' ? entry.action : DONATION_SB_DEFAULTS[k].action,
          params: sanitizeParams(entry.params),
        };
      }
    }
  }
  return out;
}

function loadCache(): DonationSbMap {
  if (typeof window === 'undefined') return { ...DONATION_SB_DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DONATION_SB_DEFAULTS };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...DONATION_SB_DEFAULTS };
  }
}

function saveCache(map: DonationSbMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

// Shared hook - dipakai dock (eksekutor) + halaman /integrations (manager).
// Sumber utama: database kolom donation_sb_map (per user). localStorage cache + sinkron antar tab.
export function useDonationSbMap() {
  const supabase = createClient();
  const [map, setMapState] = useState<DonationSbMap>(() => loadCache());
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
        const { data: row } = await supabase
          .from('integration_settings')
          .select('donation_sb_map')
          .eq('user_id', uid)
          .single();
        const dbMap = (row as { donation_sb_map?: unknown } | null)?.donation_sb_map;
        if (cancelled) return;
        if (dbMap) {
          const clean = sanitize(dbMap);
          loadedFromDb.current = true;
          saveCache(clean);
          setMapState(clean);
        } else {
          loadedFromDb.current = true;
        }
      } catch {
        if (!cancelled) loadedFromDb.current = true;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setMapState(loadCache());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback(
    (next: DonationSbMap, uid: string | null) => {
      saveCache(next);
      if (!uid) return;
      supabase
        .from('integration_settings')
        .upsert({ user_id: uid, donation_sb_map: next, updated_at: new Date().toISOString() } as any, {
          onConflict: 'user_id',
        })
        .then(({ error }) => {
          if (error) console.error('Gagal simpan donation mapping ke database:', error.message);
        });
    },
    [supabase],
  );

  const setMap = useCallback(
    (next: DonationSbMap) => {
      setMapState(next);
      persist(next, userId);
    },
    [persist, userId],
  );

  const updateEntry = useCallback(
    (key: DonationSbEventKey, patch: Partial<DonationSbEntry>) => {
      setMapState((prev) => {
        const next = { ...prev, [key]: { ...prev[key], ...patch } };
        persist(next, userId);
        return next;
      });
    },
    [persist, userId],
  );

  return { map, setMap, updateEntry, userId };
}
