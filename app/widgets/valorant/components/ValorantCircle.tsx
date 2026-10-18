'use client';

// ValorantCircle- 1:1 port dari HTML "Valorant Exact Circular Overlay" user.
// Ring SVG (ticks + track + inner arc + progress RR) + rank icon tengah + badge RR%.
// Warna ngikut themeColor (auto = warna tier | custom = accent). Data (rr/icon) dari display/page.

const R_PROGRESS = 95;
const R_INNER = 82;
const R_MIDDLE = 68;
const STROKE_W = 18;
const CIRC = 2 * Math.PI * R_PROGRESS; // ~596.9
const INNER_CIRC = 2 * Math.PI * R_INNER; // ~552.92

const MINOR_TICKS = [30, 60, 120, 150, 210, 240, 300, 330];
const MAJOR_TICKS = [0, 90, 180, 270];

export function ValorantCircle({
  font,
  rr,
  iconUrl,
  themeColor,
  rankName,
  promo,
}: {
  font: string;
  rr: number;
  iconUrl: string;
  themeColor: string;
  rankName: string;
  promo?: { direction: 'up' | 'down'; tierName: string; iconUrl: string } | null;
}) {
  const progress = Math.min(100, Math.max(0, rr));
  const offset = CIRC - (progress / 100) * CIRC;
  const tier = themeColor && themeColor !== 'transparent' ? themeColor : '#e82c5f';
  // Titik ujung arc progress (start di atas, searah jarum jam)- badge ditempel di sini
  const endRad = ((-90 + (progress / 100) * 360) * Math.PI) / 180;
  const endX = 125 + R_PROGRESS * Math.cos(endRad);
  const endY = 125 + R_PROGRESS * Math.sin(endRad);

  return (
    <div style={{ position: 'relative', width: 250, height: 250, fontFamily: `'Poppins','${font}',sans-serif`, color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@800;900&display=swap');
        @keyframes valoCirclePop{0%{opacity:0;transform:scale(0.5) translateY(14px)}60%{opacity:1;transform:scale(1.12) translateY(0)}100%{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes valoCircleUp{from{opacity:0;transform:translateY(12px) scale(0.85)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes valoCirclePing{0%{transform:scale(1);opacity:0.7}100%{transform:scale(1.18);opacity:0}}
      `}</style>
      <svg viewBox="0 0 250 250" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        {/* 8 minor ticks */}
        {MINOR_TICKS.map((a) => (
          <line key={`minor-${a}`} x1="125" y1="13" x2="125" y2="7" transform={`rotate(${a} 125 125)`} stroke="#555" strokeWidth={2} strokeLinecap="round" />
        ))}
        {/* 4 major cardinal ticks */}
        {MAJOR_TICKS.map((a) => (
          <line key={`major-${a}`} x1="125" y1="15" x2="125" y2="5" transform={`rotate(${a} 125 125)`} stroke={tier} strokeWidth={3} strokeLinecap="round" style={{ transition: 'stroke 0.5s ease' }} />
        ))}
        {/* Background track */}
        <circle cx="125" cy="125" r={R_PROGRESS} fill="none" stroke="#2a2a32" strokeWidth={STROKE_W} />
        {/* Inner decorative white arc (top-left, 25%) */}
        <circle
          cx="125"
          cy="125"
          r={R_INNER}
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={`${INNER_CIRC * 0.25} ${INNER_CIRC}`}
          strokeDashoffset={INNER_CIRC * 0.25}
          transform="rotate(-90 125 125)"
        />
        {/* Middle decorative ring around rank icon */}
        <circle
          cx="125"
          cy="125"
          r={R_MIDDLE}
          fill="none"
          stroke={tier}
          strokeWidth={3}
          opacity={0.9}
          style={{ transition: 'stroke 0.5s ease' }}
        />
        {/* Active RR progress fill */}
        <circle
          cx="125"
          cy="125"
          r={R_PROGRESS}
          fill="none"
          stroke={tier}
          strokeWidth={STROKE_W}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          transform="rotate(-90 125 125)"
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1.2s cubic-bezier(0.2,0.8,0.2,1), stroke 0.5s ease' }}
        />
      </svg>

      {/* Center rank icon — key berubah saat promo biar ada pop animation */}
      {iconUrl ? (
        <img
          key={promo ? `${promo.direction}-${promo.tierName}` : iconUrl}
          src={promo?.iconUrl || iconUrl}
          alt={promo?.tierName || rankName || 'rank'}
          style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 110, height: 110, objectFit: 'contain', zIndex: 2,
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
            animation: promo ? 'valoCirclePop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) both' : undefined,
            transition: 'transform 0.3s ease',
          }}
        />
      ) : null}

      {/* Promo overlay rank up/down — lingkup circle, tidak nutup badge RR */}
      {promo && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', overflow: 'hidden',
            background: `radial-gradient(circle at center, ${tier}66 0%, rgba(8,8,12,0.88) 72%)`,
            backdropFilter: 'blur(3px)',
          }}
        >
          {/* ping ring */}
          <div
            style={{
              position: 'absolute', inset: 6, borderRadius: '50%',
              border: `3px solid ${tier}`,
              animation: 'valoCirclePing 1s ease-out infinite',
              pointerEvents: 'none',
            }}
          />
          <div style={{
            fontSize: 11, fontWeight: 900, letterSpacing: 3, color: '#fff',
            opacity: 0, animation: 'valoCircleUp 0.5s ease forwards 0.1s',
          }}>
            {promo.direction === 'up' ? 'RANK UP' : 'RANK DOWN'}
          </div>
          <div style={{
            fontSize: 17, fontWeight: 900, letterSpacing: 1, color: tier,
            textShadow: '0 2px 10px rgba(0,0,0,0.6)', textTransform: 'uppercase',
            marginTop: 4, maxWidth: 180, textAlign: 'center', lineHeight: 1.1,
            opacity: 0, animation: 'valoCircleUp 0.5s ease forwards 0.25s',
          }}>
            {promo.tierName}
          </div>
          <div style={{
            marginTop: 6, fontSize: promo.direction === 'up' ? 26 : 22,
            opacity: 0, animation: 'valoCircleUp 0.5s ease forwards 0.35s',
          }}>
            {promo.direction === 'up' ? '▲' : '▼'}
          </div>
        </div>
      )}

      {/* RR badge- nempel di ujung arc progress, meluncur mengikuti perubahan RR */}
      <div
        style={{
          position: 'absolute', left: endX, top: endY, transform: 'translate(-50%,-50%)',
          backgroundColor: tier, color: '#111',
          padding: '4px 12px', borderRadius: 20, fontWeight: 800, fontSize: 22,
          letterSpacing: -0.5, zIndex: 10, whiteSpace: 'nowrap',
          transition: 'left 1.2s cubic-bezier(0.2,0.8,0.2,1), top 1.2s cubic-bezier(0.2,0.8,0.2,1), background-color 0.5s ease',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        {Math.round(progress)}%
      </div>
    </div>
  );
}
