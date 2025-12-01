import { vi } from 'vitest';
import { copyToClipboard, searchLibrary, syncLibraryFromBackend } from './libraryClient';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn()
}));

vi.mock('@tauri-apps/api/clipboard', () => ({
  writeText: vi.fn()
}));

// Import after mocks so Vitest wires the mocked implementations.
// eslint-disable-next-line import/first
import { invoke } from '@tauri-apps/api/tauri';
// eslint-disable-next-line import/first
import { writeText } from '@tauri-apps/api/clipboard';
// eslint-disable-next-line import/first
import { apiClient } from './apiClient';

const mockInvoke = vi.mocked(invoke);
const mockWriteText = vi.mocked(writeText);
vi.mock('./apiClient', async () => {
  const actual = await vi.importActual<typeof import('./apiClient')>('./apiClient');
  return {
    ...actual,
    apiClient: {
      get: vi.fn()
    }
  };
});
const mockApiGet = vi.mocked((apiClient as unknown as { get: typeof apiClient.get }).get);

describe('libraryClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Ensure we start in non-Tauri mode unless a test opts in.
    // @ts-expect-error removing for tests
    delete window.__TAURI_IPC__;
    // @ts-expect-error removing for tests
    delete window.__TAURI_INTERNALS__;
  });

  it('returns filtered fallback results when not in Tauri', async () => {
    const results = await searchLibrary('debug');

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((item) => item.id === 'prompt-debug')).toBe(true);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('calls Tauri invoke when running in Tauri environment', async () => {
    // @ts-expect-error adding test flag
    window.__TAURI_IPC__ = true;
    mockInvoke.mockResolvedValue([
      {
        id: 'remote',
        title: 'Remote result',
        body: 'From tauri',
        item_type: 'prompt',
        source: 'db',
        tags: [],
        created_at: 0,
        updated_at: 0,
        version: 1
      }
    ]);

    const results = await searchLibrary('remote');

    expect(mockInvoke).toHaveBeenCalledWith('search_library', { query: 'remote', limit: 30 });
    expect(results[0]?.id).toBe('remote');
  });

  it('falls back to in-memory data when Tauri search fails', async () => {
    // @ts-expect-error adding test flag
    window.__TAURI_INTERNALS__ = true;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInvoke.mockRejectedValueOnce(new Error('network down'));

    const results = await searchLibrary('welcome');

    consoleError.mockRestore();
    expect(results.length).toBeGreaterThan(0);
  });

  it('uses Tauri clipboard when available', async () => {
    // @ts-expect-error adding test flag
    window.__TAURI_IPC__ = true;

    await copyToClipboard('hello');

    expect(mockWriteText).toHaveBeenCalledWith('hello');
  });

  it('falls back to browser clipboard outside Tauri', async () => {
    const writeText = vi.fn();
    Object.assign(navigator, {
      clipboard: { writeText }
    });

    await copyToClipboard('hello');

    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('throws when clipboard API is unavailable', async () => {
    // @ts-expect-error remove stub clipboard
    delete navigator.clipboard;

    await expect(copyToClipboard('hello')).rejects.toThrow('Clipboard API unavailable');
  });

  it('reseedLibrary returns fallback counts when not in Tauri', async () => {
    const result = await (await import('./libraryClient')).reseedLibrary();
    expect(result.inserted).toBe(0);
    expect(result.skipped).toBeGreaterThan(0);
  });

  it('reseedLibrary calls Tauri invoke when available', async () => {
    // @ts-expect-error adding test flag
    window.__TAURI_IPC__ = true;
    mockInvoke.mockResolvedValue({ inserted: 1, skipped: 0 });
    const { reseedLibrary } = await import('./libraryClient');

    const result = await reseedLibrary();

    expect(mockInvoke).toHaveBeenCalledWith('reseed_library');
    expect(result.inserted).toBe(1);
  });

  it('syncLibraryFromBackend populates backend cache', async () => {
    // non-Tauri path: no invoke called
    mockApiGet.mockResolvedValue({
      items: [
        {
          id: 'from-api',
          title: 'From API',
          body: 'body',
          item_type: 'prompt',
          tags: ['api'],
          version: 2,
          created_at: new Date(0).toISOString(),
          updated_at: new Date(0).toISOString(),
          source: 'backend'
        }
      ]
    });

    const items = await syncLibraryFromBackend();
    expect(mockApiGet).toHaveBeenCalledWith('/api/v1/prompts/search?limit=500', { token: undefined });
    expect(items[0]?.id).toBe('from-api');

    const results = await searchLibrary('api');
    expect(results.some((item) => item.id === 'from-api')).toBe(true);
  });

  it('syncLibraryFromBackend persists to Tauri DB when available', async () => {
    // @ts-expect-error adding test flag
    window.__TAURI_IPC__ = true;
    mockApiGet.mockResolvedValue({
      items: [
        {
          id: 'persist-api',
          title: 'Persist API',
          body: 'body',
          item_type: 'prompt',
          tags: ['api'],
          version: 2,
          created_at: new Date(0).toISOString(),
          updated_at: new Date(0).toISOString(),
          source: 'backend'
        }
      ]
    });

    await syncLibraryFromBackend();
    expect(mockInvoke).toHaveBeenCalledWith('sync_library_from_backend', {
      items: expect.any(Array)
    });
  });
});
