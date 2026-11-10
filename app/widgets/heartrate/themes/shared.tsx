import type { ComponentProps } from 'react';
import { Heart, Activity, Zap } from 'lucide-react';
import type { HeartrateSettings } from '../config';

export function bpmColor(bpm: number, s: HeartrateSettings): string {
  if (bpm <= s.lowBpm) return s.lowColor;
  if (bpm >= s.highBpm) return s.highColor;
  return s.midColor;
}

// Komponen ikon dipilih di module scope (bukan dibuat saat render) supaya
// state internal lucide tidak reset dan lolos react-hooks/static-components.
export function HeartrateIcon({ settings, ...props }: { settings: HeartrateSettings } & ComponentProps<typeof Heart>) {
  const Icon = settings.iconStyle === 'pulse' ? Activity : settings.iconStyle === 'activity' ? Zap : Heart;
  return <Icon {...props} />;
}
