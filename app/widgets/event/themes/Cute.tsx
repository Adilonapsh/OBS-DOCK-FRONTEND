import type { EventThemeProps } from './types';
import './Cute.css';
import { Gift, Heart, UserPlus } from 'lucide-react';

export default function CuteTheme({ events, font, anim, horizontalAnim, hideAnim, fontSize, bgOpacity, horizontal, inline, cuteBubbleBg, cuteResubFrom, cuteResubTo, exitingIds }: EventThemeProps & { cuteBubbleBg?: string; cuteResubFrom?: string; cuteResubTo?: string }) {
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? hide : (horizontal ? (horizontalAnim || anim) : anim);
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name);
    const d = isEleg ? '0.62s' : '0.45s';
    return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };
  const bubbleBg = cuteBubbleBg || '#1e1d2b';
  const resubGrad = `linear-gradient(90deg, ${cuteResubFrom || '#c4a2f8'} 0%, ${cuteResubTo || '#fca4d4'} 100%)`;
  const containerClass = horizontal ? 'w-full max-w-none flex flex-row flex-wrap gap-2 items-center' : 'w-full max-w-[420px] flex flex-col gap-3';

  if (horizontal || inline) {
    return (
      <div className={`cute-event-theme ${containerClass} p-1`} style={{ fontFamily: `'Nunito','Quicksand','${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}>
        {events.length === 0 ? (
          <div className="px-3.5 py-3 text-white/60 text-[13px] rounded-[12px] flex items-center gap-2" style={{ background: bubbleBg, opacity: bgOpacity/100 }}>
            <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" /> Menunggu event…
          </div>
        ) : events.map((e) => {
          const isGift = e.type==='gift';
          return (
            <div key={e.id} className="flex items-center gap-2 px-3 py-2 rounded-full shrink-0 max-w-[300px]" style={{ background: isGift ? resubGrad : bubbleBg, animation: getAnim(e.id), opacity: bgOpacity/100 }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-white/10">
                {isGift ? <Gift className="w-3 h-3 text-white" /> : e.type==='like' ? <Heart className="w-3 h-3 text-white fill-white" /> : <UserPlus className="w-3 h-3 text-white" />}
              </span>
              <span className="font-black text-[11px] text-white truncate">{e.nickname}</span>
              <span className="text-white/40 text-[11px]">•</span>
              <span className="text-white text-[11px] truncate">{isGift? `${e.giftName} ×${e.repeatCount}` : e.type==='like'? `+${e.likeCount} likes` : 'joined'}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`cute-event-theme w-full max-w-[420px] flex flex-col gap-3 p-1`} style={{ fontFamily: `'Nunito','Quicksand','${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}>
      {events.length === 0 ? (
        <div className="px-3.5 py-3 text-white/60 text-[13px] rounded-[12px] flex items-center gap-2" style={{ background: bubbleBg, opacity: bgOpacity/100 }}>
          <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" /> Menunggu event…
        </div>
      ) : events.map((e) => {
        const isGift = e.type==='gift';
        const isLike = e.type==='like';
        return (
          <div key={e.id} className="flex flex-col items-start gap-1" style={{ animation: getAnim(e.id) }}>
            <div className="flex items-center gap-2 px-1">
              <span className="role-badge" style={{ background: isGift ? resubGrad : '#2e2c45', color: isGift ? 'white' : '#a8a3ce' }}>{isGift?'GIFT': isLike?'LIKE':'JOIN'}</span>
              <span className="font-black text-[11px] tracking-wider uppercase" style={{ color: isGift?'#f5a8d0': isLike?'#fca4d4':'#d8cded' }}>{e.nickname}</span>
            </div>
            <div className="px-3.5 py-2.5 flex items-center gap-2.5 rounded-[12px] w-full max-w-[95%]" style={{ background: isGift ? resubGrad : bubbleBg, opacity: bgOpacity/100 }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/10">
                {isGift ? <Gift className="w-4 h-4 text-white" /> : isLike ? <Heart className="w-4 h-4 text-white fill-white" /> : <UserPlus className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-[12px] truncate">
                  {isGift ? <span>{e.giftName} ×{e.repeatCount} {e.diamondCount ? `• ♦${e.diamondCount}`:''}</span> : isLike ? <span>+{e.likeCount} likes</span> : <span>joined the live</span>}
                </div>
              </div>
              {isGift && e.giftPictureUrl && <img src={e.giftPictureUrl} alt={e.giftName} className="w-10 h-10 rounded-xl object-contain bg-white p-1 shrink-0" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
