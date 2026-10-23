import type { ComponentType } from 'react';
import type { GoalThemeProps } from './types';
import Standard from './Standard';
import Minimal from './Minimal';
import Plain from './Plain';
import Brutalist from './Brutalist';
import Passion from './Passion';
import NeonBar from './NeonBar';

export const goalThemeComponents: Record<string, ComponentType<GoalThemeProps>> = {
  standard: Standard,
  minimal: Minimal,
  plain: Plain,
  brutalist: Brutalist,
  neonbar: NeonBar,
};

export const GOAL_THEME_OPTIONS = [
  { value: 'standard', label: 'Standard - Card' },
  { value: 'minimal', label: 'Minimal - Bar' },
  { value: 'plain', label: 'Plain - Teks Polos' },
  { value: 'brutalist', label: 'Brutalist' },
  { value: 'neonbar', label: 'Neon Bar - Video Progress' },
] as const;
