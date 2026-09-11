'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadSettings, saveSettings, resolvePrivateKey } from '../utils/storage';

// Generic factory — semua widget (timer/chat/poll/etc) bisa pakai ini
// Menggantikan duplikasi useTimerSettings / useChatSettings / useTaskSettings
export function createUseWidgetSettings<T extends Record<string, unknown>>(storageKey: string, defaults: T) {
  return function useWidgetSettings() {
    const searchParams = useSearchParams();
    const [privateKey, setPrivateKey] = useState('');
    const [state, setState] = useState<T>({ ...defaults } as T);

    useEffect(() => {
      const pk = resolvePrivateKey(searchParams);
      if (pk) setPrivateKey(pk);
      const has = Array.from(searchParams.keys()).some((k) => k in defaults);
      if (has) {
        const s: Record<string, unknown> = { ...defaults };
        for (const k of Object.keys(defaults)) {
          const v = searchParams.get(k);
          if (v !== null) {
            const def = (defaults as Record<string, unknown>)[k];
            if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
            else if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
            else s[k] = v;
          }
        }
        setState(s as T);
      } else {
        setState(loadSettings(storageKey, defaults as unknown as T));
      }
    }, [searchParams]);

    useEffect(() => { saveSettings(storageKey, state); }, [state]);

    const update = useCallback((k: keyof T, v: unknown) => setState((p) => ({ ...p, [k]: v } as T)), []);
    const reset = useCallback(() => setState({ ...defaults } as T), []);
    const loadFromUrl = useCallback((url: string) => {
      const u = new URL(url);
      const p = u.searchParams;
      const s: Record<string, unknown> = { ...defaults };
      for (const k of Object.keys(defaults)) {
        const v = p.get(k);
        if (v !== null) {
          const def = (defaults as Record<string, unknown>)[k];
          if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
          else if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
          else s[k] = v;
        }
      }
      setState(s as T);
      if (p.get('key')) setPrivateKey(p.get('key') || '');
    }, []);

    return { state, setState, update, reset, privateKey, setPrivateKey, loadFromUrl };
  };
}
