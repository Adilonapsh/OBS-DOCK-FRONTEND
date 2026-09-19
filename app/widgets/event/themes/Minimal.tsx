import type { EventThemeProps } from './types';
import './Minimal.css';
import { Gift, Heart, UserPlus } from 'lucide-react';

export default function MinimalTheme({ events, font, accent, bg, showAvatar, anim, horizontalAnim, hideAnim, fontSize, bgOpacity, horizontal, inline, exitingIds }: EventThemeProps) {
  const bgColor = bg === 'transparent' ? 'rgba(255,255,255,0.92)' : bg;
  const isLight = bg === 'transparent' || bg.toLowerCase().includes('fff');
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? hide : (horizontal ? (horizontalAnim || anim) : anim);
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name);
    const d = isEleg ? '0.62s' : '0.45s';
    return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };
  const containerClass = horizontal ? 'w-full max-w-none flex flex-row flex-wrap gap-2 items-center' : 'w-full max-w-[420px] flex flex-col gap-1.5';
  // horizontal and inline both use pill
  if (horizontal || inline) {
    return (
      <div className={`event-minimal-theme ${containerClass}`} style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {events.length === 0 ? (
          <div className="px-3 py-2 rounded-full bg-black text-white/60 text-[11px] border border-white/10 shrink-0">Menunggu event…</div>
        ) : events.map((e) => (
          <div key={e.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border shrink-0 max-w-[320px]" style={{ background: bgColor, borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', opacity: bgOpacity / 100, animation: getAnim(e.id) }}>
            {showAvatar && <img src={e.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nickname)}`} alt={e.nickname} className="w-5 h-5 rounded-full object-cover shrink-0" />}
            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: e.type==='gift'?'#FE2C55': e.type==='like'?'#ec4899': accent }}>
              {e.type==='gift'?<Gift className="w-3 h-3 text-white"/>: e.type==='like'?<Heart className="w-3 h-3 text-white fill-white"/>:<UserPlus className="w-3 h-3 text-white"/>}
            </span>
            <span className="font-black text-[11px] truncate" style={{ color: isLight ? '#111':'#fff' }}>{e.nickname}</span>
            <span className="text-[11px] opacity-30">•</span>
            <span className="text-[11px] truncate" style={{ color: isLight ? '#222':'rgba(255,255,255,0.9)' }}>{e.type==='gift'? `${e.giftName} ×${e.repeatCount}` : e.type==='like'? `+${e.likeCount} likes` : 'joined'}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`event-minimal-theme ${containerClass}`} style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {events.length === 0 ? (
        <div className="px-3 py-2 rounded-full bg-black text-white/60 text-[11px] border border-white/10 shrink-0">Menunggu event…</div>
      ) : events.map((e) => (
        <div key={e.id} className="flex items-center gap-2 px-3 py-2 rounded-full border shrink-0" style={{ background: bgColor, borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', opacity: bgOpacity / 100, animation: getAnim(e.id) }}>
          {showAvatar && <img src={e.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nickname)}`} alt={e.nickname} className="w-5 h-5 rounded-full object-cover shrink-0" />}
          <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: e.type==='gift'?'#FE2C55': e.type==='like'?'#ec4899': accent }}>
            {e.type==='gift'?<Gift className="w-3 h-3 text-white"/>: e.type==='like'?<Heart className="w-3 h-3 text-white fill-white"/>:<UserPlus className="w-3 h-3 text-white"/>}
          </span>
          <span className="font-black text-[11px] truncate" style={{ color: isLight ? '#111':'#fff' }}>{e.nickname}</span>
          <span className="text-[11px] opacity-30">•</span>
          <span className="text-[11px] truncate" style={{ color: isLight ? '#222':'rgba(255,255,255,0.9)' }}>{e.type==='gift'? `${e.giftName} ×${e.repeatCount}` : e.type==='like'? `+${e.likeCount} likes` : 'joined'}</span>
        </div>
      ))}
    </div>
  );
}
