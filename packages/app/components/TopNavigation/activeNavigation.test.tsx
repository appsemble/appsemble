import { type AppDefinition, type PageDefinition } from '@appsemble/lang-sdk';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { TopNavigation } from './index.js';
import { getNavPages } from '../../utils/layout.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as appVariablesProvider from '../AppVariablesProvider/index.js';
import { BottomNavigation } from '../BottomNavigation/index.js';
import { SideNavigation } from '../SideNavigation/index.js';

const pages: PageDefinition[] = [
  { name: 'Home', blocks: [] },
  { name: 'Available Lots', parent: 'Home', blocks: [] },
  { name: 'Overview Lots', blocks: [] },
  {
    name: 'Lot Details',
    parameters: ['id'],
    parent: [{ page: 'Overview Lots', roles: ['Employee', 'Manager'] }, 'Available Lots'],
    blocks: [],
  },
  { name: 'Lot History', navigation: 'hidden', parent: 'Lot Details', blocks: [] },
  { name: 'Orphan', navigation: 'hidden', blocks: [] },
];

function renderNavigation(
  navigation: string,
  path: string,
  roles: string[] = [],
  navigationPages = pages,
): void {
  const definition = {
    name: 'Lots',
    defaultPage: 'Home',
    pages: navigationPages,
    security: {
      guest: {},
      roles: { Charity: {}, Employee: {}, Manager: {} },
    },
  } as AppDefinition;
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition,
    demoMode: false,
    revision: 1,
    blockManifests: [],
  });
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberRoles: roles,
    appMemberSelectedGroup: undefined,
    isLoggedIn: Boolean(roles.length),
  } as never);
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    appMessageIds: ['pages.lot-details'],
    getAppMessage: ({ defaultMessage, id }: { defaultMessage: string; id: string }) => ({
      format: () => (id === 'pages.lot-details' ? 'Details' : defaultMessage),
    }),
    getMessage: () => ({ format: () => '' }),
  } as never);
  vi.spyOn(appVariablesProvider, 'useAppVariables').mockReturnValue({
    getVariable: vi.fn(),
  } as never);
  const visiblePages = getNavPages(definition, roles, undefined!);

  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            element={
              <>
                {navigation === 'top' ? (
                  <TopNavigation />
                ) : navigation === 'side' ? (
                  <SideNavigation blockMenus={[]} pages={visiblePages} />
                ) : (
                  <BottomNavigation />
                )}
                <Link to="/en/lot-details/42">Open lot</Link>
                <Link to="/en/orphan">Open orphan</Link>
              </>
            }
            path="/:lang/*"
          />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

function selection(): (string | null)[][] {
  return screen
    .getAllByRole('link')
    .filter((link) => ['page', 'location'].includes(link.getAttribute('aria-current')!))
    .map((link) => [link.textContent, link.getAttribute('aria-current')]);
}

