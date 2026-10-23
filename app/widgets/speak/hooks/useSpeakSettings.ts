'use client';

import { SPEAK_DEFAULTS, SPEAK_THEMES } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'speak-settings';

export const useSpeakSettings = createUseWidgetSettings(STORAGE_KEY, SPEAK_DEFAULTS, {
  parseValue: (key, raw) => {
    // Migrasi URL lama (tema neon red/blue/...) ke tema Pinned.
    if (key === 'theme' && !SPEAK_THEMES.some((t) => t.value === raw)) return { value: 'standard' };
    return undefined;
  },
  validateLoaded: (loaded) => {
    const value = loaded as typeof SPEAK_DEFAULTS;
    if (SPEAK_THEMES.some((t) => t.value === value.theme)) return loaded;
    return { ...value, theme: 'standard' } as typeof loaded;
  },
});
