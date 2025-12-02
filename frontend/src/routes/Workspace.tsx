import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PromptSummary } from '../features/prompts/types';
import './workspace.css';

const workspacePrompts: PromptSummary[] = [
  {
    id: 'code-review',
    name: 'Code Review Helper',
    status: 'pending_approval',
    version: 'v1.2',
    owner: 'Platform',
  },
  {
    id: 'analysis-lab',
    name: 'Analysis Lab',
    status: 'approved',
    version: 'v2.3',
    owner: 'Data Science',
  },
  {
    id: 'incident-debug',
    name: 'Incident Debug',
    status: 'draft',
    version: 'v0.9',
    owner: 'SRE',
  },
];

function Workspace() {
  const { t } = useTranslation(['workspace', 'common']);
  const [selectedId, setSelectedId] = useState<string>(workspacePrompts[0]?.id ?? '');
  const [draftText, setDraftText] = useState('');
  const [notes, setNotes] = useState('');

  const selectedPrompt = useMemo(
    () => workspacePrompts.find((prompt) => prompt.id === selectedId),
    [selectedId]
  );

  return (
    <div className="workspace">
      <aside className="workspace__sidebar card">
        <div className="workspace__sidebar-header">
          <div>
            <p className="eyebrow">{t('workspace:sidebarTitle')}</p>
            <h2>{t('workspace:title')}</h2>
          </div>
          <button className="button secondary" type="button">
            {t('common:actions.newPrompt')}
          </button>
        </div>

        <input
          type="search"
          className="input"
          placeholder={t('workspace:searchPlaceholder')}
          aria-label={t('workspace:searchPlaceholder')}
        />

        <div className="workspace__list">
          {workspacePrompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              className={`workspace__list-item ${prompt.id === selectedId ? 'active' : ''}`}
              onClick={() => setSelectedId(prompt.id)}
            >
              <div className="workspace__list-title">{prompt.name}</div>
              <div className="workspace__list-meta">
                <span className="pill pill--status">{prompt.status}</span>
                <span className="text-muted">{prompt.owner}</span>
                <span className="text-muted">{prompt.version}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="workspace__main">
        <div className="workspace__header card">
          {selectedPrompt ? (
            <div className="stack">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stack" style={{ gap: 6 }}>
                  <p className="eyebrow">{t('workspace:selectedEyebrow')}</p>
                  <h2 style={{ margin: 0 }}>{selectedPrompt.name}</h2>
                  <div className="row workspace__badges">
                    <span className="pill pill--status">{selectedPrompt.status}</span>
                    <span className="pill">{t('workspace:versionLabel')}: {selectedPrompt.version}</span>
                    <span className="pill">{t('workspace:ownerLabel')}: {selectedPrompt.owner}</span>
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button className="button secondary" type="button">
                    {t('workspace:runSandbox')}
                  </button>
                  <button className="button" type="button">
                    {t('workspace:approvalCta')}
                  </button>
                </div>
              </div>
              <p className="text-muted">{t('workspace:selectedHint')}</p>
            </div>
          ) : (
            <div>{t('workspace:emptySelection')}</div>
          )}
        </div>

        <div className="workspace__grid">
          <div className="card stack workspace__section">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{t('workspace:draftTitle')}</h3>
              <span className="pill">{t('workspace:draftBadge')}</span>
            </div>
            <label className="stack" style={{ gap: 6 }}>
              <span className="label">{t('workspace:bodyLabel')}</span>
              <textarea
                className="input workspace__textarea"
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                placeholder={t('workspace:draftPlaceholder')}
                rows={8}
              />
            </label>
            <label className="stack" style={{ gap: 6 }}>
              <span className="label">{t('workspace:notesLabel')}</span>
              <textarea
                className="input workspace__textarea"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t('workspace:notesPlaceholder')}
                rows={4}
              />
            </label>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="button" type="button">
                {t('workspace:saveDraft')}
              </button>
            </div>
          </div>

          <div className="card stack workspace__section">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{t('workspace:historyTitle')}</h3>
              <span className="text-muted">{t('workspace:historyHint')}</span>
            </div>
            <ul className="workspace__history">
              <li>
                <div className="workspace__history-title">v2.3 — Approved</div>
                <div className="text-muted">Added new evaluation rubric and enforced owner tag.</div>
              </li>
              <li>
                <div className="workspace__history-title">v1.2 — Pending</div>
                <div className="text-muted">Drafting incident checklist tweaks.</div>
              </li>
              <li>
                <div className="workspace__history-title">v1.0 — Approved</div>
                <div className="text-muted">Initial prompt published to workspace.</div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Workspace;
