import { writeText } from '@tauri-apps/api/clipboard';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import './spotlight-overlay.css';

type SpotlightOverlayProps = {
  open: boolean;
  onClose: () => void;
};

type InsertState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

const DEFAULT_PROMPT = 'hello from prompt engine';
const isTauriEnv = () =>
  typeof window !== 'undefined' && (('__TAURI_IPC__' in window) || ('__TAURI_INTERNALS__' in window));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function SpotlightOverlay({ open, onClose }: SpotlightOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const [insertState, setInsertState] = useState<InsertState>({ status: 'idle' });
  const [isInserting, setIsInserting] = useState(false);
  const [showCopyFlash, setShowCopyFlash] = useState(false);

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

      if (import.meta.env.DEV) {
        console.log('[spotlight overlay] escape pressed', {
          key: event.key,
          code: event.code,
          target: (event.target as HTMLElement)?.tagName,
        });
      }

      event.preventDefault();
      event.stopPropagation();
      onClose();
    },
    [onClose]
  );

  const handleInsert = useCallback(async () => {
    if (!open || isInserting) return;

    if (!isTauriEnv()) {
      setInsertState({
        status: 'error',
        message: 'Insert is available in the Prompt Engine desktop app.',
      });
      return;
    }

    setIsInserting(true);
    setInsertState({ status: 'idle', message: 'Copying prompt to clipboard…' });
    setShowCopyFlash(true);
    setTimeout(() => {
      if (mountedRef.current) setShowCopyFlash(false);
    }, 520);

    try {
      await writeText(DEFAULT_PROMPT);
      if (mountedRef.current) {
        setInsertState({
          status: 'success',
          message: 'Copied to clipboard. Press Cmd+V to paste anywhere.',
        });
      }
      await sleep(480);
      if (mountedRef.current) {
        onClose();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (mountedRef.current) {
        setInsertState({
          status: 'error',
          message: message || 'Unable to copy the prompt. Please try again.',
        });
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      return;
    } finally {
      if (mountedRef.current) {
        setIsInserting(false);
      }
    }
  }, [isInserting, onClose, open]);

  useEffect(() => {
    if (open) {
      setInsertState({ status: 'idle' });
      inputRef.current?.focus();
    }
  }, [open]);

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

  if (!open) return null;

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    const isEnter = event.key === 'Enter' && !event.metaKey && !event.altKey && !event.ctrlKey;
    if (!isEnter) return;
    event.preventDefault();
    handleInsert();
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
              Press Enter to copy the default prompt. Paste it anywhere with Cmd+V.
            </p>
          </div>
          <button className="spotlight-overlay__close" type="button" onClick={onClose} aria-label="Close">
            Esc
          </button>
        </header>

        <div className="spotlight-overlay__search">
          <input
            ref={inputRef}
            type="text"
            placeholder="Press Enter to copy the default prompt to your clipboard"
            aria-label="Insert prompt"
            onKeyDown={handleInputKeyDown}
            disabled={isInserting}
          />
          <div className="spotlight-overlay__kbd">Cmd+Alt+L</div>
        </div>
        <p className="spotlight-overlay__input-hint">
          Hit Enter to copy, then paste with Cmd+V in your target app.
        </p>

        <div className="spotlight-overlay__results">
          <div className="spotlight-overlay__empty">
            <p className="spotlight-overlay__empty-title">Insert v0 is ready</p>
            <p className="spotlight-overlay__empty-copy">
              Hit Enter to copy the default prompt to your clipboard, then paste where you need it.
            </p>
            <div className="spotlight-overlay__prompt-preview" aria-label="Default prompt">
              "{DEFAULT_PROMPT}"
            </div>
            <p className="spotlight-overlay__empty-copy">
              After it copies, the spotlight will close automatically so you can paste immediately.
            </p>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpotlightOverlay;
