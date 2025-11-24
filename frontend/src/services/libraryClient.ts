import { writeText } from '@tauri-apps/api/clipboard';
import { invoke } from '@tauri-apps/api/tauri';

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

const fallbackItems: LibraryItem[] = [
  {
    id: 'doc-onboarding',
    title: 'Onboarding Welcome',
    body: 'Welcome new teammates. Outline first-week tasks, key docs, and buddies.',
    item_type: 'note',
    source: 'dummy',
    tags: ['onboarding', 'people'],
    created_at: Date.now() / 1000 - 3600 * 8,
    updated_at: Date.now() / 1000 - 3600 * 8,
    version: 1
  },
  {
    id: 'prompt-code-review',
    title: 'LLM Code Review',
    body: 'You are a senior engineer. Review the following code for correctness, security, and performance. Respond with prioritized issues and concrete fixes.',
    item_type: 'prompt',
    source: 'dummy',
    tags: ['prompt', 'code', 'quality'],
    created_at: Date.now() / 1000 - 3600 * 6,
    updated_at: Date.now() / 1000 - 3600 * 6,
    version: 1
  },
  {
    id: 'prompt-debug',
    title: 'Incident Debug Template',
    body: 'Ask clarifying questions, list likely failure domains, propose a minimal debug plan, and suggest quick mitigations.',
    item_type: 'prompt',
    source: 'dummy',
    tags: ['incident', 'sre'],
    created_at: Date.now() / 1000 - 3600 * 5,
    updated_at: Date.now() / 1000 - 3600 * 5,
    version: 1
  },
  {
    id: 'faq-security',
    title: 'Security FAQ',
    body: 'Data residency: US/EU only. PII policy: no storage in logs. Rotation: API keys rotate every 90 days.',
    item_type: 'faq',
    source: 'dummy',
    tags: ['security', 'policy'],
    created_at: Date.now() / 1000 - 3600 * 4,
    updated_at: Date.now() / 1000 - 3600 * 4,
    version: 1
  },
  {
    id: 'snippet-typescript',
    title: 'TypeScript Error Handler',
    body: "export function handleApiError(err: unknown) { if (err instanceof Error) return err.message; return 'Unexpected error'; }",
    item_type: 'snippet',
    source: 'dummy',
    tags: ['typescript', 'snippet'],
    created_at: Date.now() / 1000 - 3600 * 2,
    updated_at: Date.now() / 1000 - 3600 * 2,
    version: 1
  },
  {
    id: 'prompt-qa',
    title: 'QA Checklist',
    body: 'Generate a QA checklist covering functional, performance, accessibility, and edge cases based on the feature description.',
    item_type: 'prompt',
    source: 'dummy',
    tags: ['qa', 'testing'],
    created_at: Date.now() / 1000 - 3600,
    updated_at: Date.now() / 1000 - 3600,
    version: 1
  }
];

export async function searchLibrary(query: string, limit = 30): Promise<LibraryItem[]> {
  if (isTauriEnv()) {
    try {
      const response = await invoke<LibraryItem[]>('search_library', { query, limit });
      return response;
    } catch (error) {
      console.error('[library] search failed, falling back to in-memory data', error);
    }
  }

  if (!query.trim()) return fallbackItems;

  const lower = query.toLowerCase();
  return fallbackItems.filter(
    (item) =>
      item.title.toLowerCase().includes(lower) ||
      item.body.toLowerCase().includes(lower) ||
      item.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
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
