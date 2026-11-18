'use client';

import type { HeartrateThemeProps } from './types';
import { bpmColor, HeartrateIcon } from './shared';

export const themeMeta = { value: 'pill', label: 'Pill - Capsule' } as const;

export default function PillTheme({ bpm, settings, connected, simulate = false }: HeartrateThemeProps) {
  const color = bpm !== null ? bpmColor(bpm, settings) : settings.midColor;
  const fontFamily = `'${settings.font}', sans-serif`;
  const history = simulate ? [72, 78, 85, 92, 88, 76, 80, 90, 95, 85] : [];

  return (
    <div
      className="inline-flex items-center gap-3 px-4 py-2 rounded-full border"
      style={{
        fontFamily,
        background: settings.bg === 'transparent' ? 'rgba(0,0,0,0.6)' : settings.bg,
        borderColor: color,
        borderWidth: 2,
        borderRadius: settings.borderRadius,
        padding: settings.padding,
        color: settings.textColor || '#fff',
      }}
    >
      {settings.showIcon && <HeartrateIcon settings={settings} className="w-5 h-5 shrink-0" style={{ color, fill: color, animation: bpm !== null && connected ? 'heartbeat 0.8s infinite' : undefined }} />}
      <div className="flex flex-col leading-none">
        {settings.showLabel && <span className="text-[8px] font-black tracking-widest uppercase opacity-60">{settings.label}</span>}
        <span className="flex items-baseline gap-1">
          <span style={{ fontSize: settings.fontSize * 0.7, fontWeight: 900 }}>{bpm ?? '--'}</span>
          {settings.showUnit && <span className="text-[10px] font-bold" style={{ color }}>{settings.unit}</span>}
        </span>
      </div>
      {settings.showHistory && history.length > 0 && (
        <div className="flex items-end gap-[2px] h-6">
          {history.map((v, i) => (
            <span key={i} className="w-[3px] rounded-full" style={{ height: `${8 + (v % 16)}px`, background: color, opacity: 0.3 + i * 0.07 }} />
          ))}
        </div>
      )}
    </div>
  );
}
