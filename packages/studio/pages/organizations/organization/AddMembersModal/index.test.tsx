import { PredefinedOrganizationRole } from '@appsemble/types';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';

import { AddMembersModal } from './index.js';

const user = vi.hoisted(() => ({ roles: [] as string[] }));

vi.mock('../../../../components/UserProvider/index.js', () => ({
  useUser: () => ({ organizations: [{ id: 'example', roles: user.roles, guest: false }] }),
}));

it.each([
  { role: PredefinedOrganizationRole.Maintainer, offered: false },
  { role: PredefinedOrganizationRole.Owner, offered: true },
])('should offer external guest invitations to role $role: $offered', ({ offered, role }) => {
  user.roles = [role];
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/organizations/example/members']}>
        <Routes>
          <Route
            element={
              <AddMembersModal
                onInvited={vi.fn()}
                state={{ enabled: true, enable: vi.fn(), disable: vi.fn(), toggle: vi.fn() }}
              />
            }
            path="/organizations/:organizationId/members"
          />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );

  expect(screen.queryByRole('checkbox', { name: 'External guest' }) != null).toBe(offered);
});
