import PromptListPreview from '../features/prompts/PromptListPreview';
import './home.css';

function Home() {
  return (
    <div className="stack">
      <section className="hero card">
        <div className="stack">
          <p className="eyebrow">Internal tooling</p>
          <h1>Prompt Engine</h1>
          <p className="text-muted">
            Manage reusable prompts with approvals, ownership, and analytics. Desktop-first, ready for Codex and MCP integrations.
          </p>
          <div className="row">
            <button className="button" type="button">
              Open prompt workspace
            </button>
            <button className="button secondary" type="button">
              Configure backend
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="stack" style={{ flex: 1 }}>
            <h2>Recent prompts</h2>
            <p className="text-muted">Synced from backend once API wiring lands.</p>
          </div>
          <div className="text-muted" style={{ fontSize: 14 }}>Offline cache coming soon</div>
        </div>
        <PromptListPreview />
      </section>
    </div>
  );
}

export default Home;
