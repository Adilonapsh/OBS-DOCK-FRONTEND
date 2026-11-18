'use client';

import { PINNED_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'pinned-settings';

export const usePinnedSettings = createUseWidgetSettings(STORAGE_KEY, PINNED_DEFAULTS);
