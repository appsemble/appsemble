import { resolveRoleInheritance } from './appSecurity';

describe('resolveRoleInheritance', () => {
  it('should return an empty array if no security definition is defined', () => {
    const result = resolveRoleInheritance({}, 'unknown');
    expect(result).toStrictEqual([]);
  });

  it('should return an empty array for an unknown role', () => {
    const result = resolveRoleInheritance(
      {
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
