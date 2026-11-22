import { act, render, screen } from '@testing-library/react';
import axios, { AxiosError, type AxiosAdapter } from 'axios';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { OrganizationSsoCallback } from './index.js';
import { ProtectedRoute } from '../ProtectedRoute/index.js';
import { UserProvider, useUser } from '../UserProvider/index.js';

const transport = axios.defaults.adapter;
let conflict: boolean;
let redirect: string;

beforeEach(() => {
  localStorage.clear();
  conflict = false;
  redirect = '/organizations/example';
  axios.defaults.adapter = (config) => {
    const response = {
      data: undefined as unknown,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
    if (config.url === '/api/organizations/example/sso/callback') {
      if (conflict) {
        return Promise.reject(
          new AxiosError('Existing account', 'ERR_BAD_REQUEST', config, undefined, {
            ...response,
            status: 409,
          }),
        );
      }
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
      response.data = {
        access_token: `e30.${payload}.signature`,
        refresh_token: 'refresh',
        token_type: 'bearer',
        expires_in: 3600,
      };
    } else if (config.url === '/api/users/current') {
      response.data = { sub: 'staff', email: 'staff@example.com' };
    } else if (config.url === '/api/users/current/organizations') {
      response.data = [];
    }
    return Promise.resolve(response);
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
  localStorage.clear();
});

function Account(): ReactNode {
  const { userInfo } = useUser();
  const location = useLocation();
  return (
    <>
      <p>Signed in as {userInfo?.email}</p>
      <p>{`${location.pathname}${location.search}${location.hash}`}</p>
    </>
  );
}

function renderCallback(): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/nl/callback?code=code&state=state']}>
        <UserProvider>
          <Routes>
            <Route
              element={
                <OrganizationSsoCallback
                  session={{
                    id: '',
                    organizationId: 'example',
                    authorizationUrl: 'https://sso.example/authorize',
                    redirect,
                    state: 'state',
                  }}
                />
              }
              path="/:lang/callback"
            />
            <Route element={<Account />} path="/organizations/example" />
            <Route element={<ProtectedRoute />} path="/:lang/private">
              <Route element={<Account />} index />
            </Route>
            <Route element={<p>Sign-in required</p>} path="/:lang/login" />
          </Routes>
        </UserProvider>
      </MemoryRouter>
    </IntlProvider>,
  );
}

it('should establish a Studio session and return to the organization after sign-in', async () => {
  renderCallback();

  expect(await screen.findByText('Signed in as staff@example.com')).toBeDefined();
});

it('waits for the new account access before entering the preserved private destination', async () => {
  redirect = '/en/private?view=details#section';
  const pending: Record<string, () => void> = {};
  const adapter = axios.defaults.adapter as AxiosAdapter;
  let requestsStarted!: () => void;
  const started = new Promise<void>((resolve) => {
    requestsStarted = resolve;
  });
  axios.defaults.adapter = (config) => {
    if (!config.url.startsWith('/api/users/current')) {
      return adapter(config);
    }
    return new Promise((resolve) => {
      pending[config.url] = () => resolve(adapter(config));
      if (Object.keys(pending).length === 2) {
        requestsStarted();
      }
    });
  };
  renderCallback();
  await started;
  await act(() => pending['/api/users/current']());
  expect(screen.queryByText('Signed in as staff@example.com')).toBeNull();
  await act(() => pending['/api/users/current/organizations']());

  expect(await screen.findByText('Signed in as staff@example.com')).toBeDefined();
  expect(screen.getByText('/en/private?view=details#section')).toBeDefined();
});

it('should direct an existing account owner to sign in before linking organization single sign-on', async () => {
  conflict = true;
  renderCallback();

  expect(
    await screen.findByRole('link', { name: 'Sign in to your existing account' }),
  ).toHaveProperty(
    'href',
    'http://localhost/nl/login?personal=1&redirect=%2Fnl%2Flogin%3Forganization%3Dexample%26redirect%3D%252Forganizations%252Fexample',
  );
});

it('should reject a continuation destination outside Studio', async () => {
  redirect = 'https://outside.example/';
  renderCallback();

  expect(
    await screen.findByText('The state parameter is invalid. Please try again.'),
  ).toBeDefined();
});
