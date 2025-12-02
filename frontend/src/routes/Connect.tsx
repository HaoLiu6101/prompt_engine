import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppConfigStore } from '../stores/useAppConfigStore';
import { useSessionStore } from '../stores/useSessionStore';
import { apiClient } from '../services/apiClient';
import './onboarding.css';

function Connect() {
  const { t } = useTranslation(['connect', 'common']);
  const navigate = useNavigate();
  const { backendUrl, shortcut, setBackendUrl } = useAppConfigStore();
  const { token, loginName, rememberMe, setToken, setLoginName, setRememberMe } = useSessionStore();
  const [backendInput, setBackendInput] = useState(backendUrl);
  const [loginInput, setLoginInput] = useState(loginName);
  const [passwordInput, setPasswordInput] = useState(token ?? '');
  const [error, setError] = useState<string | null>(null);

  const ready = useMemo(() => backendInput.trim().length > 0, [backendInput]);

  useEffect(() => {
    if (backendUrl && token) {
      navigate('/workspace', { replace: true });
    }
  }, [backendUrl, token, navigate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedBackend = backendInput.trim();
    if (!trimmedBackend) {
      setError(t('connect:errors.backendRequired'));
      return;
    }

    setBackendUrl(trimmedBackend);
    apiClient.setBaseUrl(trimmedBackend);

    const normalizedLogin = loginInput.trim();
    const normalizedPassword = passwordInput.trim();
    setLoginName(normalizedLogin);
    setToken(normalizedPassword.length > 0 ? normalizedPassword : null);
    setError(null);
    navigate('/workspace');
  };

  return (
    <div className="onboarding">
      <section className="card onboarding__panel">
        <div className="stack" style={{ gap: 8 }}>
          <p className="eyebrow">{t('connect:eyebrow')}</p>
          <h1 className="onboarding__title">{t('connect:title')}</h1>
          <p className="text-muted">{t('connect:subtitle')}</p>
        </div>

        <form className="stack" style={{ gap: 16 }} onSubmit={handleSubmit}>
          <label className="stack" style={{ gap: 6 }}>
            <span className="label">{t('connect:backendLabel')}</span>
            <input
              type="url"
              value={backendInput}
              onChange={(event) => setBackendInput(event.target.value)}
              placeholder="http://localhost:8000"
              className="input"
              required
            />
            <span className="text-muted helper">{t('connect:backendHint')}</span>
          </label>

          <label className="stack" style={{ gap: 6 }}>
            <span className="label">{t('connect:loginLabel')}</span>
            <input
              type="text"
              value={loginInput}
              onChange={(event) => setLoginInput(event.target.value)}
              placeholder={t('connect:loginPlaceholder')}
              className="input"
              autoComplete="username"
            />
          </label>

          <label className="stack" style={{ gap: 6 }}>
            <span className="label">{t('connect:passwordLabel')}</span>
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder={t('connect:passwordPlaceholder')}
              className="input"
              autoComplete="current-password"
            />
            <span className="text-muted helper">{t('connect:passwordHint')}</span>
          </label>

          <label className="row" style={{ gap: 8 }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span className="text-muted helper">{t('connect:rememberMe')}</span>
          </label>

          {error && <div className="onboarding__error">{error}</div>}

          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div className="text-muted helper">
              {t('connect:shortcutHint', { shortcut })}
            </div>
            <div className="row" style={{ gap: 10 }}>
              <button className="button secondary" type="button" onClick={() => navigate('/settings')}>
                {t('connect:openSettings')}
              </button>
              <button className="button" type="submit" disabled={!ready}>
                {t('connect:continue')}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="card onboarding__aside">
        <div className="stack" style={{ gap: 10 }}>
          <p className="eyebrow">{t('connect:asideTitle')}</p>
          <ul className="onboarding__list">
            <li>{t('connect:asideOne')}</li>
            <li>{t('connect:asideTwo')}</li>
            <li>{t('connect:asideThree')}</li>
          </ul>
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <p className="eyebrow">{t('connect:helperTitle')}</p>
          <p className="text-muted">{t('connect:helperSubtitle')}</p>
          <div className="pill" style={{ alignSelf: 'flex-start' }}>
            {t('connect:helperBadge')}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Connect;
