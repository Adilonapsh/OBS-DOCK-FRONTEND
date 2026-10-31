'use client';

import { FOLLOW_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'follow-settings';

export const useFollowSettings = createUseWidgetSettings(STORAGE_KEY, FOLLOW_DEFAULTS);
