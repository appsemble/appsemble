import { describe, expect, it } from 'vitest';

import { type PageDefinition } from './types/index.js';
import {
  findPageById,
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
});
