'use client';

import StandardTheme from '../themes/Standard';
import { tickerThemeComponents } from '../themes/registry';
import { parseTickerItems, DEMO_TICKER_ITEMS, TICKER_KEYFRAMES_CSS, type TickerSettings } from '../config';

export function TickerPreview({ state }: { state: TickerSettings }) {
  const items = parseTickerItems(state.items);
  const props = {
    items: items.length > 0 ? items : [...DEMO_TICKER_ITEMS],
    font: state.font,
    fontSize: state.fontSize,
    accent: state.accent,
    bg: state.bg,
    textColor: state.textColor,
    separator: state.separator,
    speed: state.speed,
    direction: (state.direction === 'right' ? 'right' : 'left') as 'left' | 'right',
    showBadge: state.showBadge,
    badgeText: state.badgeText,
  } as const;

  // auto-register: theme baru di themes/*.tsx langsung kepakai di preview
  const Theme = tickerThemeComponents[state.theme] ?? StandardTheme;
  return (
    <>
      <style>{TICKER_KEYFRAMES_CSS}</style>
      <Theme {...props} />
    </>
  );
}
