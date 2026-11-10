'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, Play, Search, Square, X } from 'lucide-react';

type VoiceSample = {
  title: string;
  audio: string;
};

export type FishVoice = {
  id: string;
  title: string;
  coverImage: string;
  author: string;
  description: string;
  samples: VoiceSample[];
};

type Props = {
  open: boolean;
  selectedVoiceId: string;
  onClose: () => void;
  onSelect: (voice: FishVoice) => void;
};

type FishVoiceResponse = {
  items?: Array<{
    _id?: unknown;
    title?: unknown;
    cover_image?: unknown;
    description?: unknown;
    author?: { nickname?: unknown } | null;
    samples?: Array<{ title?: unknown; audio?: unknown }>;
  }>;
};

const VOICE_CACHE_TTL_MS = 5 * 60 * 1000;
const VOICE_CACHE_MAX_ENTRIES = 60;
const voiceResultsCache = new Map<string, { voices: FishVoice[]; cachedAt: number }>();

function getCachedVoices(key: string): FishVoice[] | null {
  const cached = voiceResultsCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > VOICE_CACHE_TTL_MS) {
    voiceResultsCache.delete(key);
    return null;
  }
  voiceResultsCache.delete(key);
  voiceResultsCache.set(key, cached);
  return cached.voices;
}

function cacheVoices(key: string, voices: FishVoice[]): void {
  voiceResultsCache.delete(key);
  voiceResultsCache.set(key, { voices, cachedAt: Date.now() });
  while (voiceResultsCache.size > VOICE_CACHE_MAX_ENTRIES) {
    const oldestKey = voiceResultsCache.keys().next().value;
    if (oldestKey === undefined) break;
    voiceResultsCache.delete(oldestKey);
  }
}

function parseVoices(data: FishVoiceResponse): FishVoice[] {
  if (!Array.isArray(data.items)) return [];
  return data.items.flatMap((item) => {
    const id = typeof item._id === 'string' ? item._id : '';
    const title = typeof item.title === 'string' ? item.title : '';
    if (!id || !title) return [];
    const coverPath = typeof item.cover_image === 'string' ? item.cover_image : '';
    const coverImage = /^coverimage\/[A-Za-z0-9_-]+$/.test(coverPath)
      ? `https://public-platform.r2.fish.audio/cdn-cgi/image/width=128,format=webp/${coverPath}`
      : '';
    const samples = Array.isArray(item.samples)
      ? item.samples.flatMap((sample) => {
          const audio = typeof sample.audio === 'string' ? sample.audio : '';
          try {
            const url = new URL(audio);
            if (url.protocol !== 'https:' || url.hostname !== 'platform.r2.fish.audio') return [];
          } catch {
            return [];
          }
          return [{ title: typeof sample.title === 'string' ? sample.title : 'Sample', audio }];
        })
      : [];
    return [{
      id,
      title,
      coverImage,
      author: typeof item.author?.nickname === 'string' ? item.author.nickname : 'Unknown creator',
      description: typeof item.description === 'string' ? item.description : '',
      samples,
    }];
  });
}

