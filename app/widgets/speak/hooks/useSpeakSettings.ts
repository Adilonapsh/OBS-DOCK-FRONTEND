'use client';

import { SPEAK_DEFAULTS, SPEAK_SETTINGS_STORAGE_KEY, SPEAK_THEMES } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

export const useSpeakSettings = createUseWidgetSettings(SPEAK_SETTINGS_STORAGE_KEY, SPEAK_DEFAULTS, {
  parseValue: (key, raw) => {
    // Migrasi URL lama (tema neon red/blue/...) ke tema Pinned.
    if (key === 'theme' && !SPEAK_THEMES.some((t) => t.value === raw)) return { value: 'standard' };
    return undefined;
  },
  validateLoaded: (loaded) => {
    const value = loaded as typeof SPEAK_DEFAULTS;
    return {
      ...value,
      theme: SPEAK_THEMES.some((t) => t.value === value.theme) ? value.theme : 'standard',
      voiceId: typeof value.voiceId === 'string' ? value.voiceId : '',
      voiceTitle: typeof value.voiceTitle === 'string' ? value.voiceTitle : '',
      voiceAuthor: typeof value.voiceAuthor === 'string' ? value.voiceAuthor : '',
    } as typeof loaded;
  },
});
