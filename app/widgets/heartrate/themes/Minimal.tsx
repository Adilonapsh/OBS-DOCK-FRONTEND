'use client';

import type { HeartrateThemeProps } from './types';
import { bpmColor, HeartrateIcon } from './shared';

export const themeMeta = { value: 'minimal', label: 'Minimal' } as const;

export default function MinimalTheme({ bpm, settings, connected }: HeartrateThemeProps) {
  const color = bpm !== null ? bpmColor(bpm, settings) : settings.midColor;
  const fontFamily = `'${settings.font}', sans-serif`;

  return (
    <div
      className="flex items-center gap-3"
      style={{ fontFamily, color: settings.textColor || '#fff' }}
    >
      {settings.showIcon && (
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color, color: '#fff' }}
        >
          <HeartrateIcon settings={settings} className="w-5 h-5 fill-white" style={{ animation: bpm !== null && connected ? 'heartbeat 0.8s infinite' : undefined }} />
        </span>
      )}
      <div className="flex items-baseline gap-1">
        <span style={{ fontSize: settings.fontSize, fontWeight: 900, lineHeight: 1 }}>{bpm ?? '--'}</span>
        {settings.showUnit && <span className="text-[11px] font-bold opacity-60">{settings.unit}</span>}
      </div>
      {settings.showLabel && <span className="text-[9px] font-black tracking-widest opacity-50 uppercase">{settings.label}</span>}
    </div>
  );
}
