import { describe, expect, it } from 'vitest';

import { getAppPossiblePermissions } from '../authorization.js';
import { LanguageComponent, LanguageCtx, type Node } from './index.js';
import { type AppDefinition } from '../types/index.js';

/*
 * End-to-end demo of the language component binding system: a real binding on the permissions
 * array. `validate` and `complete` are ~3 lines each because they reuse lang-sdk's
 * getAppPossiblePermissions (static enum + per-resource/view/webhook permissions), and
 * reach the enclosing app through cursor.nearest('AppDefinition') — the context a flat
 * schema enum cannot provide.
 */
const AppPermissions = LanguageComponent.define(
  'AppPermissions',
  { type: 'array', items: { type: 'string' } },
  {
    validate(node) {
      const app = node.nearest('AppDefinition')?.val as AppDefinition;
      const valid = new Set<string>(getAppPossiblePermissions(app));
      return ((node.val as string[]) ?? [])
        .filter((permission) => !valid.has(permission))
        .map((permission) => `unknown permission: ${permission}`);
    },
    complete(node) {
      const app = node.nearest('AppDefinition')?.val as AppDefinition;
      const present = new Set((node.val as string[]) ?? []);
      return getAppPossiblePermissions(app).filter((permission) => !present.has(permission));
    },
  },
);

const defs = [
  AppPermissions,
  LanguageComponent.define(
    'AppDefinition',
    {
      type: 'object',
      properties: {
        resources: { type: 'object' },
        webhooks: { type: 'object' },
        security: { $ref: '#/components/schemas/SecurityDefinition' },
      },
    },
    {},
  ),
  LanguageComponent.define(
    'SecurityDefinition',
    {
      type: 'object',
      properties: {
        roles: {
          type: 'object',
          additionalProperties: { $ref: '#/components/schemas/RoleDefinition' },
        },
      },
    },
    {},
  ),
  LanguageComponent.define(
    'RoleDefinition',
    {
      type: 'object',
      properties: { permissions: { $ref: '#/components/schemas/AppPermissions' } },
    },
    {},
  ),
];
const schemas = LanguageComponent.schemas(defs);

const app = {
  resources: { note: { views: { public: {} } } },
  webhooks: { sync: {} },
  security: { roles: { Reader: { permissions: ['$resource:note:get', '$resource:bogus:get'] } } },
};

function permissionsNode(): Node {
  const root = LanguageCtx.compile(schemas, 'AppDefinition').root(app);
  const node = root.child('security')?.child('roles')?.child('Reader')?.child('permissions');
  if (!node) {
    throw new Error('failed to navigate to permissions');
  }
  return node;
}

describe('language component binding: app permissions', () => {
  it('should navigate to the permissions node and resolve its identity', () => {
    const node = permissionsNode();
    expect(node.identity?.name).toBe('AppPermissions');
    expect(node.val).toStrictEqual(['$resource:note:get', '$resource:bogus:get']);
    // Climbing past the untagged intermediate nodes reaches the enclosing app.
    expect(permissionsNode().nearest('AppDefinition')?.val).toBe(app);
  });

  it('should flag a permission the app cannot grant', () => {
    const problems = AppPermissions.binding.validate!(permissionsNode());
    expect(problems).toStrictEqual(['unknown permission: $resource:bogus:get']);
  });

  it('should complete with valid permissions not yet present', () => {
    const completions = AppPermissions.binding.complete!(permissionsNode());
    // Resource/view/webhook permissions derived from THIS app's definition.
    expect(completions).toContain('$webhook:sync:invoke');
    expect(completions).toContain('$resource:note:get:public');
    expect(completions).toContain('$resource:note:delete');
    // Already-present permissions are not suggested again.
    expect(completions).not.toContain('$resource:note:get');
  });
});
