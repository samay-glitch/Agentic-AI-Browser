import { useState } from 'react';
import './CommandBar.css';

export default function CommandBar({ onSubmit, isLoading, activeCommand }) {
  const [command, setCommand] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (command.trim() && !isLoading) {
      onSubmit(command.trim());
      setCommand('');
    }
  };

  return (
    <div className="command-bar-container">
      <form className="command-bar glass-card" onSubmit={handleSubmit}>
        <div className={`prompt-icon ${!isLoading ? 'idle' : ''}`}>❯</div>
        <input
          type="text"
          className="command-input"
          placeholder="Enter a command for the AI agent..."
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
        <button type="submit" className="btn btn-primary submit-btn" disabled={isLoading || !command.trim()}>
          {isLoading ? (
            <>
              <span className="loader"></span>
              Running...
            </>
          ) : (
            'Execute'
          )}
        </button>
      </form>
      
      {activeCommand && (
        <div className="active-command-label">
          <span className="pulse-dot"></span>
          Active: <span className="command-text">{activeCommand}</span>
        </div>
      )}
    </div>
  );
}
