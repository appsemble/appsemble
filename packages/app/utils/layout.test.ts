import { type AppDefinition } from '@appsemble/lang-sdk';
import { describe, expect, it } from 'vitest';

import { getNavPages, shouldHideGroupDropdown } from './layout.js';

describe('getNavPages', () => {
  const appDefinition = {
    name: 'Test App',
    defaultPage: 'Visible',
    pages: [
      { name: 'Visible', blocks: [] },
      { name: 'Hidden', navigation: 'hidden', blocks: [] },
      { name: 'Profile', navigation: 'profileDropdown', blocks: [] },
      { name: 'Detail', parameters: ['id'], blocks: [] },
      { name: 'NoTitle', hideNavTitle: true, blocks: [] },
      { name: 'Container', type: 'container', pages: [{ name: 'Visible Child', blocks: [] }] },
      {
        name: 'Empty Container',
        type: 'container',
        pages: [{ name: 'Hidden Child', navigation: 'hidden', blocks: [] }],
      },
    ],
  } as unknown as AppDefinition;

  it('should return only pages that belong in the navigation', () => {
    const names = getNavPages(appDefinition, [], undefined as never).map((page) => page.name);
    expect(names).toStrictEqual(['Visible', 'Container']);
  });
});

describe('shouldHideGroupDropdown', () => {
  it('should hide the dropdown for all members when set to true', () => {
    expect(shouldHideGroupDropdown(true, ['User'])).toBe(true);
    expect(shouldHideGroupDropdown(true, [])).toBe(true);
  });

  it('should hide the dropdown for members holding a listed role', () => {
    expect(shouldHideGroupDropdown(['Manager', 'Admin'], ['User', 'Admin'])).toBe(true);
  });

  it('should show the dropdown for members holding none of the listed roles', () => {
    expect(shouldHideGroupDropdown(['Admin'], ['User'])).toBe(false);
  });

  it('should show the dropdown when the field is omitted or false', () => {
    expect(shouldHideGroupDropdown(undefined, ['User'])).toBe(false);
    expect(shouldHideGroupDropdown(false, ['User'])).toBe(false);
  });

  it('should show the dropdown for an empty role list', () => {
    expect(shouldHideGroupDropdown([], ['User'])).toBe(false);
  });
});
