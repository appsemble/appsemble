import { type AppDefinition } from '@appsemble/lang-sdk';
import { render, screen } from '@testing-library/react';
import { type ReactNode, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MenuProvider, usePage } from './index.js';
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

function SetPage({ navigation }: { readonly navigation?: string }): ReactNode {
  const { setPage } = usePage();
  useEffect(() => {
    setPage({ name: 'Edit Profile', navigation, blocks: [] } as never);
    // Run once on mount. The `setPage` reference and the page object both change on every page
    // update, so listing them as dependencies would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <main>Page content</main>;
}

function renderMenu(
  definition = appDefinition,
  child: ReactNode = <main>Page content</main>,
): void {
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
          <Route element={<MenuProvider>{child}</MenuProvider>} path="/:lang/*" />
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

  it('should keep the app menu on pages listed under the profile dropdown', async () => {
    renderMenu(
      { ...appDefinition, layout: { navigation: 'left-menu' } } as AppDefinition,
      <SetPage navigation="profileDropdown" />,
    );
    expect((await screen.findByRole('link', { name: 'Reports' })).getAttribute('href')).toBe(
      '/en/reports',
    );
  });
});
