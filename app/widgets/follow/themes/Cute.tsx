import type { FollowThemeProps } from './types';
import './Cute.css';
import { Heart } from 'lucide-react';

export default function CuteTheme({ follows, font, anim, hideAnim, fontSize, bgOpacity, horizontal, exitingIds }: FollowThemeProps) {
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? (hideAnim || 'fadeOut') : anim;
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','blurOut'].includes(name);
    return `${name} ${isEleg ? '0.62s' : '0.35s'} cubic-bezier(0.16,1,0.3,1) both`;
  };
  const containerClass = horizontal ? 'w-full max-w-none flex flex-row flex-wrap gap-2 items-center' : 'w-full max-w-[360px] flex flex-col gap-3';
  return (
    <div className={`cute-follow-theme ${containerClass} p-1`} style={{ fontFamily: `'Nunito','Quicksand','${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}>
      {follows.length === 0 ? (
        <div className="px-3.5 py-3 text-white/60 text-[13px] rounded-[12px] flex items-center gap-2" style={{ background: '#1e1d2b', opacity: bgOpacity/100 }}>
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" /> Menunggu follow…
        </div>
      ) : follows.map((f) => (
        <div key={f.id} className="flex flex-col items-start gap-1" style={{ animation: getAnim(f.id) }}>
          <div className="flex items-center gap-2 px-1">
            <span className="role-badge" style={{ background: '#2e2c45', color: '#f5a8d0' }}>FOLLOW</span>
            <span className="font-black text-[11px] tracking-wider uppercase" style={{ color: '#f5a8d0' }}>{f.nickname}</span>
          </div>
          <div className="px-3.5 py-2.5 flex items-center gap-2.5 rounded-[12px] w-full" style={{ background: 'linear-gradient(90deg, #c4a2f8 0%, #fca4d4 100%)', opacity: bgOpacity/100 }}>
            <Heart className="w-5 h-5 text-white fill-white shrink-0" />
            <span className="text-white font-bold text-[13px] flex-1 truncate">{f.nickname} just followed!</span>
            <span className="text-white/80 text-[11px]">🎉</span>
          </div>
        </div>
      ))}
    </div>
  );
}
