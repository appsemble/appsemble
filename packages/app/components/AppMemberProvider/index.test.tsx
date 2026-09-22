import { act, render, waitFor } from '@testing-library/react';
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { type ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppMemberProvider, useAppMember } from './index.js';

const { axiosGet, axiosPost, definitionSecurity, getUri, requestEject, requestUse, setSentryUser } =
  vi.hoisted(() => ({
    axiosGet: vi.fn(),
    axiosPost: vi.fn(),
    definitionSecurity: { value: undefined as Record<string, unknown> | undefined },
    getUri: vi.fn((config: { url?: string }) => config.url ?? ''),
    requestEject: vi.fn(),
    requestUse: vi.fn(),
    setSentryUser: vi.fn(),
  }));

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();

  return {
    ...actual,
    default: {
      defaults: {},
      get: axiosGet,
      post: axiosPost,
      getUri,
      isAxiosError: actual.default.isAxiosError,
      interceptors: {
        request: {
          use: requestUse,
          eject: requestEject,
        },
      },
    },
  };
});

vi.mock('@sentry/browser', () => ({
  setUser: setSentryUser,
}));

vi.mock('../AppDefinitionProvider/index.js', () => ({
  useAppDefinition: () => ({
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      pages: [],
      security: definitionSecurity.value,
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
let location: ReturnType<typeof useLocation> | undefined;

function Consumer(): ReactNode {
  appMember = useAppMember();
  location = useLocation();
  return null;
}

function renderProvider(initialEntry = '/en/Home'): void {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          element={
            <AppMemberProvider>
              <Consumer />
            </AppMemberProvider>
          }
          path="/:lang/*"
        />
      </Routes>
    </MemoryRouter>,
  );
}

function createTotpChallenge(): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = {
    config,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    data: { error: 'totp_required', totp_enabled: true, totp_token: 'pending' },
    headers: {},
    status: 400,
    statusText: '',
  } as AxiosResponse;
  return new AxiosError('Request failed', '400', config as never, null, response);
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
  location = undefined;
  requestInterceptor = undefined;
  definitionSecurity.value = undefined;
  accessToken = createAccessToken();
  requestUse.mockImplementation((interceptor) => {
    requestInterceptor = interceptor;
    return 1;
  });
  axiosPost.mockResolvedValue({ data: { access_token: accessToken } });
  axiosGet.mockImplementation((url: string) =>
    Promise.resolve(
      url.endsWith('/groups')
        ? { data: [] }
        : {
            data: {
              sub: 'member',
              roles: ['Staff'],
            },
          },
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppMemberProvider', () => {
  it('should remain logged out while the server revokes the session', async () => {
    definitionSecurity.value = {};
    let resolveLogout: () => void;
    const logoutResponse = new Promise<{ data: object }>((resolve) => {
      resolveLogout = () => resolve({ data: {} });
    });
    axiosPost.mockImplementation((...args: [string, URLSearchParams]) => {
      const data = args[1];
      const grantType = data.get('grant_type');
      if (grantType === 'revoke_token') {
        return logoutResponse;
      }
      return Promise.resolve({ data: { access_token: accessToken } });
    });

    renderProvider();
    await waitFor(() => expect(appMember?.isLoggedIn).toBe(true));

    let logoutPromise: Promise<void> | undefined;
    await act(async () => {
      logoutPromise = appMember?.logout();
      await Promise.resolve();
    });

    expect(appMember?.isLoggedIn).toBe(false);
    resolveLogout!();
    await logoutPromise;
    expect(appMember?.isLoggedIn).toBe(false);
  });

  it('should move a TOTP challenged login started from the register page to the login page', async () => {
    axiosPost.mockRejectedValue(createTotpChallenge());
    renderProvider('/en/Register?redirect=%2Fen%2FSecret');

    await waitFor(() => expect(appMember).toBeTruthy());

    await act(async () => {
      await appMember?.passwordLogin({
        username: 'test@example.com',
        password: 'password',
        redirect: '/en/Secret',
      });
    });

    // The second factor is only rendered on the login page, which keeps the page the login was
    // started for.
    expect(location).toMatchObject({ pathname: '/en/Login', search: '?redirect=%2Fen%2FSecret' });
    expect(appMember?.totpPending).toMatchObject({ redirect: '/en/Secret', totpToken: 'pending' });
  });

  it('should move a TOTP challenged login started by an action to the login page', async () => {
    axiosPost.mockRejectedValue(createTotpChallenge());
    renderProvider('/en/Home');

    await waitFor(() => expect(appMember).toBeTruthy());

    await act(async () => {
      await appMember?.passwordLogin({ username: 'test@example.com', password: 'password' });
    });

    expect(location).toMatchObject({ pathname: '/en/Login', search: '' });
    expect(appMember?.totpPending).toMatchObject({ totpToken: 'pending' });
  });

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
