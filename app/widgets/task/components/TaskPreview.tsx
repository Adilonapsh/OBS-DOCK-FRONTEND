'use client';

import FocusTheme from '../themes/Focus';
import MinimalTheme from '../themes/Minimal';
import type { TaskSettings } from '../config';
import { ANIM_MAP } from '../../_shared/constants/animations';

export function TaskPreview({ state, onToggleTask }: {
  state: TaskSettings;
  onToggleTask: (id: string) => void;
}) {
  const props = {
    tasks: state.tasks as unknown as { id: string; text: string; completed: boolean; user?: string }[],
    font: state.font,
    fontSize: state.fontSize,
    accent: state.accent,
    bg: state.bg,
    bgOpacity: state.bgOpacity,
    onToggleTask,
    anim: ANIM_MAP[state.anim] || 'elegantIn',
    hideAnim: ANIM_MAP[(state as unknown as { hideAnim: string }).hideAnim] || 'fadeOut',
    horizontal: (state as unknown as { horizontal: boolean }).horizontal,
    horizontalAnim: ANIM_MAP[(state as unknown as { horizontalAnim: string }).horizontalAnim] || 'elegantIn',
    inline: (state as unknown as { inline: boolean }).inline,
  } as const;

  if (state.theme === 'minimal') return <MinimalTheme {...props} />;
  return <FocusTheme {...props} onAddTask={() => {}} />;
}
