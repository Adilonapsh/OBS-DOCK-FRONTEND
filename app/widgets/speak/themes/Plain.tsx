'use client';

import PinnedPlain from '../../pinned/themes/Plain';
import type { SpeakThemeProps } from './types';

export const themeMeta = { value: 'plain', label: 'Plain' } as const;

export default function PlainTheme(props: SpeakThemeProps) {
  return <PinnedPlain {...props} />;
}
