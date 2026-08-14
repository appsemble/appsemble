import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { AppAssetDownloadButton } from './index.js';

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

it('should download the original asset for Appsemble asset URLs', async () => {
  const blob = new Blob(['image'], { type: 'image/png' });
  const fetch = vi.fn().mockResolvedValue({
    blob: vi.fn().mockResolvedValue(blob),
    headers: new Headers({ 'Content-Disposition': 'inline; filename="course-image.png"' }),
  });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(vi.fn());
  const createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/course-image');
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

  render(<AppAssetDownloadButton src="/api/apps/1/assets/course-image?width=128&height=128" />);

  await userEvent.click(screen.getByRole('button', { name: 'Download in HD' }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith('/api/apps/1/assets/course-image/download');
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click.mock.calls).toHaveLength(1);
    expect(click.mock.instances[0]).toHaveProperty('download', 'course-image.png');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/course-image');
  });
});

it('should not render for external image URLs', () => {
  render(<AppAssetDownloadButton src="https://example.com/course-image.png" />);

  expect(screen.queryByRole('button', { name: 'Download in HD' })).toBeNull();
});
