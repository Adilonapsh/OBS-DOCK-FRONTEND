"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  emitLikedSongsChanged,
  isAudioUrl,
  LIKED_SONGS_EVENT,
  mapLikedSongRow,
  normalizeLikedUrl,
  parseYouTubeVideoId,
  youtubeThumbnail,
  type LikedSong,
  type LikedSongInput,
  type LikedSongRow,
} from "@/app/lib/likedSongs";
import { SONG_BLACKLIST_EVENT } from "@/app/lib/songBlacklist";

export type UseLikedSongsResult = {
  songs: LikedSong[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addLiked: (input: LikedSongInput) => Promise<LikedSong | null>;
  removeLiked: (id: string) => Promise<boolean>;
  updateLiked: (id: string, patch: { title?: string; note?: string }) => Promise<boolean>;
  findLiked: (url: string) => LikedSong | undefined;
};

type LikedRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

const CREATE_TABLE_HINT =
  "Fitur Liked Songs belum aktif di database. Jalankan supabase/migrations/027_song_entries.sql di Supabase SQL Editor.";

let likedHookSequence = 0;

function prettyLikedError(err: unknown): string {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : (err as { message?: string } | null)?.message || "Terjadi kesalahan saat memuat liked songs.";

  if (
    /song_entries|liked_songs|get_liked_songs_by_private_key|upsert_liked_song_by_private_key|delete_liked_song_by_private_key|update_liked_song_by_private_key/i.test(
      message,
    ) &&
    /(does not exist|schema cache|Could not find|not found)/i.test(message)
  ) {
    return CREATE_TABLE_HINT;
  }

  return message;
}

function sortByLikedAt(list: LikedSong[]): LikedSong[] {
  return [...list].sort((a, b) => b.likedAt - a.likedAt);
}

export function useLikedSongs(privateKey?: string): UseLikedSongsResult {
  const supabase = useMemo(() => createClient(), []);
  const rawKey = String(privateKey || "").trim();
  // "global" bukan private key - jangan dipakai untuk RPC.
  const key = rawKey && rawKey !== "global" ? rawKey : "";
  const [instanceId] = useState(() => ++likedHookSequence);

  const [songs, setSongs] = useState<LikedSong[]>([]);
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
        const rpc = supabase as unknown as LikedRpcClient;
        const { data, error: rpcError } = await rpc.rpc(
          "get_liked_songs_by_private_key",
          { p_key: key },
        );
        if (rpcError) throw rpcError;
        const rows = Array.isArray(data) ? (data as LikedSongRow[]) : [];
        setSongs(sortByLikedAt(rows.map(mapLikedSongRow)));
        setError(null);
        return;
      }

      const userId = await getUserId();
      if (!userId) {
        setSongs([]);
        setError("Login atau buka halaman lewat Dock (?key=...) untuk memakai Liked Songs.");
        return;
      }

      const { data, error: queryError } = await supabase
        .from("song_entries")
        .select("*")
        .eq("status", "liked")
        .order("liked_at", { ascending: false });
      if (queryError) throw queryError;
      const rows = Array.isArray(data) ? (data as LikedSongRow[]) : [];
      setSongs(sortByLikedAt(rows.map(mapLikedSongRow)));
      setError(null);
    } catch (err) {
      setSongs([]);
      setError(prettyLikedError(err));
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
    window.addEventListener(LIKED_SONGS_EVENT, onChanged);
    // Satu tabel dipakai blacklist juga - status lagu bisa pindah liked <-> blocked.
    window.addEventListener(SONG_BLACKLIST_EVENT, onChanged);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(LIKED_SONGS_EVENT, onChanged);
      window.removeEventListener(SONG_BLACKLIST_EVENT, onChanged);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [instanceId, refresh]);

  const addLiked = useCallback(
    async (input: LikedSongInput): Promise<LikedSong | null> => {
      const url = normalizeLikedUrl(input.url);
      if (!url) throw new Error("URL lagu tidak valid.");
      if (!/^https?:\/\//i.test(url)) throw new Error("Hanya link YouTube / MP3 langsung yang didukung.");

      const videoId = input.videoId || parseYouTubeVideoId(url);
      const kind = input.kind || (videoId ? "youtube" : isAudioUrl(url) ? "audio" : "youtube");
      const title = String(input.title || "").trim() || url;
      const channel = String(input.channel || "").trim();
      const thumbnail = String(input.thumbnail || "").trim() || youtubeThumbnail(videoId);
      const requestedBy = String(input.requestedBy || "").trim();
      const platform = String(input.platform || "").trim();
      const note = String(input.note || "");
      const metadata = input.metadata && typeof input.metadata === "object" ? input.metadata : {};

      setSaving(true);
      try {
        let saved: LikedSong;

        if (key) {
          const rpc = supabase as unknown as LikedRpcClient;
          const { data, error: rpcError } = await rpc.rpc(
            "upsert_liked_song_by_private_key",
            {
              p_key: key,
              p_url: url,
              p_video_id: videoId,
              p_kind: kind,
              p_title: title,
              p_channel: channel,
              p_thumbnail: thumbnail,
              p_requested_by: requestedBy,
              p_platform: platform,
              p_note: note,
              p_metadata: metadata,
            },
          );
          if (rpcError) throw rpcError;
          if (!data) throw new Error("Gagal menyimpan lagu.");
          saved = mapLikedSongRow(data as LikedSongRow);
        } else {
          const userId = await getUserId();
          if (!userId) throw new Error("Login dulu untuk menyimpan liked songs.");
          const { data, error: upsertError } = await supabase
            .from("song_entries")
            .upsert(
              {
                user_id: userId,
                status: "liked",
                url,
                video_id: videoId,
                kind,
                title,
                channel: channel || null,
                thumbnail_url: thumbnail || null,
                requested_by: requestedBy || null,
                platform: platform || null,
                note,
                metadata,
                liked_at: new Date().toISOString(),
              },
              { onConflict: "user_id,url" },
            )
            .select("*")
            .single();
          if (upsertError) throw upsertError;
          if (!data) throw new Error("Gagal menyimpan lagu.");
          saved = mapLikedSongRow(data as LikedSongRow);
        }

        // Optimistic update lokal supaya hati langsung berubah.
        setSongs((prev) => sortByLikedAt([saved, ...prev.filter((item) => normalizeLikedUrl(item.url) !== url)]));
        setError(null);
        emitLikedSongsChanged(instanceId);
        return saved;
      } catch (err) {
        const message = prettyLikedError(err);
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [getUserId, instanceId, key, supabase],
  );

  const removeLiked = useCallback(
    async (id: string): Promise<boolean> => {
      if (!id) return false;
      setSaving(true);
      try {
        if (key) {
          const rpc = supabase as unknown as LikedRpcClient;
          const { error: rpcError } = await rpc.rpc(
            "delete_liked_song_by_private_key",
            { p_key: key, p_id: id },
          );
          if (rpcError) throw rpcError;
        } else {
          const userId = await getUserId();
          if (!userId) throw new Error("Login dulu untuk menghapus liked songs.");
          const { error: deleteError } = await supabase
            .from("song_entries")
            .delete()
            .eq("id", id)
            .eq("user_id", userId)
            .eq("status", "liked");
          if (deleteError) throw deleteError;
        }

        setSongs((prev) => prev.filter((item) => item.id !== id));
        setError(null);
        emitLikedSongsChanged(instanceId);
        return true;
      } catch (err) {
        setError(prettyLikedError(err));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [getUserId, instanceId, key, supabase],
  );

  const updateLiked = useCallback(
    async (id: string, patch: { title?: string; note?: string }): Promise<boolean> => {
      if (!id) return false;
      setSaving(true);
      try {
        const title = patch.title;
        const note = patch.note;

        if (key) {
          const rpc = supabase as unknown as LikedRpcClient;
          const { error: rpcError } = await rpc.rpc(
            "update_liked_song_by_private_key",
            {
              p_key: key,
              p_id: id,
              p_title: typeof title === "string" ? title : null,
              p_note: typeof note === "string" ? note : null,
            },
          );
          if (rpcError) throw rpcError;
        } else {
          const userId = await getUserId();
          if (!userId) throw new Error("Login dulu untuk mengubah liked songs.");
          const payload: Record<string, unknown> = {};
          if (typeof title === "string") payload.title = title.trim() || undefined;
          if (typeof note === "string") payload.note = note;
          const { error: updateError } = await supabase
            .from("song_entries")
            .update(payload)
            .eq("id", id)
            .eq("user_id", userId)
            .eq("status", "liked");
          if (updateError) throw updateError;
        }

        setSongs((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  title: typeof title === "string" && title.trim() ? title.trim() : item.title,
                  note: typeof note === "string" ? note : item.note,
                  updatedAt: Date.now(),
                }
              : item,
          ),
        );
        setError(null);
        emitLikedSongsChanged(instanceId);
        return true;
      } catch (err) {
        setError(prettyLikedError(err));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [getUserId, instanceId, key, supabase],
  );

  const findLiked = useCallback(
    (url: string) => {
      const target = normalizeLikedUrl(url);
      if (!target) return undefined;
      return songs.find((item) => normalizeLikedUrl(item.url) === target);
    },
    [songs],
  );

  return {
    songs,
    loading,
    saving,
    error,
    refresh,
    addLiked,
    removeLiked,
    updateLiked,
    findLiked,
  };
}
