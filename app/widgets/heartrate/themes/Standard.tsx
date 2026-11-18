'use client';

import type { HeartrateThemeProps } from './types';
import { bpmColor, HeartrateIcon } from './shared';

export const themeMeta = { value: 'standard', label: 'Standard - Card' } as const;

export default function StandardTheme({ bpm, settings, connected, simulate = false }: HeartrateThemeProps) {
  const color = bpm !== null ? bpmColor(bpm, settings) : settings.midColor;
  const fontFamily = `'${settings.font}', sans-serif`;
  const history = simulate ? [72, 78, 85, 92, 88, 76, 80, 90, 95, 85] : [];

  return (
    <div
      className="rounded-2xl border flex items-center gap-4 shadow-xl"
      style={{
        fontFamily,
        background: settings.bg === 'transparent' ? 'rgba(22,22,22,0.95)' : settings.bg,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: settings.borderRadius,
        padding: settings.padding,
        color: settings.textColor || '#fff',
        opacity: settings.bgOpacity ? settings.bgOpacity / 100 : 1,
      }}
    >
      {settings.showIcon && (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: color, boxShadow: `0 0 20px ${color}40` }}
        >
          <HeartrateIcon settings={settings} className="w-7 h-7 text-white" style={{ fill: 'white', animation: bpm !== null && connected ? 'heartbeat 0.85s ease-in-out infinite' : undefined }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {settings.showLabel && <div className="text-[9px] font-black tracking-[0.2em] uppercase opacity-50 mb-0.5">{settings.label}</div>}
        <div className="flex items-baseline gap-2">
          <span style={{ fontSize: settings.fontSize, fontWeight: 900, color, lineHeight: 1, animation: settings.anim === 'pop' && bpm !== null ? 'popIn 0.4s' : undefined }}>
            {bpm ?? '--'}
          </span>
          {settings.showUnit && (
            <span className="text-[12px] font-black tracking-widest uppercase" style={{ color, opacity: 0.9 }}>
              {settings.unit}
            </span>
          )}
        </div>
        <div className="text-[10px] font-mono opacity-40 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          {connected ? (simulate ? 'SIMULATE' : 'LIVE') : 'OFFLINE'} • {settings.theme}
        </div>
      </div>
      {settings.showHistory && history.length > 0 && (
        <div className="hidden sm:flex items-end gap-1 h-10">
          {history.map((v, i) => (
            <span key={i} className="w-1 rounded-full" style={{ height: `${10 + (v % 20)}px`, background: color, opacity: 0.25 + i * 0.07 }} />
          ))}
        </div>
      )}
      <style>{`@keyframes heartbeat { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }`}</style>
    </div>
  );
}
