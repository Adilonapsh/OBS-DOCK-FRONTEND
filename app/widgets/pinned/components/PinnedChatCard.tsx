'use client';

import type { PinnedChatCardProps } from '../themes/types';
import { pinnedThemeComponents } from '../themes/registry';
import StandardTheme from '../themes/Standard';

export type { PinnedCardItem, PinnedCardStatus, PinnedChatCardProps } from '../themes/types';
export { PINNED_CHAT_CSS } from '../themes/styles';
export { pinnedBaseWidth, platformLogo } from '../themes/shared';

// Dispatcher tipis: semua tema ada di themes/<NamaTema>.tsx dan otomatis
// terdaftar lewat themes/registry.tsx (pola yang sama seperti widget chat).
// Dipakai widget Pinned dan Speak supaya tampilan keduanya sama.
export function PinnedChatCard(props: PinnedChatCardProps) {
  const key = props.theme === 'typing' ? 'monkey' : props.theme;
  const Theme = pinnedThemeComponents[key] ?? StandardTheme;
  return <Theme {...props} />;
}
