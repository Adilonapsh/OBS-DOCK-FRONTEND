'use client';
import { useEffect, useRef, useState } from 'react';

// Simulasi live generik dari data dummy - pola yang sama seperti chat.
// - Item masuk satu per satu tiap `intervalMs` (animasi masuk = anim tema).
// - Tiap item bertahan `holdMs` lalu keluar pakai animasi (`hideDur`), persis jalur real.
// - `filter` dipakai agar preview akurat saat filter widget aktif.
// - Tanpa suara (khusus preview); suara hanya di jalur real.
export type DummyBase<T> = Omit<T, 'id' | 'timestamp'>;

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function useDummySimulation<T extends { id: string }>(opts: {
  enabled: boolean;
  pool: DummyBase<T>[];
  maxItems: number;
  holdMs: number;
  hideDur: number;
  intervalMs?: number;
  idPrefix?: string;
  filter?: (item: T) => boolean;
  onPush?: (item: T) => void;
}): { items: T[]; exitingIds: Set<string> } {
  const { enabled, maxItems, holdMs, hideDur, intervalMs = 2400, idPrefix = 'sim' } = opts;
  const [items, setItems] = useState<T[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const poolRef = useRef<DummyBase<T>[]>(opts.pool);
  poolRef.current = opts.pool;
  const cfgRef = useRef({ maxItems, holdMs, hideDur, intervalMs, idPrefix, filter: opts.filter, onPush: opts.onPush });
  cfgRef.current = { maxItems, holdMs, hideDur, intervalMs, idPrefix, filter: opts.filter, onPush: opts.onPush };
  const idxRef = useRef(0);

  useEffect(() => {
    if (!enabled || poolRef.current.length === 0) return;
    let alive = true;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timers.delete(t);
        if (alive) fn();
      }, ms);
      timers.add(t);
    };
    const push = () => {
      if (!alive) return;
      const cfg = cfgRef.current;
      const pool = poolRef.current;
      if (pool.length === 0) { later(push, cfg.intervalMs); return; }
      // Lewati item yang kefilter (max 1 putaran pool) agar ritme tetap jalan
      for (let k = 0; k < pool.length; k++) {
        const base = pool[idxRef.current % pool.length];
        idxRef.current += 1;
        const item = { ...base, id: makeId(cfg.idPrefix), timestamp: Date.now() } as unknown as T;
        if (cfg.filter && !cfg.filter(item)) continue;
        setItems((prev) => [...prev, item].slice(-cfg.maxItems));
        cfg.onPush?.(item);
        later(() => {
          setExitingIds((prev) => new Set(prev).add(item.id));
          later(() => {
            setItems((prev) => prev.filter((c) => c.id !== item.id));
            setExitingIds((prev) => {
              const n = new Set(prev);
              n.delete(item.id);
              return n;
            });
          }, cfg.hideDur);
        }, cfg.holdMs);
        break;
      }
      later(push, cfg.intervalMs);
    };
    later(push, 600);
    return () => {
      alive = false;
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { items, exitingIds };
}
