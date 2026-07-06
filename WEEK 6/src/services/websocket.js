const WS_BASE = 'ws://localhost:8000';

export function createTaskWebSocket(taskId, { onMessage, onOpen, onClose, onError }) {
  const url = `${WS_BASE}/ws/status/${taskId}`;
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log(`[WS] Connected to task ${taskId}`);
    onOpen?.();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    } catch (err) {
      console.error('[WS] Failed to parse message:', err);
    }
  };

  ws.onclose = (event) => {
    console.log(`[WS] Disconnected from task ${taskId}`, event.code, event.reason);
    onClose?.(event);
  };

  ws.onerror = (error) => {
    console.error('[WS] Error:', error);
    onError?.(error);
  };

  return ws;
}
