import type { EventThemeProps } from './types';
import './PerChar.css';
import { Gift, Heart, UserPlus } from 'lucide-react';

export type PerCharEventProps = EventThemeProps & {
  charDelayMs?: number;
  charDurationS?: number;
};

function eventText(e: { type: string; giftName?: string; repeatCount?: number; likeCount?: number }): string {
  if (e.type === 'gift') return `mengirim ${e.giftName || 'Gift'} ×${e.repeatCount || 1}`;
  if (e.type === 'like') return `+${e.likeCount || 1} likes`;
  return 'telah bergabung';
}

function eventBadge(e: { type: string }) {
  if (e.type === 'gift') return { bg: '#FE2C55', label: 'GIFT' };
  if (e.type === 'like') return { bg: '#ec4899', label: 'LIKE' };
  return { bg: '#22c55e', label: 'JOIN' };
}

function eventIcon(type: string) {
  if (type === 'gift') return <Gift className="pe-icon" />;
  if (type === 'like') return <Heart className="pe-icon pe-icon-fill" />;
  return <UserPlus className="pe-icon" />;
}

function PerCharText({ text, delayMs, durationS }: { text: string; delayMs: number; durationS: number }) {
  return (
    <>
      {[...text].map((ch, i) => (
        <span
          key={i}
          className="pe-char"
          style={{ animationDelay: `${(i * delayMs) / 1000}s`, animationDuration: `${durationS}s` }}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

export default function PerCharTheme({
  events,
  font,
  accent,
  showAvatar,
  fontSize,
  charDelayMs = 25,
  charDurationS = 0.35,
  exitingIds,
  hideAnim,
  horizontal,
  inline,
}: PerCharEventProps) {
  const hide = hideAnim || 'fadeOut';
  // horizontal & inline pakai bubble penuh yang sama — cuma arah alir beda
  const flowCls = horizontal ? 'flex-row flex-wrap items-start' : 'flex-col';
  return (
    <div className={`event-perchar-theme w-full ${horizontal ? 'max-w-none' : 'max-w-[480px]'} flex ${flowCls}`} style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {events.length === 0 ? (
        <div className="pe-empty">
          <span className="pe-empty-dot" /> Menunggu event…
        </div>
      ) : events.map((e) => {
        const badge = eventBadge(e);
        const isExiting = exitingIds?.has(e.id);
        return (
          <div key={e.id} className="pe-row" style={isExiting ? { animation: `${hide} 0.4s ease both` } : undefined}>
            <div className="pe-meta">
              <span className="pe-badge" style={{ background: badge.bg }}>{badge.label}</span>
              <span className="pe-username">{e.nickname}</span>
            </div>
            <div className="pe-bubble-line">
              {showAvatar ? (
                <img
                  src={e.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nickname)}&background=222&color=fff`}
                  alt={e.nickname}
                  className="pe-avatar"
                  style={{ borderColor: badge.bg }}
                  onError={(ev) => { (ev.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nickname)}&background=222&color=fff`; }}
                />
              ) : (
                <span className="pe-avatar-fallback" style={{ borderColor: badge.bg, background: accent }}>
                  {eventIcon(e.type)}
                </span>
              )}
              <div className="pe-bubble" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, fontSize: `${fontSize}px` }}>
                <PerCharText text={eventText(e)} delayMs={charDelayMs} durationS={charDurationS} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
