import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Connect from './Connect';

describe('Connect', () => {
  it('renders connect form and actions', () => {
    render(
      <MemoryRouter>
        <Connect />
      </MemoryRouter>
    );

    expect(screen.getByText('Connect to Prompt Engine')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('http://localhost:8000')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste a personal token or password')).toBeInTheDocument();
    expect(screen.getByText('Continue to workspace')).toBeInTheDocument();
  });
});
