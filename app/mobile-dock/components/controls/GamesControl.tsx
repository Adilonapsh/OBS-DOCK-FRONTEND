'use client';

/** Kontrol Games (Trivia) - start/stop/skip/reset dan status pertandingan live. */

import { Gamepad2, Play, RefreshCw, RotateCcw, SkipForward, Square, Trophy } from 'lucide-react';
import type { DockControlsApi } from './types';

const PHASE_LABEL: Record<string, string> = {
  topics: 'Pilih Topik',
  rules: 'Aturan',
  intro: 'Intro',
  question: 'Pertanyaan',
  reveal: 'Jawaban',
  leaderboard: 'Leaderboard',
  champion: 'Juara',
};

export type GamesControlProps = {
  game: DockControlsApi['game'];
  actions: DockControlsApi['gameActions'];
  privateKey?: string | null;
};

export default function GamesControl({ game, actions, privateKey }: GamesControlProps) {
  const settingsHref = `/games/trivia${privateKey ? `?key=${encodeURIComponent(privateKey)}` : ''}`;
  const phase = game?.phase ? PHASE_LABEL[game.phase] ?? game.phase : 'Belum berjalan';
  const active = !!game?.phase && game.phase !== 'champion';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto mdock-scroll p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Gamepad2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider truncate">Trivia</span>
          <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-emerald-500 animate-pulse' : 'bg-[var(--text-label)] opacity-40'}`} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={actions.refresh}
            className="w-7 h-7 grid place-items-center rounded-full bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-label)] hover:text-[var(--text-main)] cursor-pointer"
            title="Refresh status game"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <a
            href={settingsHref}
            className="h-7 px-2.5 rounded-full bg-[var(--text-main)] text-[var(--bg-color)] text-[9px] font-black uppercase flex items-center"
          >
            Settings
          </a>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={actions.start}
          className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
        >
          <Play className="w-3 h-3" /> Start
        </button>
        <button
          onClick={actions.stop}
          className="h-8 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
        >
          <Square className="w-3 h-3" /> Stop
        </button>
        <button
          onClick={actions.skip}
          className="h-8 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
        >
          <SkipForward className="w-3 h-3" /> Skip
        </button>
        <button
          onClick={actions.reset}
          className="h-8 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {game?.phase ? (
        <>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-black uppercase truncate">{phase}</span>
              <span className="shrink-0 px-2 py-0.5 rounded bg-[var(--panel-bg)] border border-[var(--border-color)] text-[9px] font-black">
                {String(game.topic || '—').toUpperCase()}
              </span>
            </div>
            {game.question && (
              <p className="text-[10px] leading-relaxed text-[var(--text-label)] line-clamp-3">{game.question}</p>
            )}
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-[var(--panel-bg)] rounded-lg py-2">
                <div className="font-black text-[13px] leading-none">{game.qIndex || 0}<span className="text-[var(--text-label)] text-[9px]">/{game.total || 0}</span></div>
                <div className="text-[8px] font-bold uppercase text-[var(--text-label)] mt-1">Soal</div>
              </div>
              <div className="bg-[var(--panel-bg)] rounded-lg py-2">
                <div className="font-black text-[13px] leading-none">{game.players || 0}</div>
                <div className="text-[8px] font-bold uppercase text-[var(--text-label)] mt-1">Pemain</div>
              </div>
              <div className="bg-[var(--panel-bg)] rounded-lg py-2">
                <div className="font-black text-[13px] leading-none">{game.round || 1}</div>
                <div className="text-[8px] font-bold uppercase text-[var(--text-label)] mt-1">Round</div>
              </div>
            </div>
          </div>

          {game.leaderboard && game.leaderboard.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-label)] flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Leaderboard
              </p>
              {game.leaderboard.slice(0, 5).map((row, i) => (
                <div key={`${row.username}-${i}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)]">
                  <span className="w-5 text-[9px] font-black text-[var(--text-label)]">#{i + 1}</span>
                  <span className="flex-1 text-[10px] font-bold truncate">{row.username}</span>
                  <span className="text-[10px] font-black tabular-nums">{row.score}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center border border-dashed border-[var(--border-color)] rounded-xl">
          <Gamepad2 className="w-7 h-7 text-[var(--text-label)] opacity-50" />
          <p className="text-[10px] text-[var(--text-label)] italic">Game trivia belum berjalan.</p>
          <p className="text-[9px] text-[var(--text-label)] opacity-80">Tekan Start untuk memulai, atau atur dulu di Settings.</p>
        </div>
      )}
    </div>
  );
}
