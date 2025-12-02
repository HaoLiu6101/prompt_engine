import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SpotlightOverlay from './SpotlightOverlay';
import { searchLibrary, copyToClipboard, type LibraryItem } from '../../services/libraryClient';
import enSpotlight from '../../i18n/locales/en/spotlight.json';

vi.mock('../../services/libraryClient', () => ({
  searchLibrary: vi.fn(),
  copyToClipboard: vi.fn()
}));

const mockItems: LibraryItem[] = [
  {
    id: 'one',
    title: 'First',
    body: 'Body one',
    item_type: 'prompt',
    source: 'dummy',
    tags: ['tag1'],
    created_at: 0,
    updated_at: 0,
    version: 1
  },
  {
    id: 'two',
    title: 'Second',
    body: 'Body two',
    item_type: 'faq',
    source: 'dummy',
    tags: ['tag2'],
    created_at: 0,
    updated_at: 0,
    version: 1
  }
];

const mockSearch = vi.mocked(searchLibrary);
const mockCopy = vi.mocked(copyToClipboard);

describe('SpotlightOverlay interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockResolvedValue(mockItems);
    mockCopy.mockResolvedValue();
  });

  it('navigates list with arrow keys', async () => {
    render(<SpotlightOverlay open onClose={() => {}} />);
    const input = await screen.findByLabelText(enSpotlight.placeholder);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    const options = await screen.findAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('shows empty state when no results', async () => {
    mockSearch.mockResolvedValueOnce([]);
    render(<SpotlightOverlay open onClose={() => {}} />);

    expect(await screen.findByText(enSpotlight.emptyTitle)).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(<SpotlightOverlay open onClose={onClose} />);
    await screen.findByLabelText(enSpotlight.placeholder);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('shows error message when copy fails', async () => {
    const error = new Error('copy failed');
    mockCopy.mockRejectedValueOnce(error);
    render(<SpotlightOverlay open onClose={() => {}} />);
    const input = await screen.findByLabelText(enSpotlight.placeholder);

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    await waitFor(() => screen.getByRole('alert'));

    expect(screen.getByRole('alert')).toHaveTextContent('copy failed');
  });
});
