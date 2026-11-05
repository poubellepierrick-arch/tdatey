import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silencer les erreurs HMR WebSockets issues de l'environnement de développement containerisé
if (typeof window !== 'undefined') {
  const silentViteWsErrors = (event: ErrorEvent | PromiseRejectionEvent) => {
    const errorMsg = 'reason' in event 
      ? (event.reason?.message || event.reason?.toString() || '') 
      : (event.message || '');
    
    if (
      errorMsg.includes('WebSocket') || 
      errorMsg.includes('failed to connect to websocket') ||
      errorMsg.includes('WebSocket closed') ||
      errorMsg.includes('websocket')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  window.addEventListener('unhandledrejection', silentViteWsErrors, true);
  window.addEventListener('error', silentViteWsErrors, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
