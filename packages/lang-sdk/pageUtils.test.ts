import { describe, expect, it } from 'vitest';

import { type PageDefinition } from './types/index.js';
import {
  findPageById,
  getPageAncestors,
  getPageDisplayName,
  getPageMessageId,
  getPagePathSegment,
  getRouteSegment,
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

  it('should build the path segment from the internal page name when it is untranslated', () => {
    expect(getPagePathSegment({ name: 'Staff Tasks' }, createGetAppMessage({}) as never)).toBe(
      'staff-tasks',
    );
  });

  it('should build the path segment from the translated page name', () => {
    const getAppMessage = createGetAppMessage({ 'pages.staff-tasks': 'Taken' });

    expect(getPagePathSegment({ name: 'Staff Tasks' }, getAppMessage as never)).toBe('taken');
  });

  it('should keep the canonical path segment when the translated page name has no Latin characters', () => {
    const getAppMessage = createGetAppMessage({ 'pages.staff-tasks': 'Задачи' });

    expect(getPagePathSegment({ name: 'Staff Tasks' }, getAppMessage as never)).toBe('staff-tasks');
  });

  it('should return the translated page label when available', () => {
    const getAppMessage = createGetAppMessage({ 'pages.tasks': 'Staff Tasks' });

    expect(getPageDisplayName({ name: 'Tasks' }, getAppMessage as never)).toBe('Staff Tasks');
  });

  it('should use the English name of a built-in route when it is untranslated', () => {
    expect(getRouteSegment('Login', createGetAppMessage({}) as never)).toBe('Login');
  });

  it('should use the translated segment of a built-in route', () => {
    const getAppMessage = createGetAppMessage({ 'routes.Login': 'InLoggen' });

    expect(getRouteSegment('Login', getAppMessage as never)).toBe('InLoggen');
  });

  it('should find a top-level page by its internal slug', () => {
    const pages = [{ name: 'Tasks' }, { name: 'Settings' }] as PageDefinition[];

    const page = findPageById(pages, 'tasks', createGetAppMessage({}) as never);

    expect(page?.name).toBe('Tasks');
  });

  it('should find a page by its canonical slug when it is translated', () => {
    const pages = [{ name: 'Tasks' }, { name: 'Settings' }] as PageDefinition[];

    const page = findPageById(
      pages,
      'tasks',
      createGetAppMessage({ 'pages.tasks': 'Staff Tasks' }) as never,
    );

    expect(page?.name).toBe('Tasks');
  });

  it('should find a page by its translated slug', () => {
    const pages = [{ name: 'Tasks' }, { name: 'Settings' }] as PageDefinition[];

    const page = findPageById(
      pages,
      'staff-tasks',
      createGetAppMessage({ 'pages.tasks': 'Staff Tasks' }) as never,
    );

    expect(page?.name).toBe('Tasks');
  });

  it('should prefer a translated slug over the canonical slug of an earlier page', () => {
    const pages = [{ name: 'Werk' }, { name: 'Tasks' }] as PageDefinition[];

    const page = findPageById(
      pages,
      'werk',
      createGetAppMessage({ 'pages.werk': 'Taken', 'pages.tasks': 'Werk' }) as never,
    );

    expect(page?.name).toBe('Tasks');
  });

  it('should find nested pages by translated slug', () => {
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
      createGetAppMessage({ 'pages.nested-page': 'Translated Nested Page' }) as never,
    );

    expect(page?.name).toBe('Nested Page');
  });

  it('should return null when no page matches', () => {
    const pages = [{ name: 'Tasks' }] as PageDefinition[];

    expect(findPageById(pages, 'missing', createGetAppMessage({}) as never)).toBeNull();
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
