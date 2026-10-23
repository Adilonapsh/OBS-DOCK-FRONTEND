'use client';

import StandardTheme from '../themes/Standard';
import MinimalTheme from '../themes/Minimal';
import CuteTheme from '../themes/Cute';
import { ANIM_MAP, ANIM_OUT_MAP, isElegantAnim } from '../../_shared/constants/animations';
import { SIM_EVENT_POOL } from '../themes/dummySim';
import { useDummySimulation } from '../../_shared/hooks/useDummySimulation';
import type { EventItem } from '../themes/types';
import type { EventSettings } from '../config';

export function EventPreview({ state }: { state: EventSettings }) {
  const s = state as unknown as Record<string, unknown>;
  const showJoin = (s.showJoin as boolean) ?? true;
  const showGift = (s.showGift as boolean) ?? true;
  const showLike = (s.showLike as boolean) ?? true;
  const hideAfter = Number(s.hideAfter ?? 0);
  const hideName = ANIM_OUT_MAP[state.hideAnim] || 'fadeOut';
  const hideDur = isElegantAnim(hideName) ? 620 : 400;

  // Simulasi live dari dummy: masuk satu per satu + keluar pakai animasi, seperti real
  const sim = useDummySimulation<EventItem>({
    enabled: true,
    pool: SIM_EVENT_POOL,
    maxItems: state.maxEvents,
    holdMs: hideAfter > 0 ? hideAfter * 1000 : 8000,
    hideDur,
    idPrefix: 'sim_ev',
    filter: (e) =>
      (e.type === 'join' && showJoin) || (e.type === 'gift' && showGift) || (e.type === 'like' && showLike),
  });

  const props = {
    events: sim.items,
    font: state.font,
    accent: state.accent,
    bg: state.bg,
    maxEvents: state.maxEvents,
    showAvatar: state.showAvatar,
    anim: ANIM_MAP[state.anim] || 'elegantIn',
    horizontalAnim: ANIM_MAP[(state as unknown as { horizontalAnim: string }).horizontalAnim] || 'elegantIn',
    hideAnim: hideName,
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
    exitingIds: sim.exitingIds,
  } as const;

  if (state.theme === 'minimal') return <MinimalTheme {...props} />;
  if (state.theme === 'cute') return <CuteTheme {...props} />;
  return <StandardTheme {...props} />;
}
