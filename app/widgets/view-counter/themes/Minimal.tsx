import { Eye } from 'lucide-react';
import type { ViewCounterThemeProps } from './types';
import { fmtCount } from './shared';

export default function MinimalTheme({ total, font, fontSize, accent, bg }: ViewCounterThemeProps) {
  return (
    <div className="vc-font flex items-center gap-2 px-10 py-2 rounded-full border border-white/10" style={{ fontFamily: `'${font}', sans-serif`, background: bg === 'transparent' ? 'transparent' : bg }}>
      <Eye className="w-4 h-4 shrink-0" style={{ color: accent }} />
      <span className="text-white font-black tabular-nums" style={{ fontSize }}>{fmtCount(total)}</span>
    </div>
  );
}
