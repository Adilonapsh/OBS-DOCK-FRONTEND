'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CHAT_DEFAULTS, type ChatSettings } from '../config';
import { loadSettings, saveSettings, resolvePrivateKey } from '../../_shared/utils/storage';

const STORAGE_KEY = 'chat-settings';

export function useChatSettings() {
  const searchParams = useSearchParams();
  const [privateKey, setPrivateKey] = useState('');
  const [state, setState] = useState<ChatSettings>({ ...CHAT_DEFAULTS } as ChatSettings);

  useEffect(() => {
    const pk = resolvePrivateKey(searchParams);
    if (pk) setPrivateKey(pk);

    const has = searchParams.get('theme');
    if (has) {
      const s: Record<string, unknown> = { ...CHAT_DEFAULTS };
      for (const k of Object.keys(CHAT_DEFAULTS)) {
        const v = searchParams.get(k);
        if (v !== null) {
          const def = (CHAT_DEFAULTS as Record<string, unknown>)[k];
          if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
          else if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
          else s[k] = v;
        }
      }
      setState(s as ChatSettings);
    } else {
      setState(loadSettings(STORAGE_KEY, CHAT_DEFAULTS as unknown as ChatSettings));
    }
  }, [searchParams]);

  useEffect(() => {
    saveSettings(STORAGE_KEY, state);
  }, [state]);

  const update = (k: keyof ChatSettings, v: unknown) =>
    setState((prev) => ({ ...prev, [k]: v } as ChatSettings));

  const reset = () => setState({ ...CHAT_DEFAULTS } as ChatSettings);

  const loadFromUrl = (url: string) => {
    const u = new URL(url);
    const p = u.searchParams;
    const s: Record<string, unknown> = { ...CHAT_DEFAULTS };
    for (const k of Object.keys(CHAT_DEFAULTS)) {
      const v = p.get(k);
      if (v !== null) {
        const def = (CHAT_DEFAULTS as Record<string, unknown>)[k];
        if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
        else if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
        else s[k] = v;
      }
    }
    setState(s as ChatSettings);
    if (p.get('key')) setPrivateKey(p.get('key') || '');
  };

  return { state, setState, update, reset, privateKey, setPrivateKey, loadFromUrl };
}
