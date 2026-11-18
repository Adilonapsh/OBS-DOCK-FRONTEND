import type { MediaThemeProps } from '../../media-player/themes/types';
import { readableOn, shadeHex } from '../utils/color';

type WaveThemeProps = MediaThemeProps & {
  layout?: 'horizontal' | 'vertical';
  waveDensity?: number;
  waveSpeed?: number;
  marqueeSpeed?: number;
};

export default function WaveTheme({
  track,
  artist,
  art,
  accent,
  bgColor,
  textColor,
  progressPercent,
  showAlbumArt,
  showPrimary,
  showSecondary,
  isPausedOverlay,
  textAlignCls,
  layout = 'horizontal',
  waveDensity = 2,
  waveSpeed = 1,
  marqueeSpeed = 1,
}: WaveThemeProps) {
  const safeAccent = accent && accent !== 'transparent' ? accent : '#d9ad16';
  const safeBg = bgColor && bgColor !== 'transparent' ? bgColor : '#0c0c0c';
  const safeText = textColor && textColor !== 'transparent' ? textColor : '#ffffff';
  const hasArt = !!art && art !== '' && !art.includes('placeholder.com');
  const pct = Math.max(0, Math.min(100, progressPercent || 0));
  const isHorizontal = layout !== 'vertical';
  const progressLift = pct > 0 ? 0.12 + (pct / 100) * 0.62 : 0;
  const density = Math.max(1, Math.min(4, waveDensity || 2));
  const speedFactor = Math.max(0.6, Math.min(2.2, waveSpeed || 1));
  const marqueeFactor = Math.max(0.4, Math.min(2.5, marqueeSpeed || 1));
  const darkAccent = shadeHex(safeAccent, 0.52);
  const deepAccent = shadeHex(safeAccent, 0.38);
  const softAccent = shadeHex(safeAccent, 0.82);
  const glowAccent = shadeHex(safeAccent, 0.92);
  const readableTitle = readableOn(safeBg, safeText, 4.5, '#ffffff', '#14141c');
  const readableArtist = readableOn(safeBg, readableTitle, 4.5, '#f3f4f6', '#111827');

  const waveLayers = Array.from({ length: density + 2 }, (_, i) => {
    const fill = i === 0 ? deepAccent : i === 1 ? darkAccent : i === 2 ? softAccent : glowAccent;
    const opacity = i === 0 ? 0.7 : i === 1 ? 0.8 : i === 2 ? 0.9 : 0.65;
    const height = i === 0 ? 72 : i === 1 ? 100 : i === 2 ? 128 : 150;
    const yShift = i === 0 ? 28 : i === 1 ? 10 : i === 2 ? -12 : -26;
    return { fill, opacity, height, yShift, duration: `${(8 / speedFactor) * (1 + i * 0.22)}s` };
  });

  return (
    <div
      className={`wave-theme relative overflow-hidden ${isHorizontal ? 'wave-horizontal' : 'wave-vertical'} ${textAlignCls || ''}`}
      style={{
        width: '100%',
        height: isHorizontal ? 140 : 550,
        maxWidth: isHorizontal ? '100%' : 260,
        minWidth: 0,
        background: '#0c0c0c',
        borderRadius: isHorizontal ? 999 : 130,
        // boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
      }}
    >
      <style>{`
        .wave-theme .wave-layer {
          position: absolute;
          left: 0;
          width: 200%;
          pointer-events: none;
        }
        .wave-theme .wave-back {
          animation: wave-move-left var(--wave-duration, 8s) linear infinite;
        }
        .wave-theme .wave-front {
          animation: wave-move-right var(--wave-duration, 6s) linear infinite;
        }
        .wave-theme .marquee-wrap {
          position: relative;
          overflow: hidden;
          width: 100%;
          white-space: nowrap;
        }
        .wave-theme .marquee-track {
          display: inline-flex;
          width: max-content;
          min-width: 100%;
          will-change: transform;
          animation: wave-marquee calc(18s / var(--marquee-speed, 1)) ease-in-out infinite;
        }
        @keyframes wave-move-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes wave-move-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes wave-marquee {
          0%, 16% { transform: translateX(0); }
          42% { transform: translateX(-10%); }
          68% { transform: translateX(-18%); }
          100% { transform: translateX(0); }
        }
        .wave-theme .wave-art {
          box-shadow: 0 0 28px rgba(255, 255, 255, 0.1), 0 0 32px ${safeAccent}80;
        }
      `}</style>

      <div
        className="absolute inset-x-0 bottom-0 z-0 pointer-events-none"
        style={
          isHorizontal
            ? { height: `${Math.max(20, pct + 12)}%` }
            : {
                height: '100%',
                transform: `translateY(${100 - Math.max(20, pct + 12)}%)`,
              }
        }
      >
        {pct > 0 && waveLayers.map((layer, index) => {
          const visualHeight = Math.max(0, Math.min(180, layer.height * progressLift));
          const visualBottom = (index === 0 ? 0 : -index * 6) + (1 - progressLift) * 24;
          return (
            <div key={index} className="absolute inset-x-0" style={{ bottom: visualBottom, height: visualHeight, opacity: layer.opacity }}>
              <svg
                className={index % 2 === 0 ? 'wave-layer wave-back' : 'wave-layer wave-front'}
                style={{ height: '100%', '--wave-duration': layer.duration } as React.CSSProperties}
                viewBox="0 0 1300 140"
                preserveAspectRatio="none"
              >
                <path d="M0,70 C325,150 325,-10 650,70 C975,150 975,-10 1300,70 L1300,140 L0,140 Z" fill={layer.fill} opacity={Math.min(1, 0.55 + index * 0.12)} />
              </svg>
              <div className="absolute inset-x-0" style={{ top: `${layer.yShift}px`, height: '100%', background: layer.fill, opacity: 0.14 }} />
            </div>
          );
        })}
      </div>

      <div className="relative z-10 flex h-full w-full items-center px-3.5" style={isHorizontal ? {} : { flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 24, paddingBottom: 18 }}>
        {showAlbumArt && (
          <div className="relative shrink-0" style={isHorizontal ? { marginRight: 18, flexShrink: 0 } : { marginBottom: 28, flexShrink: 0 }}>
            {hasArt ? (
              <img
                src={art}
                alt={track || 'album art'}
                className="wave-art object-cover border-[3px] border-[#0c0c0c]"
                style={{
                  width: isHorizontal ? 112 : 150,
                  height: isHorizontal ? 112 : 150,
                  borderRadius: '50%',
                }}
              />
            ) : (
              <div
                className="grid place-items-center border-[3px] border-[#0c0c0c]"
                style={{
                  width: isHorizontal ? 112 : 150,
                  height: isHorizontal ? 112 : 150,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${safeAccent}, ${deepAccent})`,
                  color: readableOn(safeAccent, '#ffffff', 4.5, '#ffffff', '#111111'),
                  fontSize: isHorizontal ? 34 : 48,
                  fontWeight: 900,
                }}
              >
                ♪
              </div>
            )}
            {isPausedOverlay && (
              <div className="absolute inset-0 grid place-items-center rounded-full bg-[#0c0c0c]/60 border-[3px] border-[#0c0c0c]">
                <span className="px-2 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white">Paused</span>
              </div>
            )}
          </div>
        )}

        <div
          className="relative z-10 flex min-w-0 flex-1 flex-col justify-center"
          style={
            isHorizontal
              ? { color: safeText }
              : { alignItems: 'center', textAlign: 'center', color: safeText }
          }
        >
          {showPrimary && (
            isHorizontal ? (
              <div className="marquee-wrap font-extrabold leading-tight tracking-[-0.04em] drop-shadow-md" style={{ color: readableTitle, fontSize: 32, lineHeight: 1.06 }}>
                <div className="marquee-track" style={{ fontSize: 32, color: readableTitle, ['--marquee-speed' as string]: String(marqueeFactor) }}>
                  <span>{track || '-'}&nbsp; • &nbsp; {track || '-'}&nbsp; • &nbsp; {track || '-'}</span>
                </div>
              </div>
            ) : (
              <div className="font-extrabold leading-tight tracking-[-0.04em] drop-shadow-md" style={{ color: readableTitle, fontSize: 28, lineHeight: 1.06 }}>
                {track || '-'}
              </div>
            )
          )}
          {showSecondary && (
            <div
              className="font-bold drop-shadow-md"
              style={{
                color: readableArtist,
                fontSize: isHorizontal ? 22 : 18,
                marginTop: isHorizontal ? 4 : 10,
                opacity: 0.92,
              }}
            >
              {artist || '-'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
