import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import AppRoutes from './AppRoutes';
import Home from './Home';

describe('AppRoutes', () => {
  it('renders Welcome by default', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Open desktop client')).toBeInTheDocument();
  });

  it('renders PromptCatalog on /prompts', () => {
    render(
      <MemoryRouter initialEntries={['/prompts']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('Prompts')).toBeInTheDocument();
    expect(screen.getByText('New prompt')).toBeInTheDocument();
  });

  it('renders Home on /home', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Prompt Engine')).toBeInTheDocument();
    expect(screen.getByText('Recent prompts')).toBeInTheDocument();
  });
});
