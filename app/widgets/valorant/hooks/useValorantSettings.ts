'use client';

import { VALORANT_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'valorant-settings';

const INT_KEYS = new Set(['refresh', 'brutalistShadow']);

export const useValorantSettings = createUseWidgetSettings(STORAGE_KEY, VALORANT_DEFAULTS, {
  parseValue: (key, raw) => {
    if (INT_KEYS.has(key)) {
      const n = parseInt(raw, 10);
      return { value: Number.isFinite(n) ? Math.max(0, n) : (VALORANT_DEFAULTS as Record<string, unknown>)[key] };
    }
    return undefined;
  },
});
