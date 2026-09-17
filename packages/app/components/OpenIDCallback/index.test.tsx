import { render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OpenIDCallback } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';

const { clearOAuth2State, loadOAuth2State } = vi.hoisted(() => ({
  clearOAuth2State: vi.fn(),
  loadOAuth2State: vi.fn(),
}));

vi.mock('@appsemble/web-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@appsemble/web-utils')>();

  return { ...actual, clearOAuth2State, loadOAuth2State };
});

const authorizationCodeLogin = vi.fn();

function mockAppMember(overrides: Record<string, unknown> = {}): void {
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberRoles: [],
    authorizationCodeLogin,
    isLoggedIn: false,
    totpPending: null,
    ...overrides,
  } as never);
}

function renderCallback(): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/Callback?code=abc&state=state-1']}>
        <Routes>
          <Route element={<OpenIDCallback />} path="/Callback" />
          <Route element={<p>Login page</p>} path="/Login" />
        </Routes>
      </MemoryRouter>
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

  it('should clear the OAuth2 state when handing off to the TOTP challenge', async () => {
    mockAppMember({
      totpPending: { totpEnabled: false, totpToken: 'token', redirect: '/en/deep/link' },
    });

    renderCallback();

    // The login continues on the login page, which is where the second factor is verified.
    expect(await screen.findByText('Login page')).not.toBeNull();
    expect(clearOAuth2State).toHaveBeenCalledWith();
  });

  it('should clear the OAuth2 state once logged in', async () => {
    mockAppMember({ isLoggedIn: true });

    renderCallback();

    await waitFor(() => {
      expect(clearOAuth2State).toHaveBeenCalledWith();
    });
  });
});
