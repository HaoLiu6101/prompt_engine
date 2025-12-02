import { create } from 'zustand';

interface SessionState {
  token: string | null;
  loginName: string;
  rememberMe: boolean;
  setToken: (token: string | null) => void;
  setLoginName: (loginName: string) => void;
  setRememberMe: (rememberMe: boolean) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  loginName: '',
  rememberMe: false,
  setToken: (token) => set({ token }),
  setLoginName: (loginName) => set({ loginName }),
  setRememberMe: (rememberMe) => set({ rememberMe }),
  clearSession: () => set({ token: null, loginName: '', rememberMe: false })
}));
