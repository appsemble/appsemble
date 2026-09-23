import { type AppDefinition } from '@appsemble/lang-sdk';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Page } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as appVariablesProvider from '../AppVariablesProvider/index.js';
import * as demoAppMembersProvider from '../DemoAppMembersProvider/index.js';
import { MenuProvider } from '../MenuProvider/index.js';
import * as serviceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider/index.js';
import { VerifyBanner } from '../VerifyBanner/index.js';

vi.mock('../TitleBar/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- This mocks a component export.
  AppBar: ({ children }: { readonly children?: ReactNode }) => (
    <div data-testid="app-bar">{children}</div>
  ),
}));

// A hidden block renders nothing, which keeps the page from redirecting as an empty one does.
const block = { type: 'test', version: '0.0.0' };

function BuiltinPage(): ReactNode {
  return <span>Settings</span>;
}

const blockManifests = [
  {
    name: '@appsemble/test',
    version: '0.0.0',
    layout: 'hidden',
    files: ['test.js'],
    languages: [],
  },
];

function mockApp(definition: AppDefinition): void {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition,
    demoMode: false,
    revision: 1,
    blockManifests,
  } as never);
}

function renderApp(): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/en/home']}>
        <MenuProvider>
          <VerifyBanner />
          <Routes>
            <Route element={<Page />} path="/:lang/:pageId/*" />
          </Routes>
        </MenuProvider>
      </MemoryRouter>
    </IntlProvider>,
  );
}

beforeEach(() => {
  // The page writes its theme to the stylesheet link the app shell renders.
  const bulma = document.createElement('link');
  bulma.id = 'bulma-style-app';
  document.head.append(bulma);
  // The block watches the mobile breakpoint, which jsdom does not implement.
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: {
      name: 'Test App',
      defaultPage: 'Home',
      layout: { navigation: 'left-menu' },
      pages: [
        { name: 'Home', navigation: 'bottom', blocks: [block] },
        { name: 'About', blocks: [block] },
      ],
    } as AppDefinition,
    demoMode: false,
    revision: 1,
    blockManifests,
  } as never);
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberGroups: [],
    appMemberInfoRef: { current: undefined },
    appMemberRoles: [],
    appMemberSelectedGroup: undefined,
    appMemberInfo: undefined,
    isLoggedIn: false,
  } as never);
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    appMessageIds: [],
    getAppMessage: ({ defaultMessage }: { defaultMessage?: string }) => ({
      format: () => defaultMessage,
    }),
    getMessage: () => ({ format: () => '' }),
  } as never);
  vi.spyOn(appVariablesProvider, 'useAppVariables').mockReturnValue({
    getVariable: vi.fn(),
  } as never);
  vi.spyOn(demoAppMembersProvider, 'useDemoAppMembers').mockReturnValue({
    refetchDemoAppMembers: vi.fn(),
  } as never);
  vi.spyOn(serviceWorkerRegistrationProvider, 'useServiceWorkerRegistration').mockReturnValue(
    {} as never,
  );
});

afterEach(() => {
  document.getElementById('bulma-style-app')?.remove();
});

it('should leave its navigation behind when a built-in page replaces it', async () => {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/en/home']}>
        <MenuProvider>
          <Link to="/en/Settings">settings</Link>
          <Routes>
            <Route element={<BuiltinPage />} path="/:lang/Settings" />
            <Route element={<Page />} path="/:lang/:pageId/*" />
          </Routes>
        </MenuProvider>
      </MemoryRouter>
    </IntlProvider>,
  );
  await waitFor(() => expect(document.querySelector('nav.bottom-nav')).not.toBeNull());

  fireEvent.click(screen.getByText('settings'));

  await waitFor(() => expect(screen.getByText('Settings')).not.toBeNull());
  expect(document.querySelector('nav.bottom-nav')).toBeNull();
});

