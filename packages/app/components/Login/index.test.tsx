import { render, screen } from '@testing-library/preact';
import { userEvent } from '@testing-library/user-event';
import axios from 'axios';
import { Route } from 'wouter-preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Login } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import { AppIconProvider } from '../AppIconProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import { IntlProvider } from '../IntlProvider/index.js';

vi.mock('../../utils/settings.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/settings.js')>()),
  showAppsembleOAuth2Login: false,
}));
vi.mock('../TitleBar/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AppBar: () => null,
}));

describe('Login', () => {
  beforeEach(() => {
    vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
      getAppMessage: ({ defaultMessage }: { defaultMessage: string }) => ({
        format: () => defaultMessage,
      }),
    } as never);
  });

  it('should send visitors of an app without security to the default page', async () => {
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
      definition: { defaultPage: 'Home', name: 'Test App', pages: [{ name: 'Home', blocks: [] }] },
    } as never);
    vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
      appMemberRoles: [],
      isLoggedIn: false,
    } as never);

    window.history.replaceState(null, '', '/en/Login');
    render(
      <IntlProvider locale="en" messages={{}}>
        <Route path="/:lang/Login">
          <Login />
        </Route>
        <Route path="/:lang/home">
          <p>Home page</p>
        </Route>
      </IntlProvider>,
    );

    expect(await screen.findByText('Home page')).not.toBeNull();
  });

  it.each([
    ['code entry', true, () => Promise.reject(new Error('Not called'))],
    ['setup', false, () => Promise.resolve({ data: { otpauthUrl: '', secret: 'SECRET' } })],
    ['failed setup', false, () => Promise.reject(new Error('Expired'))],
  ])(
    'should offer to cancel TOTP %s on an app without login methods',
    async (name, totpEnabled, setup) => {
      vi.spyOn(axios, 'post').mockImplementation(setup);
      vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
        definition: {
          defaultPage: 'Home',
          name: 'Test App',
          pages: [{ name: 'Home', blocks: [] }],
          security: { default: { policy: 'everyone', role: 'User' }, roles: { User: {} } },
        },
      } as never);
      const cancelTotpLogin = vi.fn();
      vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
        appMemberRoles: [],
        cancelTotpLogin,
        isLoggedIn: false,
        totpPending: { totpEnabled, totpToken: 'pending' },
      } as never);

      window.history.replaceState(null, '', '/en/home');
      render(
        <IntlProvider locale="en" messages={{}}>
          <AppIconProvider>
            <Route path="/:lang/*?">
              <Login />
            </Route>
          </AppIconProvider>
        </IntlProvider>,
      );
      await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

      expect(cancelTotpLogin).toHaveBeenCalledTimes(1);
    },
  );
});
