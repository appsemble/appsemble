import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { CardImage } from './index.js';

let originalCreateObjectURL: typeof URL.createObjectURL | undefined;
let originalFetch: typeof globalThis.fetch | undefined;
let originalRevokeObjectURL: typeof URL.revokeObjectURL | undefined;

beforeEach(() => {
  originalCreateObjectURL = URL.createObjectURL;
  originalFetch = globalThis.fetch;
  originalRevokeObjectURL = URL.revokeObjectURL;
});

afterEach(() => {
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: originalFetch,
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: originalCreateObjectURL,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: originalRevokeObjectURL,
  });

  vi.restoreAllMocks();
});

it('should download original feed images from previews', async () => {
  const blob = new Blob(['image'], { type: 'image/png' });
  const fetch = vi.fn().mockResolvedValue({
    blob: vi.fn().mockResolvedValue(blob),
    headers: new Headers({ 'Content-Disposition': 'inline; filename="feed-image.png"' }),
  });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(vi.fn());
  const createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/feed-image');
  const revokeObjectURL = vi.fn();

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: fetch,
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectURL,
  });

  render(<CardImage alt="Feed image" src="http://localhost/api/apps/1/assets/feed-image" />);

  await userEvent.click(screen.getByRole('button', { name: 'Feed image' }));
  await userEvent.click(screen.getByRole('button', { name: 'Download in HD' }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith('http://localhost/api/apps/1/assets/feed-image/download');
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/feed-image');
  });
});
