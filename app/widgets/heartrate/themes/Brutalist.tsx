'use client';

import { Heart } from 'lucide-react';
import type { HeartrateThemeProps } from './types';
import { HeartrateIcon } from './shared';

export const themeMeta = { value: 'brutalist', label: 'Brutalist' } as const;

export default function BrutalistTheme({ bpm, settings, connected }: HeartrateThemeProps) {
  const fontFamily = `'${settings.font}', sans-serif`;

  const brutalist = settings as unknown as {
    brutalistBg: string; brutalistTextColor: string; brutalistBadgeBg: string; brutalistBorderColor: string;
    brutalistShadow: number; brutalistHalftone: boolean; brutalistTail: boolean; brutalistItalic: boolean; brutalistUppercase: boolean;
    brutalistCompact: boolean;
  };
  const bubbleBg = brutalist.brutalistBg || '#FFFFFF';
  const txtColor = brutalist.brutalistTextColor || '#000000';
  const badgeBg = brutalist.brutalistBadgeBg || '#FFFFFF';
  const borderColor = brutalist.brutalistBorderColor || '#000000';
  const shadowOffset = brutalist.brutalistShadow ?? 6;
  const hasHalftone = brutalist.brutalistHalftone ?? true;
  const isItalic = brutalist.brutalistItalic ?? true;
  const isUppercase = brutalist.brutalistUppercase ?? true;
  const isCompact = brutalist.brutalistCompact ?? false;
  const getBorder = (w: number) => `${w}px solid ${borderColor}`;
  const getShadow = (o: number) => `${o}px ${o}px 0px 0px ${borderColor}`;
  const halftone: React.CSSProperties = { backgroundImage: 'radial-gradient(circle, #000 1.2px, transparent 1.45px)', backgroundSize: '10px 10px' };

  if (isCompact) {
    const compactBoxSize = Math.max(72, settings.fontSize * 3.8);
    const compactBpm = String(bpm ?? '--');
    const compactBpmWidth = Math.max(compactBoxSize, compactBpm.length * settings.fontSize * 1.45 + 24);
    const compactShadow = Math.max(4, shadowOffset * 2);
    return (
      <div
        className="inline-flex items-center gap-6 p-4"
        style={{
          fontFamily,
          paddingBottom: brutalist.brutalistTail ? 28 : 16,
          backgroundImage: hasHalftone ? 'radial-gradient(circle, #eeeeee 4px, transparent 4.5px)' : 'none',
          backgroundSize: '42px 42px',
        }}
      >
        <div
          className="flex shrink-0 items-center justify-center"
          style={{ width: compactBoxSize, height: compactBoxSize, backgroundColor: '#000', boxShadow: `${compactShadow}px ${compactShadow}px 0 #000` }}
        >
          <Heart
            style={{ width: compactBoxSize * 0.52, height: compactBoxSize * 0.52, color: '#fff', fill: '#fff', animation: bpm !== null && connected ? 'heartbeat 0.85s ease-in-out infinite' : undefined }}
          />
        </div>
        <div
          className="relative flex shrink-0 items-center justify-center"
          style={{ width: compactBpmWidth, height: compactBoxSize, backgroundColor: '#000', boxShadow: `${compactShadow}px ${compactShadow}px 0 #000` }}
        >
          <span className="whitespace-nowrap font-black leading-none" style={{ fontSize: settings.fontSize * 2.3, color: '#fff', fontStyle: isItalic ? 'italic' : 'normal' }}>
            {compactBpm}
          </span>
          {brutalist.brutalistTail && (
            <span className="absolute w-6 h-6 -bottom-6 left-6" style={{ backgroundColor: '#000', clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
          )}
        </div>
        <span className="font-black leading-none" style={{ fontSize: settings.fontSize * 1.35, color: '#000', fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' : 'none' }}>{settings.unit}</span>
        <span
          aria-label={connected ? 'Connected' : 'Disconnected'}
          className="shrink-0"
          style={{
            width: Math.max(16, settings.fontSize * 0.55),
            height: Math.max(16, settings.fontSize * 0.55),
            backgroundColor: connected ? '#22c55e' : '#ef4444',
            boxShadow: `${Math.max(4, shadowOffset)}px ${Math.max(4, shadowOffset)}px 0 #000`,
          }}
        />
        <style>{`@keyframes heartbeat { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }`}</style>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[420px]" style={{ fontFamily, paddingBottom: brutalist.brutalistTail ? 26 : 0, paddingRight: shadowOffset + 4 }}>
      <div className="relative" style={{ border: getBorder(4), boxShadow: getShadow(shadowOffset), backgroundColor: bubbleBg }}>
        {hasHalftone && <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={halftone} />}
        <div className="h-3 flex items-center gap-1.5 px-2" style={{ backgroundColor: borderColor, borderBottom: getBorder(4) }}>
          <span className="w-2 h-2 border" style={{ backgroundColor: bubbleBg, borderColor }} />
          <span className="w-2 h-2 border" style={{ backgroundColor: bubbleBg, borderColor }} />
          <span className="w-2 h-2 border" style={{ backgroundColor: bubbleBg, borderColor }} />
        </div>
        <div className="relative px-5 py-5 flex items-center gap-4">
          <div className="absolute top-0 left-0 w-2 bottom-0 border-r-[4px]" style={{ background: settings.accent, borderColor }} />
          {settings.showIcon && (
            <div className="w-14 h-14 flex items-center justify-center shrink-0 ml-2" style={{ backgroundColor: borderColor, border: getBorder(3), boxShadow: getShadow(4) }}>
              <HeartrateIcon settings={settings} className="w-7 h-7" style={{ color: badgeBg, fill: badgeBg, animation: bpm !== null && connected ? 'heartbeat 0.85s ease-in-out infinite' : undefined }} />
            </div>
          )}
          <div className="flex-1 min-w-0 ml-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black leading-none px-2 py-1" style={{ fontSize: settings.fontSize, color: badgeBg, backgroundColor: borderColor, border: getBorder(3), boxShadow: getShadow(3), fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' as const : 'none' }}>{bpm ?? '--'}</span>
              {settings.showUnit && <span className="font-black" style={{ fontSize: 12, color: txtColor, fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' : 'none' }}>{settings.unit}</span>}
              <span className={`w-2 h-2 border ${connected ? '' : 'opacity-50'}`} style={{ backgroundColor: connected ? '#22c55e' : '#ef4444', borderColor, boxShadow: `2px 2px 0px 0px ${borderColor}` }} />
            </div>
          </div>
        </div>
        {brutalist.brutalistTail && (
          <>
            <span className="absolute w-6 h-6 left-8 -bottom-6" style={{ backgroundColor: borderColor, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
            <span className="absolute w-6 h-6 left-8 -bottom-5" style={{ backgroundColor: bubbleBg, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
          </>
        )}
      </div>

      <style>{`@keyframes heartbeat { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }`}</style>
    </div>
  );
}
