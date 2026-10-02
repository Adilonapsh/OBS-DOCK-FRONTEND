'use client';

import { CHAT_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'chat-settings';

const FLOAT_KEYS = new Set(['lineSpacing', 'bubbleOpacity', 'charDurationS']);

// Alias nutty.gg -> key internal. Load URL nutty bisa ditempel langsung.
function applyNuttyAliases(get: (k: string) => string | null, s: Record<string, unknown>): void {
  const alias = (nuttyKey: string, ourKey: string) => {
    if (!(ourKey in s)) return;
    // Jangan timpa bila URL sudah pakai key internal
    const v = get(nuttyKey);
    if (v !== null && get(ourKey) === null) {
      const def = (CHAT_DEFAULTS as Record<string, unknown>)[ourKey];
      if (typeof def === 'boolean') s[ourKey] = v === 'true' || v === '1';
      else if (typeof def === 'number') s[ourKey] = parseFloat(v);
      else s[ourKey] = v;
    }
  };
  alias('showTimestamps', 'showTimestamp');
  alias('background', 'bg');
  alias('inlineChat', 'inline');
  // opacity nutty 0-1, internal 0-100
  if (get('bgOpacity') === null && get('opacity') !== null) {
    const raw = String(get('opacity'));
    const n = parseFloat(raw);
    if (Number.isFinite(n)) s['bgOpacity'] = n <= 1 && raw.includes('.') ? Math.round(n * 100) : Math.round(n);
  }
}

export const useChatSettings = createUseWidgetSettings(STORAGE_KEY, CHAT_DEFAULTS, {
  parseValue: (key, raw) => {
    if (FLOAT_KEYS.has(key)) {
      const n = parseFloat(raw);
      return { value: Number.isFinite(n) ? n : (CHAT_DEFAULTS as Record<string, unknown>)[key] };
    }
    return undefined;
  },
  extraParams: applyNuttyAliases,
});
