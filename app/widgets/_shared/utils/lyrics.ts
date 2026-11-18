// Shared LRCLIB helpers for widgets that want synced lyrics (media-player/music).
// The standalone lyrics widget has its own copy of this logic; this module keeps
// the player integrations small and avoids a second fetch implementation.

export type LyricWord = { timeMs: number; text: string };
export type LyricLine = {
  timeMs: number;
  text: string;
  /** Akhir baris (ms) kalau tersedia dari lyricsfile word-sync. */
  endMs?: number;
  /** Timing per kata (enhanced/word-synced lyricsfile). */
  words?: LyricWord[];
};
export type LyricsStatus = 'idle' | 'loading' | 'synced' | 'plain' | 'none' | 'error';
export type LyricsResult = { synced: LyricLine[]; plain: string; instrumental?: boolean; wordSync?: boolean };

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

/** Buka quote YAML sederhana ('...' atau "...") yang dipakai lyricsfile LRCLIB. */
function unquoteYamlValue(raw: string): string {
  const value = raw.trim();
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
  }
  return value;
}

/**
 * Parse `lyricsfile` (YAML) dari LRCLIB. Mendukung `lines[].words` untuk
 * word-sync. Parser minimal - hanya membaca struktur yang dipakai LRCLIB:
 *
 *   lines:
 *   - text: ...
 *     start_ms: 12345
 *     end_ms: 15000
 *     words:
 *     - text: '...'
 *       start_ms: 12345
 */
export function parseLyricsfile(yaml: string): LyricLine[] {
  if (!yaml || !yaml.includes('lines:')) return [];
  const rows = yaml.split(/\r?\n/);
  const result: LyricLine[] = [];
  let current: LyricLine | null = null;
  let currentWord: LyricWord | null = null;
  let inWords = false;
  let lineIndent = 0;
  let wordIndent = 0;

  for (const raw of rows) {
    if (!raw.trim()) continue;
    const indent = raw.length - raw.trimStart().length;
    const content = raw.trim();

    if (content === 'words:') {
      inWords = true;
      continue;
    }

    if (content.startsWith('- text:')) {
      const text = unquoteYamlValue(content.slice('- text:'.length));
      const isWord = Boolean(current) && inWords && indent > lineIndent;
      if (isWord && current) {
        currentWord = { timeMs: 0, text };
        wordIndent = indent;
        current.words = current.words || [];
        current.words.push(currentWord);
      } else {
        current = { timeMs: 0, text };
        currentWord = null;
        inWords = false;
        lineIndent = indent;
        result.push(current);
      }
      continue;
    }

    if (content.startsWith('start_ms:')) {
      const ms = parseInt(content.slice('start_ms:'.length).trim(), 10);
      if (!Number.isFinite(ms)) continue;
      if (currentWord && indent > wordIndent) currentWord.timeMs = ms;
      else if (current) current.timeMs = ms;
      continue;
    }

    if (content.startsWith('end_ms:')) {
      const ms = parseInt(content.slice('end_ms:'.length).trim(), 10);
      if (!Number.isFinite(ms)) continue;
      if (currentWord && indent > wordIndent) continue;
      if (current) current.endMs = ms;
      continue;
    }

    if (content.startsWith('text:')) {
      const text = unquoteYamlValue(content.slice('text:'.length));
      if (current) current.text = current.text || text;
      else {
        current = { timeMs: 0, text };
        result.push(current);
      }
    }
  }

  // Baris kosong (jeda instrumental) tidak perlu ditampilkan.
  return result.filter((line) => line.text.trim().length > 0);
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

// ---------------------------------------------------------------------------
// Normalisasi query judul (YouTube / SMTC)
// ---------------------------------------------------------------------------
// Judul dari YouTube sering mengandung embel-embel "(Official Video)",
// "[Lirik]", nama channel, terjemahan, dll. LRCLIB tidak mengenali judul
// seperti itu, jadi query dibersihkan dulu sebelum request.

export type ParsedMusicQuery = { song: string; artist: string; cleanFullQuery: string };

const TITLE_NOISE_BRACKET_RE =
  /[\(\[\{][^\)\]\}]*(?:official|video|audio|lyric|lirik|mv|m\/v|hd|4k|visualizer|live|cover|explicit|remaster|version|ver\.|ost|soundtrack|sub\s*indo|terjemahan|karaoke|instrumental|prod\.|directed)[^\)\]\}]*[\)\]\}]/gi;

