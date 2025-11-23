import './launcher.css';

function Launcher() {
  return (
    <div className="launcher">
      <div className="launcher__glass">
        <p className="launcher__eyebrow">Prompt Engine</p>
        <h1 className="launcher__title">Workspace Launcher</h1>
        <p className="launcher__subtitle">
          Start the desktop client, connect to backend, and jump into your prompt library.
        </p>

        <div className="launcher__actions">
          <button className="button" type="button">
            Launch client
          </button>
          <button className="button secondary" type="button">
            Configure backend
          </button>
        </div>

        <div className="launcher__meta">
          <span>Platform: macOS</span>
          <span>Build: dev preview</span>
        </div>
      </div>
    </div>
  );
}

export default Launcher;
