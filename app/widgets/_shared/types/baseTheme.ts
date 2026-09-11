// Shared base theme props — dipakai semua widget agar konsisten & mudah digeneralisasi
// Developer cukup extend BaseThemeProps untuk widget-specific props

export type BaseThemeProps = {
  font: string;
  fontSize: number;
  accent: string;
  bg: string;
  bgOpacity: number;
  textColor?: string;
  pos?: string;
  anim?: string;
};

export type ThemeMeta = {
  value: string;
  label: string;
  description?: string;
};

import type React from 'react';
// Generic theme component type
export type ThemeComponent<P extends BaseThemeProps> = React.ComponentType<P>;

// Registry type — map value -> component
export type ThemeRegistry<P extends BaseThemeProps> = Record<string, ThemeComponent<P>>;

// Helper untuk mendaftarkan tema dengan type-safety
export function defineThemeRegistry<P extends BaseThemeProps>(registry: ThemeRegistry<P>): ThemeRegistry<P> {
  return registry;
}

// Untuk widget timer: props timer spesifik
export type TimerBaseProps = BaseThemeProps & {
  timerSeconds: number;
  isRunning: boolean;
  currentSession: number;
  totalSessions: number;
  onToggleTimer?: () => void;
  onResetTimer?: () => void;
  onNextSession?: () => void;
  onAddTime?: (sec: number) => void;
  subathonMode?: string;
  addedSeconds?: number | null;
};
