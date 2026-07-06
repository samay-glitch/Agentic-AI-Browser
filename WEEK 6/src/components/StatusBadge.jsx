import './StatusBadge.css';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'yellow' },
  in_progress: { label: 'In Progress', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <span className={`status-badge status-badge--${config.color}`}>
      <span className="status-badge__dot" />
      <span className="status-badge__label">{config.label}</span>
    </span>
  );
}
