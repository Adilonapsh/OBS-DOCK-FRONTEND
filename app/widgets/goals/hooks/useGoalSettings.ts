'use client';

import { GOALS_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'goals-settings';

export const useGoalSettings = createUseWidgetSettings(STORAGE_KEY, GOALS_DEFAULTS);
