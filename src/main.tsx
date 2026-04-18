import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { initDidit } from './lib/didit';

initDidit(import.meta.env.VITE_DIDIT_CLIENT_ID || 'echo_dev_placeholder');

createRoot(document.getElementById('root')!).render(
  <App />
);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.error('Service Worker registration failed:', error);
    });
  });
}
