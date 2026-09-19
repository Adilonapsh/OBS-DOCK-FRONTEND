'use client';

import { useEffect, useState, useRef } from 'react';
import FocusTheme from '../themes/Focus';
import MinimalTheme from '../themes/Minimal';
import GlassTheme from '../themes/Glass';
import PlainTheme from '../themes/Plain';
import type { TaskSettings } from '../config';
import { ANIM_MAP } from '../../_shared/constants/animations';

export function TaskPreview({ state, onToggleTask }: {
  state: TaskSettings;
  onToggleTask: (id: string) => void;
}) {
  const autoCollapse = (state as unknown as { autoCollapse: boolean }).autoCollapse || false;
  const collapseAfter = (state as unknown as { collapseAfter: number }).collapseAfter ?? 3;
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTasksRef = useRef(state.tasks);

  useEffect(() => {
    if (!autoCollapse) {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
      if (collapsedIds.size) setCollapsedIds(new Set());
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
      setIsExpanded(true);
      return;
    }
    const tasks = state.tasks as unknown as { id: string; completed: boolean }[];
    tasks.forEach((t) => {
      const isDone = !!t.completed;
      const isCollapsed = collapsedIds.has(t.id);
      const hasTimer = timersRef.current.has(t.id);
      if (isDone && !isCollapsed && !hasTimer) {
        const id = setTimeout(() => {
          setCollapsedIds((prev) => new Set(prev).add(t.id));
          timersRef.current.delete(t.id);
        }, collapseAfter * 1000);
        timersRef.current.set(t.id, id);
      }
      if (!isDone) {
        if (isCollapsed) setCollapsedIds((prev) => { const n = new Set(prev); n.delete(t.id); return n; });
        const tm = timersRef.current.get(t.id);
        if (tm) { clearTimeout(tm); timersRef.current.delete(t.id); }
      }
    });
  }, [state.tasks, autoCollapse, collapseAfter]);

  useEffect(() => {
    if (!autoCollapse) { setIsExpanded(true); return; }
    setIsExpanded(true);
    if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
    expandTimerRef.current = setTimeout(() => setIsExpanded(false), collapseAfter * 1000);
    return () => { if (expandTimerRef.current) clearTimeout(expandTimerRef.current); };
  }, [autoCollapse, collapseAfter]);

  useEffect(() => {
    if (!autoCollapse) return;
    const prev = prevTasksRef.current as unknown as { id: string; completed: boolean }[];
    const cur = state.tasks as unknown as { id: string; completed: boolean }[];
    const changed = cur.length !== prev.length || cur.some((t, i) => prev[i] && prev[i].completed !== t.completed);
    if (changed) {
      setIsExpanded(true);
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
      expandTimerRef.current = setTimeout(() => setIsExpanded(false), collapseAfter * 1000);
    }
    prevTasksRef.current = state.tasks;
  }, [state.tasks, autoCollapse, collapseAfter]);

  const props = {
    tasks: state.tasks as unknown as { id: string; text: string; completed: boolean; user?: string }[],
    font: state.font,
    fontSize: state.fontSize,
    accent: state.accent,
    bg: state.bg,
    bgOpacity: state.bgOpacity,
    textColor: (state as unknown as { textColor: string }).textColor || '#ffffff',
    onToggleTask,
    anim: ANIM_MAP[state.anim] || 'elegantIn',
    hideAnim: ANIM_MAP[(state as unknown as { hideAnim: string }).hideAnim] || 'fadeOut',
    horizontal: (state as unknown as { horizontal: boolean }).horizontal,
    horizontalAnim: ANIM_MAP[(state as unknown as { horizontalAnim: string }).horizontalAnim] || 'elegantIn',
    inline: (state as unknown as { inline: boolean }).inline,
    autoCollapse,
    collapseAfter,
    collapsedIds,
    isExpanded,
  } as const;

  if (state.theme === 'glass') return <GlassTheme {...props} onAddTask={() => {}} />;
  if (state.theme === 'minimal') return <MinimalTheme {...props} />;
  if (state.theme === 'plain') return <PlainTheme {...props} />;
  return <FocusTheme {...props} onAddTask={() => {}} />;
}
