import type { PollThemeProps } from './types';
import './Vote.css';

export default function VoteTheme({ poll, font, bg, showPercent, showCount, showTotal, showTimer }: PollThemeProps) {
  const total = poll.total || poll.votes.reduce((sum: number, vote: number) => sum + vote, 0);
  const elapsed = Math.floor((Date.now() - poll.createdAt) / 1000);
  const remain = Math.max(0, poll.duration - elapsed);
  const timer = `${String(Math.floor(remain / 60)).padStart(2, '0')}:${String(remain % 60).padStart(2, '0')}`;

  return (
    <div
      id="poll-vote-wrapper"
      className="poll-vote-theme"
      style={{
        fontFamily: `'${font}', sans-serif`,
        background: bg === 'transparent' ? '#202238' : bg,
      }}
    >
      {showTimer && (
        <div className="poll-vote-timer" aria-label={`Sisa waktu ${timer}`}>
          <span className="poll-vote-timer-icon" />
          <span>{timer}</span>
        </div>
      )}

      <div className="poll-vote-panel">
        <div className="poll-vote-options">
          {poll.options.map((option: string, index: number) => {
            const vote = poll.votes[index] || 0;
            const percent = total ? Math.round((vote / total) * 100) : 0;
            const value = showCount ? vote : showPercent ? `${percent}%` : vote;
            return (
              <div className="poll-vote-row" key={index}>
                <div className="poll-vote-label">{option}</div>
                <div className="poll-vote-track">
                  <div className={`poll-vote-fill poll-vote-fill-${index % 2}`} style={{ width: `${percent}%` }} />
                </div>
                <div className={`poll-vote-badge poll-vote-badge-${index % 2}`}>{value}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="poll-vote-question">{poll.question}</div>
      {showTotal && <div className="poll-vote-total">{total} votes</div>}
    </div>
  );
}