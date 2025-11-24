import { useCallback, useEffect, useMemo, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrent } from '@tauri-apps/api/window';
import { HashRouter } from 'react-router-dom';
import AppRoutes from '../routes/AppRoutes';
import TopNav from '../components/TopNav';
import LauncherOverlay from '../features/launcher/LauncherOverlay';
import './app.css';

function App() {
  const isTauri = useMemo(
    () => typeof window !== 'undefined' && (('__TAURI_IPC__' in window) || ('__TAURI_INTERNALS__' in window)),
    []
  );
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  const isLauncherQuery = new URLSearchParams(window.location.search).get('window') === 'launcher';
  const [launcherOpen, setLauncherOpen] = useState(false);

  const openLauncher = useCallback(() => setLauncherOpen(true), []);
  const closeLauncher = useCallback(() => setLauncherOpen(false), []);

  // Detect if this is the dedicated launcher window.
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
    const isLauncherWindow = windowLabel === 'launcher' || isLauncherQuery;
    if (isLauncherWindow) {
      document.body.classList.add('launcher-window');
      document.documentElement.classList.add('launcher-window');
      document.getElementById('root')?.classList.add('launcher-window');
    } else {
      document.body.classList.remove('launcher-window');
      document.documentElement.classList.remove('launcher-window');
      document.getElementById('root')?.classList.remove('launcher-window');
    }
    return () => {
      document.body.classList.remove('launcher-window');
      document.documentElement.classList.remove('launcher-window');
      document.getElementById('root')?.classList.remove('launcher-window');
    };
  }, [windowLabel]);

  // Listen for native global shortcut event emitted from Tauri (Cmd+Option+L).
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    if (isTauri) {
      listen('show-spotlight', () => openLauncher())
        .then((fn) => {
          unlisten = fn;
        })
        .catch(() => {
          // Ignore if tauri event system not available in web preview
        });
    }
    return () => {
      if (unlisten) unlisten();
    };
  }, [openLauncher, isTauri]);

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      const isLauncherCombo =
        event.metaKey && event.altKey && (event.code === 'KeyL' || event.key.toLowerCase() === 'l');
      if (isLauncherCombo) {
        event.preventDefault();
        openLauncher();
      }
    };

    window.addEventListener('keydown', handleHotkey);
    return () => window.removeEventListener('keydown', handleHotkey);
  }, [openLauncher]);

  // In the launcher window, render only the overlay and hide the shell.
  const isLauncherWindow = windowLabel === 'launcher' || isLauncherQuery;

  if (isLauncherWindow) {
    return (
      <LauncherOverlay
        open
        onClose={() => {
          // Hide the window when closing the overlay
          if (isTauri) {
            getCurrent().hide();
          } else {
            setLauncherOpen(false);
          }
        }}
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
        <LauncherOverlay open={launcherOpen} onClose={closeLauncher} />
      </div>
    </HashRouter>
  );
}

export default App;
