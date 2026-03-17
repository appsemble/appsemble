import { cleanup, render, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useData } from './useData.js';

const { cancelTokenSource, get, isCancel, source } = vi.hoisted(() => ({
  cancelTokenSource: vi.fn(),
  get: vi.fn(),
  isCancel: vi.fn(() => false),
  source: {
    token: 'cancel-token',
    cancel: vi.fn(),
  },
}));

cancelTokenSource.mockImplementation(() => source);

vi.mock('axios', () => ({
  default: {
    CancelToken: {
      source: cancelTokenSource,
    },
    get,
    isCancel,
  },
}));

function TestComponent({ url }: { readonly url: string }): ReactNode {
  useData(url);
  return null;
}

describe('useData', () => {
  beforeEach(() => {
    cancelTokenSource.mockImplementation(() => source);
    get.mockResolvedValue({ data: 'ok' });
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should add the studio access token to internal requests', async () => {
    localStorage.setItem('access_token', 'studio-token');

    render(<TestComponent url="/api/apps/1/members" />);

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));

    expect(get).toHaveBeenCalledWith('/api/apps/1/members', {
      cancelToken: 'cancel-token',
      headers: {
        authorization: 'Bearer studio-token',
      },
    });
  });

  it('should not add the studio access token to external requests', async () => {
    localStorage.setItem('access_token', 'studio-token');

    render(<TestComponent url="http://localhost:9999/api/apps/1/members" />);

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));

    expect(get).toHaveBeenCalledWith('http://localhost:9999/api/apps/1/members', {
      cancelToken: 'cancel-token',
    });
  });
});
