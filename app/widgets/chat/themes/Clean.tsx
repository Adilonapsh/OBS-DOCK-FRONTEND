import type { ChatThemeProps } from './types';
import './Clean.css';

function timeLabel(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function CleanTheme({ chats, font, accent, bg, showAvatar, showTimestamp, anim, horizontalAnim, fontSize, bgOpacity, horizontal, inline }: ChatThemeProps) {
  const bgColor = bg === 'transparent' ? 'rgba(255,255,255,0.92)' : bg;
  const isLight = bg === 'transparent' || bg.toLowerCase().includes('fff') || bg.toLowerCase().includes('ffffff');
  const effectiveAnim = horizontal ? (horizontalAnim || anim) : anim;
  const isElegant = ['elegantIn','softPopIn','blurIn','luxeIn'].includes(effectiveAnim);
  const dur = isElegant ? '0.62s' : '0.4s';
  if (horizontal) {
    return (
      <div className="chat-clean-theme w-full max-w-none flex flex-row flex-wrap gap-2 items-center" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? (
          <div className="px-3 py-2 rounded-full bg-black text-white/60 text-[12px] border border-white/10 shrink-0">Menunggu chat…</div>
        ) : chats.map((c) => (
          <div
            key={c.id}
            className="clean-row flex items-center gap-2 px-3 py-1.5 rounded-full border shrink-0 max-w-[320px]"
            style={{
              background: bgColor,
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
              opacity: bgOpacity / 100,
              animation: `${effectiveAnim} ${dur} cubic-bezier(0.16,1,0.3,1) both`,
            }}
          >
            {showAvatar && (
              <img
                src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}`}
                alt={c.nickname}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            )}
            <span className="font-black text-[11px] truncate shrink-0" style={{ color: isLight ? '#111' : '#fff' }}>{c.nickname}</span>
            <span className="text-[11px] opacity-30">:</span>
            <span className="text-[12px] truncate" style={{ color: isLight ? '#222' : 'rgba(255,255,255,0.9)' }}>{c.comment}</span>
          </div>
        ))}
      </div>
    );
  }
  if (inline) {
    return (
      <div className="chat-clean-theme w-full max-w-[420px] flex flex-col gap-1.5" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? (
          <div className="px-3 py-2 rounded-xl bg-black text-white/60 text-[12px] border border-white/10">Menunggu chat…</div>
        ) : chats.map((c) => (
          <div
            key={c.id}
            className="clean-row flex items-center gap-2 px-3 py-2 rounded-full border"
            style={{
              background: bgColor,
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
              opacity: bgOpacity / 100,
              animation: `${effectiveAnim} ${dur} cubic-bezier(0.16,1,0.3,1) both`,
            }}
          >
            {showAvatar && <img src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}`} alt={c.nickname} className="w-5 h-5 rounded-full object-cover shrink-0" />}
            <span className="font-black text-[11px] truncate shrink-0" style={{ color: isLight ? '#111' : '#fff' }}>{c.nickname}</span>
            <span className="text-[11px] opacity-30">:</span>
            <span className="text-[12px] truncate flex-1" style={{ color: isLight ? '#222' : 'rgba(255,255,255,0.9)' }}>{c.comment}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="chat-clean-theme w-full max-w-[420px] flex flex-col gap-1.5" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {chats.length === 0 ? (
        <div className="px-3 py-2 rounded-xl bg-black text-white/60 text-[12px] border border-white/10">Menunggu chat…</div>
      ) : chats.map((c) => (
        <div
          key={c.id}
          className="clean-row flex items-center gap-3 px-3 py-2 rounded-xl border"
          style={{
            background: bgColor,
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
            opacity: bgOpacity / 100,
            animation: `${effectiveAnim} ${dur} cubic-bezier(0.16,1,0.3,1) both`,
            borderLeft: `3px solid ${accent}`,
          }}
        >
          {showAvatar && (
            <img
              src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}`}
              alt={c.nickname}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
            <span className="font-black text-[12px] truncate" style={{ color: isLight ? '#111' : '#fff' }}>{c.nickname}</span>
            <span className="text-[13px] leading-none break-words flex-1" style={{ color: isLight ? '#222' : 'rgba(255,255,255,0.9)' }}>{c.comment}</span>
          </div>
          {showTimestamp && c.timestamp ? <span className="text-[10px] font-mono shrink-0" style={{ color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)' }}>{timeLabel(c.timestamp)}</span> : null}
        </div>
      ))}
    </div>
  );
}
