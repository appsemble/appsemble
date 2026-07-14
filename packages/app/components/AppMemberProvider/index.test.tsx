import { act, render, waitFor } from '@testing-library/react';
import { type InternalAxiosRequestConfig } from 'axios';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppMemberProvider, useAppMember } from './index.js';

const { axiosGet, axiosPost, getUri, requestEject, requestUse, setSentryUser } = vi.hoisted(() => ({
  axiosGet: vi.fn(),
  axiosPost: vi.fn(),
  getUri: vi.fn((config: { url?: string }) => config.url ?? ''),
  requestEject: vi.fn(),
  requestUse: vi.fn(),
  setSentryUser: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    defaults: {},
    get: axiosGet,
    post: axiosPost,
    getUri,
    interceptors: {
      request: {
        use: requestUse,
        eject: requestEject,
      },
    },
  },
}));

vi.mock('@sentry/browser', () => ({
  setUser: setSentryUser,
}));

vi.mock('../AppDefinitionProvider/index.js', () => ({
  useAppDefinition: () => ({
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      pages: [],
    },
  }),
}));

let appMember: ReturnType<typeof useAppMember> | undefined;
let requestInterceptor:
  | ((
      config: InternalAxiosRequestConfig,
    ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>)
  | undefined;

let accessToken: string;

function Consumer(): ReactNode {
  appMember = useAppMember();
  return null;
}

function renderProvider(): void {
  render(
    <MemoryRouter>
      <AppMemberProvider>
        <Consumer />
      </AppMemberProvider>
    </MemoryRouter>,
  );
}

function createAccessToken(): string {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 3600,
    scopes: '',
    sub: 'member',
    iss: 'issuer',
  };
  const encodedPayload = btoa(JSON.stringify(payload))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  return `header.${encodedPayload}.signature`;
}

beforeEach(() => {
  vi.clearAllMocks();
  appMember = undefined;
  requestInterceptor = undefined;
  accessToken = createAccessToken();
  requestUse.mockImplementation((interceptor) => {
    requestInterceptor = interceptor;
    return 1;
  });
  axiosPost.mockResolvedValue({ data: { access_token: accessToken } });
  axiosGet.mockResolvedValueOnce({
    data: {
      sub: 'member',
      roles: ['Staff'],
    },
  });
  axiosGet.mockResolvedValueOnce({ data: [] });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppMemberProvider', () => {
  it('should ignore malformed request URLs in the authorization interceptor', async () => {
    renderProvider();

    await waitFor(() => expect(appMember).toBeTruthy());

    await act(async () => {
      await appMember?.passwordLogin({ username: 'test@example.com', password: 'password' });
    });

    await waitFor(() => expect(requestInterceptor).toBeTruthy());

    const emptyUrlConfig = { headers: {}, url: '' } as InternalAxiosRequestConfig;
    expect(requestInterceptor?.(emptyUrlConfig)).toBe(emptyUrlConfig);
    expect(emptyUrlConfig.headers).toStrictEqual({});

    const apiConfig = {
      headers: {},
      url: 'https://appsemble.app/api/apps/42/resources/course/3772',
    } as InternalAxiosRequestConfig;
    expect(requestInterceptor?.(apiConfig)).toBe(apiConfig);
    expect(apiConfig.headers).toStrictEqual({ authorization: `Bearer ${accessToken}` });
  });
});
