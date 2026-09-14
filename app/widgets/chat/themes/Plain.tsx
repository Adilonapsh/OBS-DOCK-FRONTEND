import type { ChatThemeProps } from './types';
import './Plain.css';

function timeLabel(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function platformLogo(p?: string) {
  const v = (p || 'tiktok').toLowerCase();
  if (v.includes('youtube')) return '/assets/logo/youtube.png';
  if (v.includes('twitch')) return '/assets/logo/twitch.png';
  if (v.includes('kick')) return '/assets/logo/sbot.png';
  return '/assets/logo/tik-tok.png';
}

export default function PlainTheme({ chats, font, showAvatar, showPlatform, showTimestamp, anim, horizontalAnim, hideAnim, fontSize, horizontal, exitingIds }: ChatThemeProps) {
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? hide : (horizontal ? (horizontalAnim || anim) : anim);
    const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn', 'elegantOut', 'softPopOut', 'blurOut', 'luxeOut'].includes(name);
    const d = isEleg ? '0.62s' : '0.4s';
    return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };

  // YouTube Live style: polosan, tanpa bubble/border/shadow, cuma baris teks
  // Avatar 20px + nama bold putih 13px + pesan 13px #e5e5e5, timestamp 10px abu
  if (horizontal) {
    return (
      <div className="chat-plain-theme w-full max-w-none flex flex-row flex-wrap gap-3 items-center content-start" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? null : chats.map((c) => (
          <div
            key={c.id}
            className="plain-row flex items-center gap-1.5 shrink-0 max-w-[360px]"
            style={{ animation: getAnim(c.id) }}
          >
            {showAvatar && (
              <img
                src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}`}
                alt={c.nickname}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            )}
            {showPlatform && <img src={platformLogo(c.platform)} alt={c.platform || 'tiktok'} title={c.platform} className="w-3.5 h-3.5 rounded-full object-contain bg-white p-0.5 shrink-0" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />}
            <span className="font-bold text-[13px] leading-none text-white whitespace-nowrap">{c.nickname}</span>
            <span className="text-white/40 text-[11px]">·</span>
            <span className="text-[13px] leading-none text-white/90 truncate">{c.comment}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="chat-plain-theme w-full max-w-[380px] flex flex-col gap-0.5" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {chats.length === 0 ? null : chats.map((c) => (
        <div
          key={c.id}
          className="plain-row flex gap-2 py-1.5 px-1 hover:bg-white/[0.04] rounded transition-colors"
          style={{ animation: getAnim(c.id) }}
        >
          {showAvatar && (
            <img
              src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}`}
              alt={c.nickname}
              className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {showPlatform && (
                <img src={platformLogo(c.platform)} alt={c.platform || 'tiktok'} title={c.platform} className="w-3.5 h-3.5 rounded-full object-contain bg-white p-0.5 shrink-0" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />
              )}
              <span className="font-bold text-[13px] leading-none text-white">{c.nickname}</span>
              {showTimestamp && c.timestamp ? <span className="text-[10px] font-mono text-white/35">{timeLabel(c.timestamp)}</span> : null}
            </div>
            <p className="text-[13px] leading-[1.35] text-white/90 break-words mt-0.5">{c.comment}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
