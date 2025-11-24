import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../features/spotlight/SpotlightOverlay', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div data-testid="spotlight-stub">Spotlight Open</div> : null)
}));

import App from './App';

describe('App shell', () => {
  it('renders navigation and welcome route by default', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: 'Prompt Engine' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome' })).toBeInTheDocument();
    expect(screen.getByText('Open desktop client')).toBeInTheDocument();
  });

  it('opens spotlight overlay when hotkey is pressed (non-tauri)', async () => {
    render(<App />);

    fireEvent.keyDown(window, { metaKey: true, altKey: true, key: 'l', code: 'KeyL' });

    expect(screen.getByTestId('spotlight-stub')).toBeInTheDocument();
  });
});
