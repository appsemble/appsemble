import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { Cursor, LanguageComponent, Scanner } from '../index.js';
import { analyze, describeIdentity, describeIdentities } from './harness.js';
import { miniSchemas, Root } from './schemas.js';
import { scenarios } from './scenarios.js';

const treeIdentities = describeIdentities;

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
        appsembleLanguageComponent: { name: 'RefCutPart', mode: 'single' },
        type: 'object',
        required: ['choice'],
        properties: { choice: { type: 'object' } },
      },
      RefCutContainer: {
        appsembleLanguageComponent: { name: 'RefCutContainer', mode: 'allOf' },
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

    const tree = new Scanner(schemas).buildTree({ choice: { kind: 'a' } }, schemas.RefCutContainer);
    const mounted = tree.mounts.get('/');

    expect(mounted).toBeDefined();
    expect(describeIdentity(mounted!.identity)).toBe('RefCutContainer:allOf(RefCutPart)');
    expect(mounted!.localValid).toBe(true);
  });

  it('enforces an inline anyOf property during local validation', () => {
    const schemas = {
      AnyOfHost: {
        appsembleLanguageComponent: { name: 'AnyOfHost', mode: 'single' },
        type: 'object',
        required: ['choice'],
        properties: {
          // Inline anyOf (no $ref): the ref-cutoff keeps its members, so local
          // validation must still enforce one of them.
          choice: { anyOf: [{ const: 'a' }, { const: 'b' }] },
        },
      },
    } satisfies Record<string, Schema>;

    const valid = new Scanner(schemas).buildTree({ choice: 'a' }, schemas.AnyOfHost);
    const invalid = new Scanner(schemas).buildTree({ choice: 'c' }, schemas.AnyOfHost);

    expect(valid.mounts.get('/')!.localValid).toBe(true);
    expect(invalid.mounts.get('/')!.localValid).toBe(false);
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
    const tree = new Scanner({}).buildTree({}, schema);

    expect(tree.mounts.size).toBe(0);
  });

  it('stops the incremental boundary when a value along the changed path became null', () => {
    const analyzer = new Scanner(miniSchemas);
    const v1 = { environment: 'development', holders: [{ text: 'a', badge: { label: 'x' } }] };
    const treeV1 = analyzer.buildTree(v1, Root);

    const v2 = { environment: 'development', holders: null };
    const incremental = analyzer.buildTree(v2, Root, {
      previous: treeV1,
      changed: [['holders', 0, 'badge']],
    });

    expect(treeIdentities(incremental)).toStrictEqual(treeIdentities(analyzer.buildTree(v2, Root)));
  });

  it('mounts nothing for an untagged oneOf with no matching annotated branch', () => {
    const schemas = {
      UntaggedChoice: {
        oneOf: [
          {
            appsembleLanguageComponent: { name: 'Alpha', mode: 'single' },
            type: 'object',
            required: ['kind'],
            properties: { kind: { const: 'a' } },
          },
          {
            appsembleLanguageComponent: { name: 'Beta', mode: 'single' },
            type: 'object',
            required: ['kind'],
            properties: { kind: { const: 'b' } },
          },
        ],
      },
    } satisfies Record<string, Schema>;

    const tree = new Scanner(schemas).buildTree({ kind: 'c' }, schemas.UntaggedChoice);

    expect(tree.mounts.size).toBe(0);
  });

  it('matches a full rebuild when a changed path is below an unowned schema key', () => {
    const analyzer = new Scanner(miniSchemas);
    const before = {
      environment: 'development',
      gallery: [{ label: 'gold' }],
      metadata: { note: 'before' },
    };
    const after = {
      environment: 'development',
      gallery: [{ label: 'gold' }],
      metadata: { note: 'after' },
    };
    const previous = analyzer.buildTree(before, Root);

    const incremental = analyzer.buildTree(after, Root, {
      previous,
      changed: [['metadata', 'note']],
    });

    expect(treeIdentities(incremental)).toStrictEqual(
      treeIdentities(analyzer.buildTree(after, Root)),
    );
  });

  it('reports an unknown schema ref when analysis resolves a missing ref', () => {
    const root: Schema = {
      type: 'object',
      properties: { item: { $ref: '#/components/schemas/Missing' } },
    };

    expect(() => Scanner.run({}, { item: {} }, root)).toThrow(/Unknown schema ref/);
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
    const root = Cursor.at(schemas, schemas.NullParent, { a: null });

    const grandchild = root.child('a')?.child('b');
    expect(grandchild).not.toBeNull();
    expect(grandchild!.value).toBeUndefined();
  });

  it('returns null from nearest when no ancestor carries the requested identity name', () => {
    const Solo = LanguageComponent.define(
      'SoloRoot',
      { type: 'object', properties: { a: { type: 'string' } } },
      {},
    );
    const schemas = LanguageComponent.schemas([Solo]);
    const root = Cursor.at(schemas, schemas.SoloRoot, { a: 'x' });

    expect(root.nearest('Nonexistent')).toBeNull();
  });

  it('reports cursor local validity for the focused tagged object', () => {
    const TaggedFocus = LanguageComponent.define(
      'TaggedFocus',
      { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
      {},
    );
    const schemas = LanguageComponent.schemas([TaggedFocus]);

    const valid = Cursor.at(schemas, schemas.TaggedFocus, { name: 'ok' });
    const invalid = Cursor.at(schemas, schemas.TaggedFocus, {});

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
    const cursor = Cursor.at(schemas, schemas.BranchHostLocal, { type: 'plain', action: {} });

    expect(cursor.child('type')).not.toBeNull();
    expect(cursor.child('action')).toBeNull();
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
    const cursor = Cursor.at(schemas, schemas.OwnedObject, {
      count: 2,
      ignored: true,
      title: 'hello',
    });

    expect(cursor.children().map((child) => child.path.at(-1))).toStrictEqual(['count', 'title']);
    expect(cursor.child('title')?.children()).toStrictEqual([]);
  });
});

