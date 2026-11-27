import { Confirmation } from '@appsemble/react-components';
import { type AppWarning } from '@appsemble/types';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { AppRoutes } from '../index.js';

vi.hoisted(() => {
  window.settings = { enableRegistration: true, logins: [], sentryDsn: '', sentryEnvironment: '' };
});
vi.mock('../../../../components/UserProvider/index.js', () => ({
  useUser: () => ({ organizations: [{ id: 'org', roles: ['Owner'] }], userInfo: {} }),
}));

const transport = axios.defaults.adapter;

const responses: Record<string, unknown> = {
  'get /api/apps/1?language=en': {
    id: 1,
    OrganizationId: 'org',
    definition: { name: 'Test app' },
    locked: 'unlocked',
    path: 'test',
  },
  'get /api/apps/1/secrets/service': [
    {
      id: 1,
      name: 'Orders API',
      urlPatterns: 'https://orders.example',
      authenticationMethod: 'custom-header',
      identifier: 'x-api-key',
      incomplete: true,
    },
  ],
  'get /api/apps/1/secrets/oauth2': [
    {
      id: 1,
      name: 'Example SSO',
      authorizationUrl: 'https://sso.example/authorize',
      tokenUrl: 'https://sso.example/token',
      clientId: 'client',
      icon: 'key',
      scope: 'openid',
      incomplete: true,
    },
  ],
  'get /api/apps/1/secrets/saml': [],
  'get /api/apps/1/secrets/scim': { enabled: true, incomplete: true },
};

const changes: Record<string, string> = {
  'put /api/apps/1/secrets/service/1': 'Orders API',
  'delete /api/apps/1/secrets/service/1': 'Orders API',
  'put /api/apps/1/secrets/oauth2/1': 'Example SSO',
  'delete /api/apps/1/secrets/oauth2/1': 'Example SSO',
  'patch /api/apps/1/secrets/scim': 'SCIM',
};

let warnings: AppWarning[];

beforeEach(() => {
  warnings = [
    { code: 'missing-secret', type: 'service', id: 1, name: 'Orders API' },
    { code: 'missing-secret', type: 'oauth2', id: 1, name: 'Example SSO' },
    { code: 'missing-secret', type: 'scim', name: 'SCIM' },
  ];
  axios.defaults.adapter = (config) => {
    const request = `${config.method} ${config.url}`;
    warnings = warnings.filter(({ name }) => name !== changes[request]);
    const data =
      config.url === '/api/apps/1/warnings'
        ? warnings
        : (responses[request] ?? JSON.parse(config.data ?? '{}'));
    return Promise.resolve({ config, data, headers: {}, status: 200, statusText: 'OK' });
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

function getWarningNames(): string[] {
  return screen
    .queryAllByRole('link')
    .filter((link) => link.getAttribute('href') === '/en/apps/1/test/secrets')
    .map((link) => link.textContent!);
}

async function confirmDialog(title: string, button: string): Promise<void> {
  fireEvent.click(
    within(await screen.findByRole('dialog', { name: title })).getByRole('button', {
      name: button,
    }),
  );
}

it.each([
  {
    change: 'setting the service secret',
    name: 'Orders API',
    async act() {
      fireEvent.click(await screen.findByRole('button', { name: /Orders API/ }));
      fireEvent.change(screen.getByLabelText('Secret'), { target: { value: 'api-key' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save service secret' }));
    },
  },
  {
    change: 'deleting the service secret',
    name: 'Orders API',
    async act() {
      fireEvent.click(await screen.findByRole('button', { name: /Orders API/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Delete service secret' }));
      await confirmDialog('Deleting service secret', 'Delete service secret');
    },
  },
  {
    change: 'setting the OAuth2 client secret',
    name: 'Example SSO',
    async act() {
      fireEvent.click(await screen.findByRole('button', { name: /Example SSO/ }));
      fireEvent.change(screen.getByLabelText('Client secret'), { target: { value: 'secret' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save secret' }));
    },
  },
  {
    change: 'deleting the OAuth2 secret',
    name: 'Example SSO',
    async act() {
      fireEvent.click(await screen.findByRole('button', { name: /Example SSO/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Delete secret' }));
      await confirmDialog('Deleting secret', 'Delete secret');
    },
  },
  {
    change: 'generating a SCIM token',
    name: 'SCIM',
    async act() {
      fireEvent.click(await screen.findByRole('button', { name: 'Regenerate SCIM token' }));
      await confirmDialog('Regenerate SCIM token', 'Regenerate');
    },
  },
  {
    change: 'disabling SCIM',
    name: 'SCIM',
    async act() {
      fireEvent.click(await screen.findByLabelText('Enable SCIM'));
    },
  },
])('should stop listing a secret after $change', async ({ act, name }) => {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/en/apps/1/test/secrets']}>
        <Confirmation>
          <Routes>
            <Route element={<AppRoutes />} path="/:lang/apps/:id/:path/*" />
          </Routes>
        </Confirmation>
      </MemoryRouter>
    </IntlProvider>,
  );
  const names = ['Orders API', 'Example SSO', 'SCIM'];
  await waitFor(() => expect(getWarningNames()).toStrictEqual(names));

  await act();

  await waitFor(() =>
    expect(getWarningNames()).toStrictEqual(names.filter((warning) => warning !== name)),
  );
});
