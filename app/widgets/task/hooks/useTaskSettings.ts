'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TASK_DEFAULTS, type TaskSettings, parseTasksParam } from '../config';
import { loadSettings, saveSettings, resolvePrivateKey } from '../../_shared/utils/storage';

const STORAGE_KEY = 'task-settings';

export function useTaskSettings() {
  const searchParams = useSearchParams();
  const [privateKey, setPrivateKey] = useState('');
  const [state, setState] = useState<TaskSettings>({ ...TASK_DEFAULTS } as TaskSettings);

  useEffect(() => {
    const pk = resolvePrivateKey(searchParams);
    if (pk) setPrivateKey(pk);
    const has = searchParams.get('theme') || searchParams.get('focusMinutes');
    if (has) {
      const s: Record<string, unknown> = { ...TASK_DEFAULTS };
      for (const k of Object.keys(TASK_DEFAULTS)) {
        const v = searchParams.get(k);
        if (v !== null) {
          const def = (TASK_DEFAULTS as Record<string, unknown>)[k];
          if (k === 'tasks') {
            const parsed = parseTasksParam(v);
            if (parsed) s[k] = parsed;
          } else if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
          else s[k] = v;
        }
      }
      setState(s as TaskSettings);
    } else {
      setState(loadSettings(STORAGE_KEY, TASK_DEFAULTS as unknown as TaskSettings));
    }
  }, [searchParams]);

  useEffect(() => { saveSettings(STORAGE_KEY, state); }, [state]);

  const update = (k: keyof TaskSettings, v: unknown) => setState((prev) => ({ ...prev, [k]: v } as TaskSettings));
  const reset = () => setState({ ...TASK_DEFAULTS } as TaskSettings);
  const loadFromUrl = (url: string) => {
    const u = new URL(url);
    const p = u.searchParams;
    const s: Record<string, unknown> = { ...TASK_DEFAULTS };
    for (const k of Object.keys(TASK_DEFAULTS)) {
      const v = p.get(k);
      if (v !== null) {
        const def = (TASK_DEFAULTS as Record<string, unknown>)[k];
        if (k === 'tasks') {
          const parsed = parseTasksParam(v);
          if (parsed) s[k] = parsed;
        } else if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
        else s[k] = v;
      }
    }
    setState(s as TaskSettings);
    if (p.get('key')) setPrivateKey(p.get('key') || '');
  };

  return { state, setState, update, reset, privateKey, setPrivateKey, loadFromUrl };
}
