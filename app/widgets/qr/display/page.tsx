'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import { AutoScale } from '../../_shared/components/AutoScale';
import StandardTheme from '../themes/Standard';
import BubbleTheme from '../themes/Bubble';
import CleanTheme from '../themes/Clean';
import BoxedTheme from '../themes/Boxed';
import MinimalTheme from '../themes/Minimal';
import CuteTheme from '../themes/Cute';
import PlainTheme from '../themes/Plain';

const LEVELS = ['L', 'M', 'Q', 'H'] as const;

function QrInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const fontSize = Math.max(10, Math.min(64, getIntParam(params, 'fontSize', 16)));
  const value = getStringParam(params, 'value', getStringParam(params, 'text', getStringParam(params, 'url', '')));
  const label = getStringParam(params, 'label', '');
  const showLabel = getBoolParam(params, 'showLabel', true);
  const size = Math.max(64, Math.min(512, getIntParam(params, 'size', 200)));
  const fg = getStringParam(params, 'fg', '#000000');
  const qrBg = getStringParam(params, 'qrBg', '#ffffff');
  const bg = getStringParam(params, 'bg', '#000000');
  const accent = getStringParam(params, 'accent', '#8b5cf6');
  const levelRaw = getStringParam(params, 'level', 'M').toUpperCase();
  const level = (LEVELS as readonly string[]).includes(levelRaw) ? (levelRaw as 'L' | 'M' | 'Q' | 'H') : 'M';
  const logo = getStringParam(params, 'logo', '');
  const pos = getStringParam(params, 'pos', 'center');
  const posStyle = getPositionStyle(pos);

  useEffect(() => loadGoogleFont(font, '400;700;900', 'qr-font'), [font]);

  const themeProps = { value, label, showLabel, size, fg, qrBg, bg, accent, font, fontSize, level, logo };

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent" style={{ fontFamily: `'${font}', sans-serif` }}>
      <style>{`.qr-font { font-family: '${font}', sans-serif; }`}</style>
      <div className="w-full h-full flex" style={posStyle as React.CSSProperties}>
        <AutoScale defaultBase={300} baseWidth={size + 100} defaultEnabled={false}>
          {theme === 'bubble' ? (
            <BubbleTheme {...themeProps} />
          ) : theme === 'clean' ? (
            <CleanTheme {...themeProps} />
          ) : theme === 'boxed' ? (
            <BoxedTheme {...themeProps} />
          ) : theme === 'minimal' ? (
            <MinimalTheme {...themeProps} />
          ) : theme === 'cute' ? (
            <CuteTheme {...themeProps} />
          ) : theme === 'plain' ? (
            <PlainTheme {...themeProps} />
          ) : (
            <StandardTheme {...themeProps} />
          )}
        </AutoScale>
        {!obsMode && !value && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">Isi ?value=https://… untuk tampilkan QR</div>
        )}
      </div>
    </div>
  );
}

export default function QrDisplayPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-transparent" />}>
      <QrInner />
    </Suspense>
  );
}