describe.each(['top', 'side', 'bottom'])('%s navigation selection', (navigation) => {
  it.each([
    [[], 'Available Lots'],
    [['Charity'], 'Available Lots'],
    [['Employee'], 'Overview Lots'],
    [['Manager'], 'Overview Lots'],
  ] as [string[], string][])(
    'should select the role-dependent parent on direct entry for %j',
    (roles, parent) => {
      renderNavigation(navigation, '/en/lot-details/42', roles);
      expect(selection()).toStrictEqual([[parent, 'location']]);
    },
  );

  it('should prefer a visible current page over its parent', () => {
    renderNavigation(navigation, '/en/available-lots');
    expect(selection()).toStrictEqual([['Available Lots', 'page']]);
  });

  it('should style the selected ancestor like the current page', () => {
    renderNavigation(navigation, '/en/lot-details/42');
    const lots = screen.getByRole('link', { name: 'Available Lots', current: 'location' });
    const ancestorStyle = lots.className;
    expect(ancestorStyle).not.toBe(screen.getByRole('link', { name: 'Overview Lots' }).className);
    fireEvent.click(lots);
    expect(lots.getAttribute('aria-current')).toBe('page');
    expect(lots.className).toBe(ancestorStyle);
  });

  it('should leave navigation unselected when every ancestor is hidden', () => {
    renderNavigation(
      navigation,
      '/en/lot-details/42',
      [],
      pages.map((page) =>
        ['Home', 'Available Lots'].includes(page.name) ? { ...page, navigation: 'hidden' } : page,
      ),
    );
    expect(selection()).toStrictEqual([]);
  });

  it('should preserve selection for pages without parents', () => {
    renderNavigation(navigation, '/en/home');
    expect(selection()).toStrictEqual([['Home', 'page']]);
  });

  it('should follow deeper ancestry past hidden and parameterized pages', () => {
    renderNavigation(navigation, '/en/lot-history', ['Manager']);
    expect(selection()).toStrictEqual([['Overview Lots', 'location']]);
  });

  it('should resolve translated page URLs', () => {
    renderNavigation(navigation, '/nl/details/42');
    expect(selection()).toStrictEqual([['Available Lots', 'location']]);
  });

  it('should update selection when switching sections and clear it for an unrelated page', () => {
    renderNavigation(navigation, '/en/lot-details/42');
    expect(selection()).toStrictEqual([['Available Lots', 'location']]);
    fireEvent.click(screen.getByRole('link', { name: 'Overview Lots' }));
    expect(selection()).toStrictEqual([['Overview Lots', 'page']]);
    fireEvent.click(screen.getByRole('link', { name: 'Open lot' }));
    expect(selection()).toStrictEqual([['Available Lots', 'location']]);
    fireEvent.click(screen.getByRole('link', { name: 'Open orphan' }));
    expect(screen.queryByRole('link', { current: 'page' })).toBeNull();
    expect(screen.queryByRole('link', { current: 'location' })).toBeNull();
  });

  it.each(['/en/orphan', '/en/unknown', '/en/Settings'])(
    'should leave navigation unselected at %s',
    (path) => {
      renderNavigation(navigation, path);
      expect(screen.queryByRole('link', { current: 'page' })).toBeNull();
      expect(screen.queryByRole('link', { current: 'location' })).toBeNull();
    },
  );

  it.each([
    { hideNavTitle: true },
    { navigation: 'profileDropdown' as const },
    { roles: ['Manager'] },
  ])('should skip an ancestor excluded from navigation by %j', (hidden) => {
    renderNavigation(
      navigation,
      '/en/lot-details/42',
      [],
      pages.map((page) => (page.name === 'Available Lots' ? { ...page, ...hidden } : page)),
    );
    expect(selection()).toStrictEqual([['Home', 'location']]);
  });
});

describe.each(['top', 'side'])('%s containing sections', (navigation) => {
  it('should indicate the dropdown containing the selected ancestor and clear it when leaving', () => {
    renderNavigation(
      navigation,
      '/en/lot-details/42',
      [],
      [pages[0], { name: 'Lots', type: 'container', pages: [pages[1]] }, ...pages.slice(2)],
    );
    expect(selection()).toStrictEqual([['Available Lots', 'location']]);
    const section =
      navigation === 'top'
        ? screen.getByRole('button', { name: 'Lots' })
        : screen.getByTitle('Lots');
    expect(section.getAttribute('aria-current')).toBe('location');
    const sectionStyle = section.className;
    fireEvent.click(screen.getByRole('link', { name: 'Overview Lots' }));
    expect(section.getAttribute('aria-current')).toBe('false');
    expect(section.className).not.toBe(sectionStyle);
    expect(selection()).toStrictEqual([['Overview Lots', 'page']]);
  });
});

describe('top navigation styling', () => {
  // Bulma paints `.navbar.is-primary .navbar-start > a.navbar-item.is-active` with a filled
  // background, which outranks the underlines app themes hang off `aria-current`. The title bar
  // navigation styles selection itself, so it must not opt in to that.
  it.each(['/en/available-lots', '/en/lot-details/42'])(
    'should not apply the Bulma navbar selection at %s',
    (path) => {
      renderNavigation('top', path, [], [
        pages[0],
        { name: 'Lots', type: 'container', pages: [pages[1]] },
        ...pages.slice(2),
      ] as PageDefinition[]);
      for (const item of [...screen.getAllByRole('link'), ...screen.getAllByRole('button')]) {
        expect(item.classList.contains('is-active')).toBe(false);
      }
    },
  );
});
