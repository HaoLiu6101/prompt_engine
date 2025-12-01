import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { copyToClipboard, searchLibrary, syncLibraryFromBackend, type LibraryItem } from '../../services/libraryClient';
import './spotlight-overlay.css';

type SpotlightOverlayProps = {
  open: boolean;
  onClose: () => void;
};

type InsertState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function SpotlightOverlay({ open, onClose }: SpotlightOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const searchTokenRef = useRef(0);
  const initializedRef = useRef(false);
  const [insertState, setInsertState] = useState<InsertState>({ status: 'idle' });
  const [isInserting, setIsInserting] = useState(false);
  const [showCopyFlash, setShowCopyFlash] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LibraryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const handleEscape = useCallback(
    (event: KeyboardEvent | ReactKeyboardEvent<HTMLElement>) => {
      const isEscape = event.key === 'Escape' || event.key === 'Esc' || event.code === 'Escape';
      if (!isEscape) return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    },
    [onClose]
  );

  const selectedItem = useMemo(() => {
    if (!results.length) return null;
    return results.find((item) => item.id === selectedId) ?? results[0];
  }, [results, selectedId]);

  const runSearch = useCallback(
    async (term: string) => {
      const token = ++searchTokenRef.current;
      setIsLoading(true);
      try {
        const items = await searchLibrary(term);
        if (!mountedRef.current || token !== searchTokenRef.current) return;
        setResults(items);
        setSelectedId((current) => {
          if (!items.length) return null;
          if (current && items.some((item) => item.id === current)) return current;
          return items[0].id;
        });
      } catch (error) {
        console.error('[spotlight] search failed', error);
        if (mountedRef.current) {
          setInsertState({
            status: 'error',
            message: 'Search failed, showing cached results.',
          });
        }
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    []
  );

  const handleInsert = useCallback(async () => {
    const item = selectedItem ?? results[0];
    if (!open || isInserting || !item) return;

    setIsInserting(true);
    setInsertState({ status: 'idle', message: `Copying "${item.title}"…` });
    setShowCopyFlash(true);
    setTimeout(() => {
      if (mountedRef.current) setShowCopyFlash(false);
    }, 520);

    try {
      await copyToClipboard(item.body);
      if (mountedRef.current) {
        setInsertState({
          status: 'success',
          message: `Copied "${item.title}" to clipboard. Paste with Cmd+V.`,
        });
      }
      await sleep(360);
      if (mountedRef.current) onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (mountedRef.current) {
        setInsertState({
          status: 'error',
          message: message || 'Unable to copy. Try again.',
        });
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } finally {
      if (mountedRef.current) {
        setIsInserting(false);
      }
    }
  }, [isInserting, onClose, open, results, selectedItem]);

  useEffect(() => {
    if (open) {
      setInsertState({ status: 'idle' });
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      initializedRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const delay = initializedRef.current ? 220 : 0;
    initializedRef.current = true;
    if (delay === 0) {
      runSearch(query);
      return undefined;
    }
    const timer = setTimeout(() => runSearch(query), delay);
    return () => clearTimeout(timer);
  }, [open, query, runSearch]);

  useEffect(() => {
    const resetState = () => setInsertState({ status: 'idle' });
    window.addEventListener('focus', resetState);
    return () => window.removeEventListener('focus', resetState);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const listenerOptions: AddEventListenerOptions = { capture: true };
    window.addEventListener('keydown', handleEscape, listenerOptions);
    window.addEventListener('keyup', handleEscape, listenerOptions);
    return () => {
      window.removeEventListener('keydown', handleEscape, listenerOptions);
      window.removeEventListener('keyup', handleEscape, listenerOptions);
    };
  }, [handleEscape, open]);

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncLibraryFromBackend();
      await runSearch(query);
      setInsertState({ status: 'success', message: 'Library synced.' });
    } catch (error) {
      console.error('[spotlight] sync failed', error);
      setInsertState({ status: 'error', message: 'Sync failed. Using cached items.' });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, query, runSearch]);

  if (!open) return null;

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    const isEnter = event.key === 'Enter' && !event.metaKey && !event.altKey && !event.ctrlKey;
    const isArrowDown = event.key === 'ArrowDown';
    const isArrowUp = event.key === 'ArrowUp';

    if (isEnter) {
      event.preventDefault();
      handleInsert();
      return;
    }

    if (isArrowDown || isArrowUp) {
      event.preventDefault();
      if (!results.length) return;
      const currentIndex = results.findIndex((item) => item.id === (selectedItem?.id ?? ''));
      const nextIndex = isArrowDown
        ? Math.min(results.length - 1, (currentIndex < 0 ? 0 : currentIndex + 1))
        : Math.max(0, (currentIndex < 0 ? 0 : currentIndex - 1));
      setSelectedId(results[nextIndex].id);
    }
  };

  return (
    <div
      className="spotlight-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Prompt spotlight"
      onClick={onClose}
      onKeyDownCapture={handleEscape}
      onKeyUpCapture={handleEscape}
    >
      <div
        className={`spotlight-overlay__card${showCopyFlash ? ' spotlight-overlay__card--flash' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <header className="spotlight-overlay__header">
          <div>
            <p className="spotlight-overlay__eyebrow">Prompt Engine</p>
            <h2 className="spotlight-overlay__title">Spotlight</h2>
            <p className="spotlight-overlay__hint">
              Search your library, preview a prompt, then press Enter to copy and close.
            </p>
          </div>
          <div className="spotlight-overlay__header-actions">
            <span className="spotlight-overlay__pill">Local library</span>
            <button className="spotlight-overlay__close" type="button" onClick={onClose} aria-label="Close">
              Esc
            </button>
          </div>
        </header>

        <div className="spotlight-overlay__search">
          <div className="spotlight-overlay__search-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search prompts, snippets, FAQs…"
              aria-label="Search library"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isInserting}
            />
            {query ? <span className="spotlight-overlay__badge">Enter to copy</span> : <span className="spotlight-overlay__badge">Showing recent</span>}
          </div>
          <div className="spotlight-overlay__search-actions">
            <button
              type="button"
              className="spotlight-overlay__action spotlight-overlay__action--secondary"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing…' : 'Sync'}
            </button>
            <div className="spotlight-overlay__kbd">Cmd+Alt+L</div>
          </div>
        </div>

        <div className="spotlight-overlay__body">
          <div className="spotlight-overlay__results-pane">
            {isLoading && <div className="spotlight-overlay__loading">Searching…</div>}
            {!isLoading && results.length === 0 && (
              <div className="spotlight-overlay__empty">
                <p className="spotlight-overlay__empty-title">No matches yet</p>
                <p className="spotlight-overlay__empty-copy">Try another keyword or reset the query.</p>
              </div>
            )}
            {!isLoading && results.length > 0 && (
              <ul className="spotlight-overlay__list" role="listbox" aria-label="Search results">
                {results.map((item) => {
                  const isActive = selectedItem?.id === item.id;
                  return (
                    <li
                      key={item.id}
                      className={`spotlight-overlay__list-item${isActive ? ' is-active' : ''}`}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div className="spotlight-overlay__list-row">
                        <span className="spotlight-overlay__list-title">{item.title}</span>
                        <span className="spotlight-overlay__pill muted">{item.item_type}</span>
                      </div>
                      <p className="spotlight-overlay__list-snippet">
                        {item.body.slice(0, 160)}
                        {item.body.length > 160 ? '…' : ''}
                      </p>
                      <div className="spotlight-overlay__tags">
                        {item.tags.map((tag) => (
                          <span key={tag} className="spotlight-overlay__tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="spotlight-overlay__preview">
            {selectedItem ? (
              <>
                <div className="spotlight-overlay__preview-header">
                  <div>
                    <p className="spotlight-overlay__eyebrow">Preview</p>
                    <h3 className="spotlight-overlay__preview-title">{selectedItem.title}</h3>
                    <div className="spotlight-overlay__tags">
                      <span className="spotlight-overlay__tag prominent">{selectedItem.item_type}</span>
                      {selectedItem.tags.map((tag) => (
                        <span key={tag} className="spotlight-overlay__tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="spotlight-overlay__action" type="button" onClick={handleInsert} disabled={isInserting}>
                    {isInserting ? 'Copying…' : 'Copy & close'}
                  </button>
                </div>
                <div className="spotlight-overlay__preview-body" aria-label="Prompt body">
                  {selectedItem.body}
                </div>
                {insertState.status === 'error' && (
                  <div className="spotlight-overlay__status spotlight-overlay__status--error" role="alert">
                    {insertState.message}
                  </div>
                )}
                {insertState.status === 'success' && (
                  <div className="spotlight-overlay__status spotlight-overlay__status--success" role="status">
                    {insertState.message}
                  </div>
                )}
              </>
            ) : (
              <div className="spotlight-overlay__empty">
                <p className="spotlight-overlay__empty-title">Select a result to preview</p>
                <p className="spotlight-overlay__empty-copy">Enter copies the highlighted item to your clipboard.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpotlightOverlay;
