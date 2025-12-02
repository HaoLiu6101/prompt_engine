import i18n, { type Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enNav from './locales/en/nav.json';
import enPrompts from './locales/en/prompts.json';
import enWelcome from './locales/en/welcome.json';
import zhCommon from './locales/zh/common.json';
import zhHome from './locales/zh/home.json';
import zhNav from './locales/zh/nav.json';
import zhPrompts from './locales/zh/prompts.json';
import zhWelcome from './locales/zh/welcome.json';

export type SupportedLanguage = 'en' | 'zh';
export const supportedLanguages: SupportedLanguage[] = ['en', 'zh'];

const resources: Resource = {
  en: {
    common: enCommon,
    nav: enNav,
    welcome: enWelcome,
    home: enHome,
    prompts: enPrompts,
  },
  zh: {
    common: zhCommon,
    nav: zhNav,
    welcome: zhWelcome,
    home: zhHome,
    prompts: zhPrompts,
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      supportedLngs: supportedLanguages,
      defaultNS: 'common',
      ns: ['common', 'nav', 'welcome', 'home', 'prompts'],
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      saveMissing: import.meta.env.DEV,
      missingKeyHandler:
        import.meta.env.DEV && typeof console !== 'undefined'
          ? (languages, namespace, key) => {
              console.warn(`[i18n] missing key "${namespace}:${key}" for languages: ${languages.join(', ')}`);
            }
          : undefined,
    })
    .catch((error) => {
      console.error('[i18n] failed to initialize', error);
    });
}

i18n.on('languageChanged', (language) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
});

export default i18n;
