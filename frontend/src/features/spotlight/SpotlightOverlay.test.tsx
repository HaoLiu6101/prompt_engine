import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SpotlightOverlay from './SpotlightOverlay';
import { copyToClipboard, searchLibrary, type LibraryItem } from '../../services/libraryClient';

vi.mock('../../services/libraryClient', () => ({
  searchLibrary: vi.fn(),
  copyToClipboard: vi.fn()
}));

const mockItems: LibraryItem[] = [
  {
    id: 'prompt-code-review',
    title: 'LLM Code Review',
    body: 'Review the following code for correctness, security, and performance.',
    item_type: 'prompt',
    source: 'dummy',
    tags: ['prompt', 'code', 'quality'],
    created_at: 0,
    updated_at: 0,
    version: 1
  },
  {
    id: 'faq-security',
    title: 'Security FAQ',
    body: 'Data residency: US/EU only.',
    item_type: 'faq',
    source: 'dummy',
    tags: ['security', 'policy'],
    created_at: 0,
    updated_at: 0,
    version: 1
  }
];

const mockSearchLibrary = vi.mocked(searchLibrary);
const mockCopyToClipboard = vi.mocked(copyToClipboard);

describe('SpotlightOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchLibrary.mockResolvedValue(mockItems);
    mockCopyToClipboard.mockResolvedValue();
  });

  it('renders results and preview when opened', async () => {
    render(<SpotlightOverlay open onClose={() => {}} />);

    expect(await screen.findByRole('heading', { name: 'LLM Code Review' })).toBeInTheDocument();
    expect(screen.getByLabelText('Prompt body')).toHaveTextContent(mockItems[0].body);
    expect(mockSearchLibrary).toHaveBeenCalledWith('');
  });

  it('copies the highlighted item and closes on Enter', async () => {
    const handleClose = vi.fn();
    render(<SpotlightOverlay open onClose={handleClose} />);

    const input = await screen.findByLabelText('Search library');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => expect(mockCopyToClipboard).toHaveBeenCalledWith(mockItems[0].body));
    await waitFor(() => expect(handleClose).toHaveBeenCalled(), { timeout: 750 });
    expect(screen.getByRole('status')).toHaveTextContent(
      `Copied "${mockItems[0].title}" to clipboard. Paste with Cmd+V.`
    );
  });
});
