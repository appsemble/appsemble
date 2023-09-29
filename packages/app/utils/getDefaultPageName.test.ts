import { describe, expect, it } from 'vitest';

import { getDefaultPageName } from './getDefaultPageName.js';

describe('getDefaultPageName', () => {
  it('should return the default page if not logged in', () => {
    const result = getDefaultPageName(false, '', { defaultPage: 'TestPage' });
    expect(result).toBe('TestPage');
  });

  it('should return the default page if the user is logged in but has no defaultRole', () => {
    const result = getDefaultPageName(true, 'User', {
      defaultPage: 'TestPage',
      security: { default: { role: 'User' }, roles: { User: {} } },
    });
    expect(result).toBe('TestPage');
  });

  it('should return the current role’s default page', () => {
    const result = getDefaultPageName(true, 'User', {
      defaultPage: 'TestPage',
      security: { default: { role: 'User' }, roles: { User: { defaultPage: 'RolePage' } } },
    });
    expect(result).toBe('RolePage');
  });

  it('should return the inherited role’s default page', () => {
    const result = getDefaultPageName(true, 'User', {
      defaultPage: 'TestPage',
      security: {
        default: { role: 'User' },
        roles: { Foo: { defaultPage: 'FooPage' }, User: { inherits: ['Foo'] } },
      },
    });
    expect(result).toBe('FooPage');
  });

  it('should prioritize the role’s default page', () => {
    const result = getDefaultPageName(true, 'User', {
      defaultPage: 'TestPage',
      security: {
        default: { role: 'User' },
        roles: {
          Foo: { defaultPage: 'FooPage' },
          User: { inherits: ['Foo'], defaultPage: 'RolePage' },
        },
      },
    });
    expect(result).toBe('RolePage');
  });
});
