import { beforeEach, describe, expect, it } from 'vitest';
import { useAppConfigStore } from './useAppConfigStore';

const defaults = useAppConfigStore.getState();

describe('useAppConfigStore', () => {
  beforeEach(() => {
    useAppConfigStore.setState({
      backendUrl: defaults.backendUrl,
      shortcut: defaults.shortcut,
      autoSync: defaults.autoSync,
      offlineMode: defaults.offlineMode,
    });
  });

  it('initializes with defaults', () => {
    const state = useAppConfigStore.getState();
    expect(state.backendUrl).toBe(defaults.backendUrl);
    expect(state.shortcut).toBe('Cmd+Option+L');
    expect(state.autoSync).toBe(true);
    expect(state.offlineMode).toBe(false);
  });

  it('updates fields through setters', () => {
    const store = useAppConfigStore.getState();
    store.setBackendUrl('https://api.example.com');
    store.setShortcut('Ctrl+Shift+P');
    store.setAutoSync(false);
    store.setOfflineMode(true);

    const updated = useAppConfigStore.getState();
    expect(updated.backendUrl).toBe('https://api.example.com');
    expect(updated.shortcut).toBe('Ctrl+Shift+P');
    expect(updated.autoSync).toBe(false);
    expect(updated.offlineMode).toBe(true);
  });
});
