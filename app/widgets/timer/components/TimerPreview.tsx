'use client';
// DEPRECATED: Live preview sekarang 1 file dengan OBS — app/widgets/timer/display/page.tsx?simulate=1
// File ini dipertahankan untuk backward-compat, tapi settings page sekarang pakai iframe ke display+simulate.
// Jika butuh preview tanpa iframe, import getTimerTheme + color helpers dan pakai pattern yang sama.
import type { TimerSettings } from '../config';
import { getTimerTheme } from '../themes/registry';
import { ANIM_MAP } from '../../_shared/constants/animations';
export function TimerPreview({ state, timerSeconds, isRunning, currentSession }:{state:TimerSettings;timerSeconds:number;isRunning:boolean;currentSession:number;}) {
  const Theme = getTimerTheme(state.theme);
  const themeKey = `${state.theme}-${state.accent}-${state.bg}-${(state as unknown as {textColor:string}).textColor}-${state.bgOpacity}-${state.font}-${state.anim}`;
  const props={ font:state.font, fontSize:state.fontSize, accent:state.accent, bg:state.bg, bgOpacity:state.bgOpacity, textColor:(state as unknown as {textColor:string}).textColor, pos:(state as unknown as {pos:string}).pos, timerSeconds, isRunning, currentSession, totalSessions:state.totalSessions, anim:ANIM_MAP[state.anim]||'elegantIn', subathonMode:(state as unknown as {subathonMode:string}).subathonMode, onAddTime: (sec:number)=>{} } as const;
  return <Theme key={themeKey} {...props} />;
}
