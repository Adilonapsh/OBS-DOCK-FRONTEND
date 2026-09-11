import type { ChatThemeProps } from './types';
import './Cute.css';

function timeLabel(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getBadge(platform?: string, nickname?: string, comment?: string): { label: string } | null {
  const c = (comment || '').toLowerCase();
  if (c.includes('resub')) return { label: 'RESUB' };
  const p = (platform || '').toLowerCase();
  if (p.includes('twitch')) return { label: 'MOD' };
  if (p.includes('youtube') || p === 'yt') return { label: 'SUB' };
  if (p.includes('kick')) return { label: 'VIP' };
  return null;
}

function isResub(comment?: string) {
  return (comment || '').toLowerCase().includes('resub');
}
function isEmoteOnly(comment?: string) {
  const t = (comment || '').trim();
  if (!t) return false;
  if (t.length <= 6 && /[\u{1F300}-\u{1FAFF}]/u.test(t)) return true;
  if (t.includes('✨') && t.length < 10) return true;
  return false;
}

export default function CuteTheme({ chats, font, showAvatar, showTimestamp, anim, horizontalAnim, hideAnim, fontSize, bgOpacity, horizontal, inline, exitingIds, cuteBubbleBg, cuteResubFrom, cuteResubTo, cuteBadgeBg, cuteBadgeText, cuteNameMod, cuteNameUser }: ChatThemeProps) {
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => { const isExiting = exitingIds?.has(id); const name = isExiting ? hide : (horizontal ? (horizontalAnim || anim) : anim); const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name); const d = isEleg ? '0.62s' : '0.35s'; return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`; };
  const bubbleBg = cuteBubbleBg || '#1e1d2b';
  const resubFrom = cuteResubFrom || '#c4a2f8';
  const resubTo = cuteResubTo || '#fca4d4';
  const badgeBg = cuteBadgeBg || '#2e2c45';
  const badgeText = cuteBadgeText || '#a8a3ce';
  const nameMod = cuteNameMod || '#f5a8d0';
  const nameUser = cuteNameUser || '#d8cded';
  const resubGrad = `linear-gradient(90deg, ${resubFrom} 0%, ${resubTo} 100%)`;

  // horizontal - row pills, container transparent (tidak pakai bg)
  if (horizontal) {
    return (
      <div
        className="cute-theme w-full max-w-none flex flex-row flex-wrap gap-2 items-center content-start p-1"
        style={{ fontFamily: `'Nunito','Quicksand','${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}
      >
        {chats.length === 0 ? null : chats.map((c) => {
          const badge = getBadge(c.platform, c.nickname, c.comment);
          const resub = isResub(c.comment);
          if (resub) {
            const before = c.comment.split(/resubscribed/i)[0]?.trim() || c.nickname;
            const resubText = c.comment.match(/resubscribed.*$/i)?.[0] || 'resubscribed';
            return (
              <div key={c.id} className="px-3 py-2 flex items-center gap-2 shrink-0 max-w-[320px] rounded-[12px]" style={{ background: resubGrad, animation: getAnim(c.id) }}>
                <span className="role-badge" style={{ background: badgeBg, color: '#a3b2f8' }}>RESUB</span>
                <span className="font-extrabold text-[12px] text-white tracking-wide truncate">{before} {resubText}</span>
              </div>
            );
          }
          return (
            <div key={c.id} className="px-3 py-2 flex items-center gap-2 shrink-0 max-w-[300px] rounded-[12px]" style={{ background: bubbleBg, animation: getAnim(c.id), opacity: bgOpacity / 100 }}>
              {showAvatar && <img src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=2e2c45&color=a8a3ce`} alt={c.nickname} className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/10" />}
              {badge && <span className="role-badge" style={{ background: badgeBg, color: badgeText }}>{badge.label}</span>}
              <span className="font-black text-[11px] tracking-wider uppercase shrink-0" style={{ color: badge ? nameMod : nameUser }}>{c.nickname}</span>
              <span className="text-white/40 text-[11px]">:</span>
              <span className="text-white text-[12px] font-bold truncate">{c.comment}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (inline) {
    return (
      <div className="cute-theme w-full max-w-[420px] flex flex-col gap-3 p-1" style={{ fontFamily: `'Nunito','Quicksand','${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}>
        {chats.length === 0 ? null : chats.map((c) => {
          const badge = getBadge(c.platform, c.nickname, c.comment);
          const resub = isResub(c.comment);
          if (resub) {
            return (
              <div key={c.id} className="px-3.5 py-3 flex items-center gap-2.5 rounded-[12px]" style={{ background: resubGrad, animation: getAnim(c.id) }}>
                <span className="role-badge" style={{ background: badgeBg, color: '#a3b2f8' }}>RESUB</span>
                <span className="font-extrabold text-[13px] text-white tracking-wide truncate">{c.nickname} {c.comment.match(/resubscribed.*$/i)?.[0] || c.comment}</span>
              </div>
            );
          }
          return (
            <div key={c.id} className="px-3.5 py-2.5 flex items-center gap-2 rounded-[12px]" style={{ background: bubbleBg, animation: getAnim(c.id), opacity: bgOpacity / 100 }}>
              {showAvatar && <img src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=2e2c45&color=a8a3ce`} alt={c.nickname} className="w-6 h-6 rounded-full object-cover shrink-0 border border-white/10" />}
              {badge && <span className="role-badge" style={{ background: badgeBg, color: badgeText }}>{badge.label}</span>}
              <span className="font-black text-[11px] tracking-wider uppercase shrink-0" style={{ color: badge ? nameMod : nameUser }}>{c.nickname}</span>
              <span className="text-white/40">:</span>
              <span className="text-white text-[13px] font-bold truncate flex-1">{c.comment}</span>
              {showTimestamp && c.timestamp ? <span className="text-white/30 text-[9px] font-mono shrink-0">{timeLabel(c.timestamp)}</span> : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="cute-theme w-full max-w-[380px] flex flex-col gap-3 p-1" style={{ fontFamily: `'Nunito','Quicksand','${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}>
      {chats.length === 0 ? null : chats.map((c) => {
        const badge = getBadge(c.platform, c.nickname, c.comment);
        const resub = isResub(c.comment);
        const emoteOnly = isEmoteOnly(c.comment);
        if (resub) {
          const resubText = c.comment.match(/resubscribed.*$/i)?.[0] || c.comment;
          return (
            <div key={c.id} className="flex flex-col items-start gap-1" style={{ animation: getAnim(c.id) }}>
              <div className="w-full px-3.5 py-3 flex items-center gap-2.5 rounded-[12px]" style={{ background: resubGrad }}>
                <span className="role-badge shadow-sm" style={{ background: badgeBg, color: '#a3b2f8' }}>RESUB</span>
                <span className="font-extrabold text-[13px] sm:text-[14px] text-white tracking-wide truncate">{c.nickname} {resubText}</span>
              </div>
            </div>
          );
        }
        if (emoteOnly) {
          return (
            <div key={c.id} className="flex flex-col items-start gap-1" style={{ animation: getAnim(c.id) }}>
              <div className="flex items-center gap-2 px-1">
                {badge && <span className="role-badge" style={{ background: badgeBg, color: badgeText }}>{badge.label}</span>}
                <span className="font-black text-[11px] tracking-wider uppercase" style={{ color: badge ? nameMod : nameUser }}>{c.nickname}</span>
                {showTimestamp && c.timestamp ? <span className="text-white/30 text-[9px] font-mono">{timeLabel(c.timestamp)}</span> : null}
              </div>
              <div className="px-3 py-2 flex items-center gap-2 rounded-[12px]" style={{ background: bubbleBg }}>
                <span className="text-[18px] leading-none">{c.comment}</span>
              </div>
            </div>
          );
        }
        return (
          <div key={c.id} className="flex flex-col items-start gap-1" style={{ animation: getAnim(c.id) }}>
            <div className="flex items-center gap-2 px-1">
              {showAvatar && <img src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=2e2c45&color=a8a3ce`} alt={c.nickname} className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0" />}
              {badge && <span className="role-badge" style={{ background: badgeBg, color: badgeText }}>{badge.label}</span>}
              <span className="font-black text-[11px] tracking-wider uppercase" style={{ color: badge ? nameMod : nameUser }}>{c.nickname}</span>
              {showTimestamp && c.timestamp ? <span className="text-white/30 text-[9px] font-mono">{timeLabel(c.timestamp)}</span> : null}
            </div>
            <div className="px-3.5 py-2.5 text-[13px] sm:text-[14px] font-bold leading-snug tracking-wide max-w-[95%] break-words rounded-[12px]" style={{ background: bubbleBg, opacity: bgOpacity / 100 }}>
              {c.comment}
            </div>
          </div>
        );
      })}
    </div>
  );
}
