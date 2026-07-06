import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar glass-card">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">◆</span>
          <div className="logo-text">
            <h1>Agentic AI</h1>
            <span className="subtitle">Browser</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">⌘</span>
          Dashboard
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">⚙</span>
          Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="connection-status">
          <span className="status-dot"></span>
          Backend
        </div>
      </div>
    </aside>
  );
}
