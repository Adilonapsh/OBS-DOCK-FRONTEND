// Liked Songs - tipe & helper bersama untuk halaman /songs dan dock.
// Sumber data: Supabase tabel public.song_entries, status = 'liked' (per akun/private key).

export type LikedSongKind = "youtube" | "audio";

export type LikedSong = {
  id: string;
  url: string;
  videoId: string | null;
  kind: LikedSongKind;
  title: string;
  channel: string;
  thumbnail: string;
  requestedBy: string;
  platform: string;
  note: string;
  metadata: Record<string, unknown>;
  likedAt: number;
  createdAt: number;
  updatedAt: number;
};

export type LikedSongInput = {
  url: string;
  videoId?: string | null;
  kind?: LikedSongKind;
  title?: string;
  channel?: string;
  thumbnail?: string;
  requestedBy?: string;
  platform?: string;
  note?: string;
  metadata?: Record<string, unknown>;
};

export type LikedSongRow = {
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
  note: string | null;
  metadata: Record<string, unknown> | null;
  liked_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Rapikan URL hasil copy-paste dari chat / clipboard. */
export function normalizeLikedUrl(raw: string): string {
  let s = String(raw || "").trim();
  if (!s) return "";

  // ID video polos (11 karakter) - umum saat share dari aplikasi.
  if (VIDEO_ID_RE.test(s)) return `https://youtu.be/${s}`;

  // Kupas pembungkus <...> "..." '...' (...).
  if (
    (s.startsWith("<") && s.endsWith(">")) ||
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'")) ||
    (s.startsWith("(") && s.endsWith(")"))
  ) {
    s = s.slice(1, -1).trim();
  }

  // Buang tanda baca trailing hasil paste.
  s = s.replace(/[.,!?;:'")\]>]+$/g, "").trim();
  s = s.replace(/^["'(<]+/g, "").trim();

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
    if (
      /^(www\.|m\.|music\.|youtu\.be\/|youtube\.com\/|youtube-nocookie\.com\/)/i.test(s) ||
      /^[\w-]+(\.[\w-]+)+\//.test(s)
    ) {
      s = `https://${s}`;
    }
  }

  return s;
}

export function parseYouTubeVideoId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "").toLowerCase();
  if (host === "youtu.be") {
    const id = (u.pathname.split("/").filter(Boolean)[0] || "").split(/[^A-Za-z0-9_-]/)[0];
    return VIDEO_ID_RE.test(id) ? id : null;
  }
  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const v = u.searchParams.get("v") || "";
    if (VIDEO_ID_RE.test(v)) return v;
    const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[2];
  }
  return null;
}

export function isAudioUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const hay = `${u.pathname} ${u.search}`.toLowerCase();
    return /\.(mp3|ogg|wav|m4a|aac|flac|opus|weba)(\?|#|\s|$)/.test(`${hay} `) || hay.includes(".mp3");
  } catch {
    return false;
  }
}

export function youtubeThumbnail(videoId: string | null | undefined): string {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : "";
}

export function mapLikedSongRow(row: LikedSongRow): LikedSong {
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
    note: String(row.note || ""),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    likedAt: row.liked_at ? new Date(row.liked_at).getTime() : Date.now(),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

export const LIKED_SONGS_EVENT = "liked-songs-updated";

/** Beri tahu komponen lain (dock/page di tab yang sama) agar refresh. */
export function emitLikedSongsChanged(source?: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LIKED_SONGS_EVENT, { detail: { source } }));
}

export function likedSongQueuePayload(song: LikedSong, requestedBy = "liked") {
  return {
    url: song.url,
    title: song.title || song.url,
    requestedBy,
    platform: "liked",
  };
}
