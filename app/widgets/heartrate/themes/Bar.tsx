'use client';

import type { HeartrateThemeProps } from './types';
import { bpmColor, HeartrateIcon } from './shared';

export const themeMeta = { value: 'bar', label: 'Bar - Progress' } as const;

export default function BarTheme({ bpm, settings, connected }: HeartrateThemeProps) {
  const color = bpm !== null ? bpmColor(bpm, settings) : settings.midColor;
  const fontFamily = `'${settings.font}', sans-serif`;
  const pct = bpm !== null ? Math.min(100, Math.max(0, ((bpm - 40) / 140) * 100)) : 45;

  return (
    <div
      className="w-full max-w-[360px] rounded-2xl border overflow-hidden"
      style={{
        fontFamily,
        background: settings.bg === 'transparent' ? 'rgba(18,18,18,0.9)' : settings.bg,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: settings.borderRadius,
        padding: settings.padding,
        color: settings.textColor || '#fff',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5">
          {settings.showIcon && <HeartrateIcon settings={settings} className="w-3.5 h-3.5" style={{ color, fill: color }} />}
          {settings.showLabel ? settings.label : 'BPM'}
        </span>
        <span className="text-[9px] font-mono opacity-50">{connected ? 'LIVE' : 'OFFLINE'}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span style={{ fontSize: settings.fontSize, fontWeight: 900, color, lineHeight: 1 }}>{bpm ?? '--'}</span>
        {settings.showUnit && <span className="text-[11px] font-black uppercase tracking-widest" style={{ color }}>{settings.unit}</span>}
      </div>
      <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="mt-1 flex justify-between text-[8px] font-bold opacity-40">
        <span>40</span>
        <span>180</span>
      </div>
    </div>
  );
}
