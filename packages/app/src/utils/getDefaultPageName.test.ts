import { getDefaultPageName } from './getDefaultPageName';

describe('getDefaultPageName', () => {
  it('should return the default page if not logged in', () => {
    expect(getDefaultPageName(false, '', { defaultPage: 'TestPage' })).toBe('TestPage');
  });

  it('should return the default page if the user is logged in but has no defaultRole', () => {
    expect(
      getDefaultPageName(true, 'User', {
        defaultPage: 'TestPage',
        security: { default: { role: 'User' }, roles: { User: {} } },
      }),
    ).toBe('TestPage');
  });

  it('should return the current role’s default page', () => {
    expect(
      getDefaultPageName(true, 'User', {
        defaultPage: 'TestPage',
        security: { default: { role: 'User' }, roles: { User: { defaultPage: 'RolePage' } } },
      }),
    ).toBe('RolePage');
  });

  it('should return the inherited role’s default page', () => {
    expect(
      getDefaultPageName(true, 'User', {
        defaultPage: 'TestPage',
        security: {
          default: { role: 'User' },
          roles: { Foo: { defaultPage: 'FooPage' }, User: { inherits: ['Foo'] } },
        },
      }),
    ).toBe('FooPage');
  });

  it('should prioritize the role’s default page', () => {
    expect(
      getDefaultPageName(true, 'User', {
        defaultPage: 'TestPage',
        security: {
          default: { role: 'User' },
          roles: {
            Foo: { defaultPage: 'FooPage' },
            User: { inherits: ['Foo'], defaultPage: 'RolePage' },
          },
        },
      }),
    ).toBe('RolePage');
  });
});
