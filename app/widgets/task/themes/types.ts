export type TaskItem = {
  id: string;
  text: string;
  completed: boolean;
  user?: string;
};

export type TaskThemeProps = {
  tasks: TaskItem[];
  font: string;
  fontSize: number;
  accent: string;
  bg: string;
  bgOpacity: number;
  timerSeconds?: number;
  isRunning?: boolean;
  currentSession?: number;
  totalSessions?: number;
  onToggleTimer?: () => void;
  onResetTimer?: () => void;
  onNextSession?: () => void;
  onToggleTask?: (id: string) => void;
  onAddTask?: (text: string) => void;
  anim?: string;
  hideAnim?: string;
  horizontalAnim?: string;
  horizontal?: boolean;
  inline?: boolean;
  exitingIds?: Set<string>;
};
