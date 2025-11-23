import PromptListPreview from '../features/prompts/PromptListPreview';

function PromptCatalog() {
  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Prompts</h1>
          <p className="text-muted">Browse and filter prompt families. API wiring will connect to backend catalog.</p>
        </div>
        <button className="button" type="button">
          New prompt
        </button>
      </div>
      <PromptListPreview />
    </div>
  );
}

export default PromptCatalog;
