import { type AppDefinition } from '@appsemble/lang-sdk';
import { render, screen, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';

vi.mock('../AppDebug/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AppDebug: () => <p>Debug route</p>,
}));
vi.mock('../AppInvite/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AppInvite: () => <p>App invite route</p>,
}));
vi.mock('../AppSettings/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AppSettings: () => <p>Settings route</p>,
}));
vi.mock('../EditPassword/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  EditPassword: () => <p>Edit password route</p>,
}));
vi.mock('../GroupInvite/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  GroupInvite: () => <p>Group invite route</p>,
}));
vi.mock('../Login/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Login: () => <p>Login route</p>,
}));
vi.mock('../OpenIDCallback/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OpenIDCallback: () => <p>Callback route</p>,
}));
vi.mock('../Page/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Page: () => <p>Page route</p>,
}));
vi.mock('../Register/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Register: () => <p>Register route</p>,
}));
vi.mock('../ResetPassword/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ResetPassword: () => <p>Reset password route</p>,
}));
vi.mock('../SentryFeedback/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SentryFeedback: () => <p>Feedback route</p>,
}));
vi.mock('../Verify/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Verify: () => <p>Verify route</p>,
}));

function LocationProbe(): ReactNode {
  const { hash, pathname, search } = useLocation();
  return <p>{`${pathname}${search}${hash}`}</p>;
}

interface RenderOptions {
  appMessages?: Record<string, string>;
  messagesReady?: boolean;
}

function renderRoutes(
  path: string,
  { appMessages = {}, messagesReady = true }: RenderOptions = {},
): void {
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    getAppMessage: ({ defaultMessage, id }: { defaultMessage?: string; id: string }) => ({
      format: () => appMessages[id] ?? defaultMessage ?? '',
    }),
    getMessage: () => ({ format: () => '' }),
    messagesReady,
  } as never);

  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            element={
              <>
                <LocationProbe />
                <AppRoutes />
              </>
            }
            path="/:lang/*"
          />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

beforeEach(() => {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: {
      name: 'Test App',
      defaultPage: 'Home',
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
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberRoles: [],
    isLoggedIn: false,
  } as never);
});

describe('AppRoutes', () => {
  it('should render a built-in route at its English path when it is not translated', async () => {
    renderRoutes('/en/Settings?tab=profile');
    await waitFor(() => expect(screen.getByText('Settings route')).not.toBeNull());
    expect(screen.getByText('/en/Settings?tab=profile')).not.toBeNull();
  });

  it('should redirect an English built-in path to the translated route', async () => {
    renderRoutes('/nl/Settings?tab=profile#password', {
      appMessages: { 'routes.Settings': 'Preferences' },
    });
    await waitFor(() =>
      expect(screen.getByText('/nl/Preferences?tab=profile#password')).not.toBeNull(),
    );
    expect(screen.getByText('Settings route')).not.toBeNull();
  });

  it('should render a translated built-in route at its translated path', async () => {
    renderRoutes('/nl/InLoggen', { appMessages: { 'routes.Login': 'InLoggen' } });
    await waitFor(() => expect(screen.getByText('Login route')).not.toBeNull());
    expect(screen.getByText('/nl/InLoggen')).not.toBeNull();
  });

  it('should redirect an unknown path to the translated default page', async () => {
    renderRoutes('/nl', { appMessages: { 'pages.home': 'Start' } });
    await waitFor(() => expect(screen.getByText('/nl/start')).not.toBeNull());
    expect(screen.getByText('Page route')).not.toBeNull();
  });

  it('should render the loader until the messages of the current language are loaded', () => {
    renderRoutes('/nl/Settings', {
      appMessages: { 'routes.Settings': 'Preferences' },
      messagesReady: false,
    });
    expect(document.querySelector('.appsemble-loader')).not.toBeNull();
    expect(screen.queryByText('Settings route')).toBeNull();
    expect(screen.getByText('/nl/Settings')).not.toBeNull();
  });
});
