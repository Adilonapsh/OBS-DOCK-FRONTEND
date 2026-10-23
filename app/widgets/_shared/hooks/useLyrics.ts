'use client';

import { useEffect, useState } from 'react';
import {
  fetchLyrics,
  findActiveLyricIndex,
  type LyricLine,
  type LyricsStatus,
} from '../utils/lyrics';

type UseLyricsOptions = {
  track?: string;
  artist?: string;
  enabled?: boolean;
  lrclibEnabled?: boolean;
  positionMs?: number;
};

type LyricsState = {
  key: string;
  lyrics: LyricLine[];
  plainLyrics: string;
  status: LyricsStatus;
};

const EMPTY_STATE: LyricsState = {
  key: '',
  lyrics: [],
  plainLyrics: '',
  status: 'idle',
};

export function useLyrics({
  track = '',
  artist = '',
  enabled = true,
  lrclibEnabled = true,
  positionMs = 0,
}: UseLyricsOptions) {
  const active = enabled && lrclibEnabled && Boolean(track || artist);
  const queryKey = `${track}\u0000${artist}`;
  const [data, setData] = useState<LyricsState>(EMPTY_STATE);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    fetchLyrics(artist, track)
      .then((result) => {
        if (cancelled) return;
        setData({
          key: queryKey,
          lyrics: result.synced,
          plainLyrics: result.plain,
          status: result.synced.length ? 'synced' : result.plain ? 'plain' : 'none',
        });
      })
      .catch(() => {
        if (cancelled) return;
        setData({
          key: queryKey,
          lyrics: [],
          plainLyrics: '',
          status: 'error',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [active, artist, queryKey, track]);

  const ready = data.key === queryKey;
  const lyrics = active && ready ? data.lyrics : [];
  const plainLyrics = active && ready ? data.plainLyrics : '';
  const status: LyricsStatus = !active ? 'idle' : ready ? data.status : 'loading';
  const loading = active && !ready;

  const activeIndex = findActiveLyricIndex(lyrics, positionMs);

  return { lyrics, plainLyrics, activeIndex, loading, status };
}
