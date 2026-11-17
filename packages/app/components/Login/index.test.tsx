import { render, screen } from '@testing-library/react';
import { Route } from 'wouter-preact';
import { describe, expect, it, vi } from 'vitest';

import { Login } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import { IntlProvider } from '../IntlProvider/index.js';

describe('Login', () => {
  it('should send visitors of an app without security to the default page', async () => {
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
      definition: { defaultPage: 'Home', name: 'Test App', pages: [{ name: 'Home', blocks: [] }] },
    } as never);
    vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
      appMemberRoles: [],
      isLoggedIn: false,
    } as never);
    vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
      getAppMessage: ({ defaultMessage }: { defaultMessage: string }) => ({
        format: () => defaultMessage,
      }),
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
});
