// Shared timer core - generalisasi untuk semua widget yang butuh kontrol waktu
// Dipakai oleh timer/widget lain (mis. subathon, focus, countdown) agar field konsisten

export type TimerMode = 'powerup' | 'sleep' | 'locked' | 'paused' | string;

export type TimerCoreConfig = {
  focusMinutes: number; // durasi timer dalam menit (1..120)
  totalSessions: number;
  subathonMode: TimerMode;
};

export type TimerRuntimeState = TimerCoreConfig & {
  timerSeconds: number;
  isRunning: boolean;
  currentSession: number;
  addedSeconds?: number | null;
};

// Helper untuk membangun URL timer yang konsisten - dipakai semua widget timer
export function timerUrlKeys() {
  return {
    stringKeys: ['theme', 'font', 'accent', 'textColor', 'pos', 'anim', 'subathonMode'] as const,
    intKeys: ['fontSize', 'bgOpacity', 'focusMinutes', 'totalSessions'] as const,
    transparentKeys: ['bg'] as const,
  };
}
