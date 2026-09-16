'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { ANIM_MAP, KEYFRAMES_CSS } from '../../_shared/constants/animations';
import { getPositionStyle } from '../../_shared/constants/positions';
import CleanTheme from '../themes/Clean';
import BoxedTheme from '../themes/Boxed';
import GlassTheme from '../themes/Glass';
import TimerGlassTheme from '../themes/TimerGlass';
import PlainTheme from '../themes/Plain';
import { parseSlides } from '../config';

function InfoSlidesInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const theme = getStringParam(params, 'theme', 'clean');
  const font = getStringParam(params, 'font', 'Outfit');
  const fontSize = getIntParam(params, 'fontSize', 14);
  const accent = getStringParam(params, 'accent', '#8b5cf6');
  const bg = getStringParam(params, 'bg', 'transparent');
  const bgOpacity = Math.max(10, Math.min(100, getIntParam(params, 'bgOpacity', 100)));
  const textColor = getStringParam(params, 'textColor', '#ffffff');
  const duration = Math.max(2, Math.min(30, getIntParam(params, 'duration', 6)));
  const autoRotate = getBoolParam(params, 'autoRotate', true);
  const showProgress = getBoolParam(params, 'showProgress', true);
  const showBadge = getBoolParam(params, 'showBadge', true);
  const showArrows = getBoolParam(params, 'showArrows', false);
  const anim = getStringParam(params, 'anim', 'elegant');
  const pos = getStringParam(params, 'pos', 'center');
  const posStyle = getPositionStyle(pos);

  const slidesParam = params.get('slides');
  let slides = parseSlides('[]');
  if (slidesParam) {
    try {
      const decoded = decodeURIComponent(slidesParam);
      slides = parseSlides(decoded);
    } catch { slides = parseSlides('[]'); }
  }
  // fallback: if no slides param, try slidesJson param (legacy)
  if (!slidesParam && params.get('slidesJson')) {
    slides = parseSlides(params.get('slidesJson') || '[]');
  }
  if (!slides.length) slides = parseSlides(JSON.stringify([]));

  const [index, setIndex] = useState(0);
  const safeSlides = slides.length ? slides : parseSlides('[]');
  const total = safeSlides.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);

  useEffect(() => loadGoogleFont(font, '400;700;900', 'info-slides-font'), [font]);

  useEffect(() => {
    if (!autoRotate || total <= 1) return;
    const id = setInterval(next, duration * 1000);
    return () => clearInterval(id);
  }, [autoRotate, duration, next, total]);

  // reset index if slides count changes
  useEffect(() => { setIndex((i) => Math.min(i, Math.max(0, total - 1))); }, [total]);

  const animName = ANIM_MAP[anim] || 'elegantIn';

  const themeProps = {
    slides: safeSlides,
    index,
    font,
    fontSize,
    accent,
    bg,
    bgOpacity,
    textColor,
    showBadge,
    showProgress,
    showArrows,
    anim: animName,
    duration,
    onPrev: prev,
    onNext: next,
  };

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,'+')}:wght@400;700;900&display=swap'); ${KEYFRAMES_CSS} html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; }`}</style>
      <div className={`${obsMode ? `fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-4` : `w-full min-h-screen ${theme === 'timer-glass' ? 'flex items-center justify-center p-6' : `flex p-6`}`}`} style={{ fontFamily: `'${font}', sans-serif`, background: obsMode ? 'transparent' : theme === 'timer-glass' ? 'linear-gradient(135deg, #a5b4fc 0%, #bac7ff 100%)' : '#0a0a0a', ...posStyle } as any}>
        {theme === 'boxed' ? <BoxedTheme {...themeProps} /> : theme === 'glass' ? <GlassTheme {...themeProps} /> : theme === 'timer-glass' ? <TimerGlassTheme {...themeProps} /> : theme === 'plain' ? <PlainTheme {...themeProps} /> : <CleanTheme {...themeProps} />}
      </div>
      {!obsMode && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/60 backdrop-blur border border-white/10 rounded-full px-3 py-1.5">
          <button onClick={prev} className="w-7 h-7 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white">‹</button>
          <span className="text-white font-black text-[11px] px-2 grid place-items-center">{index + 1} / {total} • {duration}s</span>
          <button onClick={next} className="w-7 h-7 grid place-items-center rounded-full bg-white text-black hover:bg-zinc-100">›</button>
        </div>
      )}
    </>
  );
}

export default function InfoSlidesDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading slides…</div>}>
      <InfoSlidesInner />
    </Suspense>
  );
}
