import { type AppDefinition } from '@appsemble/lang-sdk';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileDropdown } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as serviceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider/index.js';

vi.mock('../../utils/authorization.js', async (importActual) => ({
  ...(await importActual<typeof import('../../utils/authorization.js')>()),
  checkPagePermissions: () => true,
}));

vi.mock('react-use-pwa-install', () => ({
  usePWAInstall: () => null,
}));

const appDefinition = {
  name: 'Test App',
  defaultPage: 'Home',
  security: { roles: {} },
  layout: {},
  pages: [
    { name: 'Home', blocks: [] },
    { name: 'Edit Profile', navigation: 'profileDropdown', blocks: [] },
  ],
} as unknown as AppDefinition;

beforeEach(() => {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: appDefinition,
    demoMode: false,
    revision: 1,
    blockManifests: [],
  });
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberGroups: [],
    appMemberRoles: ['User'],
    appMemberSelectedGroup: undefined,
    appMemberInfo: { name: 'Jane', email: 'jane@example.com' },
    isLoggedIn: true,
    logout: vi.fn(),
  } as never);
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    getAppMessage: ({ id }: { id: string }) => ({ format: () => id }),
    getMessage: () => ({ format: () => '' }),
  } as never);
  vi.spyOn(serviceWorkerRegistrationProvider, 'useServiceWorkerRegistration').mockReturnValue({
    update: vi.fn(),
  } as never);
});

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

function renderProfileDropdown(): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/en/Home']}>
        <Routes>
          <Route element={<ProfileDropdown />} path="/:lang/*" />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

describe('ProfileDropdown', () => {
  it('should list pages configured with profileDropdown navigation', () => {
    renderProfileDropdown();

    expect(screen.getByText('pages.edit-profile')).not.toBeNull();
  });

  it('should not list pages that are not configured for the profile dropdown', () => {
    renderProfileDropdown();

    expect(screen.queryByText('pages.home')).toBeNull();
  });
});
