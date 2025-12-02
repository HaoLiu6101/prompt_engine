import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n, { type SupportedLanguage } from '../i18n/config';
import TopNav from './TopNav';

async function createTestI18n(language: SupportedLanguage = 'en') {
  const instance = i18n.cloneInstance({ initImmediate: false });
  await instance.init();
  await instance.changeLanguage(language);
  return instance;
}

function renderTopNav(language: SupportedLanguage = 'en') {
  return createTestI18n(language).then((instance) =>
    render(
      <I18nextProvider i18n={instance}>
        <MemoryRouter>
          <TopNav />
        </MemoryRouter>
      </I18nextProvider>
    )
  );
}

describe('TopNav', () => {
  it('renders English labels by default', async () => {
    await renderTopNav();

    expect(screen.getByRole('link', { name: 'Prompt Engine' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Welcome' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prompts' })).toBeInTheDocument();
  });

  it('switches to Chinese when the language toggle is used', async () => {
    const user = userEvent.setup();
    await renderTopNav();

    await user.click(screen.getByRole('button', { name: '中文' }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: '提示词' })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: '欢迎' })).toBeInTheDocument();
  });
});
