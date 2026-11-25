import { Confirmation } from '@appsemble/react-components';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { render, screen, within } from '@testing-library/react';
import axios from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { MemberTable } from './index.js';
import { UserProvider } from '../../../../components/UserProvider/index.js';
import { type OrganizationMember } from '../../../../types.js';

const members: OrganizationMember[] = [
  {
    id: 'owner',
    name: 'Studio Owner',
    primaryEmail: 'owner@example.com',
    role: PredefinedOrganizationRole.Owner,
    roles: [PredefinedOrganizationRole.Owner],
    ssoRoles: [],
    ssoUsernames: [],
    guest: false,
  },
  {
    id: 'staff',
    name: 'Studio Staff',
    primaryEmail: 'staff@example.com',
    role: null,
    roles: [PredefinedOrganizationRole.Maintainer],
    ssoRoles: [PredefinedOrganizationRole.Maintainer],
    ssoUsernames: ['staff@identity.example.com'],
    guest: false,
  },
];
const responses: Record<string, unknown> = {
  '/api/users/current': { sub: 'owner', email: 'owner@example.com' },
  '/api/users/current/organizations': [
    { id: 'example', name: 'Example', roles: [PredefinedOrganizationRole.Owner], guest: false },
  ],
  '/api/organizations/example/members': members,
  '/api/organizations/example/invites': [],
};
const transport = axios.defaults.adapter;

beforeEach(() => {
  localStorage.access_token = `e30.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;
  localStorage.refresh_token = 'refresh';
  axios.defaults.adapter = (config) => {
    if (config.method !== 'get' || !(config.url! in responses)) {
      throw new Error(`Unexpected request: ${config.method} ${config.url}`);
    }
    return Promise.resolve({
      data: responses[config.url!],
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
  localStorage.clear();
});

it('shows the provider account of a member linked through single sign-on', async () => {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/organizations/example/members']}>
        <UserProvider>
          <Confirmation>
            <Routes>
              <Route element={<MemberTable />} path="/organizations/:organizationId/members" />
            </Routes>
          </Confirmation>
        </UserProvider>
      </MemoryRouter>
    </IntlProvider>,
  );

  const staff = await screen.findByRole('row', { name: /Studio Staff/ });
  expect(
    within(staff).getByText('Single sign-on account: staff@identity.example.com'),
  ).toBeDefined();
  expect(screen.getAllByText(/Single sign-on account/)).toHaveLength(1);
});
