import { type AppDefinition, type PageDefinition } from '@appsemble/lang-sdk';
import { type BootstrapParams } from '@appsemble/sdk';
import { MetaProvider } from '@appsemble/react-components';
import { noop } from '@appsemble/utils';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import { Page } from './index.js';
import * as bootstrapper from '../../utils/bootstrapper.js';
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

function LocationProbe(): ReactNode {
  const { hash, pathname, search } = useLocation();
  return <p>{`${pathname}${search}${hash}`}</p>;
}

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
    pageManifests: { events: { listen: { data: {} } } },
  } as never);
}

function renderApp(path = '/en/home'): () => void {
  const app = (): ReactNode => (
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={[path]}>
        <MenuProvider>
          <VerifyBanner />
          <Routes>
            <Route element={<Page />} path="/:lang/:pageId/*" />
          </Routes>
        </MenuProvider>
      </MemoryRouter>
    </IntlProvider>
  );
  const { rerender } = render(app());
  return () => rerender(app());
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

it('should redirect a canonical page path to the translated path', async () => {
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    getAppMessage: ({ defaultMessage, id }: { defaultMessage?: string; id: string }) => ({
      format: () => (id === 'pages.home' ? 'Start' : defaultMessage),
    }),
    getMessage: () => ({ format: () => '' }),
  } as never);
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/en/home?foo=bar#section']}>
        <MenuProvider>
          <LocationProbe />
          <Routes>
            <Route element={<Page />} path="/:lang/:pageId/*" />
          </Routes>
        </MenuProvider>
      </MemoryRouter>
    </IntlProvider>,
  );

  await waitFor(() => expect(screen.getByText('/en/start?foo=bar#section')).not.toBeNull());
  await waitFor(() => expect(document.querySelector('main')).not.toBeNull());
});

it('should redirect a container page to the translated path of its first sub page', async () => {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: {
      name: 'Test App',
      defaultPage: 'Home',
      pages: [
        { name: 'Home', blocks: [block] },
        { name: 'Reports', type: 'container', pages: [{ name: 'Daily', blocks: [block] }] },
      ],
    } as AppDefinition,
    demoMode: false,
    revision: 1,
    blockManifests,
  } as never);
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    getAppMessage: ({ defaultMessage, id }: { defaultMessage?: string; id: string }) => ({
      format: () => (id === 'pages.daily' ? 'Everyday' : defaultMessage),
    }),
    getMessage: () => ({ format: () => '' }),
  } as never);
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/en/reports?foo=bar']}>
        <MenuProvider>
          <LocationProbe />
          <Routes>
            <Route element={<Page />} path="/:lang/:pageId/*" />
          </Routes>
        </MenuProvider>
      </MemoryRouter>
    </IntlProvider>,
  );

  await waitFor(() => expect(screen.getByText('/en/everyday?foo=bar')).not.toBeNull());
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

it('should resolve tab.name to its own tab when the tab list arrives after the tab rendered', async () => {
  const topics = [{ name: 'Alpha' }, { name: 'Beta' }];
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: {
      name: 'Test App',
      defaultPage: 'Topics',
      pages: [
        {
          name: 'Topics',
          type: 'tabs',
          actions: { onLoad: { type: 'event', event: 'topics', remapBefore: { static: topics } } },
          definition: {
            events: { listen: { data: 'topics' } },
            foreach: {
              name: { prop: 'name' },
              blocks: [{ ...block, events: { emit: { data: 'topics' } } }],
            },
          },
        },
      ],
    } as AppDefinition,
    demoMode: false,
    revision: 1,
    blockManifests: [{ ...blockManifests[0], events: { emit: { data: {} } } }],
    pageManifests: { events: { listen: { data: {} } } },
  } as never);
  let tabBlock: BootstrapParams | undefined;
  vi.spyOn(bootstrapper, 'callBootstrap').mockImplementation((manifest, params) => {
    tabBlock = params;
    return Promise.resolve();
  });
  renderApp('/en/topics/beta');
  await waitFor(() => expect(tabBlock).toBeDefined());

  let tabName: unknown;
  await act(async () => {
    // The tab list loads again while the Beta tab is shown. The block reads its tab name right
    // after the list arrived, before the tabs page renders it.
    await tabBlock!.events.emit.data(topics);
    tabName = tabBlock!.utils.remap({ 'tab.name': null }, null);
  });

  expect(tabName).toBe('Beta');
});

