'use client';

import { Plus, Trash2 } from 'lucide-react';
import { sanitizeTimerTiers, MAX_TIMER_TIERS, type TimerTier } from '../hooks/useDonationMap';

function fmtMenit(minutes: number): string {
  if (minutes < 60) return `${minutes} mnt`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} jam ${m} mnt` : `${h} jam`;
}

// Editor aturan "Rp X = Y menit" — bisa tambah banyak tier.
// Berlaku berapa pun nominalnya (proporsional): tier tertinggi yang
// terpenuhi dipakai; di bawah tier terkecil pakai rate tier terkecil.
export function DonationTimerTierEditor({
  tiers,
  onChange,
}: {
  tiers: TimerTier[] | undefined;
  onChange: (tiers: TimerTier[]) => void;
}) {
  const list = sanitizeTimerTiers(tiers);
  const safeList = list.length > 0 ? list : [];

  const setTier = (idx: number, patch: Partial<TimerTier>) => {
    const next = safeList.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    onChange(sanitizeTimerTiers(next));
  };
  const removeTier = (idx: number) => {
    onChange(sanitizeTimerTiers(safeList.filter((_, i) => i !== idx)));
  };
  const addTier = () => {
    if (safeList.length >= MAX_TIMER_TIERS) return;
    const last = safeList[safeList.length - 1];
    const nextAmount = last ? last.amount * 5 : 2000;
    onChange(sanitizeTimerTiers([...safeList, { amount: nextAmount, minutes: last ? Math.max(1, last.minutes * 5) : 1 }]));
  };

  return (
    <div className="space-y-2">
      {safeList.map((t, i) => (
        <div key={`${t.amount}-${i}`} className="flex gap-2 items-center">
          <div className="flex-1 flex gap-1.5 items-center min-w-0">
            <span className="text-[11px] font-bold text-gray-400 shrink-0">Rp</span>
            <input
              type="number"
              min={1}
              max={1000000000}
              step={500}
              value={t.amount}
              onChange={(e) => setTier(i, { amount: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-[12px] font-mono text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <span className="text-gray-500 text-[11px] font-black shrink-0">=</span>
          <div className="flex-1 flex gap-1.5 items-center min-w-0">
            <input
              type="number"
              min={1}
              max={1440}
              value={t.minutes}
              onChange={(e) => setTier(i, { minutes: Math.max(1, Math.min(1440, parseInt(e.target.value) || 1)) })}
              className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-[12px] font-mono text-white focus:outline-none focus:border-amber-500/50"
            />
            <span className="text-[11px] font-bold text-gray-400 shrink-0">mnt</span>
          </div>
          <button
            type="button"
            onClick={() => removeTier(i)}
            disabled={safeList.length <= 1}
            className="shrink-0 w-9 h-9 grid place-items-center bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 rounded-xl text-gray-500 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Hapus aturan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {safeList.length < MAX_TIMER_TIERS && (
        <button
          type="button"
          onClick={addTier}
          className="w-full h-9 bg-white/5 hover:bg-white/10 border border-dashed border-white/15 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah aturan
        </button>
      )}
      <span className="text-[10px] text-gray-500 block">
        Cth: Rp 10.000 = 30 mnt → donasi 10rb +{fmtMenit(30)}, 5rb +{fmtMenit(15)}, 1rb +{fmtMenit(3)} (proporsional, berapa pun nominalnya).
      </span>
    </div>
  );
}
