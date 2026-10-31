'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SOCIAL_ROTATOR_DEFAULTS, type SocialRotatorSettings } from '../config';
import { loadSettings, saveSettings, resolvePrivateKey } from '../../_shared/utils/storage';

const STORAGE_KEY = 'social-rotator-settings';
export function useSocialRotatorSettings() {
  const searchParams = useSearchParams();
  const [privateKey, setPrivateKey] = useState('');
  const [state, setState] = useState<SocialRotatorSettings>(() => {
    if (typeof window === 'undefined') return { ...SOCIAL_ROTATOR_DEFAULTS } as SocialRotatorSettings;
    try {
      const sp = new URLSearchParams(window.location.search);
      const hasQuery = sp.get('theme') || sp.get('socials') || sp.get('socialsJson') || sp.get('accent');
      if (hasQuery) return { ...SOCIAL_ROTATOR_DEFAULTS } as SocialRotatorSettings;
    } catch {}
    return loadSettings(STORAGE_KEY, SOCIAL_ROTATOR_DEFAULTS as unknown as SocialRotatorSettings);
  });

  useEffect(() => {
    const pk = resolvePrivateKey(searchParams);
    if (pk) setPrivateKey(pk);
    const has = searchParams.get('theme') || searchParams.get('socials') || searchParams.get('socialsJson') || searchParams.get('accent') || searchParams.get('pos');
    if (has) {
      const s: Record<string, unknown> = { ...SOCIAL_ROTATOR_DEFAULTS };
      for (const k of Object.keys(SOCIAL_ROTATOR_DEFAULTS)) {
        const v = searchParams.get(k);
        if (v !== null) {
          const def = (SOCIAL_ROTATOR_DEFAULTS as Record<string, unknown>)[k];
          if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
          else if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
          else s[k] = v;
        }
      }
      // handle socials param separately (encoded JSON) vs socialsJson
      const socialsParam = searchParams.get('socials');
      if (socialsParam) {
        try { s['socialsJson'] = decodeURIComponent(socialsParam); } catch { s['socialsJson'] = socialsParam; }
      }
      setState(s as SocialRotatorSettings);
    }
  }, [searchParams]);

  useEffect(() => { saveSettings(STORAGE_KEY, state); }, [state]);

  const update = (k: keyof SocialRotatorSettings, v: unknown) => setState((p) => ({ ...p, [k]: v } as SocialRotatorSettings));
  const reset = () => setState({ ...SOCIAL_ROTATOR_DEFAULTS } as SocialRotatorSettings);
  const loadFromUrl = (url: string) => {
    const u = new URL(url);
    const p = u.searchParams;
    const s: Record<string, unknown> = { ...SOCIAL_ROTATOR_DEFAULTS };
    for (const k of Object.keys(SOCIAL_ROTATOR_DEFAULTS)) {
      const v = p.get(k);
      if (v !== null) {
        const def = (SOCIAL_ROTATOR_DEFAULTS as Record<string, unknown>)[k];
        if (typeof def === 'number') s[k] = parseInt(v) || (def as number);
        else if (typeof def === 'boolean') s[k] = v === 'true' || v === '1';
        else s[k] = v;
      }
    }
    const socialsParam = p.get('socials');
    if (socialsParam) {
      try { s['socialsJson'] = decodeURIComponent(socialsParam); } catch { s['socialsJson'] = socialsParam; }
    }
    setState(s as SocialRotatorSettings);
    if (p.get('key')) setPrivateKey(p.get('key') || '');
  };

  return { state, setState, update, reset, privateKey, setPrivateKey, loadFromUrl };
}
