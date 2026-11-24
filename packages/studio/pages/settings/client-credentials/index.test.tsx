import { render, screen, within } from '@testing-library/react';
import axios from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { ClientCredentialsPage } from './index.js';

const transport = axios.defaults.adapter;

beforeEach(() => {
  axios.defaults.adapter = (config) =>
    Promise.resolve({
      data: [
        {
          id: 'client',
          description: 'Deployments',
          created: '2026-01-15T12:00:00.000Z',
          scopes: ['apps:write'],
        },
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

it('should show when client credentials were created', async () => {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/en/settings/client-credentials']}>
        <ClientCredentialsPage />
      </MemoryRouter>
    </IntlProvider>,
  );

  const row = await screen.findByRole('row', { name: /Deployments/ });
  expect(within(row).getByText('1/15/2026')).toBeDefined();
});
