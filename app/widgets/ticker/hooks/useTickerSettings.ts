'use client';

import { TICKER_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'ticker-settings';

export const useTickerSettings = createUseWidgetSettings(STORAGE_KEY, TICKER_DEFAULTS);
