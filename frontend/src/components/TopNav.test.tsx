import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopNav from './TopNav';

describe('TopNav', () => {
  it('renders links and highlights active route', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <TopNav />
      </MemoryRouter>
    );

    expect(screen.getByText('Prompt Engine')).toBeInTheDocument();
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Home')).toHaveClass('active');
    expect(screen.getByText('Prompts')).not.toHaveClass('active');
  });

  it('navigates when clicking links', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopNav />
      </MemoryRouter>
    );

    await user.click(screen.getByText('Prompts'));
    expect(screen.getByText('Prompts')).toHaveAttribute('href', '/prompts');
  });
});
