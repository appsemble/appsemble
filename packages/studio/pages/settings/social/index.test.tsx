import { Confirmation, MessagesProvider } from '@appsemble/react-components';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axios, { AxiosError } from 'axios';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { SocialPage } from './index.js';
import { UserProvider, useUser } from '../../../components/UserProvider/index.js';

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
    ],
    sentryDsn: '',
    sentryEnvironment: '',
  };
});

const transport = axios.defaults.adapter;
const issuer = 'https://identity.example.com/realms/staff';
let identities: {
  id: string;
  issuer: string;
  subject: string;
  username: string | null;
  organizations: { id: string; name: string | null; provider: string }[];
}[];
let sessionRevoked: boolean;
let errorMessage: string | undefined;
let errorStatus: number;

beforeEach(() => {
  localStorage.clear();
  localStorage.access_token = `e30.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;
  localStorage.refresh_token = 'refresh';
  sessionRevoked = false;
  errorMessage = undefined;
  errorStatus = 403;
  identities = [
    {
      id: 'first',
      issuer,
      subject: 'staff-1',
      username: 'staff@identity.example.com',
      organizations: [{ id: 'staff', name: 'Staff', provider: 'Staff Keycloak' }],
    },
    { id: 'second', issuer, subject: 'staff-2', username: null, organizations: [] },
  ];
  axios.defaults.adapter = (config) => {
    const response = {
      data: undefined as unknown,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
    if (
      config.method === 'delete' &&
      identities.some(
        (identity) => config.url === `/api/users/current/auth/oidc/identities/${identity.id}`,
      )
    ) {
      if (errorMessage) {
        return Promise.reject(
          new AxiosError('Cannot unlink', 'ERR_BAD_REQUEST', config, undefined, {
            ...response,
            status: errorStatus,
            data: { message: errorMessage },
          }),
        );
      }
      identities = identities.filter((identity) => !config.url.endsWith(`/${identity.id}`));
      response.data = { sessionRevoked };
    } else if (
      config.method === 'get' &&
      config.url === '/api/users/current/auth/oidc/identities'
    ) {
      response.data = identities;
    } else if (
      config.method === 'get' &&
      config.url === '/api/users/current/auth/oauth2/authorizations'
    ) {
      response.data = [{ authorizationUrl: 'https://gitlab.com/oauth/authorize' }];
    } else if (config.method === 'get' && config.url === '/api/users/current') {
      response.data = { sub: 'staff', email: 'staff@example.com' };
    } else if (config.method === 'get' && config.url === '/api/users/current/organizations') {
      response.data = [];
    } else if (config.method !== 'post' || config.url !== '/api/auth/logout') {
      throw new Error(`Unexpected request: ${config.method} ${config.url}`);
    }
    return Promise.resolve(response);
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
  localStorage.clear();
});

function AccountStatus(): ReactNode {
  const { userInfo } = useUser();
  return <output>{userInfo ? `Signed in as ${userInfo.email}` : 'Signed out'}</output>;
}

function renderAccounts(): ReturnType<typeof render> {
  return render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/settings/user/social']}>
        <UserProvider>
          <MessagesProvider>
            <Confirmation>
              <AccountStatus />
              <Routes>
                <Route element={<SocialPage />} path="/settings/user/social" />
                <Route element={<h1>Sign in to Studio</h1>} path="/login" />
              </Routes>
            </Confirmation>
          </MessagesProvider>
        </UserProvider>
      </MemoryRouter>
    </IntlProvider>,
  );
}

async function confirmUnlink(subject = 'staff-1'): Promise<void> {
  const identity = await screen.findByRole('region', { name: `${issuer} (${subject})` });
  fireEvent.click(within(identity).getByRole('button', { name: 'Unlink single sign-on' }));
  const dialog = await screen.findByRole('dialog', { name: 'Unlink single sign-on' });
  expect(
    within(dialog).getByText(
      `Unlink account ${subject} from ${issuer}? This revokes your organization single sign-on access, its sessions, and personal CLI credentials created through it.`,
    ),
  ).toBeDefined();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Unlink single sign-on' }));
}

it('shows the organization, provider and account of a linked identity', async () => {
  renderAccounts();
  const identity = await screen.findByRole('region', { name: `${issuer} (staff-1)` });

  expect(within(identity).getByText('Organization: Staff (Staff Keycloak)')).toBeDefined();
  expect(within(identity).getByText('Account: staff@identity.example.com')).toBeDefined();
});

it('unlinks the selected SSO account and preserves other identities and an unrelated session', async () => {
  const page = renderAccounts();
  await screen.findByRole('button', { name: 'Disconnect GitLab account' });
  await confirmUnlink('staff-2');

  await waitFor(() =>
    expect(screen.queryByRole('region', { name: `${issuer} (staff-2)` })).toBeNull(),
  );
  expect(screen.getByRole('region', { name: `${issuer} (staff-1)` })).toBeDefined();
  expect(screen.getByText('Signed in as staff@example.com')).toBeDefined();

  page.unmount();
  renderAccounts();
  await screen.findByRole('region', { name: `${issuer} (staff-1)` });
  expect(screen.queryByRole('region', { name: `${issuer} (staff-2)` })).toBeNull();
});

it('keeps both accounts linked when unlinking is cancelled', async () => {
  const page = renderAccounts();
  const identity = await screen.findByRole('region', { name: `${issuer} (staff-1)` });
  fireEvent.click(within(identity).getByRole('button', { name: 'Unlink single sign-on' }));
  const dialog = await screen.findByRole('dialog', { name: 'Unlink single sign-on' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

  page.unmount();
  renderAccounts();

  expect(await screen.findByRole('region', { name: `${issuer} (staff-1)` })).toBeDefined();
  expect(screen.getByRole('region', { name: `${issuer} (staff-2)` })).toBeDefined();
});

it.each([
  [403, 'Sign in again before unlinking organization single sign-on.'],
  [
    409,
    'Keep a verified email address or a personal social login before unlinking organization SSO.',
  ],
  [409, 'An organization must retain at least one Owner.'],
] as const)('shows the actionable refusal with status %s: %s', async (status, message) => {
  errorStatus = status;
  errorMessage = message;
  renderAccounts();
  await confirmUnlink();

  expect(await screen.findByText(message)).toBeDefined();
  expect(screen.getByRole('region', { name: `${issuer} (staff-1)` })).toBeDefined();
  expect(screen.getByText('Signed in as staff@example.com')).toBeDefined();
});

it('signs out and returns to login when unlinking revokes the current session', async () => {
  sessionRevoked = true;
  renderAccounts();
  await confirmUnlink();

  expect(await screen.findByRole('heading', { name: 'Sign in to Studio' })).toBeDefined();
  expect(screen.getByText('Signed out')).toBeDefined();
});
