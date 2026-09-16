'use client';

import { MUSIC_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'music-settings';

export const useMusicSettings = createUseWidgetSettings(STORAGE_KEY, MUSIC_DEFAULTS);
