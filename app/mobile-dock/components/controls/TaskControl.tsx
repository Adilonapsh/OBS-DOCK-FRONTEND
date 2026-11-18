'use client';

/** Kontrol Task / checklist - tambah, centang, urutkan, hapus, sinkron ke overlay. */

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, GripVertical, ListChecks, Plus, Trash2, X } from 'lucide-react';
import type { DockControlsApi } from './types';

export type TaskControlProps = {
  tasks: DockControlsApi['tasks'];
  actions: DockControlsApi['taskActions'];
};

export default function TaskControl({ tasks, actions }: TaskControlProps) {
  const [text, setText] = useState('');
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const items = tasks?.items ?? [];
  const done = items.filter((t) => t.completed).length;
  const progress = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  const handleAdd = () => {
    const value = text.trim();
    if (!value) return;
    actions.add(value.slice(0, 120));
    setText('');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <ListChecks className="w-4 h-4 text-cyan-500 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider truncate">Task Control</span>
          <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-[var(--bg-color)] border border-[var(--border-color)] text-[9px] font-black">
            {done}/{items.length}
          </span>
        </div>
        <button
          onClick={actions.clear}
          disabled={items.length === 0}
          className="h-6 px-2 rounded-full bg-[var(--bg-color)] border border-[var(--border-color)] text-[9px] font-black uppercase flex items-center gap-1 text-[var(--text-label)] hover:text-red-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      <div className="h-1 rounded-full bg-[var(--border-color)] overflow-hidden shrink-0">
        <div className="h-full bg-cyan-500 transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto mdock-scroll pr-0.5">
        {items.length === 0 ? (
          <div className="h-full min-h-[100px] flex flex-col items-center justify-center gap-2 text-center border border-dashed border-[var(--border-color)] rounded-xl">
            <ListChecks className="w-6 h-6 text-[var(--text-label)] opacity-50" />
            <span className="text-[10px] text-[var(--text-label)] italic">Belum ada task — tambah di bawah.</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((task, i) => (
              <div
                key={task.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom !== null) actions.move(dragFrom, i);
                  setDragFrom(null);
                  setDragOver(null);
                }}
                className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] transition-colors ${
                  task.completed
                    ? 'bg-[var(--bg-color)] border-[var(--border-color)] opacity-60 line-through text-[var(--text-label)]'
                    : 'bg-[var(--panel-bg)] border-[var(--border-color)]'
                } ${dragOver === i ? 'ring-1 ring-cyan-500 border-cyan-500' : ''} ${dragFrom === i ? 'opacity-50' : ''}`}
                title="Drag handle / tombol ↑↓ untuk urutkan"
              >
                <span
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setDragFrom(i);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    setDragFrom(null);
                    setDragOver(null);
                  }}
                  className="shrink-0 p-0.5 -ml-0.5 cursor-grab active:cursor-grabbing text-[var(--text-label)] touch-none"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </span>
                <span className="text-[9px] font-mono w-4 shrink-0 text-[var(--text-label)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <button
                  onClick={() => actions.toggle(task.id)}
                  className={`w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 cursor-pointer transition-colors ${
                    task.completed
                      ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-color)]'
                      : 'border-[var(--border-color)] hover:border-[var(--accent)]'
                  }`}
                  title={task.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                >
                  {task.completed && <Check className="w-3 h-3" />}
                </button>
                <span className="flex-1 truncate">{task.text}</span>
                <span className="shrink-0 flex flex-col">
                  <button
                    onClick={() => actions.move(i, i - 1)}
                    disabled={i === 0}
                    className="p-0.5 text-[var(--text-label)] hover:text-[var(--text-main)] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                    title="Naik"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => actions.move(i, i + 1)}
                    disabled={i >= items.length - 1}
                    className="p-0.5 text-[var(--text-label)] hover:text-[var(--text-main)] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                    title="Turun"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </span>
                <button
                  onClick={() => actions.remove(task.id)}
                  className="shrink-0 p-1 text-[var(--text-label)] hover:text-red-400 cursor-pointer"
                  title="Hapus task"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 shrink-0 border-t border-[var(--border-color)] pt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="Tambah task…"
          className="flex-1 h-8 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-full px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="h-8 px-3 bg-cyan-600 hover:bg-cyan-500 rounded-full text-white text-[10px] font-black uppercase flex items-center gap-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
    </div>
  );
}
