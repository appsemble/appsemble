import { type AppDefinition, type BuiltinPagesLayoutDefinition } from '@appsemble/lang-sdk';
import { noop } from '@appsemble/utils';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppDebug } from '../AppDebug/index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import { AppInvite } from '../AppInvite/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import { AppSettings } from '../AppSettings/index.js';
import * as appVariablesProvider from '../AppVariablesProvider/index.js';
import * as demoAppMembersProvider from '../DemoAppMembersProvider/index.js';
import { EditPassword } from '../EditPassword/index.js';
import { GroupInvite } from '../GroupInvite/index.js';
import { Login } from '../Login/index.js';
import { MenuProvider } from '../MenuProvider/index.js';
import { OpenIDCallback } from '../OpenIDCallback/index.js';
import { Register } from '../Register/index.js';
import { ResetPassword } from '../ResetPassword/index.js';
import { SentryFeedback } from '../SentryFeedback/index.js';
import * as serviceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider/index.js';
import { Verify } from '../Verify/index.js';

const settings = vi.hoisted(() => ({
  development: false,
  logins: [] as unknown[],
  showAppsembleLogin: true,
  showAppsembleOAuth2Login: false,
  showDemoLogin: false,
}));

vi.mock('../../utils/settings.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/settings.js')>();

  return {
    ...actual,
    sentryDsn: 'https://public@sentry.example.com/1',
    get development() {
      return settings.development;
    },
    get logins() {
      return settings.logins;
    },
    get showAppsembleLogin() {
      return settings.showAppsembleLogin;
    },
    get showAppsembleOAuth2Login() {
      return settings.showAppsembleOAuth2Login;
    },
    get showDemoLogin() {
      return settings.showDemoLogin;
    },
  };
});

// A page that navigates away unmounts, which would hide the state it renders on its way out.
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();

  return { ...actual, useNavigate: () => vi.fn() };
});

const appMember = {
  addAppMemberGroup: vi.fn(),
  appMemberGroups: [],
  appMemberInfo: undefined as unknown,
  appMemberRoles: [] as string[],
  appMemberSelectedGroup: undefined as unknown,
  cancelTotpLogin: vi.fn(),
  isLoggedIn: false,
  logout: vi.fn(),
  passwordLogin: vi.fn(),
  setAppMemberSelectedGroup: vi.fn(),
  totpLogin: vi.fn(),
  totpPending: undefined as unknown,
};

function mockApp(layout: AppDefinition['layout'] = {}): void {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: {
      name: 'Test App',
      defaultPage: 'Home',
      layout,
      pages: [
        { name: 'Home', blocks: [] },
        { name: 'About', blocks: [] },
      ],
      security: { default: { policy: 'everyone', role: 'User' }, roles: { User: {} } },
    } as unknown as AppDefinition,
    demoMode: false,
    revision: 1,
    blockManifests: [],
  });
}

beforeEach(() => {
  // The title bar renders into the navbar the app shell provides.
  const navbar = document.createElement('div');
  navbar.className = 'navbar';
  document.body.append(navbar);
  Object.assign(settings, {
    development: false,
    logins: [],
    showAppsembleLogin: true,
    showAppsembleOAuth2Login: false,
    showDemoLogin: false,
  });
  Object.assign(appMember, {
    appMemberInfo: undefined,
    appMemberRoles: [],
    appMemberSelectedGroup: undefined,
    isLoggedIn: false,
    totpPending: undefined,
  });
  mockApp();
  vi.spyOn(appMemberProvider, 'useAppMember').mockImplementation(() => appMember as never);
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
    demoAppMembers: [],
    refetchDemoAppMembers: vi.fn(),
  } as never);
  vi.spyOn(serviceWorkerRegistrationProvider, 'useServiceWorkerRegistration').mockReturnValue(
    {} as never,
  );
});

afterEach(() => {
  document.body.innerHTML = '';
});

function renderRoute(element: ReactNode, path = '/en/Page'): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={[path]}>
        <MenuProvider>
          <Routes>
            <Route element={element} path="/:lang/*" />
          </Routes>
        </MenuProvider>
      </MemoryRouter>
    </IntlProvider>,
  );
}

function generatedCss(): string {
  return [...document.head.querySelectorAll('style[data-page-grid-css]')]
    .map((style) => style.textContent)
    .join('');
}

interface RouteCase {
  /**
   * The name the page renders as `data-appsemble-page`.
   */
  page: string;

  /**
   * The state the page renders as `data-appsemble-page-state`.
   */
  state: string;

  /**
   * Bring the app and the API in the shape this state needs.
   */
  setup?: () => void;

  /**
   * Render the route.
   */
  render: () => void;

  /**
   * Drive the page into its state, once it has rendered.
   */
  act?: () => Promise<void> | void;
}

const invite = { email: 'member@example.com', groupId: 1, groupName: 'Crew', role: 'Member' };

async function submitForm(): Promise<void> {
  fireEvent.submit(document.querySelector('form')!);
  await waitFor(() => expect(vi.mocked(axios.post).mock.calls).not.toHaveLength(0));
}

