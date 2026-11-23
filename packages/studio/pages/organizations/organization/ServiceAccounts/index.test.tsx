import { Confirmation } from '@appsemble/react-components';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axios, { type InternalAxiosRequestConfig } from 'axios';
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
let requests: Pick<InternalAxiosRequestConfig, 'data' | 'method' | 'url'>[];

beforeEach(() => {
  requests = [];
  axios.defaults.adapter = (config) => {
    requests.push({ method: config.method, url: config.url, data: config.data });
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

it('should let Owners create a service account without the Owner role', async () => {
  renderServiceAccounts(PredefinedOrganizationRole.Owner);
  fireEvent.click(await screen.findByRole('button', { name: 'Create service account' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
    target: { value: 'Deployments' },
  });
  const role = screen.getByLabelText('Role');
  const ownerOffered = within(role).queryByRole('option', { name: 'Owner' }) != null;
  fireEvent.change(role, { target: { value: PredefinedOrganizationRole.AppManager } });
  fireEvent.click(screen.getByLabelText('apps:write'));
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));

  expect(await screen.findByDisplayValue('client:secret')).toBeDefined();
  expect({
    ownerOffered,
    request: JSON.parse(requests.find(({ method }) => method === 'post')!.data),
  }).toStrictEqual({
    ownerOffered: false,
    request: {
      description: 'Deployments',
      role: PredefinedOrganizationRole.AppManager,
      scopes: ['apps:write'],
    },
  });
});

it('should let Owners revoke a service account', async () => {
  renderServiceAccounts(PredefinedOrganizationRole.Owner);
  fireEvent.click(await screen.findByRole('button', { name: 'Revoke' }));
  const dialog = await screen.findByRole('dialog', { name: 'Revoke service account' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Revoke' }));

  await waitFor(() => expect(screen.queryByText('Nightly import')).toBeNull());
  expect(requests.at(-1)).toMatchObject({
    method: 'delete',
    url: '/api/organizations/example/service-accounts/existing',
  });
});

it('should show service accounts to other members without letting them manage them', async () => {
  renderServiceAccounts(PredefinedOrganizationRole.Maintainer);

  expect(await screen.findByText('Nightly import')).toBeDefined();
  expect(screen.queryAllByRole('button')).toStrictEqual([]);
});
