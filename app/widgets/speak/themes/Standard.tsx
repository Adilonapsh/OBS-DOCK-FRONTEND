'use client';

import PinnedStandard from '../../pinned/themes/Standard';
import type { SpeakThemeProps } from './types';

export const themeMeta = { value: 'standard', label: 'Standard - Dark Glass' } as const;

export default function StandardTheme(props: SpeakThemeProps) {
  return <PinnedStandard {...props} />;
}
