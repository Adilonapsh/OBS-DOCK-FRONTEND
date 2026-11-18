'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Durasi & easing geser horizontal. Sengaja pakai ease-in-out supaya item lama
// tidak "lompat" saat pesan baru masuk.
const SHIFT_DURATION = 380;
const SHIFT_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';

/**
 * FLIP ringan untuk track horizontal chat.
 *
 * Layout flex menggeser item lama secara instan saat item baru masuk. Hook ini
 * menyimpan posisi X tiap item (berdasarkan `data-chat-id`), lalu memutar
 * animasi `translate` dari posisi lama ke posisi baru. Properti `translate`
 * terpisah dari `transform`, jadi tidak bentrok dengan animasi masuk tema.
 */
export function useHorizontalShift(ref: RefObject<HTMLElement | null>, enabled = true) {
  const positions = useRef<Map<string, number>>(new Map());
  const running = useRef<WeakMap<HTMLElement, Animation>>(new WeakMap());

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!enabled || !root) {
      positions.current.clear();
      return;
    }

    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-chat-id]'));
    const nextPositions = new Map<string, number>();

    for (const node of nodes) {
      const id = node.dataset.chatId;
      if (!id) continue;

      const x = node.offsetLeft;
      nextPositions.set(id, x);

      const previousX = positions.current.get(id);
      if (previousX == null) continue; // item baru: biarkan animasi masuk tema

      const delta = previousX - x;
      if (Math.abs(delta) < 0.5) continue;

      // Batalkan animasi geser sebelumnya (kalau pesan datang sangat cepat).
      running.current.get(node)?.cancel();

      const anim = node.animate(
        [
          { translate: `${delta}px 0` },
          { translate: '0px 0' },
        ],
        {
          duration: SHIFT_DURATION,
          easing: SHIFT_EASING,
          fill: 'none',
        },
      );
      running.current.set(node, anim);
    }

    positions.current = nextPositions;
  });
}
