import { useCallback, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import './spotlight-overlay.css';

type SpotlightOverlayProps = {
  open: boolean;
  onClose: () => void;
};

function SpotlightOverlay({ open, onClose }: SpotlightOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

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
      <div className="spotlight-overlay__card" onClick={(e) => e.stopPropagation()} role="document">
        <header className="spotlight-overlay__header">
          <div>
            <p className="spotlight-overlay__eyebrow">Prompt Engine</p>
            <h2 className="spotlight-overlay__title">Spotlight</h2>
            <p className="spotlight-overlay__hint">Type to search prompts. Enter to select.</p>
          </div>
          <button className="spotlight-overlay__close" type="button" onClick={onClose} aria-label="Close">
            Esc
          </button>
        </header>

        <div className="spotlight-overlay__search">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search prompts…"
            aria-label="Search prompts"
          />
          <div className="spotlight-overlay__kbd">Cmd+Alt+L</div>
        </div>

        <div className="spotlight-overlay__results">
          <div className="spotlight-overlay__empty">
            <p className="spotlight-overlay__empty-title">Ready for instant search</p>
            <p className="spotlight-overlay__empty-copy">
              Cached prompt results will appear here. Arrow keys to navigate, Enter to pick, Esc to close.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpotlightOverlay;
