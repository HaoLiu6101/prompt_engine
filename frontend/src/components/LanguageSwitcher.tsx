import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, type SupportedLanguage } from '../i18n/config';
import './language-switcher.css';

const languageLabels: Record<SupportedLanguage, string> = {
  en: 'EN',
  zh: '中文',
};

function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');
  const activeLanguage = useMemo<SupportedLanguage>(() => {
    const resolved = i18n.resolvedLanguage ?? i18n.language ?? 'en';
    return supportedLanguages.includes(resolved as SupportedLanguage) ? (resolved as SupportedLanguage) : 'en';
  }, [i18n.language, i18n.resolvedLanguage]);

  const handleChangeLanguage = (language: SupportedLanguage) => {
    if (language === activeLanguage) return;
    i18n.changeLanguage(language).catch((error) => {
      if (import.meta.env.DEV) {
        console.error('[i18n] failed to change language', error);
      }
    });
  };

  return (
    <div className="language-switcher" role="group" aria-label={t('language')}>
      {supportedLanguages.map((language) => (
        <button
          key={language}
          type="button"
          className={`language-switcher__button${language === activeLanguage ? ' is-active' : ''}`}
          onClick={() => handleChangeLanguage(language)}
          aria-pressed={language === activeLanguage}
        >
          {languageLabels[language]}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
