import type { ChatThemeProps } from './types';
import './Standard.css';

function timeLabel(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function platformLogo(p?: string) {
  const v = (p || 'tiktok').toLowerCase();
  if (v.includes('tiktok')) return '/assets/logo/tik-tok.png';
  if (v.includes('youtube') || v === 'yt') return '/assets/logo/youtube.png';
  if (v.includes('twitch')) return '/assets/logo/twitch.png';
  if (v.includes('kick')) return '/assets/logo/sbot.png';
  return '/assets/logo/tik-tok.png';
}

export default function StandardTheme({ chats, font, accent, bg, showAvatar, showPlatform, showTimestamp, anim, horizontalAnim, hideAnim, fontSize, bgOpacity, horizontal, inline, exitingIds }: ChatThemeProps) {
  const bgColor = bg === 'transparent' ? 'rgba(18,18,18,0.88)' : bg;
  const effectiveAnim = horizontal ? (horizontalAnim || anim) : anim;
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? hide : effectiveAnim;
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name);
    const d = isEleg ? '0.62s' : '0.45s';
    return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };
  if (horizontal) {
    return (
      <div className="chat-standard-theme w-full max-w-none flex flex-row flex-wrap gap-2 items-center content-start" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? null : chats.map((c) => (
          <div
            key={c.id}
            className="chat-bubble flex items-center gap-2 backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-3 py-2 will-change-transform shrink-0 max-w-[360px]"
            style={{
              background: bgColor,
              borderColor: 'rgba(255,255,255,0.10)',
              borderRadius: '999px',
              opacity: bgOpacity / 100,
              animation: getAnim(c.id),
              borderLeft: `3px solid ${accent}`,
            }}
          >
            {showAvatar && (
              <img
                src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                alt={c.nickname}
                className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
              />
            )}
            <span className="font-black text-[11px] text-white flex items-center gap-1 shrink-0">
              {showPlatform && <img src={platformLogo(c.platform)} alt={c.platform} className="w-3 h-3 rounded-full bg-white p-0.5 object-contain" />}
              {c.nickname}
            </span>
            <span className="text-white/40 text-[11px]">:</span>
            <span className="text-white text-[12px] leading-none truncate">{c.comment}</span>
            {showTimestamp && c.timestamp ? <span className="text-white/30 text-[9px] font-mono shrink-0">{timeLabel(c.timestamp)}</span> : null}
          </div>
        ))}
      </div>
    );
  }
  if (inline) {
    return (
      <div className="chat-standard-theme w-full max-w-[420px] flex flex-col gap-2" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? null : chats.map((c) => (
          <div
            key={c.id}
            className="chat-bubble flex items-center gap-2 backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-3 py-2 will-change-transform"
            style={{
              background: bgColor,
              borderColor: 'rgba(255,255,255,0.10)',
              borderRadius: '999px',
              opacity: bgOpacity / 100,
              animation: getAnim(c.id),
              borderLeft: `3px solid ${accent}`,
            }}
          >
            {showAvatar && (
              <img
                src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                alt={c.nickname}
                className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
              />
            )}
            <span className="font-black text-[11px] text-white flex items-center gap-1 shrink-0">
              {showPlatform && <img src={platformLogo(c.platform)} alt={c.platform} className="w-3 h-3 rounded-full bg-white p-0.5 object-contain" />}
              {c.nickname}
            </span>
            <span className="text-white/40 text-[11px]">:</span>
            <span className="text-white text-[12px] leading-none truncate flex-1">{c.comment}</span>
            {showTimestamp && c.timestamp ? <span className="text-white/30 text-[9px] font-mono shrink-0">{timeLabel(c.timestamp)}</span> : null}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="chat-standard-theme w-full max-w-[420px] flex flex-col gap-2" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {chats.length === 0 ? null : chats.map((c) => (
        <div
          key={c.id}
          className="chat-bubble flex gap-2.5 backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-3 py-2.5 will-change-transform"
          style={{
            background: bgColor,
            borderColor: 'rgba(255,255,255,0.10)',
            borderRadius: '16px',
            opacity: bgOpacity / 100,
            animation: getAnim(c.id),
            borderLeft: `3px solid ${accent}`,
          }}
        >
          {showAvatar && (
            <img
              src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
              alt={c.nickname}
              className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-[12px] leading-none tracking-tight text-white flex items-center gap-1">
                {showPlatform && <img src={platformLogo(c.platform)} alt={c.platform} className="w-3.5 h-3.5 rounded-full bg-white p-0.5 object-contain" />}
                {c.nickname}
              </span>
              {showTimestamp && c.timestamp ? <span className="text-white/40 text-[10px] font-mono">{timeLabel(c.timestamp)}</span> : null}
            </div>
            <p className="text-white text-[13px] leading-[1.35] break-words mt-0.5 line-clamp-3">{c.comment}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