describe('hits collection (public surface)', () => {
  it('records a hit for every candidate schema reached, including losing oneOf branches', () => {
    const result = analyze(scenarios.normal);
    const widgetHits = result.hits
      .filter((hit) => hit.path.length === 1 && hit.path[0] === 'widget')
      .map((hit) => hit.tag.name);
    // Every oneOf candidate the validator touches records a hit -- winners and losers alike.
    expect(widgetHits).toStrictEqual(
      expect.arrayContaining(['Widget', 'ButtonWidget', 'TextWidget', 'IconWidget']),
    );
    // ...while only the winning branch is mounted as an interpretation.
    expect(describeIdentities(result)['/widget']).toBe('Widget:oneOf(IconWidget)');
  });
});

/*
 * Consolidated from the former gaps.test.ts: known engine gaps now closed by the
 * structural walk (identity comes from resolving the schema at each node, not from
 * collected hits). The ghost-from-a-losing-branch case (#1) lives in capabilities.test.ts.
 *
 * - #2 untagged combinator: identity comes from the entry schema, so an untagged allOf
 *   resolves as a full composite instead of collapsing to the first wrapper.
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
  it('composes every wrapper under an untagged combinator', () => {
    const result = analyze(scenarios.untaggedComposite);

    expect(result.documentValid).toBe(true);
    expect(describeIdentities(result)).toStrictEqual({
      '/untaggedComposite':
        'allOf(StrictButtonOrText:oneOf(StrictButton), StrictIconOrTrackable:anyOf(IconWidget, Trackable))',
    });
  });

  it('does not attach ancestor errors to a locally valid descendant', () => {
    const result = analyze(scenarios.ancestorError);

    const inner = result.mountAt(['container', 'inner']);
    expect(inner).toBeDefined();
    expect(inner!.localValid).toBe(true);
    expect(inner!.errors).toStrictEqual([]);
  });

  it('keeps a tagged object identity when it fails its own constraints', () => {
    const result = analyze(scenarios.ancestorError);

    const container = result.mountAt(['container']);
    expect(container).toBeDefined();
    expect(container!.identity.kind).toBe('single');
    expect(container!.identity.name).toBe('Container');
    expect(container!.localValid).toBe(false);
    expect(container!.errors.length).toBeGreaterThan(0);
  });
});
