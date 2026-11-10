'use client';

import type { ValorantSkinProps } from './types';
import StandardTheme from './Standard';

export const themeMeta = { value: 'custom', label: 'Custom - pakai accent' } as const;

export default function CustomTheme(props: ValorantSkinProps) {
  return <StandardTheme {...props} />;
}
