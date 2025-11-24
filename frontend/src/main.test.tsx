import { describe, expect, it } from 'vitest';

describe('main entrypoint', () => {
  it('renders App into #root without crashing', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    await import('./main');

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.childElementCount).toBeGreaterThan(0);
  });
});
