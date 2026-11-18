'use client';

import { HEARTRATE_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'heartrate-settings';

const INT_KEYS = new Set(['fontSize', 'bgOpacity', 'lowBpm', 'highBpm', 'historyLength', 'borderRadius', 'padding', 'alertThreshold']);

export const useHeartrateSettings = createUseWidgetSettings(STORAGE_KEY, HEARTRATE_DEFAULTS, {
  parseValue: (key, raw) => {
    if (INT_KEYS.has(key)) {
      const n = parseInt(raw, 10);
      return { value: Number.isFinite(n) ? n : (HEARTRATE_DEFAULTS as Record<string, unknown>)[key] };
    }
    return undefined;
  },
});
