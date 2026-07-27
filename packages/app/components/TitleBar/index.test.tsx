import { type AppDefinition } from '@appsemble/lang-sdk';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppBar } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as appVariablesProvider from '../AppVariablesProvider/index.js';
import * as menuProvider from '../MenuProvider/index.js';

const appDefinition = {
  name: 'Test App',
  defaultPage: 'Home',
  layout: { navigation: 'top', login: 'hidden' },
  pages: [
    { name: 'Home', blocks: [] },
    { name: 'Reports', blocks: [] },
  ],
} as unknown as AppDefinition;

function mockProviders(): void {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: appDefinition,
    demoMode: false,
    revision: 1,
    blockManifests: [],
  });
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberGroups: [],
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
  vi.spyOn(menuProvider, 'usePage').mockReturnValue({ page: undefined } as never);
}

beforeEach(() => {
  const navbar = document.createElement('div');
  navbar.className = 'navbar';
  document.body.append(navbar);
  mockProviders();
});

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

function renderAppBar(): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/en/Home']}>
        <Routes>
          <Route element={<AppBar />} path="/:lang/*" />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

describe('AppBar top navigation', () => {
  it('should render the page links in the navbar when navigation is top', () => {
    renderAppBar();
    expect(screen.getByRole('link', { name: 'Reports' }).getAttribute('href')).toBe('/en/reports');
  });

  it('should keep the logo, app name and page links when the logo is stacked above the nav', () => {
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
      definition: {
        ...appDefinition,
        layout: {
          navigation: 'top',
          login: 'hidden',
          titleBarText: 'appName',
          stackedHeader: true,
          logo: { position: 'navbar' },
        },
      },
      demoMode: false,
      revision: 1,
      blockManifests: [],
    } as never);

    renderAppBar();

    expect(screen.getByAltText('app-logo')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Test App' })).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Reports' }).getAttribute('href')).toBe('/en/reports');
  });
});
