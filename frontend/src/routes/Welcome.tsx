import { useTranslation } from 'react-i18next';
import './welcome.css';

function Welcome() {
  const { t } = useTranslation(['welcome', 'common']);

  return (
    <div className="welcome">
      <div className="welcome__glass">
        <p className="welcome__eyebrow">{t('welcome:eyebrow')}</p>
        <h1 className="welcome__title">{t('welcome:title')}</h1>
        <p className="welcome__subtitle">{t('welcome:subtitle')}</p>

        <div className="welcome__actions">
          <button className="button" type="button">
            {t('common:actions.openDesktop')}
          </button>
          <button className="button secondary" type="button">
            {t('common:actions.configureBackend')}
          </button>
        </div>

        <div className="welcome__meta">
          <span>{t('common:platformMac')}</span>
          <span>{t('common:buildDev')}</span>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
