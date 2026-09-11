import { PredefinedOrganizationRole } from '@appsemble/types';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { OrganizationSideMenu } from './index.js';
import { type Organization } from '../../../types.js';

const organization: Organization = {
  city: '',
  countryCode: '',
  description: '',
  email: '',
  houseNumber: '',
  iconUrl: '',
  id: 'example',
  invoiceReference: '',
  locale: 'en',
  name: 'Example organization',
  role: PredefinedOrganizationRole.Member,
  streetName: '',
  vatIdNumber: '',
  website: '',
  zipCode: '',
};

function renderSideMenu(userOrganization?: Organization): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter>
        <OrganizationSideMenu
          mayEdit={false}
          organization={organization}
          url="organizations/example"
          userOrganization={userOrganization}
        />
      </MemoryRouter>
    </IntlProvider>,
  );
}

describe('OrganizationSideMenu', () => {
  it('should hide billing links from organization visitors', () => {
    renderSideMenu();

    expect(screen.queryByRole('link', { name: 'Subscriptions' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Invoices' })).toBeNull();
  });

  it('should show billing links to organization members', () => {
    renderSideMenu(organization);

    expect(screen.getByRole('link', { name: 'Subscriptions' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Invoices' })).toBeDefined();
  });
});
