import type { ChatThemeProps } from './types';
import './Boxed.css';

function timeLabel(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function BoxedTheme({ chats, font, accent, bg, showAvatar, showTimestamp, anim, horizontalAnim, fontSize, bgOpacity, horizontal, inline }: ChatThemeProps) {
  const cardBg = bg === 'transparent' ? 'rgba(12,12,12,0.9)' : bg;
  const effectiveAnim = horizontal ? (horizontalAnim || anim) : anim;
  const isElegant = ['elegantIn','softPopIn','blurIn','luxeIn'].includes(effectiveAnim);
  const dur = isElegant ? '0.62s' : '0.45s';
  if (horizontal) {
    return (
      <div className="chat-boxed-theme w-full max-w-none flex flex-row flex-wrap gap-2 items-center" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? (
          <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/50 text-[12px] shrink-0">Menunggu chat…</div>
        ) : chats.map((c) => (
          <div
            key={c.id}
            className="boxed-row flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.06] border border-white/10 shrink-0 max-w-[340px]"
            style={{ animation: `${effectiveAnim} ${dur} cubic-bezier(0.16,1,0.3,1) both`, background: cardBg, opacity: bgOpacity / 100 }}
          >
            {showAvatar && (
              <img
                src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                alt={c.nickname}
                className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
              />
            )}
            <span className="font-black text-[11px] text-white shrink-0">{c.nickname}</span>
            <span className="text-white/30 text-[11px]">:</span>
            <span className="text-white/85 text-[12px] truncate">{c.comment}</span>
          </div>
        ))}
      </div>
    );
  }
  if (inline) {
    return (
      <div className="chat-boxed-theme w-full max-w-[440px] rounded-[16px] border border-white/10 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px`, background: cardBg, opacity: bgOpacity / 100 }}>
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between" style={{ background: `linear-gradient(90deg, ${accent}22, transparent)` }}>
          <span className="font-black text-[11px] uppercase tracking-widest text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent }} />
            LIVE CHAT
          </span>
          <span className="text-white/50 text-[10px] font-mono">{chats.length} messages</span>
        </div>
        <div className="p-3 flex flex-col gap-2 max-h-[520px] overflow-hidden">
          {chats.length === 0 ? (
            <div className="px-3 py-6 text-center text-white/40 text-[13px]">Belum ada chat - tunggu viewers ngobrol di TikTok / Twitch / YouTube</div>
          ) : chats.map((c) => (
            <div key={c.id} className="boxed-row flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.04] border border-white/5" style={{ animation: `${effectiveAnim} ${dur} cubic-bezier(0.16,1,0.3,1) both` }}>
              {showAvatar && <img src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`} alt={c.nickname} className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0" />}
              <span className="font-black text-[11px] text-white shrink-0">{c.nickname}</span>
              <span className="text-white/30 text-[11px]">:</span>
              <span className="text-white/85 text-[12px] truncate flex-1">{c.comment}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="chat-boxed-theme w-full max-w-[440px] rounded-[20px] border border-white/10 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px`, background: cardBg, opacity: bgOpacity / 100 }}>
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between" style={{ background: `linear-gradient(90deg, ${accent}22, transparent)` }}>
        <span className="font-black text-[11px] uppercase tracking-widest text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent }} />
          LIVE CHAT
        </span>
        <span className="text-white/50 text-[10px] font-mono">{chats.length} messages</span>
      </div>
      <div className="p-3 flex flex-col gap-2 max-h-[520px] overflow-hidden">
        {chats.length === 0 ? (
          <div className="px-3 py-6 text-center text-white/40 text-[13px]">Belum ada chat - tunggu viewers ngobrol di TikTok / Twitch / YouTube</div>
        ) : chats.map((c) => (
          <div
            key={c.id}
            className="boxed-row flex gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/5"
            style={{ animation: `${effectiveAnim} ${dur} cubic-bezier(0.16,1,0.3,1) both` }}
          >
            {showAvatar && (
              <img
                src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                alt={c.nickname}
                className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[12px] text-white">{c.nickname}</span>
                {showTimestamp && c.timestamp ? <span className="text-white/30 text-[10px] font-mono">{timeLabel(c.timestamp)}</span> : null}
                <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
              </div>
              <p className="text-white/85 text-[13px] leading-snug break-words mt-0.5">{c.comment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