it('should name the main landmark after the page when the title bar shows the app name', async () => {
  mockApp({
    name: 'Test App',
    defaultPage: 'Home',
    layout: { titleBarText: 'appName' },
    pages: [{ name: 'Home', blocks: [block] }],
  } as AppDefinition);
  renderApp();

  expect(await screen.findByRole('main', { name: 'Home' })).not.toBeNull();
});

describe('page not found', () => {
  const security = {
    default: { policy: 'everyone', role: 'User' },
    roles: { User: {}, Admin: {} },
  };

  function renderAt(path: string): void {
    render(
      <IntlProvider locale="en" messages={{}}>
        <MemoryRouter initialEntries={[path]}>
          <MetaProvider description="" title="Test App">
            <MenuProvider>
              <LocationProbe />
              <Routes>
                <Route element={<Page />} path="/:lang/:pageId/*" />
              </Routes>
            </MenuProvider>
          </MetaProvider>
        </MemoryRouter>
      </IntlProvider>,
    );
  }

  function mockMember(isLoggedIn: boolean, appMemberRoles: string[] = []): void {
    vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
      appMemberGroups: [],
      appMemberInfoRef: { current: undefined },
      appMemberRoles,
      appMemberSelectedGroup: undefined,
      isLoggedIn,
    } as never);
  }

  it('should redirect to the default page at an unknown page path when the app defines no not found page', async () => {
    renderAt('/en/does-not-exist');

    expect(await screen.findByRole('main', { name: 'Home' })).not.toBeNull();
    expect(screen.getByText('/en/home')).not.toBeNull();
  });

  it('should show the built-in page not found page at an unknown page path', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      notFoundPage: true,
      pages: [{ name: 'Home', blocks: [block] }],
    } as AppDefinition);
    renderAt('/en/does-not-exist?foo=bar');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).not.toBeNull();
    expect(screen.getByText('/en/does-not-exist?foo=bar')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Go to the home page' }).getAttribute('href')).toBe(
      '/en',
    );
    expect(document.title).toBe('Page not found · Test App');
  });

  it('should show the not found page of the app at an unknown page path, even to guests', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      notFoundPage: 'Lost',
      security,
      pages: [
        { name: 'Home', blocks: [block] },
        { name: 'Lost', roles: ['Admin'], blocks: [block] },
      ],
    } as AppDefinition);
    renderAt('/en/does-not-exist');

    expect(await screen.findByRole('main', { name: 'Lost' })).not.toBeNull();
    expect(screen.getByText('/en/does-not-exist')).not.toBeNull();
  });

  it('should show the not found page of the app for path segments that match no parameter', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      notFoundPage: 'Lost',
      pages: [
        { name: 'Home', blocks: [block] },
        { name: 'Item', parameters: ['id'], blocks: [block] },
        { name: 'Lost', blocks: [block] },
      ],
    } as AppDefinition);
    renderAt('/en/item/1/extra');

    expect(await screen.findByRole('main', { name: 'Lost' })).not.toBeNull();
    expect(screen.getByText('/en/item/1/extra')).not.toBeNull();
  });

  it('should keep showing a page for its parameters when the app defines a not found page', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      notFoundPage: 'Lost',
      pages: [
        { name: 'Home', blocks: [block] },
        { name: 'Item', parameters: ['id'], blocks: [block] },
        { name: 'Lost', blocks: [block] },
      ],
    } as AppDefinition);
    renderAt('/en/item/1');

    expect(await screen.findByRole('main', { name: 'Item' })).not.toBeNull();
  });

  it('should not pass the data of the previous page to the not found page', async () => {
    const mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);
    onTestFinished(() => mock.restore());
    mock.onGet('https://example.com/item').reply(200, { name: 'Ada' });
    const blocks: BootstrapParams[] = [];
    vi.spyOn(bootstrapper, 'callBootstrap').mockImplementation((manifest, params) => {
      blocks.push(params);
      return Promise.resolve();
    });
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      notFoundPage: 'Lost',
      pages: [
        { name: 'Home', blocks: [block] },
        {
          name: 'Item',
          parameters: ['id'],
          actions: { onLoad: { type: 'request', url: 'https://example.com/item', proxy: false } },
          blocks: [block],
        },
        { name: 'Lost', blocks: [block] },
      ],
    } as AppDefinition);
    render(
      <IntlProvider locale="en" messages={{}}>
        <MemoryRouter initialEntries={['/en/item/1']}>
          <MenuProvider>
            <Link to="/en/item/1/extra">extra</Link>
            <Routes>
              <Route element={<Page />} path="/:lang/:pageId/*" />
            </Routes>
          </MenuProvider>
        </MemoryRouter>
      </IntlProvider>,
    );
    await waitFor(() => expect(blocks.map(({ data }) => data)).toStrictEqual([{ name: 'Ada' }]));

    fireEvent.click(screen.getByText('extra'));

    expect(await screen.findByRole('main', { name: 'Lost' })).not.toBeNull();
    await waitFor(() => expect(blocks.at(-1)?.data).toStrictEqual({}));
  });

  it('should not mark the page of the URL as current in the navigation when the not found page is shown', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      notFoundPage: 'Lost',
      layout: { navigation: 'bottom' },
      pages: [
        { name: 'Home', blocks: [block] },
        { name: 'About', blocks: [block] },
        { name: 'Lost', hideNavTitle: true, blocks: [block] },
      ],
    } as AppDefinition);
    renderAt('/en/about/extra');

    expect(await screen.findByRole('main', { name: 'Lost' })).not.toBeNull();
    expect(screen.getByRole('link', { name: 'About' }).getAttribute('aria-current')).toBe('false');
  });

  it('should leave the sub paths of a tabs page to its tabs when the app defines a not found page', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      notFoundPage: 'Lost',
      pages: [
        { name: 'Home', blocks: [block] },
        {
          name: 'Details',
          type: 'tabs',
          tabs: [
            { name: 'First', blocks: [block] },
            { name: 'Second', blocks: [block] },
          ],
        },
        { name: 'Lost', blocks: [block] },
      ],
    } as AppDefinition);
    renderAt('/en/details/second');

    expect(await screen.findByRole('main', { name: 'Details' })).not.toBeNull();
    expect(screen.getByText('/en/details/second')).not.toBeNull();
  });

  it('should show the not found page of the app for the sub paths of a container page', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      notFoundPage: 'Lost',
      pages: [
        { name: 'Home', blocks: [block] },
        { name: 'Reports', type: 'container', pages: [{ name: 'Daily', blocks: [block] }] },
        { name: 'Lost', blocks: [block] },
      ],
    } as AppDefinition);
    renderAt('/en/reports/extra');

    expect(await screen.findByRole('main', { name: 'Lost' })).not.toBeNull();
    expect(screen.getByText('/en/reports/extra')).not.toBeNull();
  });

  it('should redirect to the login page for an existing page that requires a login', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      security,
      pages: [
        { name: 'Home', blocks: [block] },
        { name: 'About', blocks: [block] },
      ],
    } as AppDefinition);
    renderAt('/en/about');

    expect(
      await screen.findByText(`/en/Login?${new URLSearchParams({ redirect: '/en/about' })}`),
    ).not.toBeNull();
  });

  it('should redirect a member to the default page for an existing page they may not view', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      security,
      pages: [
        { name: 'Home', blocks: [block] },
        { name: 'Admin', roles: ['Admin'], blocks: [block] },
      ],
    } as AppDefinition);
    mockMember(true, ['User']);
    renderAt('/en/admin');

    expect(await screen.findByText('/en/home')).not.toBeNull();
  });

  it('should not redirect a member who may not view a page to the not found page', async () => {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      notFoundPage: 'Lost',
      security,
      pages: [
        { name: 'Home', roles: ['Admin'], blocks: [block] },
        { name: 'Lost', blocks: [block] },
        { name: 'Reports', roles: ['User'], blocks: [block] },
      ],
    } as AppDefinition);
    mockMember(true, ['User']);
    renderAt('/en/home');

    expect(await screen.findByText('/en/reports')).not.toBeNull();
  });
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

