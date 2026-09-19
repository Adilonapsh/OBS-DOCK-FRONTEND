import type { FollowThemeProps } from './types';
import './Minimal.css';
import { Heart } from 'lucide-react';

export default function MinimalTheme({ follows, font, accent, bg, showAvatar, anim, hideAnim, fontSize, bgOpacity, horizontal, exitingIds }: FollowThemeProps) {
  const bgColor = bg === 'transparent' ? 'rgba(255,255,255,0.92)' : bg;
  const isLight = bg === 'transparent' || bg.toLowerCase().includes('fff');
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? (hideAnim || 'fadeOut') : anim;
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','blurOut'].includes(name);
    return `${name} ${isEleg ? '0.62s' : '0.4s'} cubic-bezier(0.16,1,0.3,1) both`;
  };
  const containerClass = horizontal ? 'w-full max-w-none flex flex-row flex-wrap gap-2 items-center' : 'w-full max-w-[360px] flex flex-col gap-1.5';
  return (
    <div className={`follow-minimal-theme ${containerClass}`} style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {follows.length === 0 ? (
        <div className="px-3 py-2 rounded-full bg-black text-white/60 text-[11px] border border-white/10">Menunggu follow…</div>
      ) : follows.map((f) => (
        <div key={f.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border shrink-0 max-w-[300px]" style={{ background: bgColor, borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', opacity: bgOpacity/100, animation: getAnim(f.id) }}>
          {showAvatar && <img src={f.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.nickname)}`} alt={f.nickname} className="w-5 h-5 rounded-full object-cover shrink-0" />}
          <Heart className="w-3 h-3 text-pink-500 fill-pink-500 shrink-0" />
          <span className="font-black text-[11px] truncate" style={{ color: isLight ? '#111':'#fff' }}>{f.nickname}</span>
          <span className="text-[11px] opacity-30">{f.label || 'followed'}</span>
        </div>
      ))}
    </div>
  );
}
