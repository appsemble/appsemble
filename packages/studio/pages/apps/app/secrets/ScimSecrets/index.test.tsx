import { Confirmation } from '@appsemble/react-components';
import { fireEvent, render, screen, within } from '@testing-library/react';
import axios from 'axios';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ScimSecrets } from './index.js';

vi.mock('../../index.js', () => ({
  useApp: () => ({ app: { id: 42 }, refreshWarnings: vi.fn() }),
}));

const transport = axios.defaults.adapter;
let storedToken: string | undefined;

beforeEach(() => {
  storedToken = 'stored-token';
  axios.defaults.adapter = (config) => {
    if (config.method === 'patch') {
      storedToken = JSON.parse(config.data).token;
    }
    const data = { enabled: true, incomplete: !storedToken };
    return Promise.resolve({ config, data, headers: {}, status: 200, statusText: 'OK' });
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

function renderPage(): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <Confirmation>
        <ScimSecrets />
      </Confirmation>
    </IntlProvider>,
  );
}

it('should show that a SCIM token is set without showing it', async () => {
  renderPage();

  expect(
    await screen.findByText('A SCIM token is set. Regenerate it to get a new token.'),
  ).toBeDefined();
  expect(screen.queryByLabelText('SCIM token')).toBeNull();
});

it('should show a regenerated SCIM token once', async () => {
  renderPage();

  fireEvent.click(await screen.findByRole('button', { name: 'Regenerate SCIM token' }));
  fireEvent.click(
    within(await screen.findByRole('dialog', { name: 'Regenerate SCIM token' })).getByRole(
      'button',
      { name: 'Regenerate' },
    ),
  );

  const token = await screen.findByLabelText('SCIM token');
  expect(storedToken).not.toBe('stored-token');
  expect(token).toHaveProperty('value', storedToken);
  expect(screen.getByText('Copy the token now. It is not shown again.')).toBeDefined();
});
