'use client';

import { EVENT_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'event-settings';

export const useEventSettings = createUseWidgetSettings(STORAGE_KEY, EVENT_DEFAULTS);
