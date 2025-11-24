import { render, screen } from '@testing-library/react';
import Home from './Home';

describe('Home', () => {
  it('renders hero and recent prompts section', () => {
    render(<Home />);

    expect(screen.getByText('Prompt Engine')).toBeInTheDocument();
    expect(screen.getByText('Recent prompts')).toBeInTheDocument();
    expect(screen.getByText('Open prompt workspace')).toBeInTheDocument();
  });
});
