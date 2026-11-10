'use client';

import PinnedIsland from '../../pinned/themes/Island';
import type { SpeakThemeProps } from './types';

export const themeMeta = { value: 'island', label: 'Island - Dynamic Island' } as const;

export default function IslandTheme(props: SpeakThemeProps) {
  return <PinnedIsland {...props} />;
}
