'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { ANIM_MAP, KEYFRAMES_CSS } from '../../_shared/constants/animations';
import { getPositionStyle } from '../../_shared/constants/positions';
import PillTheme from '../themes/Pill';
import CleanTheme from '../themes/Clean';
import GlassTheme from '../themes/Glass';
import BoxedTheme from '../themes/Boxed';
import BadgeTheme from '../themes/Badge';
import PlainTheme from '../themes/Plain';
import { parseSocials } from '../config';

function SocialRotatorInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const theme = getStringParam(params, 'theme', 'pill');
  const font = getStringParam(params, 'font', 'Outfit');
  const fontSize = getIntParam(params, 'fontSize', 14);
  const accent = getStringParam(params, 'accent', '#8b5cf6');
  const bg = getStringParam(params, 'bg', 'transparent');
  const bgOpacity = Math.max(10, Math.min(100, getIntParam(params, 'bgOpacity', 100)));
  const textColor = getStringParam(params, 'textColor', '#ffffff');
  const duration = Math.max(2, Math.min(20, getIntParam(params, 'duration', 4)));
  const autoRotate = getBoolParam(params, 'autoRotate', true);
  const showIcon = getBoolParam(params, 'showIcon', true);
  const showHandle = getBoolParam(params, 'showHandle', true);
  const showLabel = getBoolParam(params, 'showLabel', true);
  const anim = getStringParam(params, 'anim', 'elegant');
  const pos = getStringParam(params, 'pos', 'center');
  const posStyle = getPositionStyle(pos);

  const socialsParam = params.get('socials');
  let socials = parseSocials('[]');
  if (socialsParam) {
    try {
      const decoded = decodeURIComponent(socialsParam);
      socials = parseSocials(decoded);
    } catch { socials = parseSocials('[]'); }
  }
  if (!socialsParam && params.get('socialsJson')) {
    socials = parseSocials(params.get('socialsJson') || '[]');
  }
  if (!socials.length) socials = parseSocials(JSON.stringify([]));

  const [index, setIndex] = useState(0);
  const total = socials.length || 1;
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);

  useEffect(() => loadGoogleFont(font, '400;700;900', 'social-rotator-font'), [font]);

  useEffect(() => {
    if (!autoRotate || total <= 1) return;
    const id = setInterval(next, duration * 1000);
    return () => clearInterval(id);
  }, [autoRotate, duration, next, total]);

  useEffect(() => { setIndex((i) => Math.min(i, Math.max(0, total - 1))); }, [total]);

  const animName = ANIM_MAP[anim] || 'elegantIn';

  const themeProps = {
    socials,
    index,
    font,
    fontSize,
    accent,
    bg,
    bgOpacity,
    textColor,
    showIcon,
    showHandle,
    showLabel,
    anim: animName,
    duration,
    onPrev: prev,
    onNext: next,
  };

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,'+')}:wght@400;700;900&display=swap'); ${KEYFRAMES_CSS} html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; }`}</style>
      <div className={`${obsMode ? `fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-4` : `w-full min-h-screen flex p-6`}`} style={{ ...posStyle, background: obsMode ? 'transparent' : theme === 'badge' ? '#98a5ff' : '#0a0a0a', fontFamily: `'${font}', sans-serif`, ...(theme === 'badge' && !obsMode ? { backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' } : {}) } as any}>
        {theme === 'clean' ? <CleanTheme {...themeProps} /> : theme === 'glass' ? <GlassTheme {...themeProps} /> : theme === 'boxed' ? <BoxedTheme {...themeProps} /> : theme === 'badge' ? <BadgeTheme {...themeProps} /> : theme === 'plain' ? <PlainTheme {...themeProps} /> : <PillTheme {...themeProps} />}
      </div>
      {!obsMode && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/60 backdrop-blur border border-white/10 rounded-full px-3 py-1.5">
          <button onClick={prev} className="w-7 h-7 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white">‹</button>
          <span className="text-white font-black text-[11px] px-2 grid place-items-center">{index + 1} / {total} • {duration}s • pos:{pos}</span>
          <button onClick={next} className="w-7 h-7 grid place-items-center rounded-full bg-white text-black hover:bg-zinc-100">›</button>
        </div>
      )}
    </>
  );
}

export default function SocialRotatorDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading social rotator…</div>}>
      <SocialRotatorInner />
    </Suspense>
  );
}
