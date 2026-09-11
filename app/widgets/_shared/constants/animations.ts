// Shared animation definitions - elegant core used by chat
// Single source for keyframes, maps, and duration helpers

export const ANIM_MAP: Record<string, string> = {
  elegant: 'elegantIn',
  softPop: 'softPopIn',
  blur: 'blurIn',
  luxe: 'luxeIn',
  slideUp: 'slideUp',
  slideLeft: 'slideLeft',
  slideRight: 'slideRight',
  pop: 'popIn',
  fade: 'fadeIn',
  flip: 'flipIn',
};

export const ANIM_OUT_MAP: Record<string, string> = {
  elegant: 'elegantOut',
  softPop: 'softPopOut',
  blur: 'blurOut',
  luxe: 'luxeOut',
  slideUp: 'slideUpOut',
  slideLeft: 'slideLeftOut',
  slideRight: 'slideRightOut',
  pop: 'popOut',
  fade: 'fadeOut',
  flip: 'flipOut',
};

export const ELEGANT_ANIMS = new Set(['elegantIn', 'softPopIn', 'blurIn', 'luxeIn', 'elegantOut', 'softPopOut', 'blurOut', 'luxeOut']);

export function isElegantAnim(name: string): boolean {
  return ELEGANT_ANIMS.has(name);
}

export function animDuration(name: string, fallback: string = '0.45s'): string {
  return isElegantAnim(name) ? '0.62s' : fallback;
}

export const KEYFRAMES_CSS = `
  @keyframes elegantIn { from { opacity:0; transform: translateY(14px) scale(0.97); filter: blur(8px); } to { opacity:1; transform: translateY(0) scale(1); filter: blur(0); } }
  @keyframes softPopIn { from { opacity:0; transform: scale(0.94) translateY(8px); filter: blur(6px); } to { opacity:1; transform: scale(1) translateY(0); filter: blur(0); } }
  @keyframes blurIn { from { opacity:0; filter: blur(12px); } to { opacity:1; filter: blur(0); } }
  @keyframes luxeIn { from { opacity:0; transform: translateY(18px) scale(0.96); filter: blur(10px); letter-spacing: 0.04em; } to { opacity:1; transform: translateY(0) scale(1); filter: blur(0); letter-spacing: 0; } }
  @keyframes slideUp { from { opacity:0; transform: translateY(16px) scale(0.96); filter: blur(6px); } to { opacity:1; transform: translateY(0) scale(1); filter: blur(0); } }
  @keyframes slideLeft { from { opacity:0; transform: translateX(18px); filter: blur(4px); } to { opacity:1; transform: translateX(0); filter: blur(0); } }
  @keyframes slideRight { from { opacity:0; transform: translateX(-18px); filter: blur(4px); } to { opacity:1; transform: translateX(0); filter: blur(0); } }
  @keyframes popIn { 0%{ opacity:0; transform: scale(0.85) translateY(8px); filter: blur(6px);} 60%{ transform: scale(1.03); filter: blur(0);} 100%{ opacity:1; transform: scale(1) translateY(0); } }
  @keyframes fadeIn { from{ opacity:0; filter: blur(6px); } to{ opacity:1; filter: blur(0); } }
  @keyframes flipIn { from { opacity:0; transform: perspective(600px) rotateX(-20deg); filter: blur(6px); } to { opacity:1; transform: perspective(600px) rotateX(0); filter: blur(0); } }
  /* - Hide / Out - default fade, elegant blur+scale */
  @keyframes elegantOut { from { opacity:1; transform: translateY(0) scale(1); filter: blur(0); } to { opacity:0; transform: translateY(-10px) scale(0.98); filter: blur(8px); } }
  @keyframes softPopOut { from { opacity:1; transform: scale(1) translateY(0); filter: blur(0); } to { opacity:0; transform: scale(0.96) translateY(-6px); filter: blur(6px); } }
  @keyframes blurOut { from { opacity:1; filter: blur(0); } to { opacity:0; filter: blur(12px); } }
  @keyframes luxeOut { from { opacity:1; transform: translateY(0) scale(1); filter: blur(0); letter-spacing: 0; } to { opacity:0; transform: translateY(-14px) scale(0.97); filter: blur(10px); letter-spacing: 0.04em; } }
  @keyframes slideUpOut { from { opacity:1; transform: translateY(0) scale(1); filter: blur(0); } to { opacity:0; transform: translateY(-16px) scale(0.96); filter: blur(6px); } }
  @keyframes slideLeftOut { from { opacity:1; transform: translateX(0); filter: blur(0); } to { opacity:0; transform: translateX(-18px); filter: blur(4px); } }
  @keyframes slideRightOut { from { opacity:1; transform: translateX(0); filter: blur(0); } to { opacity:0; transform: translateX(18px); filter: blur(4px); } }
  @keyframes popOut { from { opacity:1; transform: scale(1) translateY(0); filter: blur(0); } to { opacity:0; transform: scale(0.92) translateY(-8px); filter: blur(6px); } }
  @keyframes fadeOut { from { opacity:1; filter: blur(0); } to { opacity:0; filter: blur(6px); } }
  @keyframes flipOut { from { opacity:1; transform: perspective(600px) rotateX(0); filter: blur(0); } to { opacity:0; transform: perspective(600px) rotateX(20deg); filter: blur(6px); } }
`;
