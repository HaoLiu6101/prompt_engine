import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppConfigStore } from '../stores/useAppConfigStore';
import { useSessionStore } from '../stores/useSessionStore';
import { apiClient } from '../services/apiClient';
import './settings.css';

function Settings() {
  const { t } = useTranslation(['settings', 'common']);
  const { backendUrl, shortcut, autoSync, offlineMode, setBackendUrl, setShortcut, setAutoSync, setOfflineMode } =
    useAppConfigStore();
  const { token, setToken, clearSession } = useSessionStore();

  const [backendInput, setBackendInput] = useState(backendUrl);
  const [tokenInput, setTokenInput] = useState(token ?? '');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextBackend = backendInput.trim();
    setBackendUrl(nextBackend);
    apiClient.setBaseUrl(nextBackend);

    const normalizedToken = tokenInput.trim();
    setToken(normalizedToken.length > 0 ? normalizedToken : null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings">
      <div className="stack" style={{ gap: 6 }}>
        <p className="eyebrow">{t('settings:eyebrow')}</p>
        <h1>{t('settings:title')}</h1>
        <p className="text-muted">{t('settings:subtitle')}</p>
      </div>

      <form className="settings__grid" onSubmit={handleSubmit}>
        <section className="card stack settings__section">
          <h2>{t('settings:backendTitle')}</h2>
          <label className="stack" style={{ gap: 6 }}>
            <span className="label">{t('settings:backendLabel')}</span>
            <input
              className="input"
              type="url"
              value={backendInput}
              onChange={(event) => setBackendInput(event.target.value)}
              placeholder="http://localhost:8000"
              required
            />
            <span className="text-muted helper">{t('settings:backendHint')}</span>
          </label>

          <label className="stack" style={{ gap: 6 }}>
            <span className="label">{t('settings:tokenLabel')}</span>
            <input
              className="input"
              type="text"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder={t('settings:tokenPlaceholder')}
            />
            <span className="text-muted helper">{t('settings:tokenHint')}</span>
          </label>

          <div className="row" style={{ gap: 10 }}>
            <button className="button" type="submit">
              {saved ? t('settings:saved') : t('settings:save')}
            </button>
            <button className="button secondary" type="button" onClick={() => clearSession()}>
              {t('settings:clearSession')}
            </button>
          </div>
        </section>

        <section className="card stack settings__section">
          <h2>{t('settings:shortcutsTitle')}</h2>
          <label className="stack" style={{ gap: 6 }}>
            <span className="label">{t('settings:shortcutLabel')}</span>
            <input
              className="input"
              type="text"
              value={shortcut}
              onChange={(event) => setShortcut(event.target.value)}
              placeholder="Cmd+Option+L"
            />
            <span className="text-muted helper">{t('settings:shortcutHint')}</span>
          </label>

          <div className="stack" style={{ gap: 12 }}>
            <label className="row settings__checkbox">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(event) => setAutoSync(event.target.checked)}
              />
              <div className="stack" style={{ gap: 4 }}>
                <strong>{t('settings:autoSyncLabel')}</strong>
                <span className="text-muted helper">{t('settings:autoSyncHint')}</span>
              </div>
            </label>

            <label className="row settings__checkbox">
              <input
                type="checkbox"
                checked={offlineMode}
                onChange={(event) => setOfflineMode(event.target.checked)}
              />
              <div className="stack" style={{ gap: 4 }}>
                <strong>{t('settings:offlineLabel')}</strong>
                <span className="text-muted helper">{t('settings:offlineHint')}</span>
              </div>
            </label>
          </div>
        </section>
      </form>
    </div>
  );
}

export default Settings;
