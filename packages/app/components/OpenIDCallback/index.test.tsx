import { render, screen, waitFor } from '@testing-library/preact';
import { Route } from 'wouter-preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OpenIDCallback } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import { AppIconProvider } from '../AppIconProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import { IntlProvider } from '../IntlProvider/index.js';
import { MessagesProvider } from '../MessagesProvider/index.js';

const { clearOAuth2State, loadOAuth2State } = vi.hoisted(() => ({
  clearOAuth2State: vi.fn(),
  loadOAuth2State: vi.fn(),
}));

vi.mock('@appsemble/web-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@appsemble/web-utils')>();

  return { ...actual, clearOAuth2State, loadOAuth2State };
});

// The app bar needs the whole app runtime around it, which has nothing to do with the callback.
// eslint-disable-next-line @typescript-eslint/naming-convention
vi.mock('../TitleBar/index.js', () => ({ AppBar: () => null }));

const authorizationCodeLogin = vi.fn();

function mockAppMember(overrides: Record<string, unknown> = {}): void {
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    getAppMessage: ({ defaultMessage }: { defaultMessage: string }) => ({
      format: () => defaultMessage,
    }),
    getMessage: () => ({ format: () => '' }),
  } as never);
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberRoles: [],
    authorizationCodeLogin,
    isLoggedIn: false,
    totpPending: null,
    ...overrides,
  } as never);
}

function renderCallback(query = 'code=abc&state=state-1'): void {
  window.history.replaceState(null, '', `/en/Callback?${query}`);
  render(
    <IntlProvider locale="en" messages={{}}>
      <AppIconProvider>
        <MessagesProvider>
          <Route path="/en/Login">
            <p>Login page</p>
          </Route>
          <Route path="/:lang/Callback">
            <OpenIDCallback />
          </Route>
          <Route path="/:lang/home">
            <p>Home page</p>
          </Route>
        </MessagesProvider>
      </AppIconProvider>
    </IntlProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  authorizationCodeLogin.mockImplementation(() => Promise.resolve());
  loadOAuth2State.mockReturnValue({ state: 'state-1', redirect: '/en/deep/link' });
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: {
      defaultPage: 'Home',
      name: 'Test App',
      pages: [{ name: 'Home', blocks: [] }],
    },
  } as never);
});

describe('OpenIDCallback', () => {
  it('should carry the stored redirect into the login', async () => {
    mockAppMember();

    renderCallback();

    await waitFor(() => {
      expect(authorizationCodeLogin).toHaveBeenCalledWith({
        code: 'abc',
        redirect_uri: `${window.location.origin}/Callback`,
        redirect: '/en/deep/link',
      });
    });
  });

  it.each([
    { case: 'no stored state', stored: null },
    { case: 'another stored state', stored: { state: 'state-2', redirect: '/en/deep/link' } },
  ])('should ask to log in again without logging in for $case', async ({ stored }) => {
    loadOAuth2State.mockReturnValue(stored);
    mockAppMember();

    renderCallback();

    expect(await screen.findByText('Login page')).not.toBeNull();
    expect(
      screen.getByText('Logging in could not be completed. Please log in again.'),
    ).not.toBeNull();
    expect(authorizationCodeLogin).not.toHaveBeenCalled();
  });

  it('should go back to the page before a callback that cannot be completed', async () => {
    loadOAuth2State.mockReturnValue(null);
    mockAppMember();
    window.history.replaceState(null, '', '/en/home');
    window.history.pushState(null, '', '/en/Callback');

    renderCallback();
    await screen.findByText('Login page');
    window.history.back();

    expect(await screen.findByText('Home page')).not.toBeNull();
  });

  it.each([
    { case: 'logged in', member: { isLoggedIn: true }, page: 'Home page' },
    {
      case: 'verifying TOTP',
      member: { totpPending: { totpEnabled: true, totpToken: 'token' } },
      page: 'Login page',
    },
  ])('should not ask a member who is $case to log in again', async ({ member, page }) => {
    // Going back to the callback after it handed off finds its state cleared.
    loadOAuth2State.mockReturnValue(null);
    mockAppMember(member);

    renderCallback();

    expect(await screen.findByText(page)).not.toBeNull();
    expect(
      screen.queryByText('Logging in could not be completed. Please log in again.'),
    ).toBeNull();
  });

  it('should clear the OAuth2 state when handing off to the TOTP challenge', async () => {
    mockAppMember({
      totpPending: { totpEnabled: false, totpToken: 'token', redirect: '/en/deep/link' },
    });

    renderCallback();

    // The login continues on the login page, which is where the second factor is verified.
    expect(await screen.findByText('Login page')).not.toBeNull();
    expect(clearOAuth2State).toHaveBeenCalledWith();
  });

  it('should send a member who logged in without a deep link to the default page', async () => {
    loadOAuth2State.mockReturnValue({ state: 'state-1' });
    mockAppMember({ isLoggedIn: true });

    renderCallback();

    expect(await screen.findByText('Home page')).not.toBeNull();
  });

  it.each([
    {
      query: 'error=access_denied&error_description=noRoleMatch&state=state-1',
      message:
        'Your account is not in a group that gives access to this app. Ask your administrator for access.',
    },
    { query: 'error=access_denied&state=state-1', message: 'Access was denied' },
    {
      query: 'error=invalid_request&state=state-1',
      message: 'An unexpected error occurred while logging in',
    },
  ])('should explain a failed login ($query)', async ({ message, query }) => {
    mockAppMember();

    renderCallback(query);

    expect(await screen.findByText(message)).not.toBeNull();
  });

  it('should clear the OAuth2 state once logged in', async () => {
    mockAppMember({ isLoggedIn: true });

    renderCallback();

    await waitFor(() => {
      expect(clearOAuth2State).toHaveBeenCalledWith();
    });
  });
});
