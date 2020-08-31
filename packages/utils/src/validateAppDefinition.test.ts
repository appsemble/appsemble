import type { AppDefinition } from '@appsemble/types';

import {
  AppsembleValidationError,
  checkBlocks,
  validateDefaultPage,
  validateHooks,
  validateLanguage,
  validateReferences,
  validateSecurity,
} from './validateAppDefinition';

describe('validateDefaultPage', () => {
  it('should pass if defaultPage exists', () => {
    const definition: AppDefinition = {
      defaultPage: 'Foo',
      pages: [
        { name: 'Foo', blocks: [] },
        { name: 'Bar', blocks: [] },
      ],
    };

    expect(() => validateDefaultPage(definition)).not.toThrow();
  });

  it('should throw if defaultPage does not exist', () => {
    const definition: AppDefinition = {
      defaultPage: 'Foo',
      pages: [{ name: 'Bar', blocks: [] }],
    };

    expect(() => validateDefaultPage(definition)).toThrow(
      new AppsembleValidationError('Page “Foo” as specified in defaultPage does not exist.'),
    );
  });

  it('should not allow pages with page parameters', () => {
    const definition: AppDefinition = {
      defaultPage: 'Foo',
      pages: [{ name: 'Foo', parameters: ['id'], blocks: [] }],
    };

    expect(() => validateDefaultPage(definition)).toThrow(
      new AppsembleValidationError('Default page “Foo” can not have page parameters.'),
    );
  });
});

describe('checkBlocks', () => {
  it('should validate block parameters using JSON schema', () => {
    let error: AppsembleValidationError;
    try {
      checkBlocks(
        { 'pages.0.blocks.0': { type: 'test', version: '1.2.3', parameters: { prop: 1 } } },
        [
          {
            name: '@appsemble/test',
            version: '1.2.3',
            files: [],
            parameters: {
              type: 'object',
              properties: {
                prop: { type: 'string' },
              },
            },
          },
        ],
      );
    } catch (err: unknown) {
      error = err as AppsembleValidationError;
    }
    expect(error).toBeInstanceOf(AppsembleValidationError);
    expect(error.message).toBe('Block validation failed');
    expect(error.data).toStrictEqual({
      'pages.0.blocks.0.parameters.prop': 'should be string',
    });
  });

  it('should not throw on success', () => {
    expect(() =>
      checkBlocks({ 'pages.0.blocks.0': { type: 'test', version: '1.2.3' } }, [
        { name: '@appsemble/test', version: '1.2.3', files: [] },
      ]),
    ).not.toThrow();
  });

  it('should validate whether block types exist', () => {
    let error: AppsembleValidationError;
    try {
      checkBlocks({ 'pages.0.blocks.0': { type: 'test', version: '1.2.3' } }, []);
    } catch (err: unknown) {
      error = err as AppsembleValidationError;
    }
    expect(error).toBeInstanceOf(AppsembleValidationError);
    expect(error.message).toBe('Block validation failed');
    expect(error.data).toStrictEqual({
      'pages.0.blocks.0': 'Unknown block type “@appsemble/test”',
    });
  });

  it('should throw on unknown action types', () => {
    let error: AppsembleValidationError;
    try {
      checkBlocks(
        {
          'pages.0.blocks.0': {
            type: 'test',
            version: '1.2.3',
            actions: { onClick: { type: 'noop' } },
          },
        },
        [{ name: '@appsemble/test', version: '1.2.3', files: [], actions: { onTap: {} } }],
      );
    } catch (err: unknown) {
      error = err as AppsembleValidationError;
    }
    expect(error).toBeInstanceOf(AppsembleValidationError);
    expect(error.message).toBe('Block validation failed');
    expect(error.data).toStrictEqual({
      'pages.0.blocks.0.actions.onClick': 'Unknown action type',
    });
  });

  it('should validate wildcard actions', () => {
    let error: AppsembleValidationError;
    try {
      checkBlocks(
        {
          'pages.0.blocks.0': {
            type: 'test',
            version: '1.2.3',
            actions: { onClick: { type: 'noop' }, onTap: { type: 'noop' } },
            parameters: { customAction: 'onClick' },
          },
        },
        [
          {
            name: '@appsemble/test',
            version: '1.2.3',
            files: [],
            actions: { $any: {} },
            parameters: {
              type: 'object',
              properties: { customAction: { type: 'string', format: 'action' } },
            },
          },
        ],
      );
    } catch (err: unknown) {
      error = err as AppsembleValidationError;
    }
    expect(error).toBeInstanceOf(AppsembleValidationError);
    expect(error.message).toBe('Block validation failed');
    expect(error.data).toStrictEqual({
      'pages.0.blocks.0.actions.onTap': 'Custom action “onTap” is unused',
    });
  });

  it('should throw if a block doesn’t support actions', () => {
    let error: AppsembleValidationError;
    try {
      checkBlocks(
        {
          'pages.0.blocks.0': {
            type: 'test',
            version: '1.2.3',
            actions: { onClick: { type: 'noop' } },
          },
        },
        [{ name: '@appsemble/test', version: '1.2.3', files: [] }],
      );
    } catch (err: unknown) {
      error = err as AppsembleValidationError;
    }
    expect(error).toBeInstanceOf(AppsembleValidationError);
    expect(error.message).toBe('Block validation failed');
    expect(error.data).toStrictEqual({
      'pages.0.blocks.0.actions': 'This block doesn’t support any actions',
    });
  });
});

