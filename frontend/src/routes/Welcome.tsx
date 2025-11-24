import './welcome.css';

function Welcome() {
  return (
    <div className="welcome">
      <div className="welcome__glass">
        <p className="welcome__eyebrow">Prompt Engine</p>
        <h1 className="welcome__title">Welcome</h1>
        <p className="welcome__subtitle">
          Start the desktop client, connect to backend, and jump into your prompt library.
        </p>

        <div className="welcome__actions">
          <button className="button" type="button">
            Open desktop client
          </button>
          <button className="button secondary" type="button">
            Configure backend
          </button>
        </div>

        <div className="welcome__meta">
          <span>Platform: macOS</span>
          <span>Build: dev preview</span>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
