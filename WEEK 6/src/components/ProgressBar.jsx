import './ProgressBar.css';

export default function ProgressBar({ progress = 0, status = 'in_progress' }) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const statusClass =
    status === 'completed'
      ? 'progress-bar__fill--completed'
      : status === 'failed'
        ? 'progress-bar__fill--failed'
        : 'progress-bar__fill--active';

  return (
    <div className="progress-bar">
      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill ${statusClass}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      <span className="progress-bar__text">{Math.round(clampedProgress)}%</span>
    </div>
  );
}
