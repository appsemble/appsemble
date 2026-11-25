import { act, render, screen, waitFor } from '@testing-library/preact';
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { type VNode } from 'preact';
import { Route } from 'wouter-preact';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { AppMemberProvider, useAppMember } from './index.js';
import { startAccountLinking } from '../../utils/accountLinking.js';
import { ActionOwnerAbortError, createTestAction } from '../../utils/makeActions.js';
import { IconTestWrapper } from '../../utils/test-utils.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import { IntlProvider } from '../IntlProvider/index.js';
import { MessagesProvider } from '../MessagesProvider/index.js';

const { axiosGet, axiosPost, definitionSecurity, getUri, requestEject, requestUse, setSentryUser } =
  vi.hoisted(() => ({
    axiosGet: vi.fn(),
    axiosPost: vi.fn(),
    definitionSecurity: { value: undefined as Record<string, unknown> | undefined },
    getUri: vi.fn((config: { url?: string }) => config.url ?? ''),
    requestEject: vi.fn(),
    requestUse: vi.fn(),
    setSentryUser: vi.fn(),
  }));

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();

  return {
    ...actual,
    default: {
      defaults: {},
      get: axiosGet,
      post: axiosPost,
      getUri,
      isAxiosError: actual.default.isAxiosError,
      interceptors: {
        request: {
          use: requestUse,
          eject: requestEject,
        },
      },
    },
  };
});

vi.mock('@sentry/browser', () => ({
  addBreadcrumb: vi.fn(),
  setUser: setSentryUser,
}));

vi.mock('../AppDefinitionProvider/index.js', () => ({
  useAppDefinition: () => ({
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      pages: [],
      security: definitionSecurity.value,
    },
  }),
}));

