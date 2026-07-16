import { describe, expect, it } from 'vitest';

import { shouldHideGroupDropdown } from './layout.js';

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
