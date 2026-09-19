import type { FollowThemeProps } from './types';
import './Standard.css';
import { Heart, UserPlus } from 'lucide-react';

export default function StandardTheme({ follows, font, accent, bg, showAvatar, anim, hideAnim, fontSize, bgOpacity, horizontal, inline, exitingIds }: FollowThemeProps) {
  const bgColor = bg === 'transparent' ? 'rgba(18,18,18,0.88)' : bg;
  const effectiveAnim = horizontal ? 'elegantIn' : anim; // follow uses anim for both, horizontal uses elegant
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? (hideAnim || 'fadeOut') : (horizontal ? (anim || 'elegantIn') : anim);
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name);
    const d = isEleg ? '0.62s' : '0.45s';
    return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };
  const containerClass = horizontal ? 'w-full max-w-none flex flex-row flex-wrap gap-2 items-center' : 'w-full max-w-[420px] flex flex-col gap-2';

  if (horizontal || inline) {
    return (
      <div className={`follow-standard-theme ${containerClass}`} style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {follows.length === 0 ? (
          <div className="px-4 py-2.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-[12px] flex items-center gap-2 shrink-0" style={{ animation: getAnim('__empty__') }}>
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" /> Menunggu follow…
          </div>
        ) : follows.map((f) => (
          <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] shrink-0 max-w-[300px]" style={{ background: bgColor, borderColor: 'rgba(255,255,255,0.10)', opacity: bgOpacity/100, animation: getAnim(f.id) }}>
            {showAvatar && <img src={f.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.nickname)}&background=ec4899&color=fff`} alt={f.nickname} className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0" />}
            <Heart className="w-4 h-4 text-pink-400 fill-pink-400 shrink-0" />
            <span className="font-black text-[11px] text-white truncate">{f.nickname}</span>
            <span className="text-pink-300 text-[10px] font-bold">followed</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`follow-standard-theme ${containerClass}`} style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {follows.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-white/60 text-[13px]" style={{ animation: getAnim('__empty__') }}>
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" /> Menunggu follow… yang follow akan muncul dengan suara
        </div>
      ) : follows.map((f) => (
        <div key={f.id} className="flex items-center gap-2.5 backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-3 py-2.5 rounded-2xl" style={{ background: bgColor, borderColor: 'rgba(255,255,255,0.10)', opacity: bgOpacity/100, animation: getAnim(f.id), borderLeft: `3px solid ${accent}` }}>
          {showAvatar && <img src={f.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.nickname)}&background=ec4899&color=fff`} alt={f.nickname} className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0" />}
          <div className="w-8 h-8 rounded-xl bg-pink-500 flex items-center justify-center shrink-0"><Heart className="w-4 h-4 text-white fill-white" /></div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-[11px] text-white leading-none truncate">{f.nickname}</div>
            <div className="text-pink-200 text-[11px] font-bold">followed you • welcome! 🎉</div>
          </div>
          <UserPlus className="w-4 h-4 text-pink-400 shrink-0" />
        </div>
      ))}
    </div>
  );
}
