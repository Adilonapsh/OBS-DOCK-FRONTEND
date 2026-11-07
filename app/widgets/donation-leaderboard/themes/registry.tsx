import type { ComponentType } from 'react';
import type { DonationLeaderboardThemeProps } from './types';
import StandardTheme from './Standard';
import MinimalTheme from './Minimal';
import BrutalistTheme from './Brutalist';

export const donationLeaderboardThemeComponents: Record<string, ComponentType<DonationLeaderboardThemeProps>> = {
  standard: StandardTheme,
  minimal: MinimalTheme,
  brutalist: BrutalistTheme,
};

export const DONATION_LEADERBOARD_THEME_OPTIONS = [
  { value: 'standard', label: 'Standard - List Card' },
  { value: 'minimal', label: 'Minimal - Bar' },
  { value: 'brutalist', label: 'Brutalist' },
] as const;

export const DONATION_LEADERBOARD_THEME_DEFAULT = 'standard';
