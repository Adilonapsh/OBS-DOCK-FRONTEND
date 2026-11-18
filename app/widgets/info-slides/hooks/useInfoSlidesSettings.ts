'use client';

import { INFO_SLIDES_DEFAULTS, parseSlides } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'info-slides-settings';

function applySlidesParam(
  get: (k: string) => string | null,
  s: Record<string, unknown>,
) {
  // slides dari ?slides= (encoded JSON) atau fallback slidesJson
  const slidesParam = get('slides');
  if (!slidesParam) return;
  try {
    const arr = JSON.parse(decodeURIComponent(slidesParam));
    if (Array.isArray(arr)) s.slidesJson = JSON.stringify(arr);
  } catch {}
}

export const useInfoSlidesSettings = createUseWidgetSettings(STORAGE_KEY, INFO_SLIDES_DEFAULTS, {
  parseValue: (key) => (key === 'slidesJson' ? { skip: true } : undefined),
  extraParams: applySlidesParam,
  validateLoaded: (loaded) => {
    try {
      parseSlides((loaded as { slidesJson: string }).slidesJson);
    } catch {
      (loaded as Record<string, unknown>).slidesJson = INFO_SLIDES_DEFAULTS.slidesJson;
    }
    return loaded;
  },
});
