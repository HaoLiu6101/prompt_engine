import { describe, expect, it } from 'vitest';
import { useSessionStore } from './useSessionStore';

describe('useSessionStore', () => {
  it('initializes with null token and allows updates', () => {
    expect(useSessionStore.getState().token).toBeNull();

    useSessionStore.getState().setToken('abc');
    expect(useSessionStore.getState().token).toBe('abc');

    useSessionStore.getState().setToken(null);
    expect(useSessionStore.getState().token).toBeNull();
  });
});