/** Buang metadata video/audio dari judul, tanpa memotong nama lagu asli. */
export function stripTitleNoise(raw: string): string {
  const original = (raw || '').trim();
  const text = original
    .replace(TITLE_NOISE_BRACKET_RE, '')
    // teks setelah "|" / "•" (nama channel, terjemahan judul)
    .replace(/\s*[|•·]\s*.*$/, '')
    // "Judul / Terjemahan" atau "Judul // Terjemahan" - jangan sentuh "AC/DC"
    .replace(/\s+\/\s+.*$/, '')
    .replace(/\s*\/\/\s*.*$/, '')
    .replace(/\b(?:official\s*(?:music\s*)?video|official\s*audio|lyric\s*video|official\s*mv|m\/v)\b/gi, '')
    .replace(/\s+-\s+(?:Topic|Official|VEVO)$/i, '')
    .replace(/VEVO$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text || original;
}

/**
 * Parse judul mentah menjadi { song, artist, cleanFullQuery }.
 * Mendukung pola: `Artis - Judul`, `Judul by Artis`, `Artis "Judul"`,
 * plus pembersihan tag YouTube.
 */
export function parseAndCleanMusicQuery(rawInput: string): ParsedMusicQuery {
  const text = stripTitleNoise(rawInput);
  if (!text) return { song: '', artist: '', cleanFullQuery: '' };

  // Pola tanda kutip: `Tulus "Hati-Hati di Jalan"` atau `"Hati-Hati di Jalan" - Tulus`
  const quoteMatch = text.match(/["“]([^"”]+)["”]/);
  if (quoteMatch) {
    const quotedSong = quoteMatch[1].trim();
    const remainingArtist = text
      .replace(quoteMatch[0], '')
      .replace(/^[\s\-–—:by]+|[\s\-–—:]+$/gi, '')
      .trim();
    if (quotedSong && remainingArtist) {
      return { song: quotedSong, artist: remainingArtist, cleanFullQuery: `${remainingArtist} ${quotedSong}` };
    }
  }

  // Pola "Judul by Artis"
  const byMatch = text.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byMatch && !text.includes(' - ')) {
    const song = byMatch[1].trim();
    const artist = byMatch[2].replace(/\s*(?:ft\.?|feat\.?|featuring)\s+.*$/i, '').trim();
    return { song, artist, cleanFullQuery: `${artist} ${song}`.trim() };
  }

  // Pisah berdasarkan tanda hubung (-, –, —), lalu hilangkan duplikasi artis
  const rawParts = text.split(/\s+[-–—]\s+/).map((p) => p.trim()).filter(Boolean);
  const uniqueParts: string[] = [];
  for (const part of rawParts) {
    if (uniqueParts.length === 0 || uniqueParts[uniqueParts.length - 1].toLowerCase() !== part.toLowerCase()) {
      uniqueParts.push(part);
    }
  }

  let song = text;
  let artist = '';
  if (uniqueParts.length >= 2) {
    artist = uniqueParts[0];
    song = uniqueParts[1];
  } else if (uniqueParts.length === 1) {
    song = uniqueParts[0];
  }

  // Bersihkan "ft." / "feat." dari judul & artis
  song = song.replace(/\s*(?:ft\.?|feat\.?|featuring)\s+.*$/i, '').trim();
  artist = artist.replace(/\s*(?:ft\.?|feat\.?|featuring)\s+.*$/i, '').trim();

  return { song, artist, cleanFullQuery: [artist, song].filter(Boolean).join(' ') };
}

const NOISE_ARTIST_RE = /^(?:youtube|you\s*tube|youtube\s*music|vevo|topic|various\s*artists|unknown(?:\s*artist)?|auto[-\s]?generated.*)$/i;

/** Buang akhiran channel dari nama artis, mis. "Tulus - Topic" / "TulusVEVO". */
export function stripArtistNoise(raw: string): string {
  return (raw || '')
    .replace(/\s*-\s*topic$/i, '')
    .replace(/\s*-\s*official$/i, '')
    .replace(/\s*vevo$/i, '')
    .trim();
}

/**
 * Gabungkan metadata SMTC (artist + track) dengan hasil parsing judul.
 * Dipakai sebelum request ke LRCLIB supaya judul YouTube tetap ketemu.
 */
export function normalizeLyricsQuery(rawArtist: string, rawTrack: string): { artist: string; track: string } {
  const artist = stripArtistNoise(rawArtist);
  const track = (rawTrack || '').trim();
  const parsed = parseAndCleanMusicQuery(track || artist);
  const song = parsed.song || track || artist;

  const artistIsNoise = !artist || NOISE_ARTIST_RE.test(artist);
  if (artistIsNoise) {
    return { artist: parsed.artist, track: song };
  }
  // Judul "Artis - Judul" hanya di-split kalau artisnya cocok dengan metadata.
  // Kalau beda (judul asli memang mengandung tanda hubung), cukup buang noise.
  const sameArtist = Boolean(parsed.artist) && parsed.artist.toLowerCase() === artist.toLowerCase();
  const finalTrack = !parsed.artist || sameArtist ? song : stripTitleNoise(track) || track;
  return { artist, track: finalTrack };
}

type RawLyricsRecord = {
  trackName?: unknown;
  name?: unknown;
  artistName?: unknown;
  syncedLyrics?: unknown;
  plainLyrics?: unknown;
  instrumental?: unknown;
  hasWordSync?: unknown;
  lyricsfile?: unknown;
};

function toResult(data: unknown): LyricsResult {
  if (!data || typeof data !== 'object') return { synced: [], plain: '' };
  const row = data as RawLyricsRecord;
  const lineSynced = parseLRC(typeof row.syncedLyrics === 'string' ? row.syncedLyrics : '');
  // Word-sync hanya tersedia lewat `lyricsfile`, bukan di `syncedLyrics`.
  const wordSynced = row.hasWordSync === true && typeof row.lyricsfile === 'string'
    ? parseLyricsfile(row.lyricsfile)
    : [];
  return {
    synced: wordSynced.length ? wordSynced : lineSynced,
    plain: typeof row.plainLyrics === 'string' ? row.plainLyrics.trim() : '',
    instrumental: row.instrumental === true,
    wordSync: wordSynced.length > 0,
  };
}

function normalizeForMatch(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** Result dianggap relevan kalau judul/artis cocok dengan query yang dicoba. */
function isRelevantRecord(record: RawLyricsRecord, artist: string, track: string): boolean {
  const trackOk = track ? namesMatch(typeof record.trackName === 'string' ? record.trackName : typeof record.name === 'string' ? record.name : '', track) : false;
  const artistOk = artist ? namesMatch(typeof record.artistName === 'string' ? record.artistName : '', artist) : false;
  if (track && artist) return trackOk && artistOk;
  if (track) return trackOk;
  if (artist) return artistOk;
  return true;
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
    // Coba query hasil normalisasi dulu (judul YouTube dirapikan), lalu
    // fallback ke metadata mentah kalau tidak ketemu.
    const normalized = normalizeLyricsQuery(a, t);
    const queries: Array<{ artist: string; track: string }> = [{ artist: normalized.artist, track: normalized.track }];
    if (normalized.artist !== a || normalized.track !== t) queries.push({ artist: a, track: t });

    const seen = new Set<string>();
    const attempts: Array<{ kind: 'get' | 'search'; artist: string; track: string }> = [];
    const pushAttempt = (kind: 'get' | 'search', qArtist: string, qTrack: string) => {
      const key = `${kind}|${qArtist.toLowerCase()}|${qTrack.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      attempts.push({ kind, artist: qArtist, track: qTrack });
    };
    for (const q of queries) {
      if (q.artist && q.track) pushAttempt('get', q.artist, q.track);
      if (q.artist && q.track) pushAttempt('search', q.artist, q.track);
      if (q.track) pushAttempt('search', '', q.track);
      if (q.artist && !q.track) pushAttempt('search', q.artist, '');
    }

    for (const attempt of attempts) {
      const qs = new URLSearchParams();
      if (attempt.track) qs.set('track_name', attempt.track);
      if (attempt.artist) qs.set('artist_name', attempt.artist);
      const url = `https://lrclib.net/api/${attempt.kind}?${qs.toString()}`;
      const data = await getJson(url);
      if (!data) continue;

      if (Array.isArray(data)) {
        // Hasil search sudah relevance-ordered. Prioritas: record word-sync
        // yang relevan dengan query; kalau tidak ada, pakai hasil line-sync
        // pertama seperti sebelumnya.
        const rows = data as RawLyricsRecord[];
        const usable = rows
          .map((row) => ({ row, result: toResult(row) }))
          .filter(({ result }) => !result.instrumental && !isWeakResult(result));
        if (usable.length) {
          const wordSynced = usable.find(
            ({ row, result }) => result.wordSync === true && isRelevantRecord(row, attempt.artist, attempt.track),
          );
          return (wordSynced || usable[0]).result;
        }
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
