import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';

describe('apiClient', () => {
  const fetchSpy = vi.spyOn(global, 'fetch');

  beforeEach(() => {
    fetchSpy.mockReset();
  });

  it('adds JSON headers and returns parsed JSON', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const result = await apiClient.get<{ ok: boolean }>('/api/test');

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:1420/api/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers)
      })
    );
    expect(result.ok).toBe(true);
  });

  it('adds Authorization header when token provided', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await apiClient.get('/secure', { token: 'abc' });

    const headers = (fetchSpy.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer abc');
  });

  it('throws with status text when response is not ok', async () => {
    fetchSpy.mockResolvedValue(
      new Response('nope', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      })
    );

    await expect(apiClient.get('/fail')).rejects.toThrow('API 500: nope');
  });
});
