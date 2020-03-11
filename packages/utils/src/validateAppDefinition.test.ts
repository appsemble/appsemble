import { AppDefinition } from '@appsemble/types';

import { AppsembleValidationError, validateHooks, validateSecurity } from './validateAppDefinition';

describe('validateSecurity', () => {
  it('does not throw errors on valid definitions', () => {
    const definition: AppDefinition = {
      defaultPage: '',
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
    const definition: AppDefinition = {
      defaultPage: '',
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: { inherits: ['Admin'] },
          Admin: { inherits: ['Reader'] },
        },
      },
      pages: [],
    };

    expect(() => validateSecurity(definition)).toThrow(
      new AppsembleValidationError('Cyclic inheritance found for role ‘Reader’.'),
    );
  });

  it('checks non-existent default roles', () => {
    const definition: AppDefinition = {
      defaultPage: '',
      security: {
        default: { role: 'Readers', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      pages: [],
    };

    expect(() => validateSecurity(definition)).toThrow(
      new AppsembleValidationError('Default role ‘Readers’ does not exist in list of roles.'),
    );
  });

  it('checks non-existent app roles', () => {
    const definition: AppDefinition = {
      defaultPage: '',
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      roles: ['Reader', 'Admins'],
      pages: [],
    };

    expect(() => validateSecurity(definition)).toThrow(
      new AppsembleValidationError('Role ‘Admins’ in App roles does not exist.'),
    );
  });

  it('checks non-existent page roles', () => {
    const definition: AppDefinition = {
      defaultPage: '',
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

  it('checks non-existent block roles', () => {
    const definition: AppDefinition = {
      defaultPage: '',
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

  it('checks non-existent block roles in subpages', () => {
    const definition: AppDefinition = {
      defaultPage: '',
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      pages: [
        {
          name: 'Test Page A',
          type: 'flow',
          subPages: [
            { name: 'SubPage A1', blocks: [{ type: 'test', version: '0.0.0', roles: [] }] },
            {
              name: 'SubPage A2',
              blocks: [{ type: 'test', version: '0.0.0', roles: ['Admins'] }],
            },
          ],
        },
      ],
    };

    expect(() => validateSecurity(definition)).toThrow(
      new AppsembleValidationError(
        'Role ‘Admins’ in pages.0.subPages.1.blocks.0 roles does not exist.',
      ),
    );
  });
});

describe('validateHooks', () => {
  it('should validate the existance of roles in hooks', () => {
    const definition: AppDefinition = {
      defaultPage: '',
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      resources: {
        TestResource: {
          schema: { type: 'object' },
          create: {
            hooks: {
              notification: {
                to: ['$author'],
                data: { title: '', content: '', link: '' },
              },
            },
          },
          update: {
            hooks: {
              notification: {
                to: ['$author', 'Reader'],
                data: { title: '', content: '', link: '' },
              },
            },
          },
        },
      },
      pages: [],
    };

    expect(() => validateHooks(definition)).not.toThrow();
  });

  it('should validate the existance of hook roles', () => {
    const definition: AppDefinition = {
      defaultPage: '',
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      resources: {
        TestResource: {
          schema: { type: 'object' },
          create: {
            hooks: {
              notification: {
                to: ['foo'],
                data: { title: '', content: '', link: '' },
              },
            },
          },
        },
      },
      pages: [],
    };

    expect(() => validateHooks(definition)).toThrow(
      new AppsembleValidationError(
        'Role ‘foo’ in resources.TestResource.create.hooks.notification.to does not exist.',
      ),
    );
  });
});
