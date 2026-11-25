import { Confirmation, MessagesProvider } from '@appsemble/react-components';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { fireEvent, render, screen, within } from '@testing-library/react';
import axios, { type AxiosAdapter } from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { MembersPage } from './index.js';

let app: Record<string, unknown>;
let role: PredefinedOrganizationRole;
let resetTotp: AxiosAdapter;
const transport = axios.defaults.adapter;

vi.mock('../index.js', () => ({ useApp: () => ({ app, setApp: vi.fn() }) }));
vi.mock('../../../../components/UserProvider/index.js', () => ({
  useUser: () => ({
    organizations: [{ id: 'test', roles: [role] }],
    userInfo: { email: 'manager@example.com' },
  }),
}));

beforeEach(() => {
  app = {
    id: 1,
    OrganizationId: 'test',
    definition: { name: 'Test app' },
    totp: 'enabled',
  };
  role = PredefinedOrganizationRole.AppMemberManager;
  resetTotp = (config) =>
    Promise.resolve({ data: '', status: 204, statusText: 'No Content', headers: {}, config });
  axios.defaults.adapter = (config) => {
    if (config.method === 'delete' && config.url === '/api/apps/1/app-members/alice/totp') {
      return resetTotp(config);
    }
    return Promise.resolve({
      data:
        config.url === '/api/apps/1/members'
          ? [
              { sub: 'alice', name: 'Alice', roles: [], demo: false, totpEnabled: true },
              { sub: 'bob', name: 'Bob', roles: [], demo: false, totpEnabled: false },
            ]
          : [],
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

function renderPage(): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter>
        <MessagesProvider>
          <Confirmation>
            <MembersPage />
          </Confirmation>
        </MessagesProvider>
      </MemoryRouter>
    </IntlProvider>,
  );
}

it('should filter app members on their TOTP status', async () => {
  renderPage();

  fireEvent.change(await screen.findByLabelText('TOTP'), { target: { value: 'disabled' } });

  expect(screen.queryByText('Alice')).toBeNull();
  expect(screen.getByText('Bob')).toBeDefined();
});

it('should not show TOTP on apps where TOTP is disabled', async () => {
  app.totp = 'disabled';
  renderPage();

  await screen.findByText('Alice');

  expect(screen.queryByLabelText('TOTP')).toBeNull();
  expect(screen.queryByText('Not set up')).toBeNull();
  expect(screen.queryByTitle('Reset TOTP')).toBeNull();
});

it('should offer to reset the TOTP of app members who set it up', async () => {
  renderPage();

  await screen.findByText('Alice');

  expect(screen.getAllByTitle('Reset TOTP')).toHaveLength(1);
});

it('should show that TOTP is not set up after resetting it', async () => {
  renderPage();
  const row = within((await screen.findByText('Alice')).closest('tr')!);
  expect(row.getByText('Enabled')).toBeDefined();

  fireEvent.click(row.getByTitle('Reset TOTP'));
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', { name: 'Reset TOTP' }),
  );

  expect(await row.findByText('Not set up')).toBeDefined();
  expect(row.queryByTitle('Reset TOTP')).toBeNull();
  expect(await screen.findByText('The TOTP of Alice was reset')).toBeDefined();
});

it('should report that resetting TOTP failed', async () => {
  resetTotp = () => Promise.reject(new Error('Request failed with status code 403'));
  renderPage();
  const row = within((await screen.findByText('Alice')).closest('tr')!);

  fireEvent.click(row.getByTitle('Reset TOTP'));
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', { name: 'Reset TOTP' }),
  );

  expect(
    await screen.findByText('Something went wrong when trying to reset the TOTP of Alice'),
  ).toBeDefined();
  expect(row.getByText('Enabled')).toBeDefined();
});

it('should not offer to reset TOTP to organization members without the permission', async () => {
  role = PredefinedOrganizationRole.Member;
  renderPage();

  await screen.findByText('Alice');

  expect(screen.queryByTitle('Reset TOTP')).toBeNull();
});
