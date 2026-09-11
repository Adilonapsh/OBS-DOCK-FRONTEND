'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { EVENT_DEFAULTS, type EventSettings } from '../config';
import { loadSettings, saveSettings, resolvePrivateKey } from '../../_shared/utils/storage';

const STORAGE_KEY = 'event-settings';

export function useEventSettings() {
  const searchParams = useSearchParams();
  const [privateKey, setPrivateKey] = useState('');
  const [state, setState] = useState<EventSettings>({ ...EVENT_DEFAULTS } as EventSettings);

  useEffect(() => {
    const pk = resolvePrivateKey(searchParams);
    if (pk) setPrivateKey(pk);
    const has = searchParams.get('theme');
    if (has) {
      const s: Record<string, unknown> = { ...EVENT_DEFAULTS };
      for (const k of Object.keys(EVENT_DEFAULTS)) {
        const v = searchParams.get(k);
        if (v !== null) {
          const def = (EVENT_DEFAULTS as Record<string, unknown>)[k];
          if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
          else if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
          else s[k] = v;
        }
      }
      setState(s as EventSettings);
    } else {
      setState(loadSettings(STORAGE_KEY, EVENT_DEFAULTS as unknown as EventSettings));
    }
  }, [searchParams]);

  useEffect(() => { saveSettings(STORAGE_KEY, state); }, [state]);

  const update = (k: keyof EventSettings, v: unknown) => setState((prev) => ({ ...prev, [k]: v } as EventSettings));
  const reset = () => setState({ ...EVENT_DEFAULTS } as EventSettings);
  const loadFromUrl = (url: string) => {
    const u = new URL(url);
    const p = u.searchParams;
    const s: Record<string, unknown> = { ...EVENT_DEFAULTS };
    for (const k of Object.keys(EVENT_DEFAULTS)) {
      const v = p.get(k);
      if (v !== null) {
        const def = (EVENT_DEFAULTS as Record<string, unknown>)[k];
        if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
        else if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
        else s[k] = v;
      }
    }
    setState(s as EventSettings);
    if (p.get('key')) setPrivateKey(p.get('key') || '');
  };

  return { state, setState, update, reset, privateKey, setPrivateKey, loadFromUrl };
}
