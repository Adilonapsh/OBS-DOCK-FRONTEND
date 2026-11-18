// Tipe data bersama untuk semua Dock Control yang bisa dipasang di dock mana pun.
// Semua bentuk payload mengikuti event Socket.IO backend (BACKEND/src/*.ts).

export type PollState = {
  id: string;
  room?: string;
  question: string;
  options: string[];
  votes: number[];
  total: number;
  duration: number;
  createdAt: number;
  ended: boolean;
  paused: boolean;
  visible?: boolean;
  theme?: string;
  voterPlatform?: Record<string, string>;
};

export type TaskItem = {
  id: string;
  text: string;
  completed: boolean;
  user?: string;
};

export type TaskState = {
  room?: string;
  items: TaskItem[];
  updatedAt?: number;
};

export type TimerState = {
  room?: string;
  focusMinutes?: number;
  totalSessions?: number;
  totalSeconds: number;
  isRunning: boolean;
  currentSession?: number;
  mode?: string;
  updatedAt?: number;
  addedSeconds?: number;
};

export type PinnedChat = {
  user: string;
  text: string;
  platform: string;
  avatar?: string;
};

export type ChatFeedItem = {
  id: string;
  user: string;
  text: string;
  platform: string;
  avatar?: string;
  color?: string;
  at: number;
};

export type GameStatus = {
  gameId?: string;
  phase?: string;
  topic?: string;
  round?: number;
  qIndex?: number;
  total?: number;
  players?: number;
  question?: string;
  leaderboard?: Array<{ username: string; score: number }>;
  at?: number;
};

/** API kontrol yang dikembalikan useDockControls, siap dipakai komponen mana pun. */
export type DockControlsApi = {
  connected: boolean;
  poll: PollState | null;
  tasks: TaskState | null;
  timer: TimerState | null;
  pinnedChat: PinnedChat | null;
  speaking: PinnedChat | null;
  game: GameStatus | null;
  chat: ChatFeedItem[];
  pollActions: {
    create: (question: string, options: string[], duration: number) => void;
    end: () => void;
    pause: () => void;
    resume: () => void;
    clear: () => void;
    setVisible: (visible: boolean) => void;
  };
  taskActions: {
    add: (text: string) => void;
    toggle: (id: string) => void;
    remove: (id: string) => void;
    move: (from: number, to: number) => void;
    clear: () => void;
  };
  pinActions: {
    pin: (chat: { user: string; text: string; platform?: string; avatar?: string }) => void;
    unpin: () => void;
    refresh: () => void;
  };
  speakActions: {
    speak: (chat: { user: string; text: string; platform?: string; avatar?: string }) => void;
    stop: () => void;
  };
  gameActions: {
    start: () => void;
    stop: () => void;
    skip: () => void;
    reset: () => void;
    refresh: () => void;
  };
  timerActions: {
    control: (action: string, extra?: Record<string, unknown>) => void;
    refresh: () => void;
  };
};
