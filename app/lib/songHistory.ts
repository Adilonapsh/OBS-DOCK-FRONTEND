// Song History - riwayat lagu yang sudah diputar.
// Sumber data: Supabase tabel public.song_entries (kolom played_at / play_count).
// Satu URL hanya punya satu baris, jadi lagu yang sama tidak dobel.

export type PlayedSongKind = "youtube" | "audio";

export type PlayedSong = {
  id: string;
  url: string;
  videoId: string | null;
  kind: PlayedSongKind;
  title: string;
  channel: string;
  thumbnail: string;
  requestedBy: string;
  platform: string;
  metadata: Record<string, unknown>;
  playedAt: number;
  playCount: number;
  createdAt: number;
  updatedAt: number;
};

export type SongHistoryRow = {
  id: string;
  user_id?: string;
  url: string;
  video_id: string | null;
  kind: string | null;
  title: string | null;
  channel: string | null;
  thumbnail_url: string | null;
  requested_by: string | null;
  platform: string | null;
  metadata: Record<string, unknown> | null;
  played_at: string | null;
  play_count: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export function mapPlayedSongRow(row: SongHistoryRow): PlayedSong {
  return {
    id: String(row.id || ""),
    url: String(row.url || ""),
    videoId: row.video_id || null,
    kind: row.kind === "audio" ? "audio" : "youtube",
    title: String(row.title || ""),
    channel: String(row.channel || ""),
    thumbnail: String(row.thumbnail_url || ""),
    requestedBy: String(row.requested_by || ""),
    platform: String(row.platform || ""),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    playedAt: row.played_at ? new Date(row.played_at).getTime() : 0,
    playCount: Number(row.play_count || 0),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

export const SONG_HISTORY_EVENT = "song-history-updated";

/** Beri tahu komponen lain (dock/page di tab yang sama) agar refresh. */
export function emitSongHistoryChanged(source?: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SONG_HISTORY_EVENT, { detail: { source } }));
}
