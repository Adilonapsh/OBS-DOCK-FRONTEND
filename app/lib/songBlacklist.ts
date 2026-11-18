// Song Blacklist - lagu yang tidak boleh masuk queue.
// Sumber data: Supabase tabel public.song_entries, status = 'blocked' (per akun/private key).

export type BlacklistedSong = {
  id: string;
  url: string;
  videoId: string | null;
  title: string;
  channel: string;
  thumbnail: string;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

export type BlacklistedSongInput = {
  url: string;
  videoId?: string | null;
  title?: string;
  channel?: string;
  thumbnail?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export type BlacklistedSongRow = {
  id: string;
  user_id?: string;
  url: string;
  video_id: string | null;
  title: string | null;
  channel: string | null;
  thumbnail_url: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

export function mapBlacklistedSongRow(row: BlacklistedSongRow): BlacklistedSong {
  return {
    id: String(row.id || ""),
    url: String(row.url || ""),
    videoId: row.video_id || null,
    title: String(row.title || ""),
    channel: String(row.channel || ""),
    thumbnail: String(row.thumbnail_url || ""),
    reason: String(row.reason || ""),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

export const SONG_BLACKLIST_EVENT = "song-blacklist-updated";

/** Beri tahu komponen lain (dock/page di tab yang sama) agar refresh. */
export function emitSongBlacklistChanged(source?: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SONG_BLACKLIST_EVENT, { detail: { source } }));
}

/**
 * Cocokkan lagu ke blacklist:
 * - URL sama (persis setelah normalisasi), atau
 * - videoId YouTube sama (link youtu.be vs youtube.com tetap kena).
 */
export function matchesBlacklist(
  item: Pick<BlacklistedSong, "url" | "videoId">,
  url: string,
  videoId?: string | null,
): boolean {
  const targetUrl = String(url || "").trim();
  if (item.url && targetUrl && item.url === targetUrl) return true;
  const targetVideo = String(videoId || "").trim();
  return !!item.videoId && !!targetVideo && item.videoId === targetVideo;
}
