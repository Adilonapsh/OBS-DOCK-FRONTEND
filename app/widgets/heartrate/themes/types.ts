import type { HeartrateSettings } from '../config';

export type HeartrateThemeProps = {
  bpm: number | null;
  settings: HeartrateSettings;
  connected: boolean;
  simulate?: boolean;
};
