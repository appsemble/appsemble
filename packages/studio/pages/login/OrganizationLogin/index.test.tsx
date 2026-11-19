import { storageKey } from '@appsemble/web-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import axios, { AxiosError } from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { UserProvider } from '../../../components/UserProvider/index.js';
import { LoginPage } from '../index.js';

vi.hoisted(() => {
  window.settings = {
    enableRegistration: true,
    logins: [
      {
        name: 'GitLab',
        authorizationUrl: 'https://gitlab.com/oauth/authorize',
        clientId: 'gitlab-client',
        scope: 'openid',
        icon: 'gitlab',
      },
      {
        name: 'Google',
        authorizationUrl: 'https://accounts.google.com/authorize',
        clientId: 'google-client',
        scope: 'openid',
        icon: 'google',
      },
    ],
    sentryDsn: '',
    sentryEnvironment: '',
  };
});

const transport = axios.defaults.adapter;
let policy: 'optional' | 'required' | 'required-with-guests';
let discoveryFailure: boolean;
let startFailure: boolean;
let configuredSso: boolean;
let discoveryPending: Promise<void> | undefined;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  policy = 'required';
  discoveryFailure = false;
  startFailure = false;
  configuredSso = true;
  discoveryPending = undefined;
  axios.defaults.adapter = async (config) => {
    const body = config.data ? (JSON.parse(config.data) as Record<string, string>) : {};
    const response = { data: {} as unknown, status: 200, statusText: 'OK', headers: {}, config };
    if (config.url === '/api/auth/email/discover') {
      await discoveryPending;
      if (discoveryFailure) {
        throw new AxiosError('Unavailable', 'ERR_NETWORK', config);
      }
      response.data = {
        organizations: body.email.endsWith('@staff.example')
          ? [{ id: 'staff', name: 'Staff', ssoName: 'Staff SSO' }]
          : body.email.endsWith('@shared.example')
            ? [
                { id: 'staff', name: 'Staff', ssoName: 'Staff SSO' },
                { id: 'partners', name: 'Partners', ssoName: 'Partner SSO' },
              ]
            : [],
      };
    } else if (config.url === '/api/auth/email/login') {
      response.data = {
        access_token: `e30.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`,
        refresh_token: 'refresh',
      };
    } else if (config.url === '/api/users/current') {
      response.data = { sub: 'owner', email: 'owner@example.com' };
    } else if (config.url === '/api/users/current/organizations') {
      response.data = [];
    } else if (config.method === 'post' && config.url.endsWith('/sso/login')) {
      if (startFailure) {
        throw new AxiosError('Unavailable', 'ERR_BAD_RESPONSE', config, undefined, {
          ...response,
          status: 502,
        });
      }
      response.data = { authorizationUrl: 'https://identity.example/authorize?state=state' };
    } else if (config.url.endsWith('/sso/login')) {
      if (!configuredSso) {
        throw new AxiosError('Not found', 'ERR_BAD_REQUEST', config, undefined, {
          ...response,
          status: 404,
        });
      }
      response.data = {
        name: 'Staff SSO',
        policy,
        allowedLoginMethods: ['oidc', 'password', 'gitlab'],
      };
    }
    return response;
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
  localStorage.clear();
  sessionStorage.clear();
});

function renderLogin(initialEntry = '/login'): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <UserProvider>
          <Routes>
            <Route element={<LoginPage />} path="/login" />
            <Route element={<LoginPage />} path="/:lang/login" />
            <Route element={<p>Returned to destination</p>} path="/destination" />
          </Routes>
        </UserProvider>
      </MemoryRouter>
    </IntlProvider>,
  );
}

