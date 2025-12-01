import { writeText } from '@tauri-apps/api/clipboard';
import { invoke } from '@tauri-apps/api/tauri';
import { apiClient } from './apiClient';

export type LibraryItem = {
  id: string;
  title: string;
  body: string;
  item_type: string;
  source: string;
  tags: string[];
  created_at: number;
  updated_at: number;
  version: number;
};

export type SeedResult = {
  inserted: number;
  skipped: number;
};

const isTauriEnv = () =>
  typeof window !== 'undefined' && (('__TAURI_IPC__' in window) || ('__TAURI_INTERNALS__' in window));

const baseTs = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 3; // 3 days ago to avoid beating fresh DB items
let backendCache: LibraryItem[] = [];

const fallbackItems: LibraryItem[] = [
  {
    id: 'doc-onboarding',
    title: 'Onboarding Welcome',
    body: 'Welcome new teammates. Outline first-week tasks, key docs, and buddies.',
    item_type: 'note',
    source: 'dummy',
    tags: ['onboarding', 'people'],
    created_at: baseTs - 3600 * 8,
    updated_at: baseTs - 3600 * 8,
    version: 1
  },
  {
    id: 'prompt-code-review',
    title: 'LLM Code Review',
    body: 'You are a senior engineer. Review the following code for correctness, security, and performance. Respond with prioritized issues and concrete fixes.',
    item_type: 'prompt',
    source: 'dummy',
    tags: ['prompt', 'code', 'quality'],
    created_at: baseTs - 3600 * 6,
    updated_at: baseTs - 3600 * 6,
    version: 1
  },
  {
    id: 'prompt-debug',
    title: 'Incident Debug Template',
    body: 'Ask clarifying questions, list likely failure domains, propose a minimal debug plan, and suggest quick mitigations.',
    item_type: 'prompt',
    source: 'dummy',
    tags: ['incident', 'sre'],
    created_at: baseTs - 3600 * 5,
    updated_at: baseTs - 3600 * 5,
    version: 1
  },
  {
    id: 'faq-security',
    title: 'Security FAQ',
    body: 'Data residency: US/EU only. PII policy: no storage in logs. Rotation: API keys rotate every 90 days.',
    item_type: 'faq',
    source: 'dummy',
    tags: ['security', 'policy'],
    created_at: baseTs - 3600 * 4,
    updated_at: baseTs - 3600 * 4,
    version: 1
  },
  {
    id: 'snippet-typescript',
    title: 'TypeScript Error Handler',
    body: "export function handleApiError(err: unknown) { if (err instanceof Error) return err.message; return 'Unexpected error'; }",
    item_type: 'snippet',
    source: 'dummy',
    tags: ['typescript', 'snippet'],
    created_at: baseTs - 3600 * 2,
    updated_at: baseTs - 3600 * 2,
    version: 1
  },
  {
    id: 'prompt-qa',
    title: 'QA Checklist',
    body: 'Generate a QA checklist covering functional, performance, accessibility, and edge cases based on the feature description.',
    item_type: 'prompt',
    source: 'dummy',
    tags: ['qa', 'testing'],
    created_at: baseTs - 3600,
    updated_at: baseTs - 3600,
    version: 1
  }
];

export async function searchLibrary(query: string, limit = 30): Promise<LibraryItem[]> {
  const mergeWithFallback = (primary: LibraryItem[], term: string) => {
    const fallbackMatches = filterFallback(term);
    const backendMatches = filterBackendCache(term);
    const seen = new Set<string>();
    const merged: LibraryItem[] = [];

    [...primary, ...backendMatches, ...fallbackMatches].forEach((item) => {
      if (seen.has(item.id)) return;
      seen.add(item.id);
      merged.push(item);
    });

    const scoredWithFilter = merged
      .map((item) => ({ item, score: scoreItem(item, term) }))
      .filter((entry) => (term.trim() ? entry.score > 0 : true))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.item.updated_at ?? 0) - (a.item.updated_at ?? 0);
      })
      .map((entry) => entry.item);

    return scoredWithFilter.slice(0, limit);
  };

  if (isTauriEnv()) {
    try {
      const response = await invoke<LibraryItem[]>('search_library', { query, limit });
      return mergeWithFallback(response, query);
    } catch (error) {
      console.error('[library] search failed, falling back to in-memory data', error);
    }
  }

  return mergeWithFallback([], query);
}

export async function syncLibraryFromBackend(token?: string): Promise<LibraryItem[]> {
  try {
    const items = await apiClient.get<{
      items: Array<{
        id: string;
        title: string;
        body: string;
        item_type: string;
        tags: string[];
        version: number;
        created_at: string;
        updated_at: string;
        source?: string;
      }>;
    }>('/api/v1/prompts/search?limit=500', { token });

    const mapped = items.items.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      item_type: item.item_type,
      source: item.source ?? 'backend',
      tags: item.tags ?? [],
      version: item.version ?? 1,
      created_at: Math.floor(new Date(item.created_at).getTime() / 1000),
      updated_at: Math.floor(new Date(item.updated_at).getTime() / 1000)
    }));

    backendCache = mapped;

    if (isTauriEnv()) {
      try {
        await invoke('sync_library_from_backend', { items: mapped });
      } catch (error) {
        console.error('[library] failed to persist backend sync to local DB', error);
      }
    }

    return mapped;
  } catch (error) {
    console.error('[library] backend sync failed', error);
    throw error;
  }
}

export async function reseedLibrary(): Promise<SeedResult> {
  if (isTauriEnv()) {
    try {
      return await invoke<SeedResult>('reseed_library');
    } catch (error) {
      console.error('[library] reseed failed', error);
    }
  }
  return { inserted: 0, skipped: fallbackItems.length };
}

export async function copyToClipboard(text: string): Promise<void> {
  if (isTauriEnv()) {
    await writeText(text);
    return;
  }

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    throw new Error('Clipboard API unavailable');
  }
}

export { isTauriEnv };

function filterFallback(query: string) {
  if (!query.trim()) return fallbackItems;

  const lower = query.toLowerCase();
  return fallbackItems.filter(
    (item) =>
      item.title.toLowerCase().includes(lower) ||
      item.body.toLowerCase().includes(lower) ||
      item.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
}

function filterBackendCache(query: string) {
  if (!query.trim()) return backendCache;

  const lower = query.toLowerCase();
  return backendCache.filter(
    (item) =>
      item.title.toLowerCase().includes(lower) ||
      item.body.toLowerCase().includes(lower) ||
      item.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
}

function scoreItem(item: LibraryItem, term: string) {
  if (!term.trim()) {
    // No query: prefer recency but give DB items (often newer) higher priority naturally.
    return 0;
  }

  const lower = term.toLowerCase();
  const titleHit = item.title.toLowerCase().includes(lower) ? 3 : 0;
  const tagHit = item.tags.some((tag) => tag.toLowerCase().includes(lower)) ? 2 : 0;
  const bodyHit = item.body.toLowerCase().includes(lower) ? 1 : 0;

  return titleHit + tagHit + bodyHit;
}
