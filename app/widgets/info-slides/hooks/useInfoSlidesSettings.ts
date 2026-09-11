'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { INFO_SLIDES_DEFAULTS, type InfoSlidesSettings, parseSlides } from '../config';
import { loadSettings, saveSettings, resolvePrivateKey } from '../../_shared/utils/storage';

const STORAGE_KEY = 'info-slides-settings';

export function useInfoSlidesSettings() {
  const searchParams = useSearchParams();
  const [privateKey, setPrivateKey] = useState('');
  const [state, setState] = useState<InfoSlidesSettings>({ ...INFO_SLIDES_DEFAULTS } as InfoSlidesSettings);

  useEffect(() => {
    const pk = resolvePrivateKey(searchParams);
    if (pk) setPrivateKey(pk);

    const has = searchParams.get('theme');
    if (has) {
      const s: Record<string, unknown> = { ...INFO_SLIDES_DEFAULTS };
      for (const k of Object.keys(INFO_SLIDES_DEFAULTS)) {
        const v = searchParams.get(k);
        if (v !== null) {
          const def = (INFO_SLIDES_DEFAULTS as Record<string, unknown>)[k];
          if (k === 'slidesJson') continue;
          if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
          else if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
          else s[k] = v;
        }
      }
      // slides dari ?slides= (encoded JSON) atau fallback slidesJson
      const slidesParam = searchParams.get('slides');
      if (slidesParam) {
        try {
          const decoded = decodeURIComponent(slidesParam);
          const arr = JSON.parse(decoded);
          if (Array.isArray(arr)) (s as any).slidesJson = JSON.stringify(arr);
        } catch {}
      }
      setState(s as InfoSlidesSettings);
    } else {
      const loaded = loadSettings(STORAGE_KEY, INFO_SLIDES_DEFAULTS as unknown as InfoSlidesSettings);
      // validasi slidesJson
      try { parseSlides(loaded.slidesJson); } catch { (loaded as any).slidesJson = INFO_SLIDES_DEFAULTS.slidesJson; }
      setState(loaded);
    }
  }, [searchParams]);

  useEffect(() => {
    saveSettings(STORAGE_KEY, state);
  }, [state]);

  const update = (k: keyof InfoSlidesSettings, v: unknown) =>
    setState((prev) => ({ ...prev, [k]: v } as InfoSlidesSettings));

  const reset = () => setState({ ...INFO_SLIDES_DEFAULTS } as InfoSlidesSettings);

  const loadFromUrl = (url: string) => {
    const u = new URL(url);
    const p = u.searchParams;
    const s: Record<string, unknown> = { ...INFO_SLIDES_DEFAULTS };
    for (const k of Object.keys(INFO_SLIDES_DEFAULTS)) {
      const v = p.get(k);
      if (v !== null && k !== 'slidesJson') {
        const def = (INFO_SLIDES_DEFAULTS as Record<string, unknown>)[k];
        if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
        else if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
        else s[k] = v;
      }
    }
    const slidesParam = p.get('slides');
    if (slidesParam) {
      try {
        const decoded = decodeURIComponent(slidesParam);
        const arr = JSON.parse(decoded);
        if (Array.isArray(arr)) (s as any).slidesJson = JSON.stringify(arr);
      } catch {}
    }
    setState(s as InfoSlidesSettings);
    if (p.get('key')) setPrivateKey(p.get('key') || '');
  };

  return { state, setState, update, reset, privateKey, setPrivateKey, loadFromUrl };
}
