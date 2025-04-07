import {
  type AppDefinition,
  AppPermission,
  PredefinedAppRole,
  type Security,
} from '@appsemble/types';
import { describe, expect, it } from 'vitest';

import {
  checkAppRoleAppPermissions,
  checkGuestAppPermissions,
  getAppPossibleGuestPermissions,
  getAppPossiblePermissions,
  getAppRolePermissions,
  getAppRoles,
  getAppRolesByPermissions,
  getGuestAppPermissions,
} from './authorization.js';

describe('getAppRolePermissions', () => {
  it('should return permissions for an app role', () => {
    const security: Security = {
      default: {
        role: 'testRole',
      },
      roles: {
        testRole: {
          permissions: ['$resource:all:history:get'],
        },
      },
    };
    const rolePermissions = getAppRolePermissions(security, ['testRole']);
    expect(rolePermissions).toStrictEqual(['$resource:all:history:get']);
  });

  it('should return inherited permissions', () => {
    const security: Security = {
      default: {
        role: 'testRole',
      },
      roles: {
        testRole: {
          inherits: [PredefinedAppRole.GroupsManager],
          permissions: [],
        },
      },
    };
    const rolePermissions = getAppRolePermissions(security, ['testRole']);
    expect(rolePermissions).toStrictEqual([
      '$group:member:invite',
      '$group:member:query',
      '$group:member:delete',
      '$group:member:role:update',
      '$group:query',
      '$group:create',
      '$group:update',
      '$group:delete',
    ]);
  });

  it('should not override inherited permissions', () => {
    const security: Security = {
      default: {
        role: 'testRole',
      },
      roles: {
        testRole: {
          inherits: [PredefinedAppRole.MembersManager],
          permissions: ['$resource:all:history:get'],
        },
      },
    };
    const rolePermissions = getAppRolePermissions(security, ['testRole']);
    expect(rolePermissions).toStrictEqual([
      '$resource:all:history:get',
      '$member:invite',
      '$member:query',
      '$member:delete',
      '$member:role:update',
      '$member:properties:patch',
    ]);
  });
});

describe('getGuestAppPermissions', () => {
  it('should return the app permissions for guest members', () => {
    const security: Security = {
      guest: {
        permissions: ['$resource:all:history:get'],
      },
    };
    const rolePermissions = getGuestAppPermissions(security);
    expect(rolePermissions).toStrictEqual(['$resource:all:history:get']);
  });

  it('should return inherited permissions', () => {
    const security: Security = {
      guest: {
        inherits: [PredefinedAppRole.GroupsManager],
        permissions: [],
      },
    };
    const rolePermissions = getGuestAppPermissions(security);
    expect(rolePermissions).toStrictEqual([
      '$group:member:invite',
      '$group:member:query',
      '$group:member:delete',
      '$group:member:role:update',
      '$group:query',
      '$group:create',
      '$group:update',
      '$group:delete',
    ]);
  });

  it('should not override inherited permissions', () => {
    const security: Security = {
      guest: {
        inherits: [PredefinedAppRole.MembersManager],
        permissions: ['$resource:all:history:get'],
      },
    };
    const rolePermissions = getGuestAppPermissions(security);
    expect(rolePermissions).toStrictEqual([
      '$resource:all:history:get',
      '$member:invite',
      '$member:query',
      '$member:delete',
      '$member:role:update',
      '$member:properties:patch',
    ]);
  });
});

describe('checkGuestAppPermissions', () => {
  it('should return true if the guest has required permissions', () => {
    const security: Security = {
      guest: {
        permissions: ['$resource:all:history:get'],
      },
    };
    const isMatch = checkGuestAppPermissions(security, ['$resource:all:history:get']);
    expect(isMatch).toBe(true);
  });

  it('should return false if the guest does not have sufficient permissions', () => {
    const security: Security = {
      guest: {
        permissions: [],
      },
    };
    const isMatch = checkGuestAppPermissions(security, ['$resource:all:get']);
    expect(isMatch).toBe(false);
  });

  it('should return true for inherited permissions', () => {
    const security: Security = {
      guest: {
        permissions: [],
        inherits: [PredefinedAppRole.ResourcesManager],
      },
    };
    const isMatch = checkGuestAppPermissions(security, ['$resource:all:get']);
    expect(isMatch).toBe(true);
  });

  it('should return true for individual resource permissions if all is defined in the role permissions', () => {
    const security: Security = {
      guest: {
        permissions: ['$resource:all:history:get'],
      },
    };
    const isMatch = checkGuestAppPermissions(security, ['$resource:test:history:get']);
    expect(isMatch).toBe(true);
  });
});

