import { describe, expect, it } from 'vitest';
import { useSessionStore } from './useSessionStore';

describe('useSessionStore', () => {
  it('initializes with null token and allows updates', () => {
    expect(useSessionStore.getState().token).toBeNull();
    expect(useSessionStore.getState().loginName).toBe('');
    expect(useSessionStore.getState().rememberMe).toBe(false);

    useSessionStore.getState().setToken('abc');
    expect(useSessionStore.getState().token).toBe('abc');

    useSessionStore.getState().setLoginName('user@example.com');
    expect(useSessionStore.getState().loginName).toBe('user@example.com');

    useSessionStore.getState().setRememberMe(true);
    expect(useSessionStore.getState().rememberMe).toBe(true);
  });

  it('clears the session token', () => {
    useSessionStore.getState().setToken('abc');
    useSessionStore.getState().setLoginName('user@example.com');
    useSessionStore.getState().setRememberMe(true);
    expect(useSessionStore.getState().token).toBe('abc');

    useSessionStore.getState().clearSession();
    expect(useSessionStore.getState().token).toBeNull();
    expect(useSessionStore.getState().loginName).toBe('');
    expect(useSessionStore.getState().rememberMe).toBe(false);
  });
});
