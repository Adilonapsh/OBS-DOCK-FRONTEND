// Re-export shared base + timer specific
import type { TimerBaseProps } from '../../_shared/types/baseTheme';
export type TimerThemeProps = TimerBaseProps;

// Timer state yang bisa di-share ke widget lain yang butuh timer (generalizable)
export type TimerCoreSettings = {
  focusMinutes: number;
  totalSessions: number;
  subathonMode: string;
};

export type TimerDisplayState = TimerCoreSettings & {
  timerSeconds: number;
  isRunning: boolean;
  currentSession: number;
};
