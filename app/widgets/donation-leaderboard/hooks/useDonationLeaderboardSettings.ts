'use client';

import { DONATION_LEADERBOARD_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'donation-leaderboard-settings';

export const useDonationLeaderboardSettings = createUseWidgetSettings(STORAGE_KEY, DONATION_LEADERBOARD_DEFAULTS);
