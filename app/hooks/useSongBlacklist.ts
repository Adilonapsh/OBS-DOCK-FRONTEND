"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { LIKED_SONGS_EVENT, normalizeLikedUrl, parseYouTubeVideoId, youtubeThumbnail } from "@/app/lib/likedSongs";
import {
  emitSongBlacklistChanged,
  mapBlacklistedSongRow,
  matchesBlacklist,
  SONG_BLACKLIST_EVENT,
  type BlacklistedSong,
  type BlacklistedSongInput,
  type BlacklistedSongRow,
} from "@/app/lib/songBlacklist";

export type UseSongBlacklistResult = {
  items: BlacklistedSong[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addBlacklisted: (input: BlacklistedSongInput) => Promise<BlacklistedSong | null>;
  removeBlacklisted: (id: string) => Promise<boolean>;
  findBlacklisted: (url: string, videoId?: string | null) => BlacklistedSong | undefined;
  isBlacklisted: (url: string, videoId?: string | null) => boolean;
};

type BlacklistRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

const CREATE_TABLE_HINT =
  "Fitur Blacklist Song belum aktif di database. Jalankan supabase/migrations/027_song_entries.sql di Supabase SQL Editor.";

let blacklistHookSequence = 0;

function prettyBlacklistError(err: unknown): string {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : (err as { message?: string } | null)?.message || "Terjadi kesalahan saat memuat blacklist song.";

  if (
    /song_entries|song_blacklist|get_song_blacklist_by_private_key|upsert_song_blacklist_by_private_key|delete_song_blacklist_by_private_key|is_song_blacklisted_by_private_key/i.test(
      message,
    ) &&
    /(does not exist|schema cache|Could not find|not found)/i.test(message)
  ) {
    return CREATE_TABLE_HINT;
  }

  return message;
}

function sortByCreatedAt(list: BlacklistedSong[]): BlacklistedSong[] {
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

export function useSongBlacklist(privateKey?: string): UseSongBlacklistResult {
  const supabase = useMemo(() => createClient(), []);
  const rawKey = String(privateKey || "").trim();
  // "global" bukan private key - jangan dipakai untuk RPC.
  const key = rawKey && rawKey !== "global" ? rawKey : "";
  const [instanceId] = useState(() => ++blacklistHookSequence);

  const [items, setItems] = useState<BlacklistedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserId = useCallback(async (): Promise<string> => {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    return data.user?.id || "";
  }, [supabase]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (key) {
        const rpc = supabase as unknown as BlacklistRpcClient;
        const { data, error: rpcError } = await rpc.rpc(
          "get_song_blacklist_by_private_key",
          { p_key: key },
        );
        if (rpcError) throw rpcError;
        const rows = Array.isArray(data) ? (data as BlacklistedSongRow[]) : [];
        setItems(sortByCreatedAt(rows.map(mapBlacklistedSongRow)));
        setError(null);
        return;
      }

      const userId = await getUserId();
      if (!userId) {
        setItems([]);
        setError("Login atau buka halaman lewat Dock (?key=...) untuk memakai Blacklist Song.");
        return;
      }

      const { data, error: queryError } = await supabase
        .from("song_entries")
        .select("*")
        .eq("status", "blocked")
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      const rows = Array.isArray(data) ? (data as BlacklistedSongRow[]) : [];
      setItems(sortByCreatedAt(rows.map(mapBlacklistedSongRow)));
      setError(null);
    } catch (err) {
      setItems([]);
      setError(prettyBlacklistError(err));
    } finally {
      setLoading(false);
    }
  }, [getUserId, key, supabase]);

  useEffect(() => {
    // refresh() memang set state (loading/data) - efek ini sinkron ke Supabase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh, key]);

  // Sinkron antar komponen di tab yang sama + refresh saat tab kembali fokus.
  useEffect(() => {
    const onChanged = (event: Event) => {
      const source = (event as CustomEvent<{ source?: number }>).detail?.source;
      if (source === instanceId) return;
      void refresh();
    };
    const onFocus = () => void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener(SONG_BLACKLIST_EVENT, onChanged);
    // Satu tabel dipakai liked juga - status lagu bisa pindah blocked <-> liked.
    window.addEventListener(LIKED_SONGS_EVENT, onChanged);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(SONG_BLACKLIST_EVENT, onChanged);
      window.removeEventListener(LIKED_SONGS_EVENT, onChanged);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [instanceId, refresh]);

  const addBlacklisted = useCallback(
    async (input: BlacklistedSongInput): Promise<BlacklistedSong | null> => {
      const url = normalizeLikedUrl(input.url);
      if (!url) throw new Error("URL lagu tidak valid.");
      if (!/^https?:\/\//i.test(url)) throw new Error("Hanya link YouTube / MP3 langsung yang didukung.");

      const videoId = input.videoId || parseYouTubeVideoId(url);
      const title = String(input.title || "").trim() || url;
      const channel = String(input.channel || "").trim();
      const thumbnail = String(input.thumbnail || "").trim() || youtubeThumbnail(videoId);
      const reason = String(input.reason || "");
      const metadata = input.metadata && typeof input.metadata === "object" ? input.metadata : {};

      setSaving(true);
      try {
        let saved: BlacklistedSong;

        if (key) {
          const rpc = supabase as unknown as BlacklistRpcClient;
          const { data, error: rpcError } = await rpc.rpc(
            "upsert_song_blacklist_by_private_key",
            {
              p_key: key,
              p_url: url,
              p_video_id: videoId,
              p_title: title,
              p_channel: channel,
              p_thumbnail: thumbnail,
              p_reason: reason,
              p_metadata: metadata,
            },
          );
          if (rpcError) throw rpcError;
          if (!data) throw new Error("Gagal menyimpan blacklist.");
          saved = mapBlacklistedSongRow(data as BlacklistedSongRow);
        } else {
          const userId = await getUserId();
          if (!userId) throw new Error("Login dulu untuk memakai blacklist song.");
          const { data, error: upsertError } = await supabase
            .from("song_entries")
            .upsert(
              {
                user_id: userId,
                status: "blocked",
                url,
                video_id: videoId,
                title,
                channel: channel || null,
                thumbnail_url: thumbnail || null,
                reason,
                metadata,
              },
              { onConflict: "user_id,url" },
            )
            .select("*")
            .single();
          if (upsertError) throw upsertError;
          if (!data) throw new Error("Gagal menyimpan blacklist.");
          saved = mapBlacklistedSongRow(data as BlacklistedSongRow);
        }

        setItems((prev) => sortByCreatedAt([saved, ...prev.filter((item) => item.id !== saved.id && item.url !== url)]));
        setError(null);
        emitSongBlacklistChanged(instanceId);
        return saved;
      } catch (err) {
        const message = prettyBlacklistError(err);
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [getUserId, instanceId, key, supabase],
  );

  const removeBlacklisted = useCallback(
    async (id: string): Promise<boolean> => {
      if (!id) return false;
      setSaving(true);
      try {
        if (key) {
          const rpc = supabase as unknown as BlacklistRpcClient;
          const { error: rpcError } = await rpc.rpc(
            "delete_song_blacklist_by_private_key",
            { p_key: key, p_id: id },
          );
          if (rpcError) throw rpcError;
        } else {
          const userId = await getUserId();
          if (!userId) throw new Error("Login dulu untuk menghapus blacklist song.");
          const { error: deleteError } = await supabase
            .from("song_entries")
            .delete()
            .eq("id", id)
            .eq("user_id", userId)
            .eq("status", "blocked");
          if (deleteError) throw deleteError;
        }

        setItems((prev) => prev.filter((item) => item.id !== id));
        setError(null);
        emitSongBlacklistChanged(instanceId);
        return true;
      } catch (err) {
        setError(prettyBlacklistError(err));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [getUserId, instanceId, key, supabase],
  );

  const findBlacklisted = useCallback(
    (url: string, videoId?: string | null) =>
      items.find((item) => matchesBlacklist(item, url, videoId)),
    [items],
  );

  const isBlacklisted = useCallback(
    (url: string, videoId?: string | null) => !!findBlacklisted(url, videoId),
    [findBlacklisted],
  );

  return {
    items,
    loading,
    saving,
    error,
    refresh,
    addBlacklisted,
    removeBlacklisted,
    findBlacklisted,
    isBlacklisted,
  };
}
