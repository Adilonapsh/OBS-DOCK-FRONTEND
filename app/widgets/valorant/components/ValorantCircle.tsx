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
}: {
  font: string;
  rr: number;
  iconUrl: string;
  themeColor: string;
  rankName: string;
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@800;900&display=swap');`}</style>
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

      {/* Center rank icon */}
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={rankName || 'rank'}
          style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 110, height: 110, objectFit: 'contain', zIndex: 2,
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))', transition: 'transform 0.3s ease',
          }}
        />
      ) : null}

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
