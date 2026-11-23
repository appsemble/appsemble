import { type TokenResponse } from '@appsemble/types';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios, { AxiosError, type AxiosResponse } from 'axios';
import { type ReactNode, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { UserProvider, useUser } from './index.js';

const transport = axios.defaults.adapter;
const initialLocks = navigator.locks;
let refreshResponse: Promise<TokenResponse> | undefined;
let finishRefresh: ((response: TokenResponse) => void) | undefined;
let refreshStarted: Promise<void>;
let startRefresh: () => void;
let requests: string[];

function token(expires: number, sub = 'staff'): string {
  return `e30.${btoa(JSON.stringify({ exp: expires, sub }))}.signature`;
}

// Holds each request until the test answers it as the user of the request's access token.
function holdRequests(revokedUser?: string): (() => void)[] {
  const pending: (() => void)[] = [];
  axios.defaults.adapter = (config) =>
    new Promise((resolve, reject) => {
      const { sub } = JSON.parse(atob(String(config.headers.authorization).split('.')[1]));
      const response = {
        data:
          config.url === '/api/users/current'
            ? { sub, email: `${sub}@example.com` }
            : [{ id: sub }],
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
      pending.push(() =>
        sub === revokedUser
          ? reject(
              new AxiosError('Session revoked', 'ERR_BAD_REQUEST', config, undefined, {
                ...response,
                status: 401,
              }),
            )
          : resolve(response),
      );
    });
  return pending;
}

async function respond(pending: (() => void)[]): Promise<void> {
  await act(async () => {
    for (const answer of pending) {
      answer();
    }
    // Let the Studio handle the responses before the test looks at the result.
    await new Promise((resolve) => {
      setTimeout(resolve);
    });
  });
}

function signOutInAnotherTab(): void {
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
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
  const { login, organizations, refreshUserInfo, userInfo } = useUser();
  return (
    <>
      <button onClick={() => refreshUserInfo()} type="button">
        Reload profile
      </button>
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

function Draft(): ReactNode {
  const [value, setValue] = useState('');
  return (
    <input
      aria-label="Unsent message"
      onChange={(event) => setValue(event.currentTarget.value)}
      value={value}
    />
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
  requests = [];
  axios.defaults.adapter = async (config) => {
    requests.push(`${config.method} ${config.url}`);
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
  vi.useRealTimers();
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

it('should keep the session of a login in another tab', async () => {
  localStorage.clear();
  render(
    <>
      <UserProvider>
        <Account name="Second tab" />
      </UserProvider>
      <UserProvider>
        <Account name="Third tab" />
      </UserProvider>
    </>,
  );
  const loginTab = render(
    <UserProvider>
      <Profile />
    </UserProvider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Login' }));
  await screen.findByText('Organizations: 0');
  const signedIn = { ...localStorage };
  loginTab.unmount();
  localStorage.clear();

  // A browser delivers each storage write to the other tabs as a separate storage event.
  for (const [key, newValue] of Object.entries(signedIn)) {
    await act(() => {
      localStorage.setItem(key, newValue);
      window.dispatchEvent(
        new StorageEvent('storage', { key, newValue, storageArea: localStorage }),
      );
    });
  }

  expect(await screen.findAllByText(/: staff@example.com/)).toHaveLength(2);
  expect(requests).not.toContain('post /api/auth/logout');
  expect({ ...localStorage }).toStrictEqual(signedIn);
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

  expect(screen.queryByText(/Organizations:/)).toBeNull();

  await act(() => pending['/api/users/current/organizations']());

  expect(screen.getByRole('status').textContent).toBe('Organizations: 1');
});

it('preserves an unsent form value during a background token refresh', async () => {
  vi.useFakeTimers();
  render(
    <IntlProvider locale="en" messages={{}}>
      <UserProvider>
        <Draft />
      </UserProvider>
    </IntlProvider>,
  );
  await act(() => vi.advanceTimersByTimeAsync(0));
  fireEvent.change(screen.getByRole('textbox', { name: 'Unsent message' }), {
    target: { value: 'Keep this draft' },
  });
  await act(() => vi.advanceTimersByTimeAsync(3_540_000));

  expect(screen.getByRole('textbox', { name: 'Unsent message' })).toHaveProperty(
    'value',
    'Keep this draft',
  );
});

it('should stay signed out when another tab signs out while a login loads the user', async () => {
  localStorage.clear();
  const pending = holdRequests();
  render(
    <UserProvider>
      <Profile />
    </UserProvider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Login' }));
  await waitFor(() => expect(pending).toHaveLength(2));
  act(signOutInAnotherTab);
  await respond(pending);

  expect(screen.getByRole('status').textContent).toBe('Signed out');
});

it('should stay signed out when another tab signs out while the user reloads', async () => {
  localStorage.access_token = token(Math.floor(Date.now() / 1000) + 3600);
  localStorage.refresh_token = 'refresh';
  const pending = holdRequests();
  render(
    <UserProvider>
      <Profile />
    </UserProvider>,
  );
  await waitFor(() => expect(pending).toHaveLength(2));
  await respond(pending.splice(0));
  fireEvent.click(screen.getByRole('button', { name: 'Reload profile' }));
  await waitFor(() => expect(pending).not.toHaveLength(0));
  act(signOutInAnotherTab);
  await respond(pending);

  expect(screen.getByRole('status').textContent).toBe('Signed out');
});

it.each([
  { outcome: 'succeed', revokedUser: undefined },
  { outcome: 'fail', revokedUser: 'old' },
])(
  'should only show the newest user when the requests of an older session $outcome late',
  async ({ revokedUser }) => {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    localStorage.access_token = token(expires, 'old');
    localStorage.refresh_token = 'old';
    const pending = holdRequests(revokedUser);
    render(
      <UserProvider>
        <Account name="Tab" />
      </UserProvider>,
    );
    await waitFor(() => expect(pending).toHaveLength(2));
    act(() => {
      localStorage.access_token = token(expires, 'new');
      localStorage.refresh_token = 'new';
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'access_token', storageArea: localStorage }),
      );
    });
    await waitFor(() => expect(pending).toHaveLength(4));
    // The responses for the older session arrive last.
    await respond(pending.slice(2));
    await respond(pending.slice(0, 2));

    expect(screen.getByText(/^Tab:/).textContent).toBe('Tab: new@example.com');
  },
);