describe('getAppRoles', () => {
  it('should return roles defined in the security definition', () => {
    const security: Security = {
      default: {
        role: 'testRoleA',
      },
      roles: {
        testRoleA: {},
        testRoleB: {},
      },
    };
    const roles = getAppRoles(security);
    expect(roles).toStrictEqual(['testRoleA', 'testRoleB']);
  });

  it('should return empty array if no roles are defined', () => {
    const security: Security = {
      guest: {},
    };
    expect(getAppRoles(security)).toStrictEqual([]);
  });
});

describe('getAppPossibleGuestPermissions', () => {
  it('should return an array of all possible permissions', () => {
    const appDefinition: AppDefinition = {
      name: 'Test Name',
      defaultPage: 'Test Page',
      pages: [],
      security: {
        guest: {},
      },
      resources: {
        test: {
          views: {
            testView: {
              remap: { static: 'foo' },
            },
          },
          schema: {},
        },
        foo: {
          schema: {},
        },
      },
    };
    const possiblePermissions = getAppPossibleGuestPermissions(appDefinition);
    expect(possiblePermissions).toStrictEqual([
      ...Object.values(AppPermission),
      '$resource:test:create',
      '$resource:test:query',
      '$resource:test:get',
      '$resource:test:history:get',
      '$resource:test:update',
      '$resource:test:patch',
      '$resource:test:delete',
      '$resource:test:query:testView',
      '$resource:test:get:testView',
      '$resource:foo:create',
      '$resource:foo:query',
      '$resource:foo:get',
      '$resource:foo:history:get',
      '$resource:foo:update',
      '$resource:foo:patch',
      '$resource:foo:delete',
    ]);
  });

  it('should return the default permissions is no resources are defined', () => {
    const appDefinition: AppDefinition = {
      name: 'TestName',
      defaultPage: 'TestPage',
      pages: [],
    };
    const appPermissions = getAppPossibleGuestPermissions(appDefinition);
    expect(appPermissions).toStrictEqual(Object.values(AppPermission));
  });
});

describe('getAppPossiblePermissions', () => {
  it('should include the app member specific permissions', () => {
    const appDefinition: AppDefinition = {
      name: 'Test Name',
      defaultPage: 'Test Page',
      pages: [],
      security: {
        guest: {},
      },
      resources: {
        foo: {
          schema: {},
        },
      },
    };
    const appPermissions = getAppPossiblePermissions(appDefinition);
    expect(appPermissions).toStrictEqual([
      ...Object.values(AppPermission),
      '$resource:foo:create',
      '$resource:foo:query',
      '$resource:foo:get',
      '$resource:foo:history:get',
      '$resource:foo:update',
      '$resource:foo:patch',
      '$resource:foo:delete',
      '$resource:foo:own:query',
      '$resource:foo:own:get',
      '$resource:foo:own:update',
      '$resource:foo:own:patch',
      '$resource:foo:own:delete',
    ]);
  });
});

describe('getAppRolesByPermissions', () => {
  it('should return all the matching roles', () => {
    const security: Security = {
      guest: {
        permissions: ['$resource:test:history:get'],
      },
      roles: {
        testRole: {
          permissions: ['$resource:test:history:get', '$resource:test:get'],
        },
      },
    };
    const matchingRoles = getAppRolesByPermissions(security, ['$resource:test:get']);
    expect(matchingRoles).toStrictEqual(['testRole']);
  });
});

describe('checkAppRolePermissions', () => {
  it('should return true if the member has required permissions', () => {
    const security: Security = {
      default: { role: 'User' },
      roles: {
        User: {
          permissions: ['$resource:all:history:get'],
        },
      },
    };
    const isMatch = checkAppRoleAppPermissions(security, 'User', ['$resource:all:history:get']);
    expect(isMatch).toBe(true);
  });

  it('should return false if the member does not have sufficient permissions', () => {
    const security: Security = {
      default: {
        role: 'User',
      },
      roles: {
        User: {
          permissions: [],
        },
      },
    };
    const isMatch = checkAppRoleAppPermissions(security, 'User', ['$resource:all:get']);
    expect(isMatch).toBe(false);
  });

  it('should return true for inherited permissions', () => {
    const security: Security = {
      default: { role: 'User' },
      roles: {
        User: {
          permissions: [],
          inherits: [PredefinedAppRole.ResourcesManager],
        },
      },
    };
    const isMatch = checkAppRoleAppPermissions(security, 'User', ['$resource:all:get']);
    expect(isMatch).toBe(true);
  });

  it('should return true for individual resource permissions if all is defined in the role permissions', () => {
    const security: Security = {
      default: { role: 'User' },
      roles: {
        User: {
          permissions: ['$resource:all:history:get'],
        },
      },
    };
    const isMatch = checkAppRoleAppPermissions(security, 'User', ['$resource:test:history:get']);
    expect(isMatch).toBe(true);
  });
});
