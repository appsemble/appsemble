import { Confirmation } from '@appsemble/react-components';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { render, screen, within } from '@testing-library/react';
import axios from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { MemberTable } from './index.js';
import { type OrganizationMember } from '../../../../types.js';

vi.mock('../../../../components/UserProvider/index.js', () => ({
  useUser: () => ({
    userInfo: { sub: 'owner' },
    organizations: [{ id: 'example', roles: [PredefinedOrganizationRole.Owner], guest: false }],
  }),
}));

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
const transport = axios.defaults.adapter;

beforeEach(() => {
  axios.defaults.adapter = (config) =>
    Promise.resolve({
      data: config.url === '/api/organizations/example/members' ? members : [],
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

it('shows the provider account of a member linked through single sign-on', async () => {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/organizations/example/members']}>
        <Confirmation>
          <Routes>
            <Route element={<MemberTable />} path="/organizations/:organizationId/members" />
          </Routes>
        </Confirmation>
      </MemoryRouter>
    </IntlProvider>,
  );

  const staff = await screen.findByRole('row', { name: /Studio Staff/ });
  expect(
    within(staff).getByText('Single sign-on account: staff@identity.example.com'),
  ).toBeDefined();
  expect(screen.getAllByText(/Single sign-on account/)).toHaveLength(1);
});
