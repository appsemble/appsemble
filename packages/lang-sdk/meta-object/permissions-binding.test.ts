import { describe, expect, it } from 'vitest';

import { getAppPossiblePermissions } from '../authorization.js';
import { cursorAt, defineMetaObject, metaSchemas } from './index.js';
import { type AppDefinition } from '../types/index.js';

/*
 * End-to-end demo of the meta-object binding system: a real binding on the permissions
 * array. `validate` and `complete` are ~3 lines each because they reuse lang-sdk's
 * getAppPossiblePermissions (static enum + per-resource/view/webhook permissions), and
 * reach the enclosing app through cursor.nearest('AppDefinition') — the context a flat
 * schema enum cannot provide.
 */
const AppPermissions = defineMetaObject(
  'AppPermissions',
  { type: 'array', items: { type: 'string' } },
  {
    validate(cursor) {
      const app = cursor.nearest('AppDefinition')?.value as AppDefinition;
      const valid = new Set<string>(getAppPossiblePermissions(app));
      return ((cursor.value as string[]) ?? [])
        .filter((permission) => !valid.has(permission))
        .map((permission) => `unknown permission: ${permission}`);
    },
    complete(cursor) {
      const app = cursor.nearest('AppDefinition')?.value as AppDefinition;
      const present = new Set((cursor.value as string[]) ?? []);
      return getAppPossiblePermissions(app).filter((permission) => !present.has(permission));
    },
  },
);

const defs = [
  AppPermissions,
  defineMetaObject(
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
  defineMetaObject(
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
  defineMetaObject(
    'RoleDefinition',
    {
      type: 'object',
      properties: { permissions: { $ref: '#/components/schemas/AppPermissions' } },
    },
    {},
  ),
];
const schemas = metaSchemas(defs);

const app = {
  resources: { note: { views: { public: {} } } },
  webhooks: { sync: {} },
  security: { roles: { Reader: { permissions: ['$resource:note:get', '$resource:bogus:get'] } } },
};

function permissionsCursor(): ReturnType<typeof cursorAt> {
  const root = cursorAt(schemas, schemas.AppDefinition, app);
  const cursor = root.child('security')?.child('roles')?.child('Reader')?.child('permissions');
  if (!cursor) {
    throw new Error('failed to navigate to permissions');
  }
  return cursor;
}

describe('meta-object binding: app permissions', () => {
  it('should navigate to the permissions node and resolve its identity', () => {
    const cursor = permissionsCursor();
    expect(cursor.identity?.name).toBe('AppPermissions');
    expect(cursor.value).toStrictEqual(['$resource:note:get', '$resource:bogus:get']);
    // Climbing past the untagged intermediate nodes reaches the enclosing app.
    expect(permissionsCursor().nearest('AppDefinition')?.value).toBe(app);
  });

  it('should flag a permission the app cannot grant', () => {
    const problems = AppPermissions.binding.validate!(permissionsCursor());
    expect(problems).toStrictEqual(['unknown permission: $resource:bogus:get']);
  });

  it('should complete with valid permissions not yet present', () => {
    const completions = AppPermissions.binding.complete!(permissionsCursor());
    // Resource/view/webhook permissions derived from THIS app's definition.
    expect(completions).toContain('$webhook:sync:invoke');
    expect(completions).toContain('$resource:note:get:public');
    expect(completions).toContain('$resource:note:delete');
    // Already-present permissions are not suggested again.
    expect(completions).not.toContain('$resource:note:get');
  });
});
