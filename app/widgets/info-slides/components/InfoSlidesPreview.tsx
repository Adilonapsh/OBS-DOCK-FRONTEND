'use client';

import { useState, useEffect, useCallback } from 'react';
import type { InfoSlidesSettings } from '../config';
import { parseSlides } from '../config';
import CleanTheme from '../themes/Clean';
import BoxedTheme from '../themes/Boxed';
import GlassTheme from '../themes/Glass';
import TimerGlassTheme from '../themes/TimerGlass';
import { ANIM_MAP } from '../../_shared/constants/animations';

export function InfoSlidesPreview({ state }: { state: InfoSlidesSettings }) {
  const slides = parseSlides(state.slidesJson);
  const [index, setIndex] = useState(0);
  const total = slides.length || 1;

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);

  useEffect(() => {
    if (!state.autoRotate || total <= 1) return;
    const id = setInterval(next, state.duration * 1000);
    return () => clearInterval(id);
  }, [state.autoRotate, state.duration, next, total]);

  useEffect(() => setIndex(0), [state.slidesJson]);

  const animName = ANIM_MAP[state.anim] || 'elegantIn';
  const props = {
    slides,
    index,
    font: state.font,
    fontSize: state.fontSize,
    accent: state.accent,
    bg: state.bg,
    bgOpacity: state.bgOpacity,
    textColor: state.textColor,
    showBadge: state.showBadge,
    showProgress: state.showProgress,
    showArrows: state.showArrows,
    anim: animName,
    duration: state.duration,
    onPrev: prev,
    onNext: next,
  };

  return (
    <div className="w-full flex flex-col items-center">
      {state.theme === 'boxed' ? <BoxedTheme {...props} /> : state.theme === 'glass' ? <GlassTheme {...props} /> : <CleanTheme {...props} />}
      <div className="mt-3 flex items-center gap-2">
        <button onClick={prev} className="h-7 px-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white text-[11px] font-bold">‹ Prev</button>
        <span className="text-gray-500 text-[11px] font-mono">{index + 1} / {total} • {state.duration}s {state.autoRotate ? '• auto' : '• manual'}</span>
        <button onClick={next} className="h-7 px-3 bg-white text-black rounded-full text-[11px] font-black">Next ›</button>
      </div>
    </div>
  );
}
