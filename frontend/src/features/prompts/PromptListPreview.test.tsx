import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PromptListPreview from './PromptListPreview';
import { apiClient } from '../../services/apiClient';
import { useSessionStore } from '../../stores/useSessionStore';
import type { PromptSummary } from './types';

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn()
  }
}));

const mockApiGet = vi.mocked(apiClient.get);

describe('PromptListPreview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useSessionStore.setState({ token: null, loginName: '', rememberMe: false });
  });

  it('shows demo prompts when no session token', () => {
    render(<PromptListPreview />);

    expect(screen.getByText('Code Review')).toBeInTheDocument();
    expect(screen.getByText('Data Analysis')).toBeInTheDocument();
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it('fetches prompts when token is present and renders them', async () => {
    const fetched: PromptSummary[] = [
      {
        id: 'fetched-1',
        name: 'Fetched Prompt',
        status: 'approved',
        version: 'v9.9',
        owner: 'API'
      }
    ];
    mockApiGet.mockResolvedValue(fetched);
    useSessionStore.setState({ token: 'abc', loginName: '', rememberMe: false });

    render(<PromptListPreview />);

    expect(screen.getByText('Loading prompts…')).toBeInTheDocument();
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith('/api/v1/prompts'));
    expect(await screen.findByText('Fetched Prompt')).toBeInTheDocument();
    expect(screen.queryByText('Loading prompts…')).not.toBeInTheDocument();
  });
});
