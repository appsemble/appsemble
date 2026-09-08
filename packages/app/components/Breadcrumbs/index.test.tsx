import { type AppDefinition, type PageDefinition, remap, type Remapper } from '@appsemble/lang-sdk';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Breadcrumbs } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';

function createAppDefinition(pages: PageDefinition[]): AppDefinition {
  return {
    name: 'Test App',
    defaultPage: 'Home',
    layout: { breadcrumbs: true },
    pages,
  } as unknown as AppDefinition;
}

function mockApp(definition: AppDefinition, appMemberRoles: string[] = ['User']): void {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition,
    demoMode: false,
    revision: 1,
    blockManifests: [],
  });
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberRoles,
    appMemberSelectedGroup: undefined,
    appMemberInfo: { name: 'Jane' },
    isLoggedIn: true,
  } as never);
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    getAppMessage: ({ defaultMessage }: { defaultMessage?: string }) => ({
      format: () => defaultMessage,
    }),
    getMessage: () => ({ format: () => '' }),
  } as never);
}

function renderBreadcrumbs(
  page: PageDefinition,
  { data = {}, path = '/en/lot-details' }: { data?: unknown; path?: string } = {},
): void {
  // The real remapper, so a `navTitle` in a fixture behaves the way it does in an app.
  const remapWithContext = (mappers: Remapper, input: unknown): unknown =>
    remap(mappers, input, { pageData: data, pageName: page.name } as never);

  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            element={<Breadcrumbs data={data} pageDefinition={page} remap={remapWithContext} />}
            path="/:lang/:pageId/*"
          />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

const hierarchy = [
  { name: 'Home', blocks: [] },
  { name: 'Available Lots', parent: 'Home', blocks: [] },
  { name: 'Lot Details', parent: 'Available Lots', blocks: [] },
] as unknown as PageDefinition[];

beforeEach(() => {
  mockApp(createAppDefinition(hierarchy));
});

describe('Breadcrumbs', () => {
  it('should link every ancestor and leave the current page as plain text', () => {
    renderBreadcrumbs(hierarchy[2]);

    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/en/home');
    expect(screen.getByRole('link', { name: 'Available Lots' }).getAttribute('href')).toBe(
      '/en/available-lots',
    );
    expect(screen.getByText('Lot Details')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Lot Details' })).toBeNull();
  });

  it('should omit an ancestor the member is not allowed to view', () => {
    const pages = [
      { name: 'Home', blocks: [] },
      { name: 'Admin Area', parent: 'Home', roles: ['Admin'], blocks: [] },
      { name: 'Lot Details', parent: 'Admin Area', blocks: [] },
    ] as unknown as PageDefinition[];
    const definition = createAppDefinition(pages);
    definition.security = { roles: { User: {}, Admin: {} } } as never;
    mockApp(definition, ['User']);

    renderBreadcrumbs(pages[2]);

    expect(screen.getByRole('link', { name: 'Home' })).not.toBeNull();
    expect(screen.queryByText('Admin Area')).toBeNull();
  });

  it('should render nothing when breadcrumbs are not enabled for the app', () => {
    const definition = createAppDefinition(hierarchy);
    definition.layout = {};
    mockApp(definition);

    renderBreadcrumbs(hierarchy[2]);

    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('should label the current page from its navTitle remapped against the page data', () => {
    const pages = [
      { name: 'Available Lots', blocks: [] },
      {
        name: 'Lot Details',
        parent: 'Available Lots',
        navTitle: { prop: 'description' },
        blocks: [],
      },
    ] as unknown as PageDefinition[];
    mockApp(createAppDefinition(pages));

    renderBreadcrumbs(pages[1], { data: { description: 'Lot 42' } });

    expect(screen.getByText('Lot 42')).not.toBeNull();
    expect(screen.queryByText('Lot Details')).toBeNull();
  });

  it('should fall back to the page name when an ancestor navTitle resolves to nothing', () => {
    const pages = [
      { name: 'Available Lots', navTitle: { prop: 'description' }, blocks: [] },
      { name: 'Lot Details', parent: 'Available Lots', blocks: [] },
    ] as unknown as PageDefinition[];
    mockApp(createAppDefinition(pages));

    renderBreadcrumbs(pages[1], { data: { description: 'Lot 42' } });

    expect(screen.getByRole('link', { name: 'Available Lots' })).not.toBeNull();
  });

  it('should render a container ancestor as plain text rather than a link', () => {
    const pages = [
      { name: 'Container', type: 'container', pages: [{ name: 'Grouped', blocks: [] }] },
      { name: 'Lot Details', parent: 'Container', blocks: [] },
    ] as unknown as PageDefinition[];
    mockApp(createAppDefinition(pages));

    renderBreadcrumbs(pages[1]);

    expect(screen.getByText('Container')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Container' })).toBeNull();
  });

  it('should append the active tab as the final crumb on a tabs page', () => {
    const pages = [
      { name: 'Available Lots', blocks: [] },
      {
        name: 'Lot Details',
        parent: 'Available Lots',
        type: 'tabs',
        tabs: [
          { name: 'Overview', blocks: [] },
          { name: 'Documents', blocks: [] },
        ],
      },
    ] as unknown as PageDefinition[];
    mockApp(createAppDefinition(pages));

    renderBreadcrumbs(pages[1], { path: '/en/lot-details/documents' });

    expect(screen.getByRole('link', { name: 'Lot Details' })).not.toBeNull();
    expect(screen.getByText('Documents')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Documents' })).toBeNull();
  });
});
