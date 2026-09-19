export type PollState = {
  id: string;
  room: string;
  question: string;
  options: string[];
  votes: number[];
  voterMap?: Record<string, number>;
  total: number;
  theme: string;
  duration: number;
  createdAt: number;
  ended: boolean;
  paused?: boolean;
  pausedAt?: number;
  visible?: boolean;
};

export type PollThemeProps = {
  poll: PollState;
  theme: string;
  font: string;
  accent: string;
  bg: string;
  showPercent: boolean;
  showCount: boolean;
  showTotal: boolean;
  showTimer: boolean;
};
