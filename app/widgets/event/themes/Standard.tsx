import type { EventThemeProps } from './types';
import './Standard.css';
import { Gift, Heart, UserPlus } from 'lucide-react';

export default function StandardTheme({ events, font, accent, bg, showAvatar, anim, horizontalAnim, hideAnim, fontSize, bgOpacity, horizontal, inline, exitingIds }: EventThemeProps) {
  const bgColor = bg === 'transparent' ? 'rgba(18,18,18,0.88)' : bg;
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? hide : (horizontal ? (horizontalAnim || anim) : anim);
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name);
    const d = isEleg ? '0.62s' : '0.45s';
    return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };

  if (horizontal) {
    return (
      <div className="event-standard-theme w-full max-w-none flex flex-row flex-wrap gap-2 items-center" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {events.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 text-[12px] shrink-0" style={{ animation: getAnim('__empty__') }}>
            <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" /> Menunggu event…
          </div>
        ) : events.map((e) => (
          <div key={e.id} className="flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] shrink-0 max-w-[320px]" style={{ background: bgColor, borderColor: 'rgba(255,255,255,0.10)', opacity: bgOpacity/100, animation: getAnim(e.id) }}>
            {showAvatar && <img src={e.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nickname)}&background=222&color=fff`} alt={e.nickname} className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0" />}
            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: e.type==='gift'?'#FE2C55': e.type==='like'?'#ec4899': accent }}>
              {e.type==='gift'?<Gift className="w-3 h-3 text-white"/>: e.type==='like'?<Heart className="w-3 h-3 text-white fill-white"/>:<UserPlus className="w-3 h-3 text-white"/>}
            </span>
            <span className="font-black text-[11px] text-white truncate">{e.nickname}</span>
            <span className="text-white/40 text-[11px]">•</span>
            <span className="text-white/80 text-[11px] truncate">{e.type==='gift'? `${e.giftName} ×${e.repeatCount}` : e.type==='like'? `+${e.likeCount} likes` : (e.label || 'joined')}</span>
          </div>
        ))}
      </div>
    );
  }

  if (inline) {
    return (
      <div className="event-standard-theme w-full max-w-[420px] flex flex-col gap-2" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {events.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-[12px]" style={{ animation: getAnim('__empty__') }}>
            <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" /> Menunggu event…
          </div>
        ) : events.map((e) => (
          <div key={e.id} className="flex items-center gap-2 px-3 py-2.5 rounded-full backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)]" style={{ background: bgColor, borderColor: 'rgba(255,255,255,0.10)', opacity: bgOpacity/100, animation: getAnim(e.id) }}>
            {showAvatar && <img src={e.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nickname)}&background=222&color=fff`} alt={e.nickname} className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0" />}
            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: e.type==='gift'?'#FE2C55': e.type==='like'?'#ec4899': accent }}>
              {e.type==='gift'?<Gift className="w-3 h-3 text-white"/>: e.type==='like'?<Heart className="w-3 h-3 text-white fill-white"/>:<UserPlus className="w-3 h-3 text-white"/>}
            </span>
            <span className="font-black text-[11px] text-white truncate">{e.nickname}</span>
            <span className="text-white/40 text-[11px]">•</span>
            <span className="text-white/80 text-[11px] truncate flex-1">{e.type==='gift'? `${e.giftName} ×${e.repeatCount}` : e.type==='like'? `+${e.likeCount} likes` : (e.label || 'joined')}</span>
          </div>
        ))}
      </div>
    );
  }

  const bubbleBase = 'flex items-center gap-2.5 backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-3 py-2.5 will-change-transform';
  return (
    <div className="event-standard-theme w-full max-w-[420px] flex flex-col gap-2" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {events.length === 0 ? (
        <div className={`${bubbleBase} rounded-2xl border-white/10 bg-white/5 text-white/60 text-[13px]`} style={{ animation: getAnim('__empty__') }}>
          <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" /> Menunggu event… join/gift/like akan muncul di sini
        </div>
      ) : events.map((e) => (
        <div key={e.id} className={`${bubbleBase} rounded-2xl`} style={{ background: bgColor, borderColor: 'rgba(255,255,255,0.10)', opacity: bgOpacity / 100, animation: getAnim(e.id), borderLeft: `3px solid ${e.type === 'gift' ? '#FE2C55' : e.type === 'like' ? '#ec4899' : accent}` }}>
          {showAvatar && <img src={e.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nickname)}&background=222&color=fff`} alt={e.nickname} className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0" />}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: e.type === 'gift' ? '#FE2C55' : e.type === 'like' ? '#ec4899' : accent }}>
            {e.type === 'gift' ? <Gift className="w-4 h-4 text-white" /> : e.type === 'like' ? <Heart className="w-4 h-4 text-white fill-white" /> : <UserPlus className="w-4 h-4 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-[11px] text-white leading-none truncate flex items-center gap-1">
              {e.nickname}
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase ${e.type==='gift'?'bg-[#FE2C55] text-white': e.type==='like'?'bg-pink-500 text-white':'bg-white/10 text-white/70'}`}>{e.type}</span>
            </div>
            <div className="text-white/80 text-[12px] leading-tight truncate">
              {e.type === 'gift' ? <span>{e.giftName} ×{e.repeatCount} {e.diamondCount ? `• ♦${e.diamondCount}` : ''}</span> : e.type === 'like' ? <span>+{e.likeCount} likes</span> : <span>{e.label || 'joined the live'}</span>}
            </div>
          </div>
          {e.giftPictureUrl && e.type==='gift' && <img src={e.giftPictureUrl} alt={e.giftName} className="w-10 h-10 rounded-xl object-contain bg-white p-1 shrink-0" />}
        </div>
      ))}
    </div>
  );
}
