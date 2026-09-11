'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FOLLOW_DEFAULTS, type FollowSettings } from '../config';
import { loadSettings, saveSettings, resolvePrivateKey } from '../../_shared/utils/storage';

const STORAGE_KEY = 'follow-settings';

export function useFollowSettings() {
  const searchParams = useSearchParams();
  const [privateKey, setPrivateKey] = useState('');
  const [state, setState] = useState<FollowSettings>({ ...FOLLOW_DEFAULTS } as FollowSettings);

  useEffect(() => {
    const pk = resolvePrivateKey(searchParams);
    if (pk) setPrivateKey(pk);
    const has = searchParams.get('theme');
    if (has) {
      const s: Record<string, unknown> = { ...FOLLOW_DEFAULTS };
      for (const k of Object.keys(FOLLOW_DEFAULTS)) {
        const v = searchParams.get(k);
        if (v !== null) {
          const def = (FOLLOW_DEFAULTS as Record<string, unknown>)[k];
          if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
          else if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
          else s[k] = v;
        }
      }
      setState(s as FollowSettings);
    } else {
      setState(loadSettings(STORAGE_KEY, FOLLOW_DEFAULTS as unknown as FollowSettings));
    }
  }, [searchParams]);

  useEffect(() => { saveSettings(STORAGE_KEY, state); }, [state]);

  const update = (k: keyof FollowSettings, v: unknown) => setState((p) => ({ ...p, [k]: v } as FollowSettings));
  const reset = () => setState({ ...FOLLOW_DEFAULTS } as FollowSettings);
  const loadFromUrl = (url: string) => {
    const u = new URL(url);
    const p = u.searchParams;
    const s: Record<string, unknown> = { ...FOLLOW_DEFAULTS };
    for (const k of Object.keys(FOLLOW_DEFAULTS)) {
      const v = p.get(k);
      if (v !== null) {
        const def = (FOLLOW_DEFAULTS as Record<string, unknown>)[k];
        if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
        else if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
        else s[k] = v;
      }
    }
    setState(s as FollowSettings);
    if (p.get('key')) setPrivateKey(p.get('key') || '');
  };

  return { state, setState, update, reset, privateKey, setPrivateKey, loadFromUrl };
}