const cases: RouteCase[] = [
  {
    page: 'login',
    state: 'permission-error',
    setup() {
      Object.assign(settings, { showAppsembleLogin: false, showAppsembleOAuth2Login: false });
    },
    render: () => renderRoute(<Login />, '/en/Login'),
  },
  {
    page: 'login',
    state: 'demo',
    setup() {
      settings.showDemoLogin = true;
    },
    render: () => renderRoute(<Login />, '/en/Login'),
  },
  {
    page: 'login',
    state: 'totp-setup',
    setup() {
      appMember.totpPending = { memberId: 'member', totpEnabled: false };
      vi.spyOn(axios, 'post').mockReturnValue(new Promise(noop));
    },
    render: () => renderRoute(<Login />, '/en/Login'),
  },
  {
    page: 'login',
    state: 'totp',
    setup() {
      appMember.totpPending = { memberId: 'member', totpEnabled: true };
    },
    render: () => renderRoute(<Login />, '/en/Login'),
  },
  { page: 'login', state: 'form', render: () => renderRoute(<Login />, '/en/Login') },
  { page: 'register', state: 'form', render: () => renderRoute(<Register />, '/en/Register') },
  {
    page: 'reset-password',
    state: 'form',
    render: () => renderRoute(<ResetPassword />, '/en/Reset-Password'),
  },
  {
    page: 'reset-password',
    state: 'success',
    setup() {
      vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
    },
    render: () => renderRoute(<ResetPassword />, '/en/Reset-Password'),
    act: submitForm,
  },
  {
    page: 'edit-password',
    state: 'form',
    render: () => renderRoute(<EditPassword />, '/en/Edit-Password?token=abc'),
  },
  {
    page: 'edit-password',
    state: 'success',
    setup() {
      vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
    },
    render: () => renderRoute(<EditPassword />, '/en/Edit-Password?token=abc'),
    act: submitForm,
  },
  {
    page: 'verify',
    state: 'loading',
    setup() {
      vi.spyOn(axios, 'post').mockReturnValue(new Promise(noop));
    },
    render: () => renderRoute(<Verify />, '/en/Verify?token=abc'),
  },
  {
    page: 'verify',
    state: 'success',
    setup() {
      vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
    },
    render: () => renderRoute(<Verify />, '/en/Verify?token=abc'),
  },
  {
    page: 'verify',
    state: 'error',
    setup() {
      vi.spyOn(axios, 'post').mockRejectedValue(new Error('nope'));
    },
    render: () => renderRoute(<Verify />, '/en/Verify?token=abc'),
  },
  {
    page: 'app-invite',
    state: 'loading',
    setup() {
      vi.spyOn(axios, 'get').mockReturnValue(new Promise(noop));
    },
    render: () => renderRoute(<AppInvite />, '/en/App-Invite?token=abc'),
  },
  {
    page: 'app-invite',
    state: 'error',
    setup() {
      vi.spyOn(axios, 'get').mockRejectedValue(new Error('nope'));
    },
    render: () => renderRoute(<AppInvite />, '/en/App-Invite?token=abc'),
  },
  {
    page: 'app-invite',
    state: 'member',
    setup() {
      appMember.appMemberInfo = { name: 'Jane', email: invite.email };
      vi.spyOn(axios, 'get').mockResolvedValue({ data: invite });
    },
    render: () => renderRoute(<AppInvite />, '/en/App-Invite?token=abc'),
  },
  {
    page: 'app-invite',
    state: 'form',
    setup() {
      vi.spyOn(axios, 'get').mockResolvedValue({ data: invite });
    },
    render: () => renderRoute(<AppInvite />, '/en/App-Invite?token=abc'),
  },
  {
    page: 'app-invite',
    state: 'declined',
    setup() {
      vi.spyOn(axios, 'get').mockResolvedValue({ data: invite });
      vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
    },
    render: () => renderRoute(<AppInvite />, '/en/App-Invite?token=abc'),
    async act() {
      fireEvent.click(await screen.findByText('Decline'));
    },
  },
  {
    page: 'app-invite',
    state: 'accepted',
    setup() {
      vi.spyOn(axios, 'get').mockResolvedValue({ data: invite });
      vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
    },
    render: () => renderRoute(<AppInvite />, '/en/App-Invite?token=abc'),
    async act() {
      await screen.findByText('Accept');
      fireEvent.change(document.querySelector('input[name="password"]')!, {
        target: { value: 'password' },
      });
      await submitForm();
    },
  },
  {
    page: 'group-invite',
    state: 'loading',
    setup() {
      appMember.isLoggedIn = true;
      appMember.appMemberInfo = { name: 'Jane', email: invite.email };
      vi.spyOn(axios, 'get').mockReturnValue(new Promise(noop));
    },
    render: () => renderRoute(<GroupInvite />, '/en/Group-Invite?token=abc'),
  },
  {
    page: 'group-invite',
    state: 'error',
    setup() {
      appMember.isLoggedIn = true;
      appMember.appMemberInfo = { name: 'Jane', email: invite.email };
      vi.spyOn(axios, 'get').mockRejectedValue(new Error('nope'));
    },
    render: () => renderRoute(<GroupInvite />, '/en/Group-Invite?token=abc'),
  },
  {
    page: 'group-invite',
    state: 'form',
    setup() {
      appMember.isLoggedIn = true;
      appMember.appMemberInfo = { name: 'Jane', email: invite.email };
      vi.spyOn(axios, 'get').mockResolvedValue({ data: invite });
    },
    render: () => renderRoute(<GroupInvite />, '/en/Group-Invite?token=abc'),
  },
  {
    page: 'group-invite',
    state: 'declined',
    setup() {
      appMember.isLoggedIn = true;
      appMember.appMemberInfo = { name: 'Jane', email: invite.email };
      vi.spyOn(axios, 'get').mockResolvedValue({ data: invite });
      vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
    },
    render: () => renderRoute(<GroupInvite />, '/en/Group-Invite?token=abc'),
    async act() {
      fireEvent.click(await screen.findByText('Decline'));
    },
  },
  {
    page: 'group-invite',
    state: 'accepted',
    setup() {
      appMember.isLoggedIn = true;
      appMember.appMemberInfo = { name: 'Jane', email: invite.email };
      vi.spyOn(axios, 'get').mockResolvedValue({ data: invite });
      vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
    },
    render: () => renderRoute(<GroupInvite />, '/en/Group-Invite?token=abc'),
    async act() {
      fireEvent.click(await screen.findByText('Accept'));
    },
  },
  {
    page: 'settings',
    state: 'default',
    setup() {
      appMember.isLoggedIn = true;
    },
    render: () => renderRoute(<AppSettings />, '/en/Settings'),
  },
  {
    page: 'feedback',
    state: 'form',
    render: () => renderRoute(<SentryFeedback />, '/en/Feedback'),
  },
  { page: 'debug', state: 'default', render: () => renderRoute(<AppDebug />, '/en/debug') },
  {
    page: 'openid-callback',
    state: 'error',
    setup() {
      sessionStorage.setItem('oauth2Connecting', JSON.stringify({ state: 'abc', redirect: '' }));
    },
    render: () => renderRoute(<OpenIDCallback />, '/en/Callback?error=access_denied&state=abc'),
  },
];

