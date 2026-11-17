import { type TokenResponse } from '@appsemble/types';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios, { AxiosError, type AxiosResponse } from 'axios';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { UserProvider, useUser } from './index.js';

const transport = axios.defaults.adapter;
const initialLocks = navigator.locks;
let refreshResponse: Promise<TokenResponse> | undefined;
let finishRefresh: ((response: TokenResponse) => void) | undefined;
let refreshStarted: Promise<void>;
let startRefresh: () => void;

function token(expires: number): string {
  return `e30.${btoa(JSON.stringify({ exp: expires }))}.signature`;
}

function Account({ name }: { readonly name: string }): ReactNode {
  const { userInfo } = useUser();
  return (
    <p>
      {name}: {userInfo ? userInfo.email : 'Signed out'}
    </p>
  );
}

function Profile(): ReactNode {
  const { login, organizations, userInfo } = useUser();
  return (
    <>
      <button
        onClick={() =>
          login({
            access_token: token(Math.floor(Date.now() / 1000) + 3600),
            refresh_token: 'refresh',
            token_type: 'bearer',
          })
        }
        type="button"
      >
        Login
      </button>
      <output>{userInfo ? `Organizations: ${organizations.length}` : 'Signed out'}</output>
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.access_token = token(Math.floor(Date.now() / 1000) - 10);
  localStorage.refresh_token = 'initial-refresh';
  let queue: Promise<unknown> = Promise.resolve();
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request(name: string, callback: (lock: { name: string }) => Promise<void>): Promise<void> {
        const pending = queue.then(() => callback({ name }));
        queue = pending.catch(() => false);
        return pending;
      },
    },
  });
  let currentRefresh = 'initial-refresh';
  let revoked = false;
  refreshResponse = undefined;
  finishRefresh = undefined;
  refreshStarted = new Promise((resolve) => {
    startRefresh = resolve;
  });
  axios.defaults.adapter = async (config) => {
    const response = {
      data: undefined as unknown,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
    if (config.url === '/api/auth/refresh-token') {
      if (refreshResponse) {
        startRefresh();
        response.data = await refreshResponse;
        return response;
      }
      if (JSON.parse(config.data).refresh_token !== currentRefresh) {
        revoked = true;
        throw new AxiosError('Session revoked', 'ERR_BAD_REQUEST', config, undefined, {
          ...response,
          status: 401,
        });
      }
      currentRefresh = 'rotated-refresh';
      response.data = {
        access_token: token(Math.floor(Date.now() / 1000) + 3600),
        refresh_token: currentRefresh,
        token_type: 'bearer',
        expires_in: 3600,
      };
    } else if (config.url === '/api/users/current') {
      if (revoked) {
        throw new AxiosError('Session revoked', 'ERR_BAD_REQUEST', config, undefined, {
          ...response,
          status: 401,
        });
      }
      response.data = { sub: 'staff', email: 'staff@example.com' };
    } else if (config.url === '/api/users/current/organizations') {
      response.data = [];
    }
    return response;
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
  Object.defineProperty(navigator, 'locks', { configurable: true, value: initialLocks });
  localStorage.clear();
});

it('should keep both tabs signed in when a refresh token can only be used once', async () => {
  render(
    <IntlProvider locale="en" messages={{}}>
      <UserProvider>
        <Account name="First tab" />
      </UserProvider>
      <UserProvider>
        <Account name="Second tab" />
      </UserProvider>
    </IntlProvider>,
  );

  await waitFor(() =>
    expect(
      screen.getAllByText(/staff@example.com/).map((element) => element.textContent),
    ).toStrictEqual(['First tab: staff@example.com', 'Second tab: staff@example.com']),
  );
});

it('should refresh the session on an origin without the Web Locks API', async () => {
  Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
  render(
    <IntlProvider locale="en" messages={{}}>
      <UserProvider>
        <Account name="Plain HTTP tab" />
      </UserProvider>
    </IntlProvider>,
  );

  expect(await screen.findByText('Plain HTTP tab: staff@example.com')).toBeDefined();
});

it('should preserve a logout from another tab while a refresh request is in flight', async () => {
  refreshResponse = new Promise((resolve) => {
    finishRefresh = resolve;
  });
  render(
    <IntlProvider locale="en" messages={{}}>
      <UserProvider>
        <Account name="First tab" />
      </UserProvider>
    </IntlProvider>,
  );
  await refreshStarted;
  await act(async () => {
    localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
    finishRefresh({
      access_token: token(Math.floor(Date.now() / 1000) + 3600),
      refresh_token: 'rotated-refresh',
      token_type: 'bearer',
      expires_in: 3600,
    });
    await Promise.resolve();
  });

  expect(screen.getByText('First tab: Signed out')).toBeDefined();
});

it('should not expose the logged in user before their organizations have loaded', async () => {
  localStorage.clear();
  const pending: Record<string, () => void> = {};
  const responses: Record<string, unknown> = {
    '/api/users/current': { sub: 'staff' },
    '/api/users/current/organizations': [{ id: 'staff' }],
  };
  let requestsStarted: () => void;
  const started = new Promise<void>((resolve) => {
    requestsStarted = resolve;
  });
  axios.defaults.adapter = (config) =>
    new Promise<AxiosResponse>((resolve) => {
      pending[config.url] = () =>
        resolve({
          data: responses[config.url],
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
      if (Object.keys(pending).length === 2) {
        requestsStarted();
      }
    });
  render(
    <UserProvider>
      <Profile />
    </UserProvider>,
  );

  fireEvent.click(await screen.findByRole('button', { name: 'Login' }));
  await started;
  await act(() => pending['/api/users/current']());

  expect(screen.getByRole('status').textContent).toBe('Signed out');

  await act(() => pending['/api/users/current/organizations']());

  expect(screen.getByRole('status').textContent).toBe('Organizations: 1');
});
