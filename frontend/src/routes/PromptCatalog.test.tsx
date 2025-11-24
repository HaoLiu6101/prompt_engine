import { render, screen } from '@testing-library/react';
import PromptCatalog from './PromptCatalog';

describe('PromptCatalog', () => {
  it('renders header and action button', () => {
    render(<PromptCatalog />);

    expect(screen.getByText('Prompts')).toBeInTheDocument();
    expect(screen.getByText('New prompt')).toBeInTheDocument();
    expect(screen.getByText(/Browse and filter prompt families/i)).toBeInTheDocument();
  });
});
