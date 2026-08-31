import { type AppDefinition } from '@appsemble/lang-sdk';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('should lay out all header content using the configured navbar grid', async () => {
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
      definition: {
        ...appDefinition,
        layout: {
          navigation: 'top',
          login: 'hidden',
          logo: { position: 'navbar' },
          navbar: {
            mobile: {
              layout: {
                columns: 3,
                template: ['logo logo logo', 'name navigation controls'],
              },
              spacing: { gap: 0.5, padding: 0.25, unit: '1rem' },
            },
          },
          titleBarText: 'appName',
        },
      },
      demoMode: false,
      revision: 1,
      blockManifests: [],
    } as never);

    renderAppBar();

    const logo = screen.getByAltText('app-logo');
    const name = screen.getByRole('heading', { name: 'Test App' });
    const navigation = screen.getByRole('link', { name: 'Reports' });
    const navbarGrid = logo.parentElement?.parentElement?.parentElement;

    expect(logo.parentElement?.parentElement?.dataset.gridArea).toBe('logo');
    expect(name.parentElement?.dataset.gridArea).toBe('name');
    expect(navigation.closest<HTMLElement>('[data-grid-area]')?.dataset.gridArea).toBe(
      'navigation',
    );
    expect(
      Array.from(navbarGrid?.children ?? [], (child) => (child as HTMLElement).dataset.gridArea),
    ).toStrictEqual(['logo', 'name', 'navigation', 'controls']);
    expect(logo.parentElement?.getAttribute('href')).toBe('/en/home');
    expect(navigation.getAttribute('href')).toBe('/en/reports');
    await waitFor(() => {
      expect(document.head.textContent).toContain(
        'grid-template-areas: "logo logo logo" "name navigation controls"',
      );
    });
  });

  it('should emit the navbar grid at the author-configured breakpoints', async () => {
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
      definition: {
        ...appDefinition,
        layout: {
          navigation: 'top',
          login: 'hidden',
          logo: { position: 'navbar' },
          breakpoints: { desktop: 900 },
          navbar: {
            desktop: {
              layout: {
                columns: 4,
                template: ['logo name navigation controls'],
              },
            },
          },
          titleBarText: 'appName',
        },
      },
      demoMode: false,
      revision: 1,
      blockManifests: [],
    } as never);

    renderAppBar();

    await waitFor(() => {
      expect(document.head.textContent).toContain('@media (min-width: 900px)');
    });
    expect(document.head.textContent).not.toContain('@media (min-width: 1024px)');
  });

  it('should keep a valid navbar grid on breakpoints the author only defines for larger screens', async () => {
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
      definition: {
        ...appDefinition,
        layout: {
          navigation: 'top',
          login: 'hidden',
          logo: { position: 'navbar' },
          navbar: {
            desktop: {
              layout: {
                columns: 2,
                template: ['logo name', 'navigation controls'],
              },
            },
          },
          titleBarText: 'appName',
        },
      },
      demoMode: false,
      revision: 1,
      blockManifests: [],
    } as never);

    renderAppBar();

    await waitFor(() => {
      expect(document.head.textContent).toContain(
        'grid-template-areas: "logo name" "navigation controls"',
      );
    });
    expect(document.head.textContent).toContain(
      'grid-template-areas: "logo name navigation controls"',
    );
    expect(document.head.textContent).not.toContain('grid-template-areas: "main"');
  });

  it('should fall back without a logo area when the logo is not shown in the navbar', async () => {
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
      definition: {
        ...appDefinition,
        layout: {
          navigation: 'top',
          login: 'hidden',
          navbar: {
            desktop: {
              layout: {
                columns: 2,
                template: ['name navigation', 'controls controls'],
              },
            },
          },
          titleBarText: 'appName',
        },
      },
      demoMode: false,
      revision: 1,
      blockManifests: [],
    } as never);

    renderAppBar();

    await waitFor(() => {
      expect(document.head.textContent).toContain(
        'grid-template-areas: "name navigation" "controls controls"',
      );
    });
    expect(document.head.textContent).toContain('grid-template-areas: "name navigation controls"');
    expect(document.head.textContent).not.toContain(
      'grid-template-areas: "logo name navigation controls"',
    );
    expect(document.head.textContent).not.toContain('grid-template-areas: "main"');
  });
});
