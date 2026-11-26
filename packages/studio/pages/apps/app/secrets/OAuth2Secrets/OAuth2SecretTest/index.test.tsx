import { SimpleForm, SimpleFormField } from '@appsemble/react-components';
import { fireEvent, render, screen } from '@testing-library/react';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { OAuth2SecretTest } from './index.js';
import { CallbackPage } from '../../../../../callback/index.js';

vi.hoisted(() => {
  window.settings = { enableRegistration: true, logins: [], sentryDsn: '', sentryEnvironment: '' };
});
vi.mock('../../../index.js', () => ({
  useApp: () => ({ app: { id: 42 } }),
}));

const transport = axios.defaults.adapter;
let requests: InternalAxiosRequestConfig[];
let responses: Record<string, unknown>;

const secret = {
  authorizationUrl: 'https://sso.example/protocol/openid-connect/auth',
  clientId: 'appsemble',
  clientSecret: '',
  scope: 'email openid',
  tokenUrl: 'https://sso.example/protocol/openid-connect/token',
  roleMappings: [{ group: '/Managers', role: 'Manager' }],
};

beforeEach(() => {
  localStorage.clear();
  requests = [];
  responses = {};
  axios.defaults.adapter = (config) => {
    requests.push(config);
    return Promise.resolve({
      config,
      data: responses[config.url!],
      headers: {},
      status: 200,
      statusText: 'OK',
    });
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

function renderTest(): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <SimpleForm defaultValues={secret} onSubmit={vi.fn()}>
        <SimpleFormField label="Client ID" name="clientId" />
        <OAuth2SecretTest secretId={7} />
      </SimpleForm>
    </IntlProvider>,
  );
}

it('should test the unsaved settings and show the result of each check', async () => {
  responses['/api/apps/42/secrets/oauth2/test-connection'] = [
    { check: 'tokenUrl', status: 'pass', reason: 'reachable', detail: 'HTTP 401' },
    {
      check: 'clientCredentials',
      status: 'fail',
      reason: 'rejected',
      detail: 'HTTP 401: invalid_client: Invalid client credentials',
    },
  ];
  renderTest();

  fireEvent.change(screen.getByLabelText(/Client ID/), {
    target: { value: 'appsemble'.repeat(2) },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Test connection' }));

  const items = await screen.findAllByRole('listitem');
  expect(items.map((item) => item.textContent)).toStrictEqual([
    'PassedToken URL: The server can reach it. HTTP 401',
    'FailedClient ID and secret: The provider rejected the client ID or secret. HTTP 401: invalid_client: Invalid client credentials',
  ]);
  expect(JSON.parse(requests[0].data)).toStrictEqual({
    id: 7,
    authorizationUrl: secret.authorizationUrl,
    clientId: 'appsemble'.repeat(2),
    roleMappings: secret.roleMappings,
    scope: 'email openid',
    tokenUrl: secret.tokenUrl,
  });
});

it('should show which roles a test login resolves to', async () => {
  responses['/api/apps/42/secrets/oauth2/test-login'] = {
    user: { sub: 'user-1', email: 'user@example.com', groups: ['/Editors'] },
    roles: [],
  };
  const open = vi.spyOn(window, 'open').mockReturnValue({} as Window);
  vi.spyOn(window, 'close').mockImplementation(() => null);
  renderTest();

  fireEvent.click(screen.getByRole('button', { name: 'Try login' }));
  const url = new URL(open.mock.calls[0][0] as string);
  expect(url.searchParams.get('client_id')).toBe('appsemble');
  expect(url.searchParams.get('redirect_uri')).toBe('http://localhost/callback');

  // The provider returns the login window to the Studio callback.
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter
        initialEntries={[`/callback?code=provider-code&state=${url.searchParams.get('state')}`]}
      >
        <CallbackPage />
      </MemoryRouter>
    </IntlProvider>,
  );

  expect(
    await screen.findByText('No role matched, so this user can’t log in to the app.'),
  ).toBeDefined();
  expect(screen.getByText('/Editors')).toBeDefined();
  expect(JSON.parse(requests[0].data)).toMatchObject({ id: 7, code: 'provider-code' });
});