async function continueWithEmail(email: string): Promise<void> {
  fireEvent.change(await screen.findByRole('textbox', { name: 'Email' }), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
}

it('starts with email and offers personal and social sign-in through Other sign-in options', async () => {
  renderLogin();
  expect(await screen.findByRole('textbox', { name: 'Email' })).toBeDefined();
  expect(screen.queryByLabelText('Password')).toBeNull();
  const options = screen.getByRole('button', { name: 'Other sign-in options' });
  expect(options.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('button', { name: 'Login with GitLab' })).toBeNull();
  fireEvent.click(options);
  expect(options.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole('button', { name: 'Sign in with password' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'Login with GitLab' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'Login with Google' })).toBeDefined();
});

it('offers password sign-in for an unknown domain and preserves the destination and recovery context', async () => {
  const search = '?redirect=%2Fdestination&token=invite';
  renderLogin(`/login${search}`);
  await continueWithEmail('personal@example.com');
  const password = await screen.findByLabelText('Password');
  expect(document.activeElement).toBe(password);
  expect(screen.getByRole('textbox', { name: 'Email' })).toHaveProperty(
    'value',
    'personal@example.com',
  );
  expect(screen.getByRole('link', { name: 'Forgot your password?' })).toHaveProperty(
    'href',
    `http://localhost/reset-password${search}`,
  );
  expect(screen.getByRole('link', { name: 'Register a new account' })).toHaveProperty(
    'href',
    `http://localhost/register${search}`,
  );
  fireEvent.change(password, { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));
  expect(await screen.findByText('Returned to destination')).toBeDefined();
});

it('starts the matched organization SSO without another sign-in click and preserves the destination', async () => {
  renderLogin(`/login?${new URLSearchParams({ redirect: '/destination' })}`);
  await continueWithEmail('staff@staff.example');
  await vi.waitFor(() => {
    expect(JSON.parse(sessionStorage.getItem(storageKey)!)).toMatchObject({
      organizationId: 'staff',
      redirect: '/destination',
      state: 'state',
    });
  });
});

it('asks the user to choose between shared-domain matches', async () => {
  renderLogin();
  await continueWithEmail('person@shared.example');
  const heading = await screen.findByRole('heading', { name: 'Choose your organization' });
  expect(document.activeElement).toBe(heading);
  expect(sessionStorage.getItem(storageKey)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Partners (Partner SSO)' }));
  await vi.waitFor(() => {
    expect(JSON.parse(sessionStorage.getItem(storageKey)!)).toMatchObject({
      organizationId: 'partners',
    });
  });
});

it('returns keyboard focus to email when leaving the organization chooser', async () => {
  renderLogin();
  await continueWithEmail('person@shared.example');
  await screen.findByRole('heading', { name: 'Choose your organization' });
  fireEvent.click(screen.getByRole('button', { name: 'Change email' }));
  expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Email' }));
});

it('starts organization single sign-on with one click in organization context', async () => {
  policy = 'optional';
  renderLogin(
    `/login?${new URLSearchParams({ organization: 'example', redirect: '/destination' })}`,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Login with Staff SSO' }));
  await vi.waitFor(() => {
    expect(JSON.parse(sessionStorage.getItem(storageKey)!)).toMatchObject({
      organizationId: 'example',
      redirect: '/destination',
    });
  });
});

it('offers password sign-in in organization context for an unclaimed email domain', async () => {
  policy = 'optional';
  renderLogin('/login?organization=example');
  await continueWithEmail('personal@example.com');
  expect(await screen.findByLabelText('Password')).toBeDefined();
  expect(sessionStorage.getItem(storageKey)).toBeNull();
});

it('starts the organization that claims the email domain instead of the context organization', async () => {
  policy = 'optional';
  renderLogin('/login?organization=example');
  await continueWithEmail('staff@staff.example');
  await vi.waitFor(() => {
    expect(JSON.parse(sessionStorage.getItem(storageKey)!)).toMatchObject({
      organizationId: 'staff',
    });
  });
});

it('starts a discovered organization again after changing the email', async () => {
  policy = 'optional';
  startFailure = true;
  renderLogin('/login?organization=example');
  await continueWithEmail('staff@staff.example');
  await screen.findByText('Unable to start organization sign-in. Please try again.');
  startFailure = false;
  fireEvent.click(screen.getByRole('button', { name: 'Change email' }));
  await continueWithEmail('staff@staff.example');
  await vi.waitFor(() => {
    expect(JSON.parse(sessionStorage.getItem(storageKey)!)).toMatchObject({
      organizationId: 'staff',
    });
  });
});

it('offers only organization single sign-on and an existing account link when it is required', async () => {
  renderLogin('/nl/login?organization=example');
  await screen.findByRole('button', { name: 'Login with Staff SSO' });
  expect(screen.queryByRole('textbox', { name: 'Email' })).toBeNull();
  expect(screen.queryByLabelText('Password')).toBeNull();
  fireEvent.click(screen.getByText('Other sign-in options'));
  expect(screen.getByRole('link', { name: 'Sign in to your existing account' })).toHaveProperty(
    'href',
    'http://localhost/nl/login?personal=1&redirect=%2Fnl%2Flogin%3Forganization%3Dexample%26redirect%3D%252Forganizations%252Fexample',
  );
});

it.each(['', 'example'])(
  'allows explicit personal password sign-in with organization context "%s"',
  async (organizationId) => {
    const search = new URLSearchParams({ personal: '1', redirect: '/destination' });
    if (organizationId) {
      search.set('organization', organizationId);
    }
    renderLogin(`/login?${search}`);
    fireEvent.change(await screen.findByRole('textbox', { name: 'Email' }), {
      target: { value: 'staff@staff.example' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByText('Returned to destination')).toBeDefined();
  },
);

it('shows only permitted alternative providers for invited guests', async () => {
  policy = 'required-with-guests';
  renderLogin('/login?organization=example');
  await screen.findByText(
    'The other sign-in methods below are available only to explicitly invited external guests.',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Other sign-in options' }));
  expect(
    screen.getAllByRole('button', { name: /Login with/ }).map((button) => button.textContent),
  ).toStrictEqual(['Login with Staff SSO', 'Login with GitLab']);
});

it('keeps organization linking explicit after a guest signs in personally', async () => {
  policy = 'required-with-guests';
  renderLogin('/login?organization=example');
  fireEvent.click(await screen.findByRole('button', { name: 'Other sign-in options' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sign in with password' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
    target: { value: 'owner@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));
  expect(
    await screen.findByRole('button', { name: 'Link organization single sign-on' }),
  ).toHaveProperty('disabled', false);
  expect(sessionStorage.getItem(storageKey)).toBeNull();
});

it('keeps personal login usable for organization invitations without configured SSO', async () => {
  configuredSso = false;
  renderLogin('/login?organization=example');
  await continueWithEmail('owner@example.com');
  expect(await screen.findByLabelText('Password')).toBeDefined();
});

it('shows a discovery failure without moving to password sign-in', async () => {
  discoveryFailure = true;
  renderLogin();
  await continueWithEmail('staff@staff.example');
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Unable to find your sign-in options. Please try again.',
  );
  expect(screen.queryByLabelText('Password')).toBeNull();
});

it('prevents changing sign-in methods while discovery is pending', async () => {
  let complete!: () => void;
  discoveryPending = new Promise<void>((resolve) => {
    complete = resolve;
  });
  renderLogin();
  try {
    await continueWithEmail('personal@example.com');
    expect(screen.getByRole('button', { name: 'Other sign-in options' })).toHaveProperty(
      'disabled',
      true,
    );
  } finally {
    complete();
  }
  expect(await screen.findByLabelText('Password')).toBeDefined();
});

it.each([
  // eslint-disable-next-line no-script-url -- The fixture verifies rejection of executable redirects.
  'javascript:alert(1)',
  'https://outside.example/',
  '//[',
])('rejects an invalid continuation destination %s', async (redirect) => {
  renderLogin(`/login?${new URLSearchParams({ redirect })}`);
  expect(await screen.findByText('The sign-in destination is invalid.')).toBeDefined();
});
