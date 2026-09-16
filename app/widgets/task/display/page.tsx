'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { ANIM_MAP, ANIM_OUT_MAP, KEYFRAMES_CSS, isElegantAnim } from '../../_shared/constants/animations';
import { getPositionStyle } from '../../_shared/constants/positions';
import FocusTheme from '../themes/Focus';
import MinimalTheme from '../themes/Minimal';
import GlassTheme from '../themes/Glass';
import PlainTheme from '../themes/Plain';
import { parseTasksParam } from '../config';
import type { TaskItem } from '../themes/types';

function TaskInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = searchParams.get('obs') === '1' || searchParams.get('transparent') === '1';
  const theme = getStringParam(params, 'theme', 'focus');
  const font = getStringParam(params, 'font', 'Nunito');
  const fontSize = getIntParam(params, 'fontSize', 14);
  const accent = getStringParam(params, 'accent', '#594d4a');
  const bg = getStringParam(params, 'bg', 'transparent');
  const bgOpacity = Math.max(10, Math.min(100, getIntParam(params, 'bgOpacity', 100)));
  const textColor = getStringParam(params, 'textColor', '#ffffff');
  const autoCollapse = getBoolParam(params, 'autoCollapse', false);
  const collapseAfter = Math.max(1, Math.min(60, getIntParam(params, 'collapseAfter', 3)));
  const anim = getStringParam(params, 'anim', 'elegant');
  const hideAnim = getStringParam(params, 'hideAnim', 'fade');
  const horizontal = getBoolParam(params, 'horizontal', false);
  const horizontalAnim = getStringParam(params, 'horizontalAnim', 'elegant');
  const inline = getBoolParam(params, 'inline', false);
  const pos = getStringParam(params, 'pos', 'center');
  const posStyle = getPositionStyle(pos);
  const tasksParam = parseTasksParam(params.get('tasks'));
  // mode OBS: default kosong (tunggu data real dari dock), bukan demo
  const tasksFromUrl: TaskItem[] = obsMode ? (tasksParam || []) : (tasksParam || [
    { id: '1', text: '10 Pushups', completed: false, user: 'GamerPro' },
    { id: '2', text: 'Drink water!', completed: true, user: 'StreamFan' },
    { id: '3', text: "Don't forget to smile", completed: true, user: 'ModMaster' },
    { id: '4', text: 'Finish essay!', completed: false, user: '' },
    { id: '5', text: 'clean room', completed: false, user: '' },
    { id: '6', text: 'best friends bday present', completed: false, user: '' },
  ]);

  const [tasks, setTasks] = useState<TaskItem[]>(tasksFromUrl);
  const [hasSocketTasks, setHasSocketTasks] = useState(false);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const collapseTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTasksRef = useRef<TaskItem[]>(tasks);
  const hideAnimName = ANIM_OUT_MAP[hideAnim] || 'fadeOut';
  const hideDur = isElegantAnim(hideAnimName) ? 620 : 400;
  const taskSocketRef = useRef<ReturnType<typeof io> | null>(null) as any;

  // auto collapsed on time - awalnya muncul semua, sekian detik collapse ke 1 task belum done; checklist di dock muncul lagi semua, sekian detik collapse lagi
  useEffect(() => {
    if (!autoCollapse) {
      collapseTimersRef.current.forEach(clearTimeout);
      collapseTimersRef.current.clear();
      if (collapsedIds.size) setCollapsedIds(new Set());
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
      setIsExpanded(true);
      return;
    }
    // per-task collapse (untuk styling)
    tasks.forEach((t) => {
      const isDone = !!t.completed;
      const isCollapsed = collapsedIds.has(t.id);
      const hasTimer = collapseTimersRef.current.has(t.id);
      if (isDone && !isCollapsed && !hasTimer) {
        const id = setTimeout(() => {
          setCollapsedIds((prev) => new Set(prev).add(t.id));
          collapseTimersRef.current.delete(t.id);
        }, collapseAfter * 1000);
        collapseTimersRef.current.set(t.id, id);
      }
      if (!isDone) {
        if (isCollapsed) setCollapsedIds((prev) => { const n = new Set(prev); n.delete(t.id); return n; });
        const tm = collapseTimersRef.current.get(t.id);
        if (tm) { clearTimeout(tm); collapseTimersRef.current.delete(t.id); }
      }
    });
    collapseTimersRef.current.forEach((tm, id) => {
      if (!tasks.find((t) => t.id === id)) { clearTimeout(tm); collapseTimersRef.current.delete(id); }
    });
  }, [tasks, autoCollapse, collapseAfter]);

  // global expand/collapse ke 1 task selanjutnya
  useEffect(() => {
    if (!autoCollapse) { setIsExpanded(true); return; }
    // deteksi perubahan checklist (dock) - jika ada task yang completed berubah, tampilkan semua dulu
    const prev = prevTasksRef.current;
    const changed = tasks.length !== prev.length || tasks.some((t, i) => prev[i] && prev[i].completed !== t.completed);
    if (changed) {
      setIsExpanded(true);
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
      expandTimerRef.current = setTimeout(() => setIsExpanded(false), collapseAfter * 1000);
    } else if (prev.length === 0 && tasks.length > 0) {
      // initial load - muncul semua, sekian detik collapse
      setIsExpanded(true);
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
      expandTimerRef.current = setTimeout(() => setIsExpanded(false), collapseAfter * 1000);
    }
    prevTasksRef.current = tasks;
  }, [tasks, autoCollapse, collapseAfter]);

  useEffect(() => {
    if (!autoCollapse) return;
    // timer awal saat mount
    setIsExpanded(true);
    if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
    expandTimerRef.current = setTimeout(() => setIsExpanded(false), collapseAfter * 1000);
    return () => { if (expandTimerRef.current) clearTimeout(expandTimerRef.current); };
  }, [autoCollapse, collapseAfter]);

  useEffect(() => { if (tasksParam && !hasSocketTasks) setTasks(tasksParam); }, [searchParams, hasSocketTasks]);
  useEffect(() => loadGoogleFont(font, '600;700;800;900', 'task-font'), [font]);

  useEffect(() => {
    const s = io(getSocketUrl(), { transports: ['websocket', 'polling'] as const });
    taskSocketRef.current = s as any;
    const room = privateKey || 'global';
    s.on('connect', () => { s.emit('join-room', room); s.emit('task-get', { privateKey: room }); });
    s.on('task-update', (data: { items?: TaskItem[] }) => {
      if (Array.isArray(data.items)) { setTasks(data.items as TaskItem[]); setHasSocketTasks(true); }
    });
    s.on('task-clear', () => { setTasks([]); setHasSocketTasks(true); });
    return () => { s.disconnect(); taskSocketRef.current = null; };
  }, [privateKey]);

  const handleToggleTask = (id: string) => {
    // optimistic local, lalu sync ke server (dock master) via socket persisten - biar 2-way sinkron
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
    const room = privateKey || 'global';
    const sock: any = taskSocketRef.current;
    if (sock?.connected) sock.emit('task-toggle', { privateKey: room, id });
    else {
      const tmp = io(getSocketUrl(), { transports: ['websocket', 'polling'] as const });
      tmp.on('connect', () => { tmp.emit('task-toggle', { privateKey: room, id }); setTimeout(() => tmp.disconnect(), 600); });
    }
  };
  const handleAddTask = (text: string) => {
    const room = privateKey || 'global';
    const sock: any = taskSocketRef.current;
    if (sock?.connected) sock.emit('task-add', { privateKey: room, text });
    else {
      const tmp = io(getSocketUrl(), { transports: ['websocket', 'polling'] as const });
      tmp.on('connect', () => { tmp.emit('task-add', { privateKey: room, text }); setTimeout(() => tmp.disconnect(), 600); });
    }
  };

  const themeProps = {
    tasks,
    font,
    fontSize,
    accent,
    bg,
    bgOpacity,
    textColor,
    onToggleTask: handleToggleTask,
    onAddTask: handleAddTask,
    anim: ANIM_MAP[anim] || 'elegantIn',
    hideAnim: ANIM_OUT_MAP[hideAnim] || 'fadeOut',
    horizontalAnim: ANIM_MAP[horizontalAnim] || 'elegantIn',
    horizontal,
    inline,
    exitingIds,
    autoCollapse,
    collapseAfter,
    collapsedIds,
    isExpanded,
  };

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,'+')}:wght@600;700;800;900&display=swap'); ${KEYFRAMES_CSS} html,body{ background: ${obsMode ? 'transparent !important' : '#e6c8bf'}; }`}</style>
      <div className={`${obsMode ? 'fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-4' : 'w-full min-h-screen flex p-6'}`} style={{ ...posStyle, background: obsMode ? 'transparent' : theme === 'glass' ? 'linear-gradient(135deg, #a5b4fc 0%, #bac7ff 100%)' : 'linear-gradient(135deg, #eacbc2 0%, #dfb8ad 100%)' } as any}>
        {theme === 'glass' ? <GlassTheme {...themeProps} /> : theme === 'minimal' ? <MinimalTheme {...themeProps} /> : theme === 'plain' ? <PlainTheme {...themeProps} /> : <FocusTheme {...themeProps} />}
      </div>
    </>
  );
}

export default function TaskDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#e6c8bf] grid place-items-center text-white/60 text-sm">Loading task…</div>}>
      <TaskInner />
    </Suspense>
  );
}
