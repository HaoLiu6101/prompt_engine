import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import RequireConfig from './RequireConfig';
import { useAppConfigStore } from '../stores/useAppConfigStore';
import { useSessionStore } from '../stores/useSessionStore';

const defaults = {
  config: useAppConfigStore.getState(),
  session: useSessionStore.getState(),
};

describe('RequireConfig', () => {
  beforeEach(() => {
    useAppConfigStore.setState({
      backendUrl: defaults.config.backendUrl,
      shortcut: defaults.config.shortcut,
      autoSync: defaults.config.autoSync,
      offlineMode: defaults.config.offlineMode,
    });
    useSessionStore.setState({ token: null, loginName: '', rememberMe: false });
  });

  it('renders protected content when backend and token are present', () => {
    useAppConfigStore.setState({ backendUrl: 'http://api.example.com' });
    useSessionStore.setState({ token: 'abc', loginName: 'user@example.com', rememberMe: true });

    render(
      <MemoryRouter initialEntries={['/workspace']}>
        <Routes>
          <Route
            path="/workspace"
            element={
              <RequireConfig>
                <div>Workspace Content</div>
              </RequireConfig>
            }
          />
          <Route path="/" element={<div>Connect Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Workspace Content')).toBeInTheDocument();
    expect(screen.queryByText('Connect Screen')).not.toBeInTheDocument();
  });

  it('redirects to onboarding when missing configuration', () => {
    useAppConfigStore.setState({ backendUrl: '' });
    render(
      <MemoryRouter initialEntries={['/workspace']}>
        <Routes>
          <Route
            path="/workspace"
            element={
              <RequireConfig>
                <div>Workspace Content</div>
              </RequireConfig>
            }
          />
          <Route path="/" element={<div>Connect Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Connect Screen')).toBeInTheDocument();
    expect(screen.queryByText('Workspace Content')).not.toBeInTheDocument();
  });
});
