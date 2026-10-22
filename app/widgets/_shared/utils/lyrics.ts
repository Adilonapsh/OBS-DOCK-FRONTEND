// Shared LRCLIB helpers for widgets that want synced lyrics (media-player/music).
// The standalone lyrics widget has its own copy of this logic; this module keeps
// the player integrations small and avoids a second fetch implementation.

export type LyricLine = { timeMs: number; text: string };
export type LyricsStatus = 'idle' | 'loading' | 'synced' | 'plain' | 'none' | 'error';
export type LyricsResult = { synced: LyricLine[]; plain: string; instrumental?: boolean };

const lyricsCache = new Map<string, Promise<LyricsResult>>();

export function parseLRC(lrc: string): LyricLine[] {
  if (!lrc) return [];
  const offsetMatch = lrc.match(/\[offset:\s*([+-]?\d+)\s*\]/i);
  const offsetMs = offsetMatch ? parseInt(offsetMatch[1], 10) || 0 : 0;
  const lines = lrc.split('\n');
  const result: LyricLine[] = [];
  const timeRe = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

  for (const line of lines) {
    const times: number[] = [];
    let m: RegExpExecArray | null;
    timeRe.lastIndex = 0;
    while ((m = timeRe.exec(line)) !== null) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const msPart = m[3] ? m[3].padEnd(3, '0').slice(0, 3) : '0';
      const ms = parseInt(msPart, 10);
      const raw = min * 60 * 1000 + sec * 1000 + ms;
      times.push(Math.max(0, raw - offsetMs));
    }
    const text = line.replace(/\[[^\]]*\]/g, '').trim();
    if (times.length === 0) continue;
    for (const t of times) result.push({ timeMs: t, text });
  }

  result.sort((a, b) => a.timeMs - b.timeMs);
  return result;
}

// YouTube titles often contain suffixes like "(Official Video)" / "[Lyrics]".
// Keep useful version words (live/remix/acoustic) so LRCLIB can still match.
const NOISE_RE =
  /\b(?:official\s*(?:music\s*)?video|official\s*audio|lyrics?|lyric\s*video|music\s*video|visualizer|audio|mv|m\/v|hd|hq|4k|8k|explicit)\b/gi;

export function cleanTrackTitle(raw: string): string {
  let clean = (raw || '').replace(
    /\s*[\(\[\{]([^\)\]\}]*)[\)\]\}]/g,
    (_match, inner: string) => (/\b(?:live|remix|acoustic|version|edit|instrumental)\b/i.test(inner) ? ` ${inner} ` : ' '),
  );
  clean = clean.replace(/\.(?:mp3|m4a|aac|wav|flac|ogg|opus|webm)$/i, ' ');
  clean = clean.replace(NOISE_RE, ' ');
  clean = clean.replace(/\s+/g, ' ').replace(/[\s\-–—|]+$/g, '').trim();
  // Never reduce a real title to an empty string (e.g. a song called "Audio").
  return clean || (raw || '').trim();
}

export function splitArtistTrack(raw: string): { artist: string; track: string } {
  const clean = cleanTrackTitle(raw);
  if (!clean) return { artist: '', track: '' };
  const parts = clean.split(/\s+[-–—|]\s+/);
  if (parts.length >= 2) {
    const artist = parts[0].trim();
    const track = parts.slice(1).join(' - ').trim();
    if (artist && track) return { artist, track };
  }
  return { artist: '', track: clean };
}

function toResult(data: unknown): LyricsResult {
  if (!data || typeof data !== 'object') return { synced: [], plain: '' };
  const row = data as { syncedLyrics?: unknown; plainLyrics?: unknown; instrumental?: unknown };
  return {
    synced: parseLRC(typeof row.syncedLyrics === 'string' ? row.syncedLyrics : ''),
    plain: typeof row.plainLyrics === 'string' ? row.plainLyrics.trim() : '',
    instrumental: row.instrumental === true,
  };
}

// LRCLIB occasionally has a placeholder entry for a popular track (one short
// line such as "probe"). Treat that as unusable and let the search endpoint
// return the real synced lyrics.
function isWeakResult(result: LyricsResult): boolean {
  if (!result.synced.length && !result.plain) return true;
  if (result.synced.length && result.synced.length < 3 && result.plain.length < 24) return true;
  if (!result.synced.length && result.plain.length < 16) return true;
  return false;
}

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchLyrics(artist: string, track: string): Promise<LyricsResult> {
  const a = (artist || '').trim();
  const t = (track || '').trim();
  if (!a && !t) return { synced: [], plain: '' };

  const cacheKey = `${a.toLowerCase()}|${t.toLowerCase()}`;
  const cached = lyricsCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async (): Promise<LyricsResult> => {
    const attempts: Array<{ kind: 'get' | 'search'; artist: string; track: string }> = [];
    if (a && t) attempts.push({ kind: 'get', artist: a, track: t });
    if (a && t) attempts.push({ kind: 'search', artist: a, track: t });
    if (t) attempts.push({ kind: 'search', artist: '', track: t });
    if (a && !t) attempts.push({ kind: 'search', artist: a, track: '' });

    for (const attempt of attempts) {
      const qs = new URLSearchParams();
      if (attempt.track) qs.set('track_name', attempt.track);
      if (attempt.artist) qs.set('artist_name', attempt.artist);
      const url = `https://lrclib.net/api/${attempt.kind}?${qs.toString()}`;
      const data = await getJson(url);
      if (!data) continue;

      if (Array.isArray(data)) {
        // Search results are already relevance-ordered. Take the first usable
        // result instead of the one with the most lines: longer entries can be
        // a completely different recording with the same title.
        const candidate = data
          .map((item) => toResult(item))
          .find((result) => !result.instrumental && !isWeakResult(result));
        if (candidate) return candidate;
      } else {
        const parsed = toResult(data);
        // An explicit instrumental match is more trustworthy than a same-title
        // vocal track from the search fallback.
        if (parsed.instrumental) return { synced: [], plain: '' };
        if (!isWeakResult(parsed)) return parsed;
      }
    }

    return { synced: [], plain: '' };
  })();

  lyricsCache.set(cacheKey, promise);
  promise.catch(() => lyricsCache.delete(cacheKey));
  return promise;
}

export function findActiveLyricIndex(lines: LyricLine[], positionMs: number): number {
  if (!lines.length) return -1;
  const pos = Number.isFinite(positionMs) ? positionMs : 0;
  let lo = 0;
  let hi = lines.length - 1;
  let answer = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].timeMs <= pos) {
      answer = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return answer;
}
