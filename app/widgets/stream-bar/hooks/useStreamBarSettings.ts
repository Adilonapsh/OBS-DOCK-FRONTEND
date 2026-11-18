'use client';

import {
  STREAM_BAR_DEFAULTS,
  STREAM_BAR_DEFAULT_RULES,
  parseStreamBarGoals,
  parseStreamBarRules,
  type StreamBarSettings,
} from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'stream-bar-settings';

export const useStreamBarSettings = createUseWidgetSettings(STORAGE_KEY, STREAM_BAR_DEFAULTS, {
  parseValue: (key, raw) => {
    if (key === 'rules') return { value: parseStreamBarRules(raw) };
    if (key === 'goals') return { value: parseStreamBarGoals(raw) };
    return undefined;
  },
  // Alias dari HTML referensi: ?goalstyle=bar
  extraParams: (get, s) => {
    if (get('goalStyle') === null && get('goalstyle') !== null) {
      s.goalStyle = get('goalstyle') === 'bar' ? 'bar' : 'radial';
    }
  },
  validateLoaded: <T,>(loaded: T): T => {
    const s = loaded as Partial<StreamBarSettings>;
    return {
      ...STREAM_BAR_DEFAULTS,
      ...s,
      rules: Array.isArray(s.rules) ? s.rules : STREAM_BAR_DEFAULT_RULES,
      goals: Array.isArray(s.goals) ? s.goals : STREAM_BAR_DEFAULTS.goals,
    } as unknown as T;
  },
});
