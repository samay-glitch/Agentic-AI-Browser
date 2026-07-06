import { useEffect, useRef } from 'react';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import './ActivityLog.css';

export default function ActivityLog({ entries, isConnected }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="activity-log-panel glass-card">
      <div className="activity-log-header">
        <h2>Activity Log</h2>
        <div className="live-indicator">
          <span className={`live-dot ${isConnected ? 'connected' : ''}`}></span>
          {isConnected ? 'Live' : 'Disconnected'}
        </div>
      </div>

      <div className="activity-log-content" ref={scrollRef}>
        {entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⌘</div>
            <h3>Waiting for commands...</h3>
            <p>Enter a command above to see live agent activity</p>
          </div>
        ) : (
          <div className="log-entries">
            {entries.map((entry, index) => (
              <div key={index} className="log-entry-card glass-card-sm">
                <div className="log-entry-header">
                  <span className="timestamp">{entry.timestamp}</span>
                  <StatusBadge status={entry.status} />
                </div>
                
                <ProgressBar progress={entry.progress} status={entry.status} />
                
                {entry.latest_log && (
                  <div className="log-code-block">
                    <code>{entry.latest_log}</code>
                  </div>
                )}
                
                {entry.result && (
                  <div className="log-result success-box">
                    <strong>Result:</strong> {entry.result}
                  </div>
                )}
                
                {entry.error && (
                  <div className="log-result error-box">
                    <strong>Error:</strong> {entry.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
