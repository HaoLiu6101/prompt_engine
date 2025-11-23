import { useEffect, useState } from 'react';
import { PromptSummary } from './types';
import { useSessionStore } from '../../stores/useSessionStore';
import { apiClient } from '../../services/apiClient';

const demoPrompts: PromptSummary[] = [
  {
    id: 'draft-code-review',
    name: 'Code Review',
    status: 'draft',
    version: 'v1.0',
    owner: 'Platform Team'
  },
  {
    id: 'analysis-lab',
    name: 'Data Analysis',
    status: 'approved',
    version: 'v2.3',
    owner: 'Data Science'
  },
  {
    id: 'sre-debug',
    name: 'Incident Debug Template',
    status: 'approved',
    version: 'v1.4',
    owner: 'SRE'
  }
];

function PromptListPreview() {
  const token = useSessionStore((state) => state.token);
  const [prompts, setPrompts] = useState<PromptSummary[]>(demoPrompts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchPrompts = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get<PromptSummary[]>('/api/v1/prompts');
        setPrompts(response);
      } catch (err) {
        // Keep demo data as fallback for now.
        console.error('Failed to fetch prompts', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, [token]);

  return (
    <div className="stack" style={{ gap: 10 }}>
      {isLoading && <div className="text-muted">Loading prompts…</div>}
      {prompts.map((prompt) => (
        <article key={prompt.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="stack" style={{ gap: 4 }}>
            <div className="row" style={{ gap: 8 }}>
              <strong>{prompt.name}</strong>
              <span className="pill pill--status">{prompt.status}</span>
            </div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              Owner: {prompt.owner} · {prompt.version}
            </div>
          </div>
          <button className="button secondary" type="button">
            Open
          </button>
        </article>
      ))}
    </div>
  );
}

export default PromptListPreview;
