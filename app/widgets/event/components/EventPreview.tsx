'use client';

import { useState, useEffect, useMemo } from 'react';
import StandardTheme from '../themes/Standard';
import MinimalTheme from '../themes/Minimal';
import CuteTheme from '../themes/Cute';
import { DEMO_EVENTS } from '../config';
import { ANIM_MAP, ANIM_OUT_MAP } from '../../_shared/constants/animations';
import type { EventSettings } from '../config';

export function EventPreview({ state }: { state: EventSettings }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => (v + 1) % DEMO_EVENTS.length), 2400);
    return () => clearInterval(t);
  }, []);
  const count = Math.min(state.maxEvents, 4);
  const events = useMemo(() => {
    const all = DEMO_EVENTS.slice(0, count);
    const start = tick % all.length;
    const rotated = [...all.slice(start), ...all.slice(0, start)].slice(0, count);
    return rotated.map((c, i) => ({ ...c, id: `sim_${i}_${tick}` }));
  }, [count, tick]);

  const props = {
    events,
    font: state.font,
    accent: state.accent,
    bg: state.bg,
    maxEvents: state.maxEvents,
    showAvatar: state.showAvatar,
    anim: ANIM_MAP[state.anim] || 'elegantIn',
    horizontalAnim: ANIM_MAP[(state as unknown as { horizontalAnim: string }).horizontalAnim] || 'elegantIn',
    hideAnim: ANIM_OUT_MAP[(state as unknown as { hideAnim: string }).hideAnim] || 'fadeOut',
    fontSize: state.fontSize,
    bgOpacity: state.bgOpacity,
    horizontal: state.horizontal,
    inline: (state as unknown as { inline: boolean }).inline,
    cuteBubbleBg: (state as unknown as { cuteBubbleBg?: string }).cuteBubbleBg,
    cuteResubFrom: (state as unknown as { cuteResubFrom?: string }).cuteResubFrom,
    cuteResubTo: (state as unknown as { cuteResubTo?: string }).cuteResubTo,
    cuteBadgeBg: (state as unknown as { cuteBadgeBg?: string }).cuteBadgeBg,
    cuteBadgeText: (state as unknown as { cuteBadgeText?: string }).cuteBadgeText,
    cuteNameMod: (state as unknown as { cuteNameMod?: string }).cuteNameMod,
    cuteNameUser: (state as unknown as { cuteNameUser?: string }).cuteNameUser,
  } as const;

  if (state.theme === 'minimal') return <MinimalTheme {...props} />;
  if (state.theme === 'cute') return <CuteTheme {...props} />;
  return <StandardTheme {...props} />;
}
