'use client';

import type { GoalsSettings } from '../config';
import Standard from '../themes/Standard';
import Minimal from '../themes/Minimal';

const DEMO = { current: 42, target: 100, goalType: 'follow' };

export function GoalPreview({ state }: { state: GoalsSettings }) {
  const pct = Math.min(100, Math.round((state.current / Math.max(1, state.target)) * 100));
  const isMinimal = state.theme === 'minimal';
  const Theme = isMinimal ? Minimal : Standard;
  return (
    <div className="w-full">
      <Theme
        title={state.title}
        current={state.current}
        target={state.target}
        percent={pct}
        goalType={state.goalType}
        font={state.font}
        fontSize={state.fontSize}
        accent={state.accent}
        bg={state.bg}
        showLabel={state.showLabel}
        showCounts={state.showCounts}
        showBar={state.showBar}
      />
      <p className="text-[10px] text-gray-500 mt-2 text-center">
        Preview {state.goalType} • {state.current}/{state.target} ({pct}%) - live akan bertambah otomatis
      </p>
    </div>
  );
}
