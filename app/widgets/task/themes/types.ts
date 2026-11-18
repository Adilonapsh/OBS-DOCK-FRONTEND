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
  textColor?: string;
  timerSeconds?: number;
  isRunning?: boolean;
  currentSession?: number;
  totalSessions?: number;
  onToggleTask?: (id: string) => void;
  onAddTask?: (text: string) => void;
  anim?: string;
  hideAnim?: string;
  horizontalAnim?: string;
  horizontal?: boolean;
  inline?: boolean;
  exitingIds?: Set<string>;
  autoCollapse?: boolean;
  collapseAfter?: number;
  collapsedIds?: Set<string>;
  isExpanded?: boolean;
};
