import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import AppRoutes from './AppRoutes';
import { useAppConfigStore } from '../stores/useAppConfigStore';
import { useSessionStore } from '../stores/useSessionStore';

const defaults = {
  config: useAppConfigStore.getState(),
  session: useSessionStore.getState(),
};

describe('AppRoutes', () => {
  beforeEach(() => {
    useAppConfigStore.setState({
      backendUrl: '',
      shortcut: defaults.config.shortcut,
      autoSync: defaults.config.autoSync,
      offlineMode: defaults.config.offlineMode,
    });
    useSessionStore.setState({ token: null, loginName: '', rememberMe: false });
  });

  it('renders Connect by default', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('Connect to Prompt Engine')).toBeInTheDocument();
    expect(screen.getByText('Continue to workspace')).toBeInTheDocument();
  });

  it('redirects protected routes to onboarding when not configured', () => {
    useAppConfigStore.setState({ backendUrl: '' });
    render(
      <MemoryRouter initialEntries={['/prompts']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('Connect to Prompt Engine')).toBeInTheDocument();
  });

  it('renders workspace when backend and token are present', () => {
    useAppConfigStore.setState({ backendUrl: 'http://api.example.com' });
    useSessionStore.setState({ token: 'abc', loginName: '', rememberMe: false });

    render(
      <MemoryRouter initialEntries={['/workspace']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('Prompt workspace')).toBeInTheDocument();
    expect(screen.getByText('New prompt')).toBeInTheDocument();
  });
});
