'use client';

import StandardTheme from '../themes/Standard';
import MinimalTheme from '../themes/Minimal';
import CuteTheme from '../themes/Cute';
import { ANIM_MAP, ANIM_OUT_MAP, isElegantAnim } from '../../_shared/constants/animations';
import { SIM_FOLLOW_POOL } from '../themes/dummySim';
import { useDummySimulation } from '../../_shared/hooks/useDummySimulation';
import type { FollowItem } from '../themes/types';
import type { FollowSettings } from '../config';

export function FollowPreview({ state }: { state: FollowSettings }) {
  const hideAfter = Number((state as unknown as { hideAfter?: number }).hideAfter ?? 5);
  const hideName = ANIM_OUT_MAP[(state as unknown as { hideAnim: string }).hideAnim] || 'fadeOut';
  const hideDur = isElegantAnim(hideName) ? 620 : 400;

  // Simulasi live dari dummy: masuk satu per satu + keluar pakai animasi, seperti real
  const sim = useDummySimulation<FollowItem>({
    enabled: true,
    pool: SIM_FOLLOW_POOL,
    maxItems: state.maxFollows,
    holdMs: hideAfter > 0 ? hideAfter * 1000 : 8000,
    hideDur,
    idPrefix: 'sim_fo',
  });

  const props = {
    follows: sim.items,
    font: state.font,
    accent: state.accent,
    bg: state.bg,
    maxFollows: state.maxFollows,
    showAvatar: state.showAvatar,
    anim: ANIM_MAP[state.anim] || 'elegantIn',
    hideAnim: hideName,
    fontSize: state.fontSize,
    bgOpacity: state.bgOpacity,
    horizontal: state.horizontal,
    inline: (state as unknown as { inline: boolean }).inline,
    exitingIds: sim.exitingIds,
  } as const;

  if (state.theme === 'minimal') return <MinimalTheme {...props} />;
  if (state.theme === 'cute') return <CuteTheme {...props} />;
  return <StandardTheme {...props} />;
}