describe('validateSecurity', () => {
  it('should not throw errors on valid definitions', () => {
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

  it('should throw errors on cyclic dependencies', () => {
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

  it('should check for non-existent default roles', () => {
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

  it('should check for non-existent app roles', () => {
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

  it('should check for non-existent page roles', () => {
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

  it('should check for non-existent block roles', () => {
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

  it('should check for non-existent block roles in subpages', () => {
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

describe('validateReferences', () => {
  it('should validate resource references', () => {
    const definition: AppDefinition = {
      defaultPage: '',
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      pages: [],
      resources: {
        test: {},
        testGroup: {
          schema: { type: 'object', properties: { testId: { type: 'string' } } },
          references: {
            testId: {
              resource: 'test',
            },
          },
        },
      },
    };

    expect(() => validateReferences(definition)).not.toThrow();
  });

  it('should throw if referenced resource does not exist', () => {
    const definition: AppDefinition = {
      defaultPage: '',
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      pages: [],
      resources: {
        testGroup: {
          schema: { type: 'object', properties: { testId: { type: 'string' } } },
          references: {
            testId: {
              resource: 'test',
            },
          },
        },
      },
    };

    expect(() => validateReferences(definition)).toThrow(
      new AppsembleValidationError('Resource “test” referenced by “testGroup” does not exist.'),
    );
  });

  it('should throw if referenced resource property does not exist', () => {
    const definition: AppDefinition = {
      defaultPage: '',
      security: {
        default: { role: 'Reader', policy: 'everyone' },
        roles: {
          Reader: {},
          Admin: { inherits: ['Reader'] },
        },
      },
      pages: [],
      resources: {
        test: {},
        testGroup: {
          schema: { type: 'object', properties: {} },
          references: {
            testId: {
              resource: 'test',
            },
          },
        },
      },
    };

    expect(() => validateReferences(definition)).toThrow(
      new AppsembleValidationError(
        'Property “testId” referencing “test” does not exist in resource “testGroup”',
      ),
    );
  });
});

describe('validateLanguage', () => {
  const valid = ['en', 'en-US', 'en-us', 'en-Gb', 'zh-hans', 'az-Latn', 'en-US-x-twain'];

  it.each(valid)('should pass on %p', (lang) => {
    expect(() => validateLanguage(lang)).not.toThrow();
  });

  const invalid = ['blaaaaaaaaaaaaaaaa', 'dutch', 'jp'];

  it.each(invalid)('should throw on %p', (lang) => {
    expect(() => validateLanguage(lang)).toThrow(
      new AppsembleValidationError(`Language code “${lang}” is invalid.`),
    );
  });
});