let appMember: ReturnType<typeof useAppMember> | undefined;
let requestInterceptor:
  | ((
      config: InternalAxiosRequestConfig,
    ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>)
  | undefined;

let accessToken: string;

function Consumer(): VNode | null {
  appMember = useAppMember();
  return null;
}

function renderProvider(initialEntry = '/en/Home'): void {
  window.history.replaceState(null, '', initialEntry);
  render(
    <Route path="/:lang/*?">
      <IntlProvider locale="en">
        <MessagesProvider>
          <AppMemberProvider>
            <Consumer />
          </AppMemberProvider>
        </MessagesProvider>
      </IntlProvider>
    </Route>,
    { wrapper: IconTestWrapper },
  );
}

function createToken(payload: object): string {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  return `header.${encodedPayload}.signature`;
}

function createAccessToken(): string {
  return createToken({
    exp: Math.floor(Date.now() / 1000) + 3600,
    scopes: '',
    sub: 'member',
    iss: 'issuer',
  });
}

function createTotpChallenge(): AxiosError {
  const config = { headers: new AxiosHeaders() };
  // The clock of the server is an hour behind.
  const iat = Math.floor(Date.now() / 1000) - 3600;
  const response = {
    config,
    data: {
      error: 'totp_required',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      totp_enabled: true,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      totp_token: createToken({ iat, exp: iat + 300 }),
    },
    headers: {},
    status: 400,
    statusText: '',
  } as AxiosResponse;
  return new AxiosError('Request failed', '400', config as never, null, response);
}

/**
 * Log in from a custom login page using `app.member.login` on an app which requires TOTP.
 *
 * @returns A mock which is called with the result or the error of the action once it ends, and
 *   whether there was a session at that time.
 */
async function startActionLogin(): Promise<Mock> {
  axiosPost.mockImplementation((url: string, data: URLSearchParams) =>
    data.get('grant_type') === 'password'
      ? Promise.reject(createTotpChallenge())
      : Promise.resolve({ data: {} }),
  );
  renderProvider('/en/login');
  await waitFor(() => expect(appMember).toBeTruthy());

  const ended = vi.fn();
  const action = createTestAction({
    definition: {
      type: 'app.member.login',
      email: 'test@example.com',
      password: 'password',
      onSuccess: { type: 'static', value: 'success' },
      onError: { type: 'static', value: 'error' },
    },
    getAppMemberInfo: () => appMember!.appMemberInfo,
    passwordLogin: appMember!.passwordLogin,
    refetchDemoAppMembers: () => Promise.resolve(),
  });
  const end = (result: unknown): void => ended(result, appMember!.isLoggedIn);
  action().then(end, end);
  await waitFor(() => expect(appMember?.totpPending).toBeTruthy());
  return ended;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    getAppMessage: ({ defaultMessage }: { defaultMessage: string }) => ({
      format: () => defaultMessage,
    }),
    getMessage: () => ({ format: () => '' }),
  } as never);
  appMember = undefined;
  requestInterceptor = undefined;
  definitionSecurity.value = undefined;
  accessToken = createAccessToken();
  requestUse.mockImplementation((interceptor) => {
    requestInterceptor = interceptor;
    return 1;
  });
  axiosPost.mockImplementation(() => Promise.resolve({ data: { access_token: accessToken } }));
  axiosGet.mockImplementation((url: string) =>
    Promise.resolve(
      url.endsWith('/groups')
        ? { data: [] }
        : {
            data: {
              sub: 'member',
              roles: ['Staff'],
            },
          },
    ),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('AppMemberProvider', () => {
  it('should remain logged out while the server revokes the session', async () => {
    definitionSecurity.value = {};
    let resolveLogout: () => void;
    const logoutResponse = new Promise<{ data: object }>((resolve) => {
      resolveLogout = () => resolve({ data: {} });
    });
    axiosPost.mockImplementation((...args: [string, URLSearchParams]) => {
      const data = args[1];
      const grantType = data.get('grant_type');
      if (grantType === 'revoke_token') {
        return logoutResponse;
      }
      return Promise.resolve({ data: { access_token: accessToken } });
    });

    renderProvider();
    await waitFor(() => expect(appMember?.isLoggedIn).toBe(true));

    let logoutPromise: Promise<void> | undefined;
    await act(async () => {
      logoutPromise = appMember?.logout();
      await Promise.resolve();
    });

    expect(appMember?.isLoggedIn).toBe(false);
    resolveLogout!();
    await logoutPromise;
    expect(appMember?.isLoggedIn).toBe(false);
  });

  it('should run onSuccess of a login action once its TOTP step is completed', async () => {
    const ended = await startActionLogin();
    expect(window.location.pathname).toBe('/en/login');
    expect(ended).not.toHaveBeenCalled();

    await act(() => appMember!.completeTotpLogin({ access_token: accessToken } as never));

    await waitFor(() => expect(ended).toHaveBeenCalledWith('success', true));
  });

  it.each([
    ['cancelled', () => appMember!.cancelTotpLogin()],
    ['ended by logging out', () => appMember!.logout()],
    [
      'replaced by a newer login',
      () => {
        appMember!.passwordLogin({ username: 'other', password: 'password' }).catch(vi.fn());
      },
    ],
  ])('should run no handlers of a login action if its TOTP step is %s', async (name, end) => {
    const ended = await startActionLogin();

    await act(() => end());

    await waitFor(() =>
      expect(ended).toHaveBeenCalledWith(expect.any(ActionOwnerAbortError), false),
    );
  });

  it('should return to the login page with a message and run no handlers if the TOTP step expires', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const ended = await startActionLogin();

    await act(() => {
      vi.advanceTimersByTime(300_000);
    });

    await waitFor(() =>
      expect(ended).toHaveBeenCalledWith(expect.any(ActionOwnerAbortError), false),
    );
    expect(window.location.pathname).toBe('/en/Login');
    // The message is still there for an app member who comes back later.
    await act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('Logging in took too long. Please log in again.')).toBeTruthy();
  });

  it.each([
    ['token', axiosPost, '/oauth2/token'],
    ['account link', axiosPost, '/link'],
    ['app member', axiosGet, '/current'],
    ['groups', axiosGet, '/groups'],
  ])('should abort a login replaced while it requests its %s', async (name, request, path) => {
    startAccountLinking({
      externalId: 'external',
      secret: 'secret',
      email: 'test@example.com',
      logins: '',
      showAppsembleLogin: true,
      showAppsembleOAuth2Login: false,
    });
    renderProvider('/en/login');
    await waitFor(() => expect(appMember).toBeTruthy());
    const getResponse = request.getMockImplementation()!;
    const respond: (() => void)[] = [];
    request.mockImplementation((url: string) =>
      url.endsWith(path) && !respond.length
        ? new Promise((resolve) => {
            respond.push(() => resolve(getResponse(url)));
          })
        : getResponse(url),
    );
    const replaced = appMember!
      .passwordLogin({ username: 'first', password: 'password' })
      .catch((error: unknown) => error);
    await waitFor(() => expect(respond).toHaveLength(1));

    await act(() => appMember!.passwordLogin({ username: 'second', password: 'password' }));
    respond[0]();

    expect(await replaced).toBeInstanceOf(ActionOwnerAbortError);
  });

  it('should continue to the redirect of a login once its TOTP step is completed', async () => {
    axiosPost.mockRejectedValue(createTotpChallenge());
    renderProvider('/en/Login');
    await waitFor(() => expect(appMember).toBeTruthy());
    const login = appMember!.passwordLogin({
      username: 'test',
      password: 'password',
      redirect: '/en/Secret',
    });
    await waitFor(() => expect(appMember?.totpPending).toBeTruthy());

    await act(() => appMember!.completeTotpLogin({ access_token: accessToken } as never));
    await login;

    expect(window.location.pathname).toBe('/en/Secret');
  });

  it.each([
    [
      'a login action',
      '/en/login?redirect=%2Fen%2FSecret',
      () => appMember!.passwordLogin({ username: 'test', password: 'password' }),
    ],
    [
      'an OAuth2 login',
      '/en/Callback?code=code',
      () =>
        appMember!.authorizationCodeLogin({
          code: 'code',
          redirect_uri: 'http://localhost/Callback',
          redirect: '/en/Secret',
        }),
    ],
  ])('should keep the redirect of %s whose TOTP step is cancelled', async (name, path, login) => {
    axiosPost.mockRejectedValue(createTotpChallenge());
    renderProvider(path);
    await waitFor(() => expect(appMember).toBeTruthy());
    login().catch(vi.fn());
    await waitFor(() => expect(appMember?.totpPending).toBeTruthy());

    await act(() => appMember!.cancelTotpLogin());

    expect(window.location).toMatchObject({
      pathname: '/en/Login',
      search: '?redirect=%2Fen%2FSecret',
    });
    expect(appMember).toMatchObject({ isLoggedIn: false, totpPending: null });
  });

  it('should revoke the session of a TOTP login which is cancelled while its code is verified', async () => {
    const ended = await startActionLogin();
    let respond: (response: object) => void;
    axiosPost.mockReturnValueOnce(
      new Promise((resolve) => {
        respond = resolve;
      }),
    );

    await act(async () => {
      const completed = appMember!.totpLogin('123456');
      appMember!.cancelTotpLogin();
      respond!({ data: { access_token: accessToken, refresh_token: 'cancelled' } });
      await completed;
    });

    await waitFor(() =>
      expect(ended).toHaveBeenCalledWith(expect.any(ActionOwnerAbortError), false),
    );
    expect(appMember?.isLoggedIn).toBe(false);
    expect(
      axiosPost.mock.calls.map(([, data]) => Object.fromEntries(new URLSearchParams(data))),
    ).toContainEqual(
      expect.objectContaining({ grant_type: 'revoke_token', refresh_token: 'cancelled' }),
    );
  });

  it('should discard a TOTP login which is cancelled while its session is loading', async () => {
    const ended = await startActionLogin();
    let respond: (response: object) => void;
    axiosGet.mockReturnValueOnce(
      new Promise((resolve) => {
        respond = resolve;
      }),
    );

    await act(async () => {
      const completed = appMember!.completeTotpLogin({
        access_token: accessToken,
      } as never);
      appMember!.cancelTotpLogin();
      respond!({ data: { sub: 'member', roles: ['Staff'] } });
      await completed;
    });

    await waitFor(() =>
      expect(ended).toHaveBeenCalledWith(expect.any(ActionOwnerAbortError), false),
    );
    expect(appMember?.isLoggedIn).toBe(false);
  });

  it('should return to the login page without a session if loading it fails after the TOTP step', async () => {
    const ended = await startActionLogin();
    window.history.replaceState(null, '', '/en/protected');
    axiosPost.mockResolvedValueOnce({
      data: { access_token: accessToken, refresh_token: 'failed' },
    });
    axiosGet.mockRejectedValueOnce(new Error('Failed to load the app member'));

    await act(() =>
      expect(appMember!.totpLogin('123456')).rejects.toThrow('Failed to load the app member'),
    );

    await waitFor(() =>
      expect(ended).toHaveBeenCalledWith(expect.any(ActionOwnerAbortError), false),
    );
    expect(appMember).toMatchObject({ isLoggedIn: false, totpPending: null });
    expect(window.location.pathname).toBe('/en/Login');
    expect(
      axiosPost.mock.calls.map(([, data]) => Object.fromEntries(new URLSearchParams(data))),
    ).toContainEqual(
      expect.objectContaining({ grant_type: 'revoke_token', refresh_token: 'failed' }),
    );
  });

  it('should keep a newer login if loading the session of an ended TOTP step fails', async () => {
    const ended = await startActionLogin();
    let fail: (error: Error) => void;
    axiosGet.mockReturnValueOnce(
      new Promise((resolve, reject) => {
        fail = reject;
      }),
    );

    await act(async () => {
      const completed = appMember!.completeTotpLogin({ access_token: accessToken });
      appMember!.cancelTotpLogin();
      axiosPost.mockResolvedValue({ data: { access_token: accessToken } });
      await appMember!.authorizationCodeLogin({ code: 'code', redirect_uri: 'uri' });
      fail!(new Error('Failed to load the app member'));
      await expect(completed).rejects.toThrow('Failed to load the app member');
    });

    await waitFor(() =>
      expect(ended).toHaveBeenCalledWith(expect.any(ActionOwnerAbortError), expect.any(Boolean)),
    );
    expect(appMember?.isLoggedIn).toBe(true);
  });

  it('should ignore malformed request URLs in the authorization interceptor', async () => {
    renderProvider();

    await waitFor(() => expect(appMember).toBeTruthy());

    await act(async () => {
      await appMember?.passwordLogin({ username: 'test@example.com', password: 'password' });
    });

    await waitFor(() => expect(requestInterceptor).toBeTruthy());

    const emptyUrlConfig = { headers: {}, url: '' } as InternalAxiosRequestConfig;
    expect(requestInterceptor?.(emptyUrlConfig)).toBe(emptyUrlConfig);
    expect(emptyUrlConfig.headers).toStrictEqual({});

    const apiConfig = {
      headers: {},
      url: 'https://appsemble.app/api/apps/42/resources/course/3772',
    } as InternalAxiosRequestConfig;
    expect(requestInterceptor?.(apiConfig)).toBe(apiConfig);
    expect(apiConfig.headers).toStrictEqual({ authorization: `Bearer ${accessToken}` });
  });
});
