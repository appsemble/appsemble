import { fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
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
let policy: 'required' | 'required-with-guests';

beforeEach(() => {
  localStorage.clear();
  policy = 'required';
  axios.defaults.adapter = (config) =>
    Promise.resolve({
      data:
        config.url === '/api/auth/email/login'
          ? {
              access_token: `e30.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`,
              refresh_token: 'refresh',
            }
          : config.url === '/api/users/current'
            ? { sub: 'owner', email: 'owner@example.com' }
            : config.url === '/api/users/current/organizations'
              ? []
              : { name: 'Staff SSO', policy, allowedLoginMethods: ['oidc', 'password', 'gitlab'] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
});

afterEach(() => {
  axios.defaults.adapter = transport;
  localStorage.clear();
});

function renderLogin(initialEntry = '/login?organization=example'): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <UserProvider>
          <LoginPage />
        </UserProvider>
      </MemoryRouter>
    </IntlProvider>,
  );
}

it('should show only organization single sign-on when it is required for everyone', async () => {
  renderLogin();
  await screen.findByRole('button', { name: 'Login with Staff SSO' });

  expect(
    screen.getAllByRole('button', { name: /Login with/ }).map((button) => button.textContent),
  ).toStrictEqual(['Login with Staff SSO']);
});

it('should show only permitted alternative providers for invited guests', async () => {
  policy = 'required-with-guests';
  renderLogin();
  await screen.findByText(
    'The other sign-in methods below are available only to explicitly invited external guests.',
  );

  expect(
    screen.getAllByRole('button', { name: /Login with/ }).map((button) => button.textContent),
  ).toStrictEqual(['Login with Staff SSO', 'Login with GitLab']);
});

it('should allow linking organization single sign-on after signing in with a password', async () => {
  policy = 'required-with-guests';
  renderLogin();
  fireEvent.change(await screen.findByRole('textbox', { name: 'Email' }), {
    target: { value: 'owner@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Login', exact: true }));

  expect(
    await screen.findByRole('button', { name: 'Link organization single sign-on' }),
  ).toHaveProperty('disabled', false);
});

it.each([
  // eslint-disable-next-line no-script-url -- The fixture verifies rejection of executable redirects.
  'javascript:alert(1)',
  'https://outside.example/',
  '//[',
])(
  'should reject the invalid continuation destination %s for an authenticated user',
  async (redirect) => {
    localStorage.access_token = `e30.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;
    localStorage.refresh_token = 'refresh';
    renderLogin(`/login?${new URLSearchParams({ organization: 'example', redirect })}`);

    expect(await screen.findByText('The sign-in destination is invalid.')).toBeDefined();
  },
);
