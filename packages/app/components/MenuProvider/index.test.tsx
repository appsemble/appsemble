import { type AppDefinition } from '@appsemble/lang-sdk';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MenuProvider } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as appVariablesProvider from '../AppVariablesProvider/index.js';

vi.mock('@appsemble/react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@appsemble/react-components')>();

  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SideMenuProvider: ({
      base,
      children,
    }: {
      readonly base: ReactNode;
      readonly children: ReactNode;
    }) => (
      <>
        <aside>{base}</aside>
        {children}
      </>
    ),
  };
});

const appDefinition = {
  name: 'Test App',
  defaultPage: 'Home',
  layout: { navigation: 'top', hideTitleBar: true },
  pages: [
    { name: 'Home', blocks: [] },
    { name: 'Reports', blocks: [] },
  ],
} as unknown as AppDefinition;

function renderMenu(definition = appDefinition): void {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition,
    demoMode: false,
    revision: 1,
    blockManifests: [],
  });
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberRoles: [],
    appMemberSelectedGroup: undefined,
    appMemberInfo: undefined,
    isLoggedIn: false,
    logout: vi.fn(),
  } as never);
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    getAppMessage: ({ defaultMessage }: { defaultMessage: string }) => ({
      format: () => defaultMessage,
    }),
    getMessage: () => ({ format: () => '' }),
  } as never);
  vi.spyOn(appVariablesProvider, 'useAppVariables').mockReturnValue({
    getVariable: vi.fn(),
  } as never);

  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/en/Home']}>
        <Routes>
          <Route
            element={
              <MenuProvider>
                <main>Page content</main>
              </MenuProvider>
            }
            path="/:lang/*"
          />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MenuProvider', () => {
  it('should use side navigation when top navigation is configured without a title bar', () => {
    renderMenu();
    expect(screen.getByRole('link', { name: 'Reports' }).getAttribute('href')).toBe('/en/reports');
  });
});
