'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QrCollapsedPill } from '../themes/QrCollapsedPill';
import type { QrThemeProps } from '../themes/types';

type Props = {
  enabled: boolean;
  collapseAfter: number;
  autoExpand: boolean;
  expandAfter: number;
  hoverExpand: boolean;
  theme: string;
  pillProps: QrThemeProps;
  children: ReactNode;
};

type Phase = 'open' | 'closing' | 'closed';

const ANIM = '0.45s cubic-bezier(0.22, 1, 0.36, 1)';
const CLOSE_MS = 480;

const KEYFRAMES = `
  @keyframes qrCollapseIn { from { opacity: 0; transform: scale(0.72); filter: blur(8px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }
  @keyframes qrCollapseOut { from { opacity: 1; transform: scale(1); filter: blur(0); } to { opacity: 0; transform: scale(0.8); filter: blur(8px); } }
  @keyframes qrExpandIn { from { opacity: 0; transform: scale(0.9); filter: blur(8px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }
`;

// Auto-collapse QR: tampil penuh -> mengecil jadi pill URL bertema
// -> otomatis membesar lagi (opsional), berulang. Hover / klik juga membuka QR.
export function QrAutoCollapse({
  enabled,
  collapseAfter,
  autoExpand,
  expandAfter,
  hoverExpand,
  theme,
  pillProps,
  children,
}: Props) {
  const [phase, setPhase] = useState<Phase>('open');
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (phase === 'open') {
      // Jangan collapse saat kursor masih di atas widget (mode hover expand).
      if (hoverExpand && hovered) return;
      const t = setTimeout(() => setPhase('closing'), Math.max(1, collapseAfter) * 1000);
      return () => clearTimeout(t);
    }

    if (phase === 'closing') {
      const t = setTimeout(() => setPhase('closed'), CLOSE_MS);
      return () => clearTimeout(t);
    }

    if (autoExpand) {
      const t = setTimeout(() => setPhase('open'), Math.max(1, expandAfter) * 1000);
      return () => clearTimeout(t);
    }
  }, [enabled, phase, collapseAfter, autoExpand, expandAfter, hoverExpand, hovered]);

  useEffect(() => () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }, []);

  if (!enabled) return <>{children}</>;

  const expand = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setPhase('open');
  };

  const handleEnter = () => {
    if (!hoverExpand) return;
    setHovered(true);
    expand();
  };

  const handleLeave = () => {
    if (!hoverExpand) return;
    setHovered(false);
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => {
      setPhase((p) => (p === 'open' ? 'closing' : p));
    }, 600);
  };

  const urlText = pillProps.value || pillProps.label || 'Scan QR';

  return (
    <div className="relative flex items-center justify-center" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <style>{KEYFRAMES}</style>

      {/* Slot collapsed tetap di posisi yang sama saat closing -> closed
          supaya animasi masuknya tidak restart. */}
      {phase !== 'open' && (
        <div
          key="collapsed-slot"
          className={phase === 'closing' ? 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
        >
          <div
            key="collapsed"
            role="button"
            tabIndex={0}
            aria-label={urlText}
            title={urlText}
            onClick={expand}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') expand(); }}
            className="cursor-pointer"
            style={{ animation: `qrCollapseIn ${ANIM} both` }}
          >
            <QrCollapsedPill theme={theme} {...pillProps} />
          </div>
        </div>
      )}

      {phase === 'open' && (
        <div key="open" style={{ animation: `qrExpandIn ${ANIM} both` }}>
          {children}
        </div>
      )}

      {phase === 'closing' && (
        <div key="closing" style={{ animation: `qrCollapseOut ${ANIM} both` }}>
          {children}
        </div>
      )}
    </div>
  );
}
