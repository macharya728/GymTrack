import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import './index.css';
import App from './App';
import { StoreProvider } from './lib/store';
import ErrorBoundary from './components/ErrorBoundary';
import { OFFLINE_READY_KEY } from './lib/hooks';

registerSW({
  immediate: true,
  onOfflineReady() {
    try {
      localStorage.setItem(OFFLINE_READY_KEY, '1');
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event('gymtrack:offline-ready'));
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ErrorBoundary>
  </StrictMode>,
);
