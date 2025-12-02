import '@testing-library/jest-dom/vitest';
import i18n from '../i18n/config';

// Provide a minimal matchMedia stub for components that might query it during tests.
if (!window.matchMedia) {
  window.matchMedia = () =>
    ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    } as MediaQueryList);
}

beforeAll(async () => {
  await i18n.changeLanguage('en');
});
