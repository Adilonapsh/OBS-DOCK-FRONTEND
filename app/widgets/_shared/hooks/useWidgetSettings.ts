'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadSettings, saveSettings, resolvePrivateKey } from '../utils/storage';

// Hasil parse custom untuk satu query param.
// - { skip: true } → jangan isi dari param ini (ditangani via extraParams)
// - { value } → pakai nilai ini
// - undefined → koersi default (number/boolean/string sesuai tipe default)
export type ParseValueResult = { skip?: boolean; value?: unknown } | undefined;
export type ParseValueFn = (key: string, raw: string, def: unknown) => ParseValueResult;
export type ExtraParamsFn = (get: (k: string) => string | null, s: Record<string, unknown>) => void;

export type WidgetSettingsFactoryOptions = {
  parseValue?: ParseValueFn;
  extraParams?: ExtraParamsFn;
  validateLoaded?: <T>(loaded: T) => T;
};

function applyParams(
  params: { get: (k: string) => string | null },
  defaults: Record<string, unknown>,
  parseValue?: ParseValueFn,
  extraParams?: ExtraParamsFn,
): Record<string, unknown> {
  const s: Record<string, unknown> = { ...defaults };
  for (const k of Object.keys(defaults)) {
    const v = params.get(k);
    if (v === null) continue;
    const custom = parseValue?.(k, v, defaults[k]);
    if (custom?.skip) continue;
    if (custom && 'value' in custom) {
      if (custom.value !== undefined) s[k] = custom.value;
      continue;
    }
    const def = defaults[k];
    if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
    else if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
    else s[k] = v;
  }
  extraParams?.(params.get.bind(params), s);
  return s;
}

// Generic factory - semua widget (timer/chat/poll/etc) bisa pakai ini
// Menggantikan duplikasi useTimerSettings / useChatSettings / useTaskSettings
export function createUseWidgetSettings<T extends Record<string, unknown>>(
  storageKey: string,
  defaults: T,
  options: WidgetSettingsFactoryOptions = {},
) {
  const defaultsRecord = defaults as unknown as Record<string, unknown>;
  return function useWidgetSettings() {
    const searchParams = useSearchParams();
    const [privateKey, setPrivateKey] = useState('');
    const [state, setState] = useState<T>({ ...defaults } as T);

    useEffect(() => {
      const pk = resolvePrivateKey(searchParams);
      if (pk) setPrivateKey(pk);
      const has = Array.from(searchParams.keys()).some((k) => k in defaultsRecord);
      if (has) {
        setState(applyParams(searchParams, defaultsRecord, options.parseValue, options.extraParams) as T);
      } else {
        const loaded = loadSettings(storageKey, { ...defaults } as T);
        setState(options.validateLoaded ? options.validateLoaded(loaded) : loaded);
      }
    }, [searchParams]);

    useEffect(() => { saveSettings(storageKey, state); }, [state]);

    const update = useCallback((k: keyof T, v: unknown) => setState((p) => ({ ...p, [k]: v } as T)), []);
    const reset = useCallback(() => setState({ ...defaults } as T), []);
    const loadFromUrl = useCallback((url: string) => {
      const u = new URL(url);
      setState(applyParams(u.searchParams, defaultsRecord, options.parseValue, options.extraParams) as T);
      const key = u.searchParams.get('key');
      if (key) setPrivateKey(key);
    }, []);

    return { state, setState, update, reset, privateKey, setPrivateKey, loadFromUrl };
  };
}
