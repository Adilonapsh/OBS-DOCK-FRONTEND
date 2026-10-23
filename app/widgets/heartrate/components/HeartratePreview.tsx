'use client';

import { useEffect, useState } from 'react';
import { Heart, Activity, Zap } from 'lucide-react';
import type { HeartrateSettings } from '../config';

function bpmColor(bpm: number, s: HeartrateSettings): string {
  if (bpm <= s.lowBpm) return s.lowColor;
  if (bpm >= s.highBpm) return s.highColor;
  return s.midColor;
}

export function HeartratePreview({
  bpm,
  settings,
  connected,
  simulate = false,
}: {
  bpm: number | null;
  settings: HeartrateSettings;
  connected: boolean;
  simulate?: boolean;
}) {
  const color = bpm !== null ? bpmColor(bpm, settings) : settings.midColor;
  const Icon = settings.iconStyle === 'pulse' ? Activity : settings.iconStyle === 'activity' ? Zap : Heart;
  const fontFamily = `'${settings.font}', sans-serif`;

  const history = simulate ? [72, 78, 85, 92, 88, 76, 80, 90, 95, 85] : [];

  // MIN/MAX realtime - selalu dipanggil (rules of hooks) dipakai di glass
  const [minSeen, setMinSeen] = useState<number | null>(null);
  const [maxSeen, setMaxSeen] = useState<number | null>(null);
  useEffect(() => {
    if (bpm === null || !Number.isFinite(bpm)) return;
    setMinSeen((prev) => (prev === null ? bpm : Math.min(prev, bpm)));
    setMaxSeen((prev) => (prev === null ? bpm : Math.max(prev, bpm)));
  }, [bpm]);

  if (settings.theme === 'minimal') {
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
            <Icon className="w-5 h-5 fill-white" style={{ animation: bpm !== null && connected ? 'heartbeat 0.8s infinite' : undefined }} />
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

  if (settings.theme === 'pill') {
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
        {settings.showIcon && <Icon className="w-5 h-5 shrink-0" style={{ color, fill: color, animation: bpm !== null && connected ? 'heartbeat 0.8s infinite' : undefined }} />}
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

  if (settings.theme === 'bar') {
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
            {settings.showIcon && <Icon className="w-3.5 h-3.5" style={{ color, fill: color }} />}
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

  if (settings.theme === 'glass') {
    // Glass - Modern Health Widgets: bg bisa diubah dari Settings → Background (jika transparent pakai default #939cfc)
    const bgMain = settings.bg && settings.bg !== 'transparent' ? settings.bg : '#939cfc';
    const bgMainAlpha = settings.bgOpacity ? Math.round((settings.bgOpacity / 100) * 255).toString(16).padStart(2, '0') : 'CC';
    const isLive = connected && bpm !== null;
    const minLabel = minSeen ?? settings.lowBpm;
    const maxLabel = maxSeen ?? settings.highBpm;
    return (
      <div className="relative w-full max-w-[360px] flex flex-col gap-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');`}</style>
        {/* wrapper dengan bg grid b1b9ff seperti body HTML - untuk OBS transparent kita buat card standalone */}
        <div
          className="widget-card w-full h-[360px] rounded-[2.5rem] p-8 flex flex-col justify-between shadow-lg border border-white/20 relative overflow-hidden group"
          style={{ backgroundColor: `${bgMain}${bgMainAlpha}`, backdropFilter: 'blur(12px)' }}
        >
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          <div className="flex flex-col relative z-10">
            <div className="text-7xl font-bold tracking-tight text-white drop-shadow-sm" style={{ fontFamily: "'Space Grotesk', monospace", letterSpacing: '-0.02em', lineHeight: 1 }}>{bpm ?? '--'}</div>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-6 h-0.5 bg-white/80 rounded-full" />
              <span className="text-[10px] font-bold tracking-widest text-white/80 uppercase">{connected ? (simulate ? 'SIMULATE' : 'LIVE') : 'OFFLINE'}</span>
              {isLive && <span className="w-2 h-2 bg-[#6ee7b7] rounded-full shadow-[0_0_8px_#6ee7b7] animate-pulse ml-1" />}
            </div>
          </div>
          <div className="flex flex-col gap-3 relative z-10">
            <div className="text-xl font-semibold tracking-widest text-white/90 uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>MAX {maxLabel}</div>
            <div className="text-xs font-semibold tracking-wider text-white/70 uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>MIN {minLabel}</div>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-4 h-4 bg-white rounded-sm shadow-sm" />
              <div className="w-4 h-4 border-2 border-white rounded-sm bg-transparent" />
            </div>
          </div>
        </div>
        {/* varian kecil opsional - tampil di preview saja sebagai referensi */}
        {simulate && (
          <div className="hidden md:flex gap-4">
            <div className="widget-card flex-1 h-[120px] rounded-[2rem] p-5 flex flex-col justify-between shadow-lg border border-white/10 relative overflow-hidden" style={{ backgroundColor: '#4f537bcc', backdropFilter: 'blur(12px)' }}>
              <div className="flex justify-between items-start">
                <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#e8dbcb' }}>{minLabel}</div>
                <div className="w-2.5 h-2.5 bg-[#6ee7b7] rounded-full shadow-[0_0_8px_#6ee7b7]" />
              </div>
              <div className="text-xs font-semibold tracking-wider text-white/70">MIN {minLabel}</div>
            </div>
            <div className="widget-card flex-1 h-[120px] rounded-[2rem] p-5 flex flex-col justify-between shadow-lg border border-white/10 relative overflow-hidden" style={{ backgroundColor: '#4a4f78E6', backdropFilter: 'blur(12px)' }}>
              <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#ff99cc', filter: 'drop-shadow(0 0 10px rgba(255,153,204,0.3))' }}>{maxLabel}</div>
              <div className="text-xs font-semibold tracking-wider text-white/80">MAX {maxLabel}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (settings.theme === 'brutalist') {
    const brutalist = settings as unknown as {
      brutalistBg: string; brutalistTextColor: string; brutalistBadgeBg: string; brutalistBorderColor: string;
      brutalistShadow: number; brutalistHalftone: boolean; brutalistTail: boolean; brutalistItalic: boolean; brutalistUppercase: boolean;
    };
    const bubbleBg = brutalist.brutalistBg || '#FFFFFF';
    const txtColor = brutalist.brutalistTextColor || '#000000';
    const badgeBg = brutalist.brutalistBadgeBg || '#FFFFFF';
    const borderColor = brutalist.brutalistBorderColor || '#000000';
    const shadowOffset = brutalist.brutalistShadow ?? 6;
    const hasHalftone = brutalist.brutalistHalftone ?? true;
    const isItalic = brutalist.brutalistItalic ?? true;
    const isUppercase = brutalist.brutalistUppercase ?? true;
    const getBorder = (w: number) => `${w}px solid ${borderColor}`;
    const getShadow = (o: number) => `${o}px ${o}px 0px 0px ${borderColor}`;
    const halftone: React.CSSProperties = { backgroundImage: 'radial-gradient(circle, #000 1.2px, transparent 1.45px)', backgroundSize: '10px 10px' };
    return (
      <div className="relative w-full max-w-[420px]" style={{ fontFamily, border: getBorder(4), boxShadow: getShadow(shadowOffset), backgroundColor: bubbleBg }}>
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
              <Icon className="w-7 h-7" style={{ color: badgeBg, fill: badgeBg, animation: bpm !== null && connected ? 'heartbeat 0.85s ease-in-out infinite' : undefined }} />
            </div>
          )}
          <div className="flex-1 min-w-0 ml-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black leading-none px-2 py-1" style={{ fontSize: settings.fontSize, color: badgeBg, backgroundColor: borderColor, border: getBorder(3), boxShadow: getShadow(3), fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' as const : 'none' }}>{bpm ?? '--'}</span>
              {settings.showUnit && <span className="font-black" style={{ fontSize: 12, color: txtColor, fontStyle: isItalic ? 'italic' : 'normal' }}>{settings.unit}</span>}
              <span className={`w-2 h-2 border ${connected ? '' : 'opacity-50'}`} style={{ backgroundColor: connected ? '#22c55e' : '#ef4444', borderColor, boxShadow: `2px 2px 0px 0px ${borderColor}` }} />
            </div>
          </div>
        </div>

        <style>{`@keyframes heartbeat { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }`}</style>
      </div>
    );
  }

  // standard (default) - card
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
          <Icon className="w-7 h-7 text-white" style={{ fill: 'white', animation: bpm !== null && connected ? 'heartbeat 0.85s ease-in-out infinite' : undefined }} />
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
