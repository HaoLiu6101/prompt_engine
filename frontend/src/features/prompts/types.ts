export type PromptStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'deprecated';

export interface PromptSummary {
  id: string;
  name: string;
  status: PromptStatus;
  version: string;
  owner: string;
}
