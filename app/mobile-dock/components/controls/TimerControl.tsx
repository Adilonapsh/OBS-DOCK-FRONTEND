'use client';

/**
 * Kontrol Timer / Sesi - disamakan dengan panel Timer di dock desktop:
 * Start/Stop, Reset, Set durasi (d/h/m/s), Add, Sub, Base Time dari Date,
 * dan pilihan mode. Semua aksi dikirim via event `timer-control`.
 */

import { useEffect, useState } from 'react';
import { Calendar, Check, Clock, Pause, Play, Plus, RefreshCw, Square } from 'lucide-react';
import type { DockControlsApi } from './types';

const MODES = ['powerup', 'sleep', 'locked', 'paused'] as const;

type TimeParts = { d: string; h: string; m: string; s: string };

const ZERO: TimeParts = { d: '0', h: '0', m: '0', s: '0' };

function partsToSeconds(p: TimeParts): number {
  const d = Math.max(0, Math.min(365, parseInt(p.d) || 0));
  const h = Math.max(0, Math.min(23, parseInt(p.h) || 0));
  const m = Math.max(0, Math.min(59, parseInt(p.m) || 0));
  const s = Math.max(0, Math.min(59, parseInt(p.s) || 0));
  return d * 86400 + h * 3600 + m * 60 + s;
}

function secondsToParts(total: number): TimeParts {
  const sec = Math.max(0, Math.floor(total || 0));
  return {
    d: String(Math.floor(sec / 86400)),
    h: String(Math.floor((sec % 86400) / 3600)),
    m: String(Math.floor((sec % 3600) / 60)),
    s: String(sec % 60),
  };
}

function fmtClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function toDatetimeLocalString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dateDiffSec(fromStr: string, toStr: string): number {
  if (!toStr) return 0;
  const fromTime = fromStr ? new Date(fromStr).getTime() : Date.now();
  const toTime = new Date(toStr).getTime();
  if (Number.isNaN(fromTime) || Number.isNaN(toTime)) return 0;
  return Math.max(0, Math.floor((toTime - fromTime) / 1000));
}

function TimeInputs({
  value,
  onChange,
}: {
  value: TimeParts;
  onChange: (next: TimeParts) => void;
}) {
  const field = (key: keyof TimeParts, max: number, unit: string) => (
    <span className="flex items-center gap-0.5 shrink-0">
      <input
        type="number"
        min={0}
        max={max}
        value={value[key]}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        placeholder="0"
        className="w-10 h-7 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl px-1 text-center text-[11px] font-black text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-[10px] font-black text-[var(--text-label)]">{unit}</span>
    </span>
  );

  return (
    <div className="flex items-center gap-1 min-w-0">
      {field('d', 365, 'h')}
      {field('h', 23, 'j')}
      {field('m', 59, 'm')}
      {field('s', 59, 'd')}
    </div>
  );
}

export type TimerControlProps = {
  timer: DockControlsApi['timer'];
  actions: DockControlsApi['timerActions'];
};

