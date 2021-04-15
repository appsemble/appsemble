import { getDefaultPageName, resolveRoleInheritance } from './getDefaultPageName';

describe('resolveRoleInheritance', () => {
  it('should return an empty array if no security definition is defined', () => {
    const result = resolveRoleInheritance({ defaultPage: '', pages: [] }, 'unknown');
    expect(result).toStrictEqual([]);
  });

  it('should return an empty array for an unknown role', () => {
    const result = resolveRoleInheritance(
      {
        defaultPage: '',
        pages: [],
        security: {
          default: { role: 'known' },
          roles: {
            known: {},
          },
        },
      },
      'unknown',
    );
    expect(result).toStrictEqual([]);
  });

  it('should resolve a non inherited role', () => {
    const result = resolveRoleInheritance(
      {
        defaultPage: '',
        pages: [],
        security: {
          default: { role: 'user' },
          roles: {
            user: {},
          },
        },
      },
      'user',
    );
    expect(result).toStrictEqual([['user', {}]]);
  });

  it('should resolve shallow inheritance', () => {
    const result = resolveRoleInheritance(
      {
        defaultPage: '',
        pages: [],
        security: {
          default: { role: 'user' },
          roles: {
            admin: { inherits: ['user'] },
            user: {},
          },
        },
      },
      'admin',
    );
    expect(result).toStrictEqual([
      ['admin', { inherits: ['user'] }],
      ['user', {}],
    ]);
  });

  it('should resolve nested inheritance', () => {
    const result = resolveRoleInheritance(
      {
        defaultPage: '',
        pages: [],
        security: {
          default: { role: 'user' },
          roles: {
            superadmin: { inherits: ['admin'] },
            admin: { inherits: ['user'] },
            user: {},
          },
        },
      },
      'superadmin',
    );
    expect(result).toStrictEqual([
      ['superadmin', { inherits: ['admin'] }],
      ['admin', { inherits: ['user'] }],
      ['user', {}],
    ]);
  });

  it('should resolve multiple inheritance', () => {
    const result = resolveRoleInheritance(
      {
        defaultPage: '',
        pages: [],
        security: {
          default: { role: 'user' },
          roles: {
            superadmin: { inherits: ['admin', 'user'] },
            admin: {},
            user: {},
          },
        },
      },
      'superadmin',
    );
    expect(result).toStrictEqual([
      ['superadmin', { inherits: ['admin', 'user'] }],
      ['admin', {}],
      ['user', {}],
    ]);
  });

  it('should not include duplicates', () => {
    const result = resolveRoleInheritance(
      {
        defaultPage: '',
        pages: [],
        security: {
          default: { role: 'user' },
          roles: {
            superadmin: { inherits: ['admin', 'user'] },
            admin: { inherits: ['user'] },
            user: {},
          },
        },
      },
      'superadmin',
    );
    expect(result).toStrictEqual([
      ['superadmin', { inherits: ['admin', 'user'] }],
      ['admin', { inherits: ['user'] }],
      ['user', {}],
    ]);
  });

  it('should resolve roles in order', () => {
    const result = resolveRoleInheritance(
      {
        defaultPage: '',
        pages: [],
        security: {
          default: { role: 'user' },
          roles: {
            superadmin: { inherits: ['user', 'admin'] },
            admin: { inherits: ['user'] },
            user: {},
          },
        },
      },
      'superadmin',
    );
    expect(result).toStrictEqual([
      ['superadmin', { inherits: ['user', 'admin'] }],
      ['user', {}],
      ['admin', { inherits: ['user'] }],
    ]);
  });
});

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
