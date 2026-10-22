// Ensure window.fetch is safely assignable by extensions or parent frames
(function () {
  if (typeof window !== 'undefined') {
    try {
      let currentFetch = window.fetch;
      const desc = {
        get() {
          return currentFetch;
        },
        set(val: typeof window.fetch) {
          currentFetch = val;
        },
        configurable: true,
        enumerable: true,
      };
      try {
        Object.defineProperty(window, 'fetch', desc);
      } catch {}
      if (typeof Window !== 'undefined' && Window.prototype) {
        try {
          Object.defineProperty(Window.prototype, 'fetch', desc);
        } catch {}
      }
    } catch {}
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
