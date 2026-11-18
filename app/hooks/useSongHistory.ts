"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  emitSongHistoryChanged,
  mapPlayedSongRow,
  SONG_HISTORY_EVENT,
  type PlayedSong,
  type SongHistoryRow,
} from "@/app/lib/songHistory";

export type UseSongHistoryResult = {
  items: PlayedSong[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  removeEntry: (id: string) => Promise<boolean>;
  clearHistory: () => Promise<boolean>;
};

type HistoryRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

const CREATE_TABLE_HINT =
  "Fitur Song History belum aktif di database. Jalankan supabase/migrations/027_song_entries.sql lalu 028_song_history.sql di Supabase SQL Editor.";

const HISTORY_LIMIT = 200;

let historyHookSequence = 0;

function prettyHistoryError(err: unknown): string {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : (err as { message?: string } | null)?.message || "Terjadi kesalahan saat memuat riwayat lagu.";

  if (
    /song_entries|played_at|get_song_history_by_private_key|delete_song_history_by_private_key|clear_song_history_by_private_key/i.test(
      message,
    ) &&
    /(does not exist|schema cache|Could not find|not found|column)/i.test(message)
  ) {
    return CREATE_TABLE_HINT;
  }

  return message;
}

export function useSongHistory(privateKey?: string): UseSongHistoryResult {
  const supabase = useMemo(() => createClient(), []);
  const rawKey = String(privateKey || "").trim();
  // "global" bukan private key - jangan dipakai untuk RPC.
  const key = rawKey && rawKey !== "global" ? rawKey : "";
  const [instanceId] = useState(() => ++historyHookSequence);

  const [items, setItems] = useState<PlayedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserId = useCallback(async (): Promise<string> => {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    return data.user?.id || "";
  }, [supabase]);

  const refresh = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) setLoading(true);
      try {
        if (key) {
          const rpc = supabase as unknown as HistoryRpcClient;
          const { data, error: rpcError } = await rpc.rpc("get_song_history_by_private_key", {
            p_key: key,
            p_limit: HISTORY_LIMIT,
          });
          if (rpcError) throw rpcError;
          const rows = Array.isArray(data) ? (data as SongHistoryRow[]) : [];
          setItems(rows.map(mapPlayedSongRow));
          setError(null);
          return;
        }

        const userId = await getUserId();
        if (!userId) {
          setItems([]);
          setError("Login atau buka halaman lewat Dock (?key=...) untuk melihat riwayat lagu.");
          return;
        }

        const { data, error: queryError } = await supabase
          .from("song_entries")
          .select("*")
          .not("played_at", "is", null)
          .order("played_at", { ascending: false })
          .limit(HISTORY_LIMIT);
        if (queryError) throw queryError;
        const rows = Array.isArray(data) ? (data as SongHistoryRow[]) : [];
        setItems(rows.map(mapPlayedSongRow));
        setError(null);
      } catch (err) {
        setItems([]);
        setError(prettyHistoryError(err));
      } finally {
        if (!options.silent) setLoading(false);
      }
    },
    [getUserId, key, supabase],
  );

  useEffect(() => {
    // refresh() memang set state (loading/data) - efek ini sinkron ke Supabase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  // Sinkron antar komponen di tab yang sama + refresh saat tab kembali fokus.
  useEffect(() => {
    const onChanged = (event: Event) => {
      const source = (event as CustomEvent<{ source?: number }>).detail?.source;
      if (source === instanceId) return;
      void refresh({ silent: true });
    };
    const onFocus = () => void refresh({ silent: true });
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh({ silent: true });
    };
    window.addEventListener(SONG_HISTORY_EVENT, onChanged);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(SONG_HISTORY_EVENT, onChanged);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [instanceId, refresh]);

  const removeEntry = useCallback(
    async (id: string): Promise<boolean> => {
      if (!id) return false;
      setSaving(true);
      try {
        if (key) {
          const rpc = supabase as unknown as HistoryRpcClient;
          const { error: rpcError } = await rpc.rpc("delete_song_history_by_private_key", {
            p_key: key,
            p_id: id,
          });
          if (rpcError) throw rpcError;
        } else {
          const userId = await getUserId();
          if (!userId) throw new Error("Login dulu untuk menghapus riwayat lagu.");
          // Baris liked/blocked: kosongkan riwayatnya saja.
          const { data: cleared, error: updateError } = await supabase
            .from("song_entries")
            .update({ played_at: null, play_count: 0 })
            .eq("id", id)
            .eq("user_id", userId)
            .in("status", ["liked", "blocked"])
            .select("id");
          if (updateError) throw updateError;
          if (!Array.isArray(cleared) || cleared.length === 0) {
            const { error: deleteError } = await supabase
              .from("song_entries")
              .delete()
              .eq("id", id)
              .eq("user_id", userId)
              .eq("status", "played");
            if (deleteError) throw deleteError;
          }
        }

        setItems((prev) => prev.filter((item) => item.id !== id));
        setError(null);
        emitSongHistoryChanged(instanceId);
        return true;
      } catch (err) {
        setError(prettyHistoryError(err));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [getUserId, instanceId, key, supabase],
  );

  const clearHistory = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      if (key) {
        const rpc = supabase as unknown as HistoryRpcClient;
        const { error: rpcError } = await rpc.rpc("clear_song_history_by_private_key", {
          p_key: key,
        });
        if (rpcError) throw rpcError;
      } else {
        const userId = await getUserId();
        if (!userId) throw new Error("Login dulu untuk menghapus riwayat lagu.");
        const { error: deleteError } = await supabase
          .from("song_entries")
          .delete()
          .eq("user_id", userId)
          .eq("status", "played");
        if (deleteError) throw deleteError;
        const { error: updateError } = await supabase
          .from("song_entries")
          .update({ played_at: null, play_count: 0 })
          .eq("user_id", userId)
          .not("played_at", "is", null);
        if (updateError) throw updateError;
      }

      setItems([]);
      setError(null);
      emitSongHistoryChanged(instanceId);
      return true;
    } catch (err) {
      setError(prettyHistoryError(err));
      return false;
    } finally {
      setSaving(false);
    }
  }, [getUserId, instanceId, key, supabase]);

  return {
    items,
    loading,
    saving,
    error,
    refresh,
    removeEntry,
    clearHistory,
  };
}