describe('reserved grid areas', () => {
  const layout = {
    mobile: { layout: { columns: 1, template: ['resend-banner', 'main', 'bottom-navigation'] } },
  };

  function mockUnverifiedMember(): void {
    vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
      appMemberGroups: [],
      appMemberInfoRef: { current: undefined },
      appMemberRoles: [],
      appMemberSelectedGroup: undefined,
      appMemberInfo: { email: 'test@example.com', email_verified: false },
      isLoggedIn: true,
    } as never);
  }

  it('should keep the bottom navigation outside a page grid that does not place it', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      layout: { navigation: 'bottom' },
      pages: [
        {
          name: 'Home',
          blocks: [block],
          layout: { mobile: { layout: { columns: 1, template: ['main'] } } },
        },
        { name: 'About', blocks: [block] },
      ],
    } as AppDefinition);
    renderApp();

    const nav = await waitFor(() => document.querySelector('nav.bottom-nav')!);
    expect(nav.closest('main')).toBeNull();
    expect(document.querySelectorAll('nav.bottom-nav')).toHaveLength(1);
  });

  it('should render the bottom navigation inside a page grid that places it', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      layout: { navigation: 'bottom' },
      pages: [
        { name: 'Home', blocks: [block], layout },
        { name: 'About', blocks: [block] },
      ],
    } as AppDefinition);
    renderApp();

    const nav = await waitFor(() => document.querySelector('nav.bottom-nav')!);
    expect(nav.closest('main')).not.toBeNull();
    expect(document.querySelectorAll('nav.bottom-nav')).toHaveLength(1);
  });

  it('should render no bottom navigation in a page grid when the app navigation is not bottom', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      layout: { navigation: 'left-menu' },
      pages: [
        { name: 'Home', blocks: [block], layout },
        { name: 'About', blocks: [block] },
      ],
    } as AppDefinition);
    renderApp();

    await waitFor(() => expect(document.querySelector('main')).not.toBeNull());
    expect(document.querySelector('nav.bottom-nav')).toBeNull();
  });

  it('should render the bottom navigation inside the built-in layout of the permission error', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      layout: {
        navigation: 'bottom',
        settings: 'navigation',
        builtinPages: {
          mobile: { layout: { columns: 1, template: ['content', 'bottom-navigation'] } },
        },
      },
      security: { default: { policy: 'invite', role: 'Admin' }, roles: { Admin: {} } },
      pages: [{ name: 'Home', blocks: [block], roles: ['Admin'] }],
    } as AppDefinition);
    vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
      appMemberGroups: [],
      appMemberInfoRef: { current: undefined },
      appMemberRoles: [],
      appMemberSelectedGroup: undefined,
      appMemberInfo: { email: 'test@example.com', email_verified: true },
      isLoggedIn: true,
    } as never);
    renderApp();

    const message = await screen.findByText(/misconfigured permissions/);
    const nav = message.closest('main')!.querySelector('nav.bottom-nav');
    expect(nav).not.toBeNull();
    expect(document.querySelectorAll('nav.bottom-nav')).toHaveLength(1);
  });

  it('should keep the banner above a page grid that does not place it', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      pages: [
        {
          name: 'Home',
          blocks: [block],
          layout: { mobile: { layout: { columns: 1, template: ['main'] } } },
        },
      ],
    } as AppDefinition);
    mockUnverifiedMember();
    renderApp();

    const banner = await screen.findByText(/verify your email address/);
    expect(banner.closest('main')).toBeNull();
    expect(screen.getAllByText(/verify your email address/)).toHaveLength(1);
  });

  it('should render the banner inside a page grid that places it', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      pages: [{ name: 'Home', blocks: [block], layout }],
    } as AppDefinition);
    mockUnverifiedMember();
    renderApp();

    const banner = await screen.findByText(/verify your email address/);
    expect(banner.closest('main')).not.toBeNull();
    expect(screen.getAllByText(/verify your email address/)).toHaveLength(1);
  });
});