export function SpeakVoicePickerModal({ open, selectedVoiceId, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [searchId, setSearchId] = useState('');
  const [page, setPage] = useState(1);
  const [voices, setVoices] = useState<FishVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;
    const cacheKey = `${normalizedQuery.toLowerCase()}\u0000${page}`;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const cached = getCachedVoices(cacheKey);
      if (cached) {
        setVoices((current) => page === 1 ? cached : [...current, ...cached]);
        setHasMore(cached.length >= 9);
        setError('');
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      setLoading(page === 1);
      setLoadingMore(page > 1);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (normalizedQuery) {
          params.set('title', normalizedQuery);
          params.set('search_id', searchId);
        }
        const response = await fetch(`/api/fish-audio/voices?${params}`, { signal: controller.signal });
        const data = await response.json() as FishVoiceResponse & { error?: string };
        if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
        const results = parseVoices(data);
        cacheVoices(cacheKey, results);
        setVoices((current) => page === 1 ? results : [...current, ...results]);
        setHasMore(results.length >= 9);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Tidak dapat memuat suara.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }, page === 1 ? 250 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, normalizedQuery, searchId, page]);

  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  if (!open) return null;

  const stopAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
  };

  const playSample = (voiceId: string, sample: VoiceSample) => {
    const key = `${voiceId}:${sample.audio}`;
    if (playing === key) {
      stopAudio();
      return;
    }
    stopAudio();
    const audio = new Audio(sample.audio);
    audioRef.current = audio;
    setPlaying(key);
    audio.onended = stopAudio;
    audio.onerror = () => {
      setError('Sample suara gagal diputar.');
      stopAudio();
    };
    void audio.play().catch(() => {
      setError('Sample suara gagal diputar.');
      stopAudio();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[250] bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="speak-voice-picker-title"
        className="w-full max-w-5xl h-[min(760px,92vh)] bg-[#fafafa] text-zinc-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h2 id="speak-voice-picker-title" className="text-lg font-semibold">Select Voice</h2>
            <p className="text-xs text-zinc-500 mt-1">Pilih suara Fish Audio dan dengarkan sample sebelum digunakan.</p>
          </div>
          <button onClick={onClose} aria-label="Tutup pemilih voice" className="p-2 rounded-lg hover:bg-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-5 py-3 border-b border-zinc-200 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="px-3 py-2 rounded-full bg-zinc-200">Explore</span>
            <span className="text-zinc-500">Trending voices</span>
          </div>
          <label className="relative ml-auto w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                setSearchId(value.trim() ? crypto.randomUUID() : '');
                setPage(1);
              }}
              placeholder="Cari voice..."
              aria-label="Cari voice"
              className="w-full h-9 rounded-full border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-zinc-400"
            />
          </label>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="h-full min-h-40 flex items-center justify-center gap-2 text-sm text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat voice...
            </div>
          ) : error ? (
            <div role="alert" className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
          ) : voices.length === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-500">Voice tidak ditemukan.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {voices.map((voice) => (
                <article
                  key={voice.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    const sample = voice.samples[0];
                    if (sample) playSample(voice.id, sample);
                  }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
                    event.preventDefault();
                    const sample = voice.samples[0];
                    if (sample) playSample(voice.id, sample);
                  }}
                  className={`rounded-2xl border p-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400 ${selectedVoiceId === voice.id ? 'border-zinc-900 bg-zinc-100' : 'border-zinc-200 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {voice.coverImage && (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                        <img src={voice.coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
                        {voice.samples[0] && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              playSample(voice.id, voice.samples[0]);
                            }}
                            aria-label={playing === `${voice.id}:${voice.samples[0].audio}` ? `Jeda sample ${voice.title}` : `Putar sample ${voice.title}`}
                            className={`absolute inset-0 grid place-items-center !text-white transition-colors ${playing === `${voice.id}:${voice.samples[0].audio}` ? 'bg-black/65' : 'bg-black/35 opacity-0 hover:opacity-100 focus:opacity-100'}`}
                          >
                            {playing === `${voice.id}:${voice.samples[0].audio}` ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                          </button>
                        )}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate" title={voice.title}>{voice.title}</h3>
                      <p className="mt-1 text-xs text-zinc-500 truncate">oleh {voice.author}</p>
                    </div>
                    {selectedVoiceId === voice.id && <Check className="w-4 h-4 shrink-0" aria-label="Voice terpilih" />}
                  </div>
                  {voice.description && <p className="mt-2 text-xs text-zinc-600 line-clamp-2">{voice.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {voice.samples.map((sample, index) => {
                      const key = `${voice.id}:${sample.audio}`;
                      const isPlaying = playing === key;
                      return (
                        <button
                          key={`${sample.audio}-${index}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            playSample(voice.id, sample);
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] ${isPlaying ? 'border-zinc-900 bg-zinc-900 !text-white' : 'border-zinc-200 bg-white !text-zinc-700 hover:bg-zinc-100'}`}
                          title={`Putar sample: ${sample.title}`}
                        >
                          {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          {sample.title}
                        </button>
                      );
                    })}
                    {voice.samples.length === 0 && <span className="text-[11px] text-zinc-400">Tidak ada sample audio.</span>}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        stopAudio();
                        onSelect(voice);
                      }}
                      className="rounded-full bg-zinc-900 px-4 py-2 text-[11px] font-semibold !text-white hover:bg-zinc-700"
                    >
                      Gunakan Voice
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {error && voices.length > 0 && (
            <div role="alert" className="mt-3 text-center text-xs text-red-700">{error}</div>
          )}
          {hasMore && !loading && voices.length > 0 && (
            <div className="flex justify-center pt-5">
              <button
                disabled={loadingMore}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium hover:bg-zinc-100 disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="w-3 h-3 animate-spin" />}
                Muat lebih banyak
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
