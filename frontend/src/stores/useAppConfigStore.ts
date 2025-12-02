import { create } from 'zustand';

const defaultBackendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface AppConfigState {
  backendUrl: string;
  shortcut: string;
  autoSync: boolean;
  offlineMode: boolean;
  setBackendUrl: (backendUrl: string) => void;
  setShortcut: (shortcut: string) => void;
  setAutoSync: (autoSync: boolean) => void;
  setOfflineMode: (offlineMode: boolean) => void;
}

export const useAppConfigStore = create<AppConfigState>((set) => ({
  backendUrl: defaultBackendUrl,
  shortcut: 'Cmd+Option+L',
  autoSync: true,
  offlineMode: false,
  setBackendUrl: (backendUrl) => set({ backendUrl }),
  setShortcut: (shortcut) => set({ shortcut }),
  setAutoSync: (autoSync) => set({ autoSync }),
  setOfflineMode: (offlineMode) => set({ offlineMode }),
}));
