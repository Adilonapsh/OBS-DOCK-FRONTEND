'use client';

/** Kontrol Poll interaktif - buat, pause, stop, clear, dan lihat hasil real-time. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Eye, EyeOff, Loader2, Pause, Play, Plus, Square, Trash2 } from 'lucide-react';
import type { DockControlsApi } from './types';

const BAR_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#f43f5e'];

export type PollControlProps = {
  poll: DockControlsApi['poll'];
  actions: DockControlsApi['pollActions'];
};

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function PollControl({ poll, actions }: PollControlProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [duration, setDuration] = useState(60);
  const [creating, setCreating] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const optionRefs = useRef<Array<HTMLInputElement | null>>([]);
  const pendingFocus = useRef<number | null>(null);

  // Fokuskan input pilihan yang baru ditambahkan (Shift+Enter / tombol +).
  useEffect(() => {
    const index = pendingFocus.current;
    if (index == null) return;
    pendingFocus.current = null;
    optionRefs.current[index]?.focus();
  }, [options.length]);

  useEffect(() => {
    if (!poll || poll.ended || poll.paused) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [poll]);

  const remaining = useMemo(() => {
    if (!poll) return 0;
    const endAt = poll.createdAt + Math.max(1, poll.duration) * 1000;
    return Math.max(0, Math.ceil((endAt - now) / 1000));
  }, [poll, now]);

  const validOptions = options.map((o) => o.trim()).filter(Boolean);
  const canCreate = question.trim().length > 0 && validOptions.length >= 2;

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  // Shift+Enter di kolom pilihan = tambah pilihan baru (maks 6).
  const addOption = () => {
    setOptions((prev) => {
      if (prev.length >= 6) return prev;
      pendingFocus.current = prev.length;
      return [...prev, ''];
    });
  };

  const handleCreate = () => {
    if (!canCreate) return;
    setCreating(true);
    actions.create(question.trim().slice(0, 120), validOptions.slice(0, 6), duration);
    setQuestion('');
    setOptions(['', '']);
    setTimeout(() => setCreating(false), 600);
  };

  if (!poll) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto mdock-scroll p-3 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-500" />
          <h3 className="text-xs font-black uppercase tracking-wider">Buat Poll</h3>
        </div>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.shiftKey) {
              e.preventDefault();
              addOption();
            }
          }}
          placeholder="Pertanyaan poll…"
          className="w-full text-xs px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-color)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <div className="space-y-1.5">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-5 h-5 shrink-0 grid place-items-center rounded-full bg-[var(--bg-color)] text-[9px] font-black text-[var(--text-label)]">
                {i + 1}
              </span>
              <input
                ref={(el) => { optionRefs.current[i] = el; }}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault();
                    addOption();
                  }
                }}
                placeholder={`Pilihan ${i + 1}`}
                className="flex-1 text-xs px-2.5 py-2 border border-[var(--border-color)] bg-[var(--bg-color)] rounded-md focus:outline-none"
              />
              <button
                onClick={() => setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, xi) => xi !== i)))}
                disabled={options.length <= 2}
                className="p-1.5 text-[var(--text-label)] hover:text-red-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Hapus pilihan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addOption}
            disabled={options.length >= 6}
            className="flex items-center gap-1 text-[10px] font-bold uppercase text-[var(--accent)] hover:underline disabled:opacity-40 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Tambah pilihan
          </button>
          <span className="ml-auto text-[9px] text-[var(--text-label)]">{validOptions.length}/6</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase text-[var(--text-label)]">Durasi</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="text-xs px-2 py-1.5 border border-[var(--border-color)] bg-[var(--bg-color)] rounded-md"
          >
            {[30, 60, 90, 120, 180, 300, 600].map((d) => (
              <option key={d} value={d}>{d >= 60 ? `${d / 60} menit` : `${d} detik`}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleCreate}
          disabled={!canCreate || creating}
          className="w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-white bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
        >
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          Mulai Poll
        </button>
        <p className="text-[9px] text-[var(--text-label)] text-center">
          Viewer vote dengan mengetik angka 1–{Math.max(2, validOptions.length)} di chat.
        </p>
      </div>
    );
  }

  const pct = (index: number) => (poll.total > 0 ? Math.round(((poll.votes[index] || 0) / poll.total) * 100) : 0);
  const canSeeResult = true;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto mdock-scroll p-3 space-y-2.5">
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${poll.ended ? 'bg-gray-500' : poll.paused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
              <h3 className="text-xs font-black leading-snug break-words">{poll.question}</h3>
            </div>
            <p className="text-[9px] text-[var(--text-label)] mt-0.5">
              {poll.total} vote • {poll.ended ? 'Selesai' : poll.paused ? 'Pause' : `${fmt(remaining)} lagi`}
            </p>
          </div>
          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--panel-bg)] border border-[var(--border-color)]">
            #{poll.id.slice(-4)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {!poll.ended && (
            <button
              onClick={() => (poll.paused ? actions.resume() : actions.pause())}
              className="flex-1 min-w-[70px] h-7 rounded-md bg-[var(--panel-bg)] border border-[var(--border-color)] text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
            >
              {poll.paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {poll.paused ? 'Resume' : 'Pause'}
            </button>
          )}
          {!poll.ended && (
            <button
              onClick={actions.end}
              className="flex-1 min-w-[70px] h-7 rounded-md bg-red-500/10 border border-red-500/25 text-red-500 text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
            >
              <Square className="w-3 h-3" /> Stop
            </button>
          )}
          <button
            onClick={() => actions.setVisible(!(poll.visible ?? true))}
            className="h-7 px-2 rounded-md bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-label)] cursor-pointer"
            title={poll.visible ?? true ? 'Sembunyikan dari overlay' : 'Tampilkan di overlay'}
          >
            {(poll.visible ?? true) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={actions.clear}
            className="h-7 px-2 rounded-md bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-label)] hover:text-red-400 cursor-pointer"
            title="Hapus poll"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {poll.options.map((opt, i) => {
          const percent = pct(i);
          return (
            <div key={i} className="relative overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)]">
              {canSeeResult && (
                <div
                  className="absolute inset-y-0 left-0 transition-[width] duration-500"
                  style={{ width: `${percent}%`, background: BAR_COLORS[i % BAR_COLORS.length], opacity: 0.28 }}
                />
              )}
              <div className="relative flex items-center gap-2 px-2.5 py-2">
                <span className="w-5 h-5 rounded-full bg-[var(--panel-bg)] border border-[var(--border-color)] grid place-items-center text-[9px] font-black shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-[11px] font-bold truncate">{opt}</span>
                <span className="text-[9px] text-[var(--text-label)] tabular-nums">{poll.votes[i] || 0}</span>
                <span className="text-[10px] font-black tabular-nums w-9 text-right">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {poll.ended && (
        <button
          onClick={actions.clear}
          className="w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[var(--accent)] text-white cursor-pointer"
        >
          Buat Poll Baru
        </button>
      )}
    </div>
  );
}
