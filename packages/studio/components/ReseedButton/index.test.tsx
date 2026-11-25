import { type App, PredefinedOrganizationRole } from '@appsemble/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';

import { ReseedButton } from './index.js';

vi.mock('../UserProvider/index.js', () => ({
  useUser: () => ({
    userInfo: { sub: 'staff' },
    organizations: [{ id: 'example', roles: [PredefinedOrganizationRole.Owner], guest: false }],
  }),
}));

it('should let a group-managed Owner reseed a demo app', () => {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter>
        <ReseedButton app={{ id: 1, OrganizationId: 'example', demoMode: true } as App} />
      </MemoryRouter>
    </IntlProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Reseed app' }));

  expect(screen.getByRole('button', { name: 'Reseed' })).toBeDefined();
  expect(screen.queryByText('You do not have permission to reseed this app.')).toBeNull();
});
