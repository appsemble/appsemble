import { type AppDefinition, type MessageGetter } from '@appsemble/lang-sdk';
import { IntlMessageFormat } from 'intl-messageformat';
import { describe, expect, it } from 'vitest';

import { getNavPages, shouldHideGroupDropdown, shouldShowMenu } from './layout.js';

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

describe('shouldShowMenu', () => {
  const appDefinition = {
    name: 'Test App',
    defaultPage: 'Home',
    pages: [{ name: 'Home', blocks: [] }],
  } as unknown as AppDefinition;

  function createGetAppMessage(appMessages: Record<string, string>): MessageGetter {
    return ({ defaultMessage, id }) =>
      new IntlMessageFormat(appMessages[id!] ?? defaultMessage ?? '', 'en');
  }

  it('should hide the menu on a page of an app with a single visible page', () => {
    expect(
      shouldShowMenu(appDefinition, [], undefined as never, '/en/home', createGetAppMessage({})),
    ).toBe(false);
  });

  it('should show the menu on a built-in route', () => {
    expect(
      shouldShowMenu(
        appDefinition,
        [],
        undefined as never,
        '/en/Settings',
        createGetAppMessage({}),
      ),
    ).toBe(true);
  });

  it('should treat a translated built-in route as a built-in route', () => {
    const getAppMessage = createGetAppMessage({ 'routes.Settings': 'Preferences' });
    expect(
      shouldShowMenu(appDefinition, [], undefined as never, '/nl/Preferences', getAppMessage),
    ).toBe(true);
  });
});
