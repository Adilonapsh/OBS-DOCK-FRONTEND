'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

export type TtSbEventKey = 'chat' | 'gift' | 'like' | 'follow' | 'member';
export type TtSbEntry = { enabled: boolean; action: string };
export type TtSbMap = Record<TtSbEventKey, TtSbEntry>;

export const TT_SB_KEYS: TtSbEventKey[] = ['chat', 'gift', 'like', 'follow', 'member'];

export const TT_SB_DEFAULTS: TtSbMap = {
  chat: { enabled: false, action: 'TikTok_Chat' },
  gift: { enabled: false, action: 'TikTok_Gift' },
  like: { enabled: false, action: 'TikTok_Like' },
  follow: { enabled: false, action: 'TikTok_Follow' },
  member: { enabled: false, action: 'TikTok_Member' },
};

const STORAGE_KEY = 'tiktok-sb-map';

function sanitize(raw: unknown): TtSbMap {
  const out: TtSbMap = {
    chat: { ...TT_SB_DEFAULTS.chat },
    gift: { ...TT_SB_DEFAULTS.gift },
    like: { ...TT_SB_DEFAULTS.like },
    follow: { ...TT_SB_DEFAULTS.follow },
    member: { ...TT_SB_DEFAULTS.member },
  };
  if (raw && typeof raw === 'object') {
    for (const k of TT_SB_KEYS) {
      const e = (raw as Record<string, unknown>)[k];
      if (e && typeof e === 'object') {
        const entry = e as Record<string, unknown>;
        out[k] = {
          enabled: entry.enabled === true,
          action: typeof entry.action === 'string' ? entry.action : TT_SB_DEFAULTS[k].action,
        };
      }
    }
  }
  return out;
}

function loadCache(): TtSbMap {
  if (typeof window === 'undefined') return { ...TT_SB_DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...TT_SB_DEFAULTS };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...TT_SB_DEFAULTS };
  }
}

function saveCache(map: TtSbMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

// Shared hook - dipakai dock (eksekutor) + halaman /integrations (manager).
// Sumber utama: database (per user). localStorage dipakai sebagai cache +
// sinkron antar tab. Tanpa login (guest) hanya pakai cache lokal.
export function useTtSbMap() {
  const supabase = createClient();
  const [map, setMapState] = useState<TtSbMap>(() => loadCache());
  const [userId, setUserId] = useState<string | null>(null);
  const loadedFromDb = useRef(false);

  // Muat dari database sekali saat tahu user
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
          .select('tiktok_sb_map')
          .eq('user_id', uid)
          .single();
        const dbMap = (row as { tiktok_sb_map?: unknown } | null)?.tiktok_sb_map;
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

  // Sinkron antar tab (satu browser)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setMapState(loadCache());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback(
    (next: TtSbMap, uid: string | null) => {
      saveCache(next);
      if (!uid) return;
      supabase
        .from('integration_settings')
        .upsert({ user_id: uid, tiktok_sb_map: next, updated_at: new Date().toISOString() } as any, {
          onConflict: 'user_id',
        })
        .then(({ error }) => {
          if (error) console.error('Gagal simpan mapping ke database:', error.message);
        });
    },
    [supabase],
  );

  const setMap = useCallback(
    (next: TtSbMap) => {
      setMapState(next);
      persist(next, userId);
    },
    [persist, userId],
  );

  const updateEntry = useCallback(
    (key: TtSbEventKey, patch: Partial<TtSbEntry>) => {
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
