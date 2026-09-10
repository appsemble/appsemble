import { describe, expect, it } from 'vitest';

import { type PageDefinition } from './types/index.js';
import {
  findPageById,
  getPageAncestors,
  getPageDisplayName,
  getPageMessageId,
  getPagePathSegment,
} from './pageUtils.js';

function createGetAppMessage(messages: Record<string, string>) {
  return ({ defaultMessage, id }: { defaultMessage?: string; id?: string }) => ({
    format: () => (id ? messages[id] : undefined) ?? defaultMessage ?? '',
  });
}

describe('pageUtils', () => {
  it('should build a canonical message id from the internal page name', () => {
    expect(getPageMessageId('Staff Tasks')).toBe('pages.staff-tasks');
  });

  it('should build a canonical path segment from the internal page name', () => {
    expect(getPagePathSegment('Staff Tasks')).toBe('staff-tasks');
  });

  it('should return the translated page label when available', () => {
    const getAppMessage = createGetAppMessage({ 'pages.tasks': 'Staff Tasks' });

    expect(getPageDisplayName({ name: 'Tasks' }, getAppMessage as never)).toBe('Staff Tasks');
  });

  it('should find a top-level page by its internal slug', () => {
    const pages = [{ name: 'Tasks' }, { name: 'Settings' }] as PageDefinition[];

    const page = findPageById(pages, 'tasks', [], createGetAppMessage({}) as never);

    expect(page?.name).toBe('Tasks');
  });

  it('should find a page by its translated slug alias', () => {
    const pages = [{ name: 'Tasks' }, { name: 'Settings' }] as PageDefinition[];

    const page = findPageById(
      pages,
      'staff-tasks',
      ['pages.tasks'],
      createGetAppMessage({ 'pages.tasks': 'Staff Tasks' }) as never,
    );

    expect(page?.name).toBe('Tasks');
  });

  it('should find nested pages by translated slug alias', () => {
    const pages = [
      {
        name: 'Container',
        type: 'container',
        pages: [{ name: 'Nested Page' }],
      },
    ] as PageDefinition[];

    const page = findPageById(
      pages,
      'translated-nested-page',
      ['pages.nested-page'],
      createGetAppMessage({ 'pages.nested-page': 'Translated Nested Page' }) as never,
    );

    expect(page?.name).toBe('Nested Page');
  });

  it('should return the parent chain root-first, excluding the page itself', () => {
    const pages = [
      { name: 'Home' },
      { name: 'Available Lots', parent: 'Home' },
      { name: 'Lot Details', parent: 'Available Lots' },
    ] as PageDefinition[];

    const ancestors = getPageAncestors(pages, pages[2]);

    expect(ancestors.map((page) => page.name)).toStrictEqual(['Home', 'Available Lots']);
  });

  it('should use a role-scoped parent when the member holds that role', () => {
    const pages = [
      { name: 'Admin Dashboard' },
      { name: 'Available Lots' },
      {
        name: 'Lot Details',
        parent: [{ page: 'Admin Dashboard', roles: ['Admin'] }, 'Available Lots'],
      },
    ] as PageDefinition[];

    const ancestors = getPageAncestors(pages, pages[2], ['Admin']);

    expect(ancestors.map((page) => page.name)).toStrictEqual(['Admin Dashboard']);
  });

  it('should fall back to the entry without roles when no role-scoped entry matches', () => {
    const pages = [
      { name: 'Admin Dashboard' },
      { name: 'Available Lots' },
      {
        name: 'Lot Details',
        parent: [{ page: 'Admin Dashboard', roles: ['Admin'] }, 'Available Lots'],
      },
    ] as PageDefinition[];

    const ancestors = getPageAncestors(pages, pages[2], ['Reader']);

    expect(ancestors.map((page) => page.name)).toStrictEqual(['Available Lots']);
  });

  it('should treat a page as a root when no parent entry matches the member', () => {
    const pages = [
      { name: 'Admin Dashboard' },
      { name: 'Lot Details', parent: [{ page: 'Admin Dashboard', roles: ['Admin'] }] },
    ] as PageDefinition[];

    const ancestors = getPageAncestors(pages, pages[1], ['Reader']);

    expect(ancestors).toStrictEqual([]);
  });

  it('should follow a parent that lives inside a container page', () => {
    const pages = [
      { name: 'Container', type: 'container', pages: [{ name: 'Grouped Page' }] },
      { name: 'Lot Details', parent: 'Grouped Page' },
    ] as PageDefinition[];

    const ancestors = getPageAncestors(pages, pages[1]);

    expect(ancestors.map((page) => page.name)).toStrictEqual(['Grouped Page']);
  });

  it('should truncate the chain instead of looping on a cyclic definition', () => {
    const pages = [
      { name: 'Home', parent: 'Lot Details' },
      { name: 'Lot Details', parent: 'Home' },
    ] as PageDefinition[];

    const ancestors = getPageAncestors(pages, pages[1]);

    expect(ancestors.map((page) => page.name)).toStrictEqual(['Home']);
  });
});
