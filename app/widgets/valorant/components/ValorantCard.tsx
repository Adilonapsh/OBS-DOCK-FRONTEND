'use client';

import type { ValorantCardProps, PromoState } from '../themes/types';
import { valorantThemeComponents } from '../themes/registry';
import StandardTheme from '../themes/Standard';
import { ValorantCircle } from '../themes/Circle';
import { hexToRgb } from '../themes/shared';

export type { PromoState };

// Dispatcher tipis: semua skin ada di themes/<NamaTema>.tsx dan otomatis
// terdaftar lewat themes/registry.tsx (pola yang sama seperti widget chat).
export function ValorantCard(props: ValorantCardProps) {
  const { view, font, themeColor, rr, iconUrl, rankName, promo, themeMode, brutalist, partyCode, showPartyCode } = props;

  // View circle: standalone circular RR overlay, independen dari themeMode.
  if (view === 'circle') {
    return <ValorantCircle font={font} rr={rr} iconUrl={iconUrl} themeColor={themeColor} rankName={rankName} promo={promo} partyCode={partyCode} showPartyCode={showPartyCode} />;
  }

  // Brutalist butuh setting brutalist; kalau tidak ada, jatuh ke standard.
  const Theme = themeMode === 'brutalist' && !brutalist
    ? StandardTheme
    : (valorantThemeComponents[themeMode] ?? StandardTheme);

  const [r, g, b] = hexToRgb(themeColor);
  const progress = Math.min(100, Math.max(0, (rr / 100) * 100));
  const family = `'${font}', 'Inter', sans-serif`;

  return <Theme {...props} r={r} g={g} b={b} progress={progress} family={family} />;
}
