'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import { tickerThemeComponents } from '../themes/registry';
import StandardTheme from '../themes/Standard';
import { parseTickerItems, DEMO_TICKER_ITEMS, TICKER_KEYFRAMES_CSS } from '../config';

function TickerInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const fontSize = Math.max(10, Math.min(40, getIntParam(params, 'fontSize', 16)));
  const accent = getStringParam(params, 'accent', '#22d3ee');
  const bg = getStringParam(params, 'bg', 'transparent');
  const textColor = getStringParam(params, 'textColor', '');
  const separator = getStringParam(params, 'separator', '•');
  const speed = Math.max(3, Math.min(120, getIntParam(params, 'speed', 20)));
  const direction = (getStringParam(params, 'direction', 'left') === 'right' ? 'right' : 'left') as 'left' | 'right';
  const showBadge = getBoolParam(params, 'showBadge', true);
  const badgeText = getStringParam(params, 'badgeText', 'INFO');
  const pos = getStringParam(params, 'pos', 'b');
  const posStyle = getPositionStyle(pos);

  const rawItems = simulate ? '' : getStringParam(params, 'items', '');
  const parsed = parseTickerItems(rawItems);
  const items = parsed.length > 0 ? parsed : [...DEMO_TICKER_ITEMS];

  useEffect(() => loadGoogleFont(font, '400;700;900', 'ticker-font'), [font]);

  const themeProps = {
    items,
    font,
    fontSize,
    accent,
    bg,
    textColor,
    separator,
    speed,
    direction,
    showBadge,
    badgeText,
  };

  // auto-register: theme baru di themes/*.tsx langsung kepakai tanpa tambah case
  const Theme = tickerThemeComponents[theme] ?? StandardTheme;

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`${TICKER_KEYFRAMES_CSS} @import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;700;900&display=swap'); html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; scrollbar-width:none;-ms-overflow-style:none; } html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;width:0;height:0}`}</style>
      <div
        id="ticker-display-root"
        className={`${obsMode ? `fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-2` : `w-full min-h-screen bg-[#0a0a0a] flex p-4`}`}
        style={{ ...posStyle, background: obsMode ? 'transparent' : '#0a0a0a', fontFamily: `'${font}', sans-serif` } as any}
      >
        {!obsMode && <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">TICKER • {theme} • {items.length} items</div>}
        <div className="w-full">
          <Theme {...themeProps} />
        </div>
      </div>
    </>
  );
}

export default function TickerDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <TickerInner />
    </Suspense>
  );
}