async function renderCase(routeCase: RouteCase): Promise<HTMLElement> {
  routeCase.setup?.();
  routeCase.render();
  await routeCase.act?.();

  const root = await waitFor(() => {
    const element = document.querySelector<HTMLElement>('[data-appsemble-page]')!;
    expect(element.dataset.appsemblePageState).toBe(routeCase.state);
    return element;
  });
  return root;
}

describe.each(cases)('$page $state', (routeCase) => {
  it('should render one page root with the markers of its state', async () => {
    const root = await renderCase(routeCase);

    expect(document.querySelectorAll('[data-appsemble-page]')).toHaveLength(1);
    expect(root.tagName).toBe('MAIN');
    expect(root.dataset.appsemblePage).toBe(routeCase.page);
    expect(root.querySelectorAll('main')).toHaveLength(0);
    expect(root.querySelector('[data-grid-area="content"]')).not.toBeNull();
  });

  it('should render the title bar', async () => {
    await renderCase(routeCase);

    const navbar = within(document.querySelector<HTMLElement>('.navbar')!);
    expect(navbar.getByRole('heading', { level: 2 }).textContent).not.toBe('');
  });

  it('should render the bottom navigation inside a layout that places it', async () => {
    const builtinPages: BuiltinPagesLayoutDefinition = {
      mobile: { layout: { columns: 1, template: ['content', 'bottom-navigation'] } },
    };
    mockApp({ builtinPages, navigation: 'bottom' });

    const root = await renderCase(routeCase);

    expect(root.querySelector('nav.bottom-nav')).not.toBeNull();
    expect(document.querySelectorAll('nav.bottom-nav')).toHaveLength(1);
  });

  it('should generate no grid css without a layout', async () => {
    await renderCase(routeCase);

    expect(generatedCss()).toBe('');
  });

  it('should render its name as the only heading with a layout that names the title', async () => {
    const builtinPages: BuiltinPagesLayoutDefinition = {
      mobile: { layout: { columns: 1, template: ['title', 'content'] } },
    };
    mockApp({ builtinPages });

    await renderCase(routeCase);

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].dataset.gridArea).toBe('title');
  });

  it('should keep the content region inside the grid without a wrapper of its own', async () => {
    const builtinPages: BuiltinPagesLayoutDefinition = {
      mobile: { layout: { columns: 1, template: ['content'] } },
    };
    mockApp({ builtinPages });

    const root = await renderCase(routeCase);

    expect(root.querySelector('[data-grid-area="content"]')).not.toBeNull();
    expect(generatedCss()).toContain('display: grid');
  });
});

describe('without a layout', () => {
  it('should keep the heading of the password pages a title of their own', async () => {
    await renderCase(cases.find((c) => c.page === 'reset-password' && c.state === 'form')!);

    // The title of the page is rendered by the page itself, outside of any grid area.
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].dataset.gridArea).toBeUndefined();
  });
});
