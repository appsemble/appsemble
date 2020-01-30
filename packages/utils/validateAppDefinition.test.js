import { AppsembleValidationError, validateHooks, validateSecurity } from './validateAppDefinition';

describe('validateSecurity', () => {
  it('does not throw errors on valid definitions', () => {
    const definition = {
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      roles: ['Reader'],
      pages: [
        { name: 'Test Page A', blocks: [{ type: 'test', version: '0.0.0', roles: [] }] },
        {
          name: 'Test Page B',
          roles: ['Reader'],
          blocks: [{ type: 'test', version: '0.0.0', roles: ['Reader'] }],
        },
        { name: 'Test Page C', roles: [], blocks: [{ type: 'test', version: '0.0.0' }] },
      ],
    };

    expect(() => validateSecurity(definition)).not.toThrow();
  });

  it('throws errors on cyclic dependencies', () => {
    const definition = {
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: { inherits: ['Admin'] },
          Admin: { inherits: ['Reader'] },
        },
      },
    };

    expect(() => validateSecurity(definition)).toThrow(
      new AppsembleValidationError('Cyclic inheritance found for role ‘Reader’.'),
    );
  });

  it('checks non-existant default roles', () => {
    const definition = {
      security: {
        default: { role: 'Readers', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
    };

    expect(() => validateSecurity(definition)).toThrow(
      new AppsembleValidationError('Default role ‘Readers’ does not exist in list of roles.'),
    );
  });

  it('checks non-existant app roles', () => {
    const definition = {
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      roles: ['Reader', 'Admins'],
    };

    expect(() => validateSecurity(definition)).toThrow(
      new AppsembleValidationError('Role ‘Admins’ in App roles does not exist.'),
    );
  });

  it('checks non-existant page roles', () => {
    const definition = {
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      pages: [
        { name: 'Test Page A', roles: [], blocks: [] },
        { name: 'Test Page B', blocks: [] },
        { name: 'Test Page C', roles: ['Admins'], blocks: [] },
      ],
    };

    expect(() => validateSecurity(definition)).toThrow(
      new AppsembleValidationError('Role ‘Admins’ in page ‘Test Page C’ roles does not exist.'),
    );
  });

  it('checks non-existant block roles', () => {
    const definition = {
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      pages: [
        { name: 'Test Page A', blocks: [{ type: 'test', version: '0.0.0', roles: [] }] },
        { name: 'Test Page B', blocks: [{ type: 'test', version: '0.0.0', roles: ['Admins'] }] },
      ],
    };

    expect(() => validateSecurity(definition)).toThrow(
      new AppsembleValidationError('Role ‘Admins’ in pages.1.blocks.0 roles does not exist.'),
    );
  });
});

describe('validateHooks', () => {
  it('should validate the existance of roles in hooks', () => {
    const definition = {
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      resources: {
        TestResource: {
          create: {
            hooks: {
              notification: {
                to: ['$author'],
              },
            },
          },
          update: {
            hooks: {
              notification: {
                to: ['$author', 'Reader'],
              },
            },
          },
        },
      },
    };

    expect(() => validateHooks(definition)).not.toThrow();
  });

  it('should validate the existance of hook roles', () => {
    const definition = {
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      resources: {
        TestResource: {
          create: {
            hooks: {
              notification: {
                to: ['foo'],
              },
            },
          },
        },
      },
    };

    expect(() => validateHooks(definition)).toThrow(
      new AppsembleValidationError(
        'Role ‘foo’ in resources.TestResource.create.hooks.notification.to does not exist.',
      ),
    );
  });
});
