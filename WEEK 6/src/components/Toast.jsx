import './Toast.css';

function Toast({ message, type = 'info', visible, onClose }) {
  return (
    <div className={`toast toast--${type} ${visible ? 'toast--visible' : 'toast--hidden'}`}>
      <div className="toast__icon">
        {type === 'success' && '✓'}
        {type === 'error' && '✕'}
        {type === 'info' && 'ℹ'}
        {type === 'warning' && '⚠'}
      </div>
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={onClose} aria-label="Close">
        ✕
      </button>
    </div>
  );
}

export default Toast;
