import { useTranslation } from 'react-i18next';
import PromptListPreview from '../features/prompts/PromptListPreview';
import './home.css';

function Home() {
  const { t } = useTranslation(['home', 'common']);

  return (
    <div className="stack">
      <section className="hero card">
        <div className="stack">
          <p className="eyebrow">{t('home:eyebrow')}</p>
          <h1>{t('home:title')}</h1>
          <p className="text-muted">{t('home:subtitle')}</p>
          <div className="row">
            <button className="button" type="button">
              {t('common:actions.openWorkspace')}
            </button>
            <button className="button secondary" type="button">
              {t('common:actions.configureBackend')}
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="stack" style={{ flex: 1 }}>
            <h2>{t('home:recentTitle')}</h2>
            <p className="text-muted">{t('home:recentSubtitle')}</p>
          </div>
          <div className="text-muted" style={{ fontSize: 14 }}>{t('common:badges.offlineSoon')}</div>
        </div>
        <PromptListPreview />
      </section>
    </div>
  );
}

export default Home;
