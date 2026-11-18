import type { PollThemeProps } from './types';
import './Card.css';
import BarTheme from './Bar';

export default function CardTheme(props: PollThemeProps) {
  return (
    <div id="poll-card-wrapper" className="poll-card-theme scale-[0.98]">
      <BarTheme {...props} />
    </div>
  );
}