describe('page initial data', () => {
  let mock: MockAdapter;
  let blocks: BootstrapParams[];

  function mockPages(home?: Partial<PageDefinition>): void {
    mockApp({
      name: 'Test App',
      defaultPage: 'Home',
      layout: { navigation: 'bottom' },
      pages: [
        {
          name: 'Home',
          actions: { onLoad: { type: 'request', url: 'https://example.com/home', proxy: false } },
          blocks: [block],
          ...home,
        },
        {
          name: 'Other',
          actions: { onLoad: { type: 'request', url: 'https://example.com/other', proxy: false } },
          blocks: [block],
        },
      ],
    } as AppDefinition);
  }

  beforeEach(() => {
    blocks = [];
    mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);
    vi.spyOn(bootstrapper, 'callBootstrap').mockImplementation((manifest, params) => {
      blocks.push(params);
      return Promise.resolve();
    });
  });

  afterEach(() => {
    mock.restore();
  });

  it('should initialize blocks with the completed asynchronous onLoad result', async () => {
    let respond!: () => void;
    mock.onGet('https://example.com/home').reply(
      () =>
        new Promise((resolve) => {
          respond = () => resolve([200, { name: 'Ada' }]);
        }),
    );
    mockPages();
    renderApp();
    await waitFor(() => expect(respond).toBeDefined());
    respond();
    await waitFor(() => expect(blocks.map(({ data }) => data)).toStrictEqual([{ name: 'Ada' }]));
  });

  it('should pass the page onLoad result to a static tab', async () => {
    mock.onGet('https://example.com/home').reply(200, { name: 'Grace' });
    mockPages({ type: 'tabs', tabs: [{ name: 'Details', blocks: [block] }] });
    renderApp();
    await waitFor(() => expect(blocks.map(({ data }) => data)).toStrictEqual([{ name: 'Grace' }]));
  });

  it('should initialize the next page with its own result when a previous request finishes late', async () => {
    let respondHome!: () => void;
    mock.onGet('https://example.com/home').reply(
      () =>
        new Promise((resolve) => {
          respondHome = () => resolve([200, { name: 'Ada' }]);
        }),
    );
    mock.onGet('https://example.com/other').reply(200, { name: 'Grace' });
    mockPages();
    renderApp();
    await waitFor(() => expect(respondHome).toBeDefined());
    fireEvent.click(screen.getByRole('link', { name: 'Other' }));
    await waitFor(() => expect(blocks.map(({ data }) => data)).toStrictEqual([{ name: 'Grace' }]));
    await act(async () => {
      respondHome();
      await Promise.resolve();
    });
    expect(blocks.map(({ data }) => data)).toStrictEqual([{ name: 'Grace' }]);
  });

  it('should initialize blocks of a revisited page with its new onLoad result', async () => {
    mock
      .onGet('https://example.com/home')
      .replyOnce(200, { name: 'Ada' })
      .onGet('https://example.com/home')
      .replyOnce(200, { name: 'Grace' });
    mock.onGet('https://example.com/other').reply(() => new Promise(noop));
    mockPages();
    renderApp();
    await waitFor(() => expect(blocks.map(({ data }) => data)).toStrictEqual([{ name: 'Ada' }]));
    fireEvent.click(screen.getByRole('link', { name: 'Other' }));
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    await waitFor(() =>
      expect(blocks.map(({ data }) => data)).toStrictEqual([{ name: 'Ada' }, { name: 'Grace' }]),
    );
  });

  it('should initialize blocks on a page without an onLoad action', async () => {
    mockPages({ actions: undefined });
    renderApp();
    await waitFor(() => expect(blocks).toHaveLength(1));
  });

  it('should initialize blocks when the onLoad action fails', async () => {
    const errors: unknown[] = [];
    const onUnhandledRejection = (error: unknown): void => {
      errors.push(error);
    };
    // Vitest reports an unhandled rejection unless the test listens for it.
    process.on('unhandledRejection', onUnhandledRejection);
    onTestFinished(() => {
      process.off('unhandledRejection', onUnhandledRejection);
    });
    mock.onGet('https://example.com/home').reply(500);
    mockPages();
    renderApp();
    await waitFor(() => expect(blocks).toHaveLength(1));
    await waitFor(() => expect(errors).toHaveLength(1));
  });

  it('should keep blocks mounted when the page actions change', async () => {
    mock.onGet('https://example.com/home').reply(200, { name: 'Ada' });
    mockPages();
    const rerender = renderApp();
    await waitFor(() => expect(blocks).toHaveLength(1));
    let removed = false;
    blocks[0].utils.addCleanup(() => {
      removed = true;
    });

    // The page actions depend on the push notification state, so they are rebuilt and onLoad runs
    // again.
    vi.spyOn(serviceWorkerRegistrationProvider, 'useServiceWorkerRegistration').mockReturnValue({
      permission: 'granted',
    } as never);
    rerender();
    await waitFor(() => expect(mock.history.get).toHaveLength(2));

    expect(removed).toBe(false);
  });
});
