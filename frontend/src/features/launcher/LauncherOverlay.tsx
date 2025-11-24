import { useEffect, useRef } from 'react';
import './launcher-overlay.css';

type LauncherOverlayProps = {
  open: boolean;
  onClose: () => void;
};

function LauncherOverlay({ open, onClose }: LauncherOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="launcher-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Prompt launcher"
      onClick={onClose}
    >
      <div className="launcher-overlay__card" onClick={(e) => e.stopPropagation()} role="document">
        <header className="launcher-overlay__header">
          <div>
            <p className="launcher-overlay__eyebrow">Prompt Engine</p>
            <h2 className="launcher-overlay__title">Launcher</h2>
            <p className="launcher-overlay__hint">Type to search prompts. Enter to select.</p>
          </div>
          <button className="launcher-overlay__close" type="button" onClick={onClose} aria-label="Close">
            Esc
          </button>
        </header>

        <div className="launcher-overlay__search">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search prompts…"
            aria-label="Search prompts"
          />
          <div className="launcher-overlay__kbd">Cmd+Alt+L</div>
        </div>

        <div className="launcher-overlay__results">
          <div className="launcher-overlay__empty">
            <p className="launcher-overlay__empty-title">Ready for instant search</p>
            <p className="launcher-overlay__empty-copy">
              Cached prompt results will appear here. Arrow keys to navigate, Enter to pick, Esc to close.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LauncherOverlay;
