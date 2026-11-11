import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { Login } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';

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

    render(
      <IntlProvider locale="en" messages={{}}>
        <MemoryRouter initialEntries={['/en/Login']}>
          <Routes>
            <Route
              element={
                <Routes>
                  <Route element={<Login />} path="/Login" />
                  <Route element={<p>Home page</p>} path="/home" />
                </Routes>
              }
              path="/:lang/*"
            />
          </Routes>
        </MemoryRouter>
      </IntlProvider>,
    );

    expect(await screen.findByText('Home page')).not.toBeNull();
  });
});
