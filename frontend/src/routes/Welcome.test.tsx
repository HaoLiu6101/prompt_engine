import { render, screen } from '@testing-library/react';
import Welcome from './Welcome';

describe('Welcome', () => {
  it('renders title and actions', () => {
    render(<Welcome />);

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Open desktop client')).toBeInTheDocument();
    expect(screen.getByText('Configure backend')).toBeInTheDocument();
    expect(screen.getByText(/Prompt Engine/)).toBeInTheDocument();
  });
});
