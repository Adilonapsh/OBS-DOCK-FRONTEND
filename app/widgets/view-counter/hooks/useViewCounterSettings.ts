'use client';

import { VIEW_COUNTER_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'view-counter-settings';

export const useViewCounterSettings = createUseWidgetSettings(STORAGE_KEY, VIEW_COUNTER_DEFAULTS);
