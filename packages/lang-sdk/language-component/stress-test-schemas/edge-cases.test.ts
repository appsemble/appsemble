import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { buildTree, LanguageComponent, LanguageCtx, scan } from '../index.js';
import { analyzeComponent, describeIdentity, describeIdentities } from './harness.js';
import { miniSchemas } from './schemas.js';
import { componentScenarios } from './scenarios.js';

const treeIdentities = describeIdentities;
// The badge-list parameters own gallery/registry/holders directly, so they root the incremental
// mechanics cases (array-index boundaries, a null value along the changed path, an unowned key).
const miniCtx = LanguageCtx.compile(miniSchemas, 'BadgeListBlockParams');

describe('engine edge cases', () => {
  it('keeps local validation possible when a nested oneOf contains refs', () => {
    const schemas = {
      ChoiceA: {
        type: 'object',
        required: ['kind'],
        properties: { kind: { const: 'a' } },
      },
      ChoiceB: {
        type: 'object',
        required: ['kind'],
        properties: { kind: { const: 'b' } },
      },
      RefCutPart: {
        'x-appsemble-language-component': { name: 'RefCutPart', mode: 'single' },
        type: 'object',
        required: ['choice'],
        properties: { choice: { type: 'object' } },
      },
      RefCutContainer: {
        'x-appsemble-language-component': { name: 'RefCutContainer', mode: 'allOf' },
        allOf: [
          {
            type: 'object',
            required: ['choice'],
            properties: {
              choice: {
                oneOf: [
                  { $ref: '#/components/schemas/ChoiceA' },
                  { $ref: '#/components/schemas/ChoiceB' },
                ],
              },
            },
          },
          { $ref: '#/components/schemas/RefCutPart' },
        ],
      },
    } satisfies Record<string, Schema>;

    const tree = buildTree(LanguageCtx.compile(schemas, 'RefCutContainer'), {
      choice: { kind: 'a' },
    });
    const mounted = tree.mounts.get('/');

    expect(mounted).toBeDefined();
    expect(describeIdentity(mounted!.identity)).toBe('RefCutContainer:allOf(RefCutPart)');
    expect(mounted!.localValid).toBe(true);
  });

  it('enforces an inline anyOf property during local validation', () => {
    const schemas = {
      AnyOfHost: {
        'x-appsemble-language-component': { name: 'AnyOfHost', mode: 'single' },
        type: 'object',
        required: ['choice'],
        properties: {
          // Inline anyOf (no $ref): the ref-cutoff keeps its members, so local
          // validation must still enforce one of them.
          choice: { anyOf: [{ const: 'a' }, { const: 'b' }] },
        },
      },
    } satisfies Record<string, Schema>;

    const anyOfCtx = LanguageCtx.compile(schemas, 'AnyOfHost');
    const valid = buildTree(anyOfCtx, { choice: 'a' });
    const invalid = buildTree(anyOfCtx, { choice: 'c' });

    expect(valid.mounts.get('/')!.localValid).toBe(true);
    expect(invalid.mounts.get('/')!.localValid).toBe(false);
  });

  it("captures a node's own local-shape errors on its mount during the walk", () => {
    const Strict = LanguageComponent.define(
      'StrictLocal',
      { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
      {},
    );
    const schemas = LanguageComponent.schemas([Strict]);
    const tree = buildTree(LanguageCtx.compile(schemas, 'StrictLocal'), {});
    const mount = tree.mounts.get('/');

    expect(mount).toBeDefined();
    expect(mount!.localValid).toBe(false);
    expect(mount!.localErrors.length).toBeGreaterThan(0);
    // The whole-document `errors` field stays empty until `validate` runs.
    expect(mount!.errors).toStrictEqual([]);
  });

  // The no-match counterpart to the scenario-driven 'composes every wrapper under an
  // untagged combinator' in 'language component gaps'. It stays here because the null-identity
  // branch needs untagged members with no annotated parts, which the shared fixtures
  // cannot express (their members are tagged, so failure yields unresolved, not null).
  it('yields no identity for an untagged allOf whose members do not all match', () => {
    const schema = {
      allOf: [
        { type: 'object', required: ['x'], properties: { x: { type: 'string' } } },
        { type: 'object' },
      ],
    } satisfies Schema;

    // Untagged combinator + no annotated parts + a member that fails -> nothing mounts.
    const tree = buildTree(LanguageCtx.compile({ Root: schema }, 'Root'), {});

    expect(tree.mounts.size).toBe(0);
  });

  it('stops the incremental boundary when a value along the changed path became null', () => {
    const v1 = { holders: [{ text: 'a', badge: { label: 'x' } }] };
    const treeV1 = buildTree(miniCtx, v1);

    const v2 = { holders: null };
    const incremental = buildTree(miniCtx, v2, {
      previous: treeV1,
      changed: [['holders', 0, 'badge']],
    });

    expect(treeIdentities(incremental)).toStrictEqual(treeIdentities(buildTree(miniCtx, v2)));
  });

  it('mounts nothing for an untagged oneOf with no matching annotated branch', () => {
    const schemas = {
      UntaggedChoice: {
        oneOf: [
          {
            'x-appsemble-language-component': { name: 'Alpha', mode: 'single' },
            type: 'object',
            required: ['kind'],
            properties: { kind: { const: 'a' } },
          },
          {
            'x-appsemble-language-component': { name: 'Beta', mode: 'single' },
            type: 'object',
            required: ['kind'],
            properties: { kind: { const: 'b' } },
          },
        ],
      },
    } satisfies Record<string, Schema>;

    const tree = buildTree(LanguageCtx.compile(schemas, 'UntaggedChoice'), { kind: 'c' });

    expect(tree.mounts.size).toBe(0);
  });

  it('matches a full rebuild when a changed path is below an unowned schema key', () => {
    const before = {
      gallery: [{ label: 'gold' }],
      metadata: { note: 'before' },
    };
    const after = {
      gallery: [{ label: 'gold' }],
      metadata: { note: 'after' },
    };
    const previous = buildTree(miniCtx, before);

    const incremental = buildTree(miniCtx, after, {
      previous,
      changed: [['metadata', 'note']],
    });

    expect(treeIdentities(incremental)).toStrictEqual(treeIdentities(buildTree(miniCtx, after)));
  });

  it('reports an unknown schema ref when analysis resolves a missing ref', () => {
    const root: Schema = {
      type: 'object',
      properties: { item: { $ref: '#/components/schemas/Missing' } },
    };

    expect(() => scan(LanguageCtx.compile({ Root: root }, 'Root'), { item: {} })).toThrow(
      /Unknown schema ref/,
    );
  });

  it('navigates into a child key whose parent value is null', () => {
    const Nested = LanguageComponent.define(
      'NullParent',
      {
        type: 'object',
        properties: { a: { type: 'object', properties: { b: { type: 'string' } } } },
      },
      {},
    );
    const schemas = LanguageComponent.schemas([Nested]);
    const root = LanguageCtx.compile(schemas, 'NullParent').root({ a: null });

    const grandchild = root.child('a')?.child('b');
    expect(grandchild).not.toBeNull();
    expect(grandchild!.val).toBeUndefined();
  });

  it('returns null from nearest when no ancestor carries the requested identity name', () => {
    const Solo = LanguageComponent.define(
      'SoloRoot',
      { type: 'object', properties: { a: { type: 'string' } } },
      {},
    );
    const schemas = LanguageComponent.schemas([Solo]);
    const root = LanguageCtx.compile(schemas, 'SoloRoot').root({ a: 'x' });

    expect(root.nearest('Nonexistent')).toBeNull();
  });

  it('reports cursor local validity for the focused tagged object', () => {
    const TaggedFocus = LanguageComponent.define(
      'TaggedFocus',
      { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
      {},
    );
    const schemas = LanguageComponent.schemas([TaggedFocus]);
    const focusCtx = LanguageCtx.compile(schemas, 'TaggedFocus');

    const valid = focusCtx.root({ name: 'ok' });
    const invalid = focusCtx.root({});

    expect(valid.identity?.name).toBe('TaggedFocus');
    expect(valid.localValid).toBe(true);
    expect(invalid.identity?.name).toBe('TaggedFocus');
    expect(invalid.localValid).toBe(false);
  });

  it('returns null for a child key not owned by the winning oneOf branch', () => {
    const Plain = LanguageComponent.define(
      'PlainBranchLocal',
      { type: 'object', required: ['type'], properties: { type: { const: 'plain' } } },
      {},
    );
    const Fancy = LanguageComponent.define(
      'FancyBranchLocal',
      {
        type: 'object',
        required: ['type'],
        properties: { type: { const: 'fancy' }, action: { type: 'object' } },
      },
      {},
    );
    const Host = LanguageComponent.define(
      'BranchHostLocal',
      {
        oneOf: [
          { $ref: '#/components/schemas/PlainBranchLocal' },
          { $ref: '#/components/schemas/FancyBranchLocal' },
        ],
      },
      {},
    );
    const schemas = LanguageComponent.schemas([Plain, Fancy, Host]);
    const node = LanguageCtx.compile(schemas, 'BranchHostLocal').root({
      type: 'plain',
      action: {},
    });

    expect(node.child('type')).not.toBeNull();
    expect(node.child('action')).toBeNull();
  });

  it('enumerates owned object children and no children for non-objects', () => {
    const OwnedObject = LanguageComponent.define(
      'OwnedObject',
      {
        type: 'object',
        properties: { title: { type: 'string' }, count: { type: 'number' } },
      },
      {},
    );
    const schemas = LanguageComponent.schemas([OwnedObject]);
    const node = LanguageCtx.compile(schemas, 'OwnedObject').root({
      count: 2,
      ignored: true,
      title: 'hello',
    });

    expect(node.children().map((child) => child.path.at(-1))).toStrictEqual(['count', 'title']);
    expect(node.child('title')?.children()).toStrictEqual([]);
  });
});

describe('hits collection (public surface)', () => {
  it('records a hit for every candidate schema reached, including losing oneOf branches', () => {
    const result = analyzeComponent('Widget', { icon: 'save' });
    const rootHits = result.hits.filter((hit) => hit.path.length === 0).map((hit) => hit.tag.name);
    // Every oneOf candidate the validator touches records a hit -- winners and losers alike.
    expect(rootHits).toStrictEqual(
      expect.arrayContaining(['Widget', 'ButtonWidget', 'TextWidget', 'IconWidget']),
    );
    // ...while only the winning branch is mounted as an interpretation.
    expect(describeIdentities(result)['/']).toBe('Widget:oneOf(IconWidget)');
  });
});

/*
 * Consolidated from the former gaps.test.ts: known engine gaps now closed by the
 * structural walk (identity comes from resolving the schema at each node, not from
 * collected hits). The losing-branch-child case (#1) lives in capabilities.test.ts.
 *
 * - #2 untagged combinator: identity comes from the entry schema, so an untagged allOf
 *   resolves as a full composite instead of collapsing to the first wrapper (asserted by the
 *   `untaggedComposite` scenario in baseline.test.ts).
 * - #4 ancestor errors: kept only at or below a node, never stapled onto a valid child.
 * - #6 failing object tag: a tagged object keeps its identity and reports failure via
 *   localValid + errors instead of collapsing to unresolved.
 * - #7 (latent, untested): allOf validates candidates independently, so candidates that
 *   are individually satisfiable but jointly impossible would still compose. No current
 *   schema exercises it.
 * - Not a gap but easy to regress: the hit-collecting validator carries a side effect;
 *   the walk uses a separate clean validator so re-validation never records extra hits.
 */
describe('language component gaps', () => {
  it('does not attach ancestor errors to a locally valid descendant', () => {
    const result = analyzeComponent(
      componentScenarios.ancestorError.root,
      componentScenarios.ancestorError.data,
    );

    const inner = result.mountAt(['inner']);
    expect(inner).toBeDefined();
    expect(inner!.localValid).toBe(true);
    expect(inner!.errors).toStrictEqual([]);
  });

  it('keeps a tagged object identity when it fails its own constraints', () => {
    const result = analyzeComponent(
      componentScenarios.ancestorError.root,
      componentScenarios.ancestorError.data,
    );

    const container = result.mountAt([]);
    expect(container).toBeDefined();
    expect(container!.identity.kind).toBe('single');
    expect(container!.identity.name).toBe('Container');
    expect(container!.localValid).toBe(false);
    expect(container!.errors.length).toBeGreaterThan(0);
  });
});
