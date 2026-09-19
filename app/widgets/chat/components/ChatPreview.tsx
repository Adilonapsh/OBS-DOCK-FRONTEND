'use client';

import { useState, useEffect, useMemo } from 'react';
import StandardTheme from '../themes/Standard';
import BubbleTheme from '../themes/Bubble';
import CleanTheme from '../themes/Clean';
import BoxedTheme from '../themes/Boxed';
import CuteTheme from '../themes/Cute';
import { DEMO_CHATS } from '../config';
import { ANIM_MAP, ANIM_OUT_MAP } from '../../_shared/constants/animations';
import type { ChatSettings } from '../config';

export function ChatPreview({ state }: { state: ChatSettings }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => (v + 1) % DEMO_CHATS.length), 2400);
    return () => clearInterval(t);
  }, []);

  const count = Math.min(state.maxMessages, 4);
  const chats = useMemo(() => {
    const all = DEMO_CHATS.slice(0, count);
    const start = tick % all.length;
    const rotated = [...all.slice(start), ...all.slice(0, start)].slice(0, count);
    return rotated.map((c, i) => ({ ...c, id: `sim_${i}_${tick}` }));
  }, [count, tick]);

  const props = {
    chats,
    font: state.font,
    accent: state.accent,
    bg: state.bg,
    maxMessages: state.maxMessages,
    showAvatar: state.showAvatar,
    showPlatform: state.showPlatform,
    showTimestamp: state.showTimestamp,
    anim: ANIM_MAP[state.anim] || 'elegantIn',
    horizontalAnim: ANIM_MAP[state.horizontalAnim] || 'elegantIn',
    hideAnim: ANIM_OUT_MAP[(state as unknown as { hideAnim: string }).hideAnim] || 'fadeOut',
    hideAfter: state.hideAfter,
    fontSize: state.fontSize,
    bgOpacity: state.bgOpacity,
    textColor: state.textColor,
    horizontal: state.horizontal,
    inline: state.inline,
    cuteBubbleBg: state.cuteBubbleBg,
    cuteResubFrom: state.cuteResubFrom,
    cuteResubTo: state.cuteResubTo,
    cuteBadgeBg: state.cuteBadgeBg,
    cuteBadgeText: state.cuteBadgeText,
    cuteNameMod: state.cuteNameMod,
    cuteNameUser: state.cuteNameUser,
  } as const;

  if (state.theme === 'bubble') return <BubbleTheme {...props} />;
  if (state.theme === 'clean') return <CleanTheme {...props} />;
  if (state.theme === 'boxed') return <BoxedTheme {...props} />;
  if (state.theme === 'cute') return <CuteTheme {...props} />;
  return <StandardTheme {...props} />;
}