export default function TimerControl({ timer, actions }: TimerControlProps) {
  const [now, setNow] = useState(() => Date.now());
  const [setForm, setSetForm] = useState<TimeParts>(ZERO);
  const [addForm, setAddForm] = useState<TimeParts>({ d: '0', h: '0', m: '5', s: '0' });
  const [subForm, setSubForm] = useState<TimeParts>({ d: '0', h: '0', m: '5', s: '0' });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!timer?.isRunning) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer?.isRunning]);

  const totalSeconds = timer?.totalSeconds;
  const timerRunning = timer?.isRunning;

  // Sinkron input Set dengan durasi timer saat tidak running (mirip dock desktop).
  useEffect(() => {
    if (totalSeconds == null || timerRunning) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSetForm(secondsToParts(totalSeconds));
  }, [totalSeconds, timerRunning]);

  const base = timer?.totalSeconds ?? 50 * 60;
  const seconds = timer?.isRunning && timer.updatedAt
    ? Math.max(0, base - Math.floor((now - timer.updatedAt) / 1000))
    : base;

  const flash = (msg: string) => {
    setError(null);
    setNotice(msg);
  };

  const handleSet = () => {
    const total = partsToSeconds(setForm);
    if (total <= 0) {
      setNotice(null);
      setError('Durasi harus > 0');
      return;
    }
    actions.control('set', { totalSeconds: total });
    flash(`Timer diset ke ${fmtClock(total)}`);
  };

  const handleAdd = () => {
    const total = partsToSeconds(addForm) || 300;
    actions.control('add', { seconds: total });
    flash(`+${fmtClock(total)}`);
  };

  const handleSub = () => {
    const total = partsToSeconds(subForm) || 300;
    actions.control('sub', { seconds: total });
    flash(`-${fmtClock(total)}`);
  };

  const handleSetFromDates = () => {
    if (!toDate.trim()) {
      setNotice(null);
      setError('Tentukan To Date dulu');
      return;
    }
    const diff = dateDiffSec(fromDate.trim(), toDate.trim());
    if (diff <= 0) {
      setNotice(null);
      setError('To Date harus lebih besar dari From Date');
      return;
    }
    setSetForm(secondsToParts(diff));
    actions.control('set', { totalSeconds: diff });
    flash(`Timer diset ke ${fmtClock(diff)} dari tanggal`);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto mdock-scroll p-3 space-y-2.5">
      {/* Display + transport */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-violet-500 shrink-0" />
            <span className="font-sans font-black text-[20px] leading-none tracking-[-0.08em] tabular-nums text-[var(--text-main)]">{fmtClock(seconds)}</span>
            <span className={`w-2 h-2 rounded-full shrink-0 ${timer?.isRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
          </div>
          <span className="text-[var(--text-label)] text-[10px] font-bold shrink-0">
            {timer?.currentSession || 1}/{timer?.totalSessions || 3} {timer?.mode || 'powerup'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => actions.control(timer?.isRunning ? 'stop' : 'start')}
            className={`h-7 rounded-full text-[10px] font-black uppercase border flex items-center justify-center gap-1 cursor-pointer ${
              timer?.isRunning
                ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
                : 'bg-green-600 text-white border-green-500'
            }`}
          >
            {timer?.isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {timer?.isRunning ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={() => actions.control('reset')}
            className="h-7 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-full text-[var(--text-main)] text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      {(error || notice) && (
        <p className={`text-[10px] font-bold px-1 ${error ? 'text-red-500' : 'text-emerald-500'}`}>
          {error || notice}
        </p>
      )}

      {/* Set / Add / Sub */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-1.5">
          <span className="text-[8px] font-black uppercase text-[var(--text-label)] w-6 shrink-0">Set</span>
          <div className="flex-1 min-w-0"><TimeInputs value={setForm} onChange={setSetForm} /></div>
          <button
            onClick={handleSet}
            className="h-7 px-2 bg-[var(--text-main)] text-[var(--bg-color)] border border-[var(--text-main)] rounded-full text-[9px] font-black uppercase flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Clock className="w-3 h-3" /> Set
          </button>
        </div>

        <div className="flex items-center gap-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-1.5">
          <span className="text-[8px] font-black uppercase text-green-500 w-6 shrink-0">Add</span>
          <div className="flex-1 min-w-0"><TimeInputs value={addForm} onChange={setAddForm} /></div>
          <button
            onClick={handleAdd}
            className="h-7 px-2 bg-[var(--text-main)] text-[var(--bg-color)] border border-[var(--text-main)] rounded-full text-[9px] font-black uppercase flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>

        <div className="flex items-center gap-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-1.5">
          <span className="text-[8px] font-black uppercase text-red-500 w-6 shrink-0">Sub</span>
          <div className="flex-1 min-w-0"><TimeInputs value={subForm} onChange={setSubForm} /></div>
          <button
            onClick={handleSub}
            className="h-7 px-2 bg-[var(--text-main)] text-[var(--bg-color)] border border-[var(--text-main)] rounded-full text-[9px] font-black uppercase flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Square className="w-3 h-3" /> Sub
          </button>
        </div>
      </div>

      {/* Base time dari tanggal */}
      <div className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[8px] font-black uppercase text-blue-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Base Time dari Date
          </span>
          {toDate && (
            <span className="text-[9px] font-mono font-bold text-[var(--text-label)]">
              {fmtClock(dateDiffSec(fromDate, toDate))}
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-[var(--text-label)] w-8 shrink-0">From</span>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="flex-1 min-w-0 h-7 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded px-1.5 text-[10px] text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={() => setFromDate(toDatetimeLocalString())}
              className="h-7 px-1.5 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded text-[8px] font-black uppercase text-[var(--text-label)] cursor-pointer"
              title="Isi From dengan waktu saat ini"
            >
              Now
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-[var(--text-label)] w-8 shrink-0">To</span>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="flex-1 min-w-0 h-7 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded px-1.5 text-[10px] text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={handleSetFromDates}
              className="h-7 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-[9px] font-black uppercase flex items-center gap-1 shrink-0 cursor-pointer"
              title="Hitung durasi dari tanggal lalu set ke timer"
            >
              <Check className="w-3 h-3" /> Set
            </button>
          </div>
        </div>
      </div>

      {/* Mode */}
      <div className="flex gap-1.5">
        {MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => actions.control('mode', { mode })}
            className={`flex-1 h-6 rounded-full text-[8px] font-black uppercase border cursor-pointer ${
              (timer?.mode || 'powerup') === mode
                ? 'bg-[var(--text-main)] text-[var(--bg-color)] border-[var(--text-main)]'
                : 'bg-[var(--bg-color)] text-[var(--text-label)] border-[var(--border-color)]'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
