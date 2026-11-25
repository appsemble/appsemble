import { render, screen } from '@testing-library/react';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';

import { IndexPage } from './index.js';

const transport = axios.defaults.adapter;

function account(id: number, name: string): unknown {
  return {
    app: {
      id,
      path: name.toLowerCase(),
      definition: { name },
      iconBackground: '#ffffff',
      OrganizationId: 'org',
      OrganizationName: 'Test Organization',
    },
    appMemberInfo: { sub: `member-${id}`, email: 'test@example.com' },
    sso: [],
  };
}

function renderPage(status: number, data: unknown): void {
  axios.defaults.adapter = (config: InternalAxiosRequestConfig) => {
    if (config.method !== 'get' || config.url !== '/api/users/current/apps/accounts') {
      throw new Error(`Unexpected request: ${config.method} ${config.url}`);
    }
    const response = { data, status, statusText: '', headers: {}, config };
    return status === 200
      ? Promise.resolve(response)
      : Promise.reject(new AxiosError('Failed', 'ERR_BAD_RESPONSE', config, undefined, response));
  };
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter>
        <IndexPage />
      </MemoryRouter>
    </IntlProvider>,
  );
}

afterEach(() => {
  axios.defaults.adapter = transport;
});

it('should list the connected apps', async () => {
  renderPage(200, [account(1, 'Notes'), account(2, 'Tasks')]);

  expect(await screen.findByRole('link', { name: /Notes/ })).toBeDefined();
  expect(screen.getByRole('link', { name: /Tasks/ })).toBeDefined();
});

it('should tell the user when there are no connected apps', async () => {
  renderPage(200, []);

  expect(await screen.findByText('You haven’t logged in to any Appsemble apps yet.')).toBeDefined();
});

it('should tell the user when the connected apps cannot be loaded', async () => {
  renderPage(500, { message: 'Internal Server Error' });

  expect(
    await screen.findByText('There was a problem loading the your connected apps.'),
  ).toBeDefined();
});
