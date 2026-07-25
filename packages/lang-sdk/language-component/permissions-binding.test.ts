import { describe, expect, it } from 'vitest';

import { getAppPossiblePermissions } from '../authorization.js';
import { LanguageComponent, LanguageCtx, type Node, scan } from './index.js';
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
      return ((node.val as string[]) ?? []).flatMap((permission, index) =>
        valid.has(permission)
          ? []
          : [{ message: `unknown permission: ${permission}`, path: [index] }],
      );
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
    // eslint-disable-next-line unicorn/no-useless-undefined -- the binding requires an explicit ctx argument
    const problems = AppPermissions.binding.validate!(permissionsNode(), undefined);
    // The bad permission is at index 1 of the array; the diagnostic pins it there, not on the node.
    expect(problems).toStrictEqual([
      { message: 'unknown permission: $resource:bogus:get', path: [1] },
    ]);
  });

  it('should complete with valid permissions not yet present', () => {
    // eslint-disable-next-line unicorn/no-useless-undefined -- the binding requires an explicit ctx argument
    const completions = AppPermissions.binding.complete!(permissionsNode(), undefined);
    // Resource/view/webhook permissions derived from THIS app's definition.
    expect(completions).toContain('$webhook:sync:invoke');
    expect(completions).toContain('$resource:note:get:public');
    expect(completions).toContain('$resource:note:delete');
    // Already-present permissions are not suggested again.
    expect(completions).not.toContain('$resource:note:get');
  });
});

// The tests above call the binding hook directly. A consumer (GUI editor, LSP) instead hands the
// engine a path and lets it find the governing binding — this exercises that dispatch seam:
// `bindingContextAt` (which component governs a position, and the relative path within it) and
// `callBindingAt` (run a hook there).
describe('language component binding dispatched through the engine at a path', () => {
  const permissionsPath = ['security', 'roles', 'Reader', 'permissions'];
  const tree = scan(
    LanguageCtx.compile(schemas, 'AppDefinition', { binds: LanguageComponent.bindings(defs) }),
    app,
  );

  it('resolves the governing binding at the mounted path, with an empty relative path', () => {
    const context = tree.bindingContextAt(permissionsPath);
    expect(context?.binding).toBe(AppPermissions.binding);
    expect(context?.componentPath).toStrictEqual(permissionsPath);
    expect(context?.relativePath).toStrictEqual([]);
    expect(context?.node.identity?.name).toBe('AppPermissions');
  });

  it('resolves a position inside the component to that binding with the relative subpath', () => {
    // A cursor on element 0 of the permissions array still resolves to the array's binding.
    const context = tree.bindingContextAt([...permissionsPath, 0]);
    expect(context?.componentPath).toStrictEqual(permissionsPath);
    expect(context?.relativePath).toStrictEqual([0]);
  });

  it('dispatches validate and complete by path, matching the direct-call results', () => {
    expect(tree.callBindingAt(permissionsPath, 'validate')).toStrictEqual([
      { message: 'unknown permission: $resource:bogus:get', path: [1] },
    ]);
    expect(tree.callBindingAt(permissionsPath, 'complete')).toContain('$webhook:sync:invoke');
  });

  it('returns undefined for an absent hook or a path no binding governs', () => {
    // The root AppDefinition is bound but has no `validate` hook: undefined, not a throw.
    expect(tree.callBindingAt([], 'validate')).toBeUndefined();
    // Bind only the permissions component, so the root mount is not a candidate; a sibling path
    // then has no governing binding at all.
    const permissionsOnly = scan(
      LanguageCtx.compile(schemas, 'AppDefinition', {
        binds: LanguageComponent.bindings([AppPermissions]),
      }),
      app,
    );
    expect(permissionsOnly.bindingContextAt(['resources'])).toBeUndefined();
    expect(permissionsOnly.callBindingAt(['resources'], 'complete')).toBeUndefined();
  });
});
