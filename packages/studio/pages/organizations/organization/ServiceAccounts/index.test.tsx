import { Confirmation } from '@appsemble/react-components';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ServiceAccounts } from './index.js';
import { type OrganizationServiceAccount } from '../../../../types.js';

const user = vi.hoisted(() => ({ roles: [] as string[] }));

vi.mock('../../../../components/UserProvider/index.js', () => ({
  useUser: () => ({ organizations: [{ id: 'example', roles: user.roles }] }),
}));

const existing: OrganizationServiceAccount = {
  id: 'existing',
  description: 'Nightly import',
  role: PredefinedOrganizationRole.AppContentsManager,
  scopes: ['resources:write'],
  created: '2026-01-01T00:00:00.000Z',
};
const transport = axios.defaults.adapter;

beforeEach(() => {
  axios.defaults.adapter = (config) => {
    const data =
      config.method === 'get'
        ? [existing]
        : config.method === 'post'
          ? {
              ...JSON.parse(config.data),
              id: 'client',
              secret: 'secret',
              created: existing.created,
            }
          : null;
    return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

function renderServiceAccounts(role: PredefinedOrganizationRole): void {
  user.roles = [role];
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/organizations/example/members']}>
        <Confirmation>
          <Routes>
            <Route element={<ServiceAccounts />} path="/organizations/:organizationId/members" />
          </Routes>
        </Confirmation>
      </MemoryRouter>
    </IntlProvider>,
  );
}

it('should let Owners create a service account with a scope and without the Owner role', async () => {
  renderServiceAccounts(PredefinedOrganizationRole.Owner);
  fireEvent.click(await screen.findByRole('button', { name: 'Create service account' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
    target: { value: 'Deployments' },
  });
  const role = screen.getByLabelText('Role');
  const ownerOffered = within(role).queryByRole('option', { name: 'Owner' }) != null;
  fireEvent.change(role, { target: { value: PredefinedOrganizationRole.AppManager } });
  const create = screen.getByRole<HTMLButtonElement>('button', { name: 'Create' });
  const createWithoutScope = !create.disabled;
  fireEvent.click(screen.getByLabelText('apps:write'));
  fireEvent.click(create);

  expect(await screen.findByDisplayValue('client:secret')).toBeDefined();
  fireEvent.click(screen.getByText('Close'));
  await waitFor(() => expect(screen.queryByDisplayValue('client:secret')).toBeNull());
  const row = screen.getByRole('row', { name: /Deployments/ });
  expect({
    ownerOffered,
    createWithoutScope,
    row: [
      within(row).queryByText('AppManager') != null,
      within(row).queryByText('apps:write') != null,
    ],
  }).toStrictEqual({ ownerOffered: false, createWithoutScope: false, row: [true, true] });
});

it('should let Owners revoke a service account', async () => {
  renderServiceAccounts(PredefinedOrganizationRole.Owner);
  fireEvent.click(await screen.findByRole('button', { name: 'Revoke' }));
  const dialog = await screen.findByRole('dialog', { name: 'Revoke service account' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Revoke' }));

  await waitFor(() => expect(screen.queryByText('Nightly import')).toBeNull());
});

it('should show service accounts to other members without letting them manage them', async () => {
  renderServiceAccounts(PredefinedOrganizationRole.Maintainer);

  expect(await screen.findByText('Nightly import')).toBeDefined();
  expect(screen.queryAllByRole('button')).toStrictEqual([]);
});
