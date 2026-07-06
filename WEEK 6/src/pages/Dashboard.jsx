import { useState, useEffect, useRef } from 'react';
import CommandBar from '../components/CommandBar';
import ActivityLog from '../components/ActivityLog';
import { sendCommand } from '../services/api';
import { createTaskWebSocket } from '../services/websocket';
import './Dashboard.css';

export default function Dashboard() {
  const [taskId, setTaskId] = useState(null);
  const [activeCommand, setActiveCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [logEntries, setLogEntries] = useState([]);
  
  const wsRef = useRef(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleSubmit = async (command) => {
    try {
      setLogEntries([]);
      setIsLoading(true);
      setActiveCommand(command);
      
      const { task_id } = await sendCommand(command);
      setTaskId(task_id);
      
      if (wsRef.current) {
        wsRef.current.close();
      }

      wsRef.current = createTaskWebSocket(task_id, {
        onOpen: () => setIsConnected(true),
        onMessage: (data) => {
          const timestamp = new Date().toLocaleTimeString();
          setLogEntries(prev => [...prev, { ...data, timestamp }]);
          
          if (data.status === 'completed' || data.status === 'failed') {
            setIsLoading(false);
          }
        },
        onClose: () => {
          setIsConnected(false);
          setIsLoading(false);
        },
        onError: () => {
          setIsLoading(false);
        }
      });
      
    } catch (err) {
      console.error('Failed to send command:', err);
      setIsLoading(false);
      setLogEntries([{
        timestamp: new Date().toLocaleTimeString(),
        status: 'failed',
        progress: 0,
        error: 'Failed to start task. Is the backend running?'
      }]);
    }
  };

  return (
    <div className="dashboard page-container">
      <div className="dashboard-main">
        <CommandBar 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
          activeCommand={activeCommand}
        />
        <ActivityLog 
          entries={logEntries} 
          isConnected={isConnected} 
        />
      </div>
      <aside className="dashboard-sidebar glass-card">
        <h3>Session History</h3>
        {taskId ? (
          <div className="history-item">
            <span className="history-command truncate">{activeCommand}</span>
            <span className="history-id truncate">{taskId}</span>
          </div>
        ) : (
          <div className="history-empty">No active tasks</div>
        )}
      </aside>
    </div>
  );
}
