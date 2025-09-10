import { type AppDefinition } from '@appsemble/lang-sdk';
import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileSettings } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';

const appMemberInfo = {
  sub: 'randomly-generated',
  email_verified: true,
  demo: false,
  role: 'User',
  zoneinfo: 'Europe/Amsterdam',
  email: 'test@appsemble.com',
  name: 'Test User',
  $seed: false,
  $ephemeral: false,
};

const appDefinition: AppDefinition = {
  name: 'Test App',
  layout: { enabledSettings: ['name', 'picture', 'languages'] },
  defaultPage: 'Test Page',
  pages: [],
};

const navigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => navigate,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProfileDropdown', () => {
  it('should render fields mentioned in the app definition', () => {
    vi.spyOn(appMemberProvider, 'useAppMember').mockImplementation(() => ({
      logout: vi.fn(),
      passwordLogin: vi.fn(),
      authorizationCodeLogin: vi.fn(),
      demoLogin: vi.fn(),
      isLoggedIn: true,
      role: 'User',
      appMemberGroups: [{ id: 1, name: 'Test Group', role: 'User' }],
      appMemberInfo,
      // @ts-expect-error null is not assignable to MutableRefObject
      appMemberInfoRef: null,
      addAppMemberGroup: vi.fn(),
      setAppMemberInfo: vi.fn(),
      setAppMemberSelectedGroup: vi.fn(),
      appMemberSelectedGroup: { id: 1, name: 'Test Group', role: 'User' },
    }));

    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockImplementation(() => ({
      definition: appDefinition,
      demoMode: false,
      revision: 1,
      blockManifests: [],
    }));

    const { container } = render(
      <IntlProvider locale="en" messages={{}}>
        <ProfileSettings />
      </IntlProvider>,
    );
    expect(container.getElementsByClassName('field')).toMatchSnapshot();
  });

  it('should render phoneNumber field', () => {
    vi.spyOn(appMemberProvider, 'useAppMember').mockImplementation(() => ({
      logout: vi.fn(),
      passwordLogin: vi.fn(),
      authorizationCodeLogin: vi.fn(),
      demoLogin: vi.fn(),
      isLoggedIn: true,
      role: 'User',
      appMemberGroups: [{ id: 1, name: 'Test Group', role: 'User' }],
      appMemberInfo,
      // @ts-expect-error null is not assignable to MutableRefObject
      appMemberInfoRef: null,
      addAppMemberGroup: vi.fn(),
      setAppMemberInfo: vi.fn(),
      setAppMemberSelectedGroup: vi.fn(),
      appMemberSelectedGroup: { id: 1, name: 'Test Group', role: 'User' },
    }));

    Object.assign(appDefinition, {
      members: {
        phoneNumber: {
          enable: true,
        },
      },
      layout: { enabledSettings: ['name', 'picture', 'languages', 'phoneNumber'] },
    });
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockImplementation(() => ({
      definition: appDefinition,
      demoMode: false,
      revision: 1,
      blockManifests: [],
    }));

    const { container } = render(
      <IntlProvider locale="en" messages={{}}>
        <ProfileSettings />
      </IntlProvider>,
    );
    expect(container.getElementsByClassName('field')).toMatchSnapshot();
  });

  it('should render no fields', () => {
    vi.spyOn(appMemberProvider, 'useAppMember').mockImplementation(() => ({
      logout: vi.fn(),
      passwordLogin: vi.fn(),
      authorizationCodeLogin: vi.fn(),
      demoLogin: vi.fn(),
      isLoggedIn: true,
      role: 'User',
      appMemberGroups: [{ id: 1, name: 'Test Group', role: 'User' }],
      appMemberInfo,
      // @ts-expect-error null is not assignable to MutableRefObject
      appMemberInfoRef: null,
      addAppMemberGroup: vi.fn(),
      setAppMemberInfo: vi.fn(),
      setAppMemberSelectedGroup: vi.fn(),
      appMemberSelectedGroup: { id: 1, name: 'Test Group', role: 'User' },
    }));

    Object.assign(appDefinition, {
      layout: { enabledSettings: [] },
    });
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockImplementation(() => ({
      definition: appDefinition,
      demoMode: false,
      revision: 1,
      blockManifests: [],
    }));

    const { container } = render(
      <IntlProvider locale="en" messages={{}}>
        <ProfileSettings />
      </IntlProvider>,
    );
    expect(container.getElementsByClassName('field')).toMatchInlineSnapshot('HTMLCollection []');
  });
});
