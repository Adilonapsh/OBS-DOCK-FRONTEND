import type { ChatThemeProps } from './types';
import './Bubble.css';

function timeLabel(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function BubbleTheme({ chats, font, accent, bg, showAvatar, showTimestamp, anim, horizontalAnim, hideAnim, fontSize, bgOpacity, horizontal, inline, textColor, exitingIds }: ChatThemeProps) {
  const bubbleBg = bg === 'transparent' ? '#ffffff' : bg;
  const text = textColor || 'rgba(0,0,0,0.85)';
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => { const isExiting = exitingIds?.has(id); const name = isExiting ? hide : (horizontal ? (horizontalAnim || anim) : anim); const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name); const d = isEleg ? '0.62s' : '0.45s'; return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`; };
  if (horizontal) {
    return (
      <div className="chat-bubble-theme w-full max-w-none flex flex-row flex-wrap gap-2 items-center" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? null : chats.map((c, i) => (
          <div
            key={c.id}
            className="chat-bubble-item flex items-center gap-2 shrink-0"
            style={{ animation: getAnim(c.id), animationDelay: `${i * 40}ms` }}
          >
            {showAvatar && (
              <img
                src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                alt={c.nickname}
                className="w-6 h-6 rounded-full object-cover border border-black/5 shrink-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
              />
            )}
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border max-w-[300px]" style={{ background: bubbleBg, borderColor: 'rgba(0,0,0,0.06)', opacity: bgOpacity / 100 }}>
              <span className="font-black text-[11px] tracking-tight shrink-0" style={{ color: accent }}>{c.nickname}</span>
              <span className="text-black/30 text-[11px]">:</span>
              <span className="text-[12px] truncate" style={{ color: text }}>{c.comment}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (inline) {
    return (
      <div className="chat-bubble-theme w-full max-w-[420px] flex flex-col gap-2" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? null : chats.map((c, i) => (
          <div key={c.id} className="chat-bubble-item flex items-center gap-2 shrink-0" style={{ animation: getAnim(c.id), animationDelay: `${i * 40}ms` }}>
            {showAvatar && <img src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`} alt={c.nickname} className="w-6 h-6 rounded-full object-cover border border-black/5 shrink-0" />}
            <div className="flex items-center gap-1.5 rounded-full px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border flex-1 max-w-[92%]" style={{ background: bubbleBg, borderColor: 'rgba(0,0,0,0.06)', opacity: bgOpacity / 100 }}>
              <span className="font-black text-[11px] shrink-0" style={{ color: accent }}>{c.nickname}</span>
              <span className="text-black/30 text-[11px]">:</span>
              <span className="text-[12px] truncate flex-1" style={{ color: text }}>{c.comment}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="chat-bubble-theme w-full max-w-[420px] flex flex-col gap-2" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {chats.length === 0 ? null : chats.map((c, i) => (
        <div
          key={c.id}
          className="chat-bubble-item flex gap-2 items-end"
          style={{ animation: getAnim(c.id), animationDelay: `${i * 40}ms` }}
        >
          {showAvatar && (
            <img
              src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
              alt={c.nickname}
              className="w-8 h-8 rounded-full object-cover border border-black/5 shrink-0 self-end"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
            />
          )}
          <div
            className="relative max-w-[82%] rounded-[18px] rounded-bl-[6px] px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border"
            style={{ background: bubbleBg, borderColor: 'rgba(0,0,0,0.06)', opacity: bgOpacity / 100 }}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[11px] tracking-tight" style={{ color: accent }}>{c.nickname}</span>
              {showTimestamp && c.timestamp ? <span className="text-black/30 text-[9px] font-mono">{timeLabel(c.timestamp)}</span> : null}
            </div>
            <p className="text-[13px] leading-[1.35] break-words mt-0.5" style={{ color: text }}>{c.comment}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
