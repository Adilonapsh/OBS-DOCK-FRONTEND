'use client';

import { useState, useEffect, useMemo } from 'react';
import StandardTheme from '../themes/Standard';
import MinimalTheme from '../themes/Minimal';
import CuteTheme from '../themes/Cute';
import { DEMO_FOLLOWS } from '../config';
import { ANIM_MAP, ANIM_OUT_MAP } from '../../_shared/constants/animations';
import type { FollowSettings } from '../config';

export function FollowPreview({ state }: { state: FollowSettings }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => (v + 1) % DEMO_FOLLOWS.length), 2400);
    return () => clearInterval(t);
  }, []);
  const count = 2;
  const follows = useMemo(() => {
    const start = tick % DEMO_FOLLOWS.length;
    return [...DEMO_FOLLOWS.slice(start), ...DEMO_FOLLOWS.slice(0, start)].slice(0, count).map((c, i) => ({ ...c, id: `sim_${i}_${tick}` }));
  }, [tick]);

  const props = {
    follows,
    font: state.font,
    accent: state.accent,
    bg: state.bg,
    maxFollows: state.maxFollows,
    showAvatar: state.showAvatar,
    anim: ANIM_MAP[state.anim] || 'elegantIn',
    hideAnim: ANIM_OUT_MAP[(state as unknown as { hideAnim: string }).hideAnim] || 'fadeOut',
    fontSize: state.fontSize,
    bgOpacity: state.bgOpacity,
    horizontal: state.horizontal,
    inline: (state as unknown as { inline: boolean }).inline,
  } as const;

  if (state.theme === 'minimal') return <MinimalTheme {...props} />;
  if (state.theme === 'cute') return <CuteTheme {...props} />;
  return <StandardTheme {...props} />;
}
