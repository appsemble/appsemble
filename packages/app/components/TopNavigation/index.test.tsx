import { type AppDefinition } from '@appsemble/lang-sdk';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TopNavigation } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as appVariablesProvider from '../AppVariablesProvider/index.js';

const appDefinition = {
  name: 'Test App',
  defaultPage: 'Home',
  pages: [
    { name: 'Home', blocks: [] },
    { name: 'Alerts', badgeCount: 7, blocks: [] },
    {
      name: 'Reports',
      type: 'container',
      pages: [
        { name: 'Daily', blocks: [] },
        { name: 'Hidden Report', navigation: 'hidden', blocks: [] },
        { name: 'Report Detail', parameters: ['id'], blocks: [] },
        { name: 'Private Report', roles: ['Admin'], blocks: [] },
        { name: 'No Title Report', hideNavTitle: true, blocks: [] },
      ],
    },
    {
      name: 'Empty Reports',
      type: 'container',
      pages: [{ name: 'Hidden Empty', navigation: 'hidden', blocks: [] }],
    },
    { name: 'Hidden', navigation: 'hidden', blocks: [] },
  ],
  security: {
    default: {
      role: 'User',
      policy: 'everyone',
    },
    roles: {
      User: {},
      Admin: {},
    },
  },
} as unknown as AppDefinition;

function renderNav(definition = appDefinition): void {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition,
    demoMode: false,
    revision: 1,
    blockManifests: [],
  });
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberRoles: ['User'],
    appMemberSelectedGroup: undefined,
    appMemberInfo: undefined,
    isLoggedIn: true,
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
          <Route element={<TopNavigation />} path="/:lang/*" />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TopNavigation', () => {
  it('should render a link for each visible top-level page', () => {
    renderNav();
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/en/home');
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it('should expose only visible children of a container page', () => {
    renderNav();
    expect(screen.getByRole('link', { name: 'Daily' }).getAttribute('href')).toBe('/en/daily');
    expect(screen.queryByRole('link', { name: 'Hidden Report' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Report Detail' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Private Report' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'No Title Report' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Empty Reports' })).toBeNull();
  });

  it('should toggle a container dropdown when its label is clicked', () => {
    renderNav();
    const reports = screen.getByRole('button', { name: 'Reports' });
    expect(reports.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(reports);
    expect(reports.getAttribute('aria-expanded')).toBe('true');
  });

  it('should render page badge counts', () => {
    renderNav();
    expect(screen.getByRole('link', { name: 'Alerts 7' }).getAttribute('href')).toBe('/en/alerts');
  });

  it('should render debug as a top navigation link', () => {
    renderNav({ ...appDefinition, layout: { debug: 'navigation' } } as AppDefinition);
    expect(screen.getByRole('link', { name: 'Debug' }).getAttribute('href')).toBe('/en/Debug');
  });

  it('should toggle the collapsed menu when the burger is clicked', () => {
    renderNav();
    const burger = screen.getByRole('button', { name: 'menu' });
    expect(burger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(burger);
    expect(burger.getAttribute('aria-expanded')).toBe('true');
  });

  it('should close the collapsed menu after a navigation link is clicked', () => {
    renderNav();
    const burger = screen.getByRole('button', { name: 'menu' });
    fireEvent.click(burger);
    expect(burger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(burger.getAttribute('aria-expanded')).toBe('false');
  });
});
