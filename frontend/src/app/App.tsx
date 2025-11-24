import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCurrent, WebviewWindow } from '@tauri-apps/api/window';
import { HashRouter } from 'react-router-dom';
import AppRoutes from '../routes/AppRoutes';
import TopNav from '../components/TopNav';
import SpotlightOverlay from '../features/spotlight/SpotlightOverlay';
import './app.css';

function App() {
  const isTauri = useMemo(
    () => typeof window !== 'undefined' && (('__TAURI_IPC__' in window) || ('__TAURI_INTERNALS__' in window)),
    []
  );
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  const isSpotlightQuery = new URLSearchParams(window.location.search).get('window') === 'spotlight';
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const isSpotlightWindow = windowLabel === 'spotlight' || isSpotlightQuery;

  const openSpotlight = useCallback(() => setSpotlightOpen(true), []);
  const closeSpotlight = useCallback(() => setSpotlightOpen(false), []);
  const handleCloseSpotlight = useCallback(() => {
    if (isSpotlightWindow && isTauri) {
      getCurrent().hide();
      return;
    }

    closeSpotlight();
  }, [closeSpotlight, isSpotlightWindow, isTauri]);

  // Detect if this is the dedicated spotlight window.
  useEffect(() => {
    if (!isTauri) {
      setWindowLabel('main');
      return;
    }
    try {
      const current = getCurrent();
      setWindowLabel(current.label);
    } catch {
      setWindowLabel('main');
    }
  }, [isTauri]);

  useEffect(() => {
    if (isSpotlightWindow) {
      document.body.classList.add('spotlight-window');
      document.documentElement.classList.add('spotlight-window');
      document.getElementById('root')?.classList.add('spotlight-window');

      // Auto-open DevTools for the spotlight window in dev builds so logs are visible.
      if (import.meta.env.DEV && isTauri) {
        try {
          getCurrent().openDevTools();
        } catch {
          // ignore if opening devtools fails
        }
      }
    } else {
      document.body.classList.remove('spotlight-window');
      document.documentElement.classList.remove('spotlight-window');
      document.getElementById('root')?.classList.remove('spotlight-window');
    }
    return () => {
      document.body.classList.remove('spotlight-window');
      document.documentElement.classList.remove('spotlight-window');
      document.getElementById('root')?.classList.remove('spotlight-window');
    };
  }, [isSpotlightWindow]);

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      const isSpotlightCombo =
        event.metaKey && event.altKey && (event.code === 'KeyL' || event.key.toLowerCase() === 'l');
      if (!isSpotlightCombo) return;

      event.preventDefault();

      if (isTauri) {
        if (isSpotlightWindow) return;

        const spotlightWindow = WebviewWindow.getByLabel('spotlight');
        if (spotlightWindow) {
          spotlightWindow.show();
          spotlightWindow.setFocus();
          return;
        }

        // Fallback: open inline overlay if dedicated window is unavailable.
        openSpotlight();
        return;
      }

      openSpotlight();
    };

    window.addEventListener('keydown', handleHotkey);
    return () => window.removeEventListener('keydown', handleHotkey);
  }, [openSpotlight, isTauri, isSpotlightWindow]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      const isEscape = event.key === 'Escape' || event.key === 'Esc' || event.code === 'Escape';
      if (!isEscape) return;

      if (import.meta.env.DEV) {
        console.log('[spotlight] escape pressed', {
          key: event.key,
          code: event.code,
          target: (event.target as HTMLElement)?.tagName,
          isSpotlightWindow,
          spotlightOpen,
        });
      }

      // Only handle Escape when the spotlight UI is visible.
      if (!isSpotlightWindow && !spotlightOpen) return;

      event.preventDefault();
      event.stopPropagation();
      handleCloseSpotlight();
    };

    const listenerOptions: AddEventListenerOptions = { capture: true };
    window.addEventListener('keydown', handleEscape, listenerOptions);
    window.addEventListener('keyup', handleEscape, listenerOptions);
    return () => {
      window.removeEventListener('keydown', handleEscape, listenerOptions);
      window.removeEventListener('keyup', handleEscape, listenerOptions);
    };
  }, [handleCloseSpotlight, isSpotlightWindow, spotlightOpen]);

  // In the spotlight window, render only the overlay and hide the shell.
  if (isSpotlightWindow) {
    return (
      <SpotlightOverlay
        open
        onClose={handleCloseSpotlight}
      />
    );
  }

  return (
    <HashRouter>
      <div className="app-shell">
        <TopNav />
        <main className="app-content">
          <AppRoutes />
        </main>
        <SpotlightOverlay open={spotlightOpen} onClose={handleCloseSpotlight} />
      </div>
    </HashRouter>
  );
}

export default App;
