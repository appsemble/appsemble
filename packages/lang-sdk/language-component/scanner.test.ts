import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { LanguageComponent, Scanner } from './index.js';
import { SchemaRegistry } from './schemaRegistry.js';

/*
 * Regression tests for the structural walk in scanner.ts: how resolve() picks winners and
 * how childSchema() descends into them. These guard the cases where a schema combines a
 * combinator (allOf/oneOf/anyOf) with structure the walk must still descend into.
 */

const TaggedChild = LanguageComponent.define(
  'TaggedChild',
  { type: 'object', properties: { leaf: { type: 'string' } } },
  {},
);

const Base = LanguageComponent.define(
  'Base',
  { type: 'object', properties: { a: { type: 'string' } } },
  {},
);

// A schema that composes Base via a combinator AND declares its own `properties.child`
// pointing at a tagged component. The combinator winner is Base, but the enclosing
// schema's own properties must still govern descent so `child` mounts.
function derivedVia(combinator: 'allOf' | 'anyOf' | 'oneOf'): Schema {
  return {
    type: 'object',
    [combinator]: [{ $ref: '#/components/schemas/Base' }],
    properties: { child: { $ref: '#/components/schemas/TaggedChild' } },
  };
}

function schemasFor(combinator: 'allOf' | 'anyOf' | 'oneOf'): {
  root: Schema;
  schemas: Record<string, Schema>;
} {
  const Derived = LanguageComponent.define('Derived', derivedVia(combinator), {});
  const Root = LanguageComponent.define(
    'Root',
    { type: 'object', properties: { derived: { $ref: '#/components/schemas/Derived' } } },
    {},
  );
  return {
    root: Root.schema,
    schemas: LanguageComponent.schemas([Root, Derived, Base, TaggedChild]),
  };
}

describe('SchemaRegistry.resolveRef only shortcuts the named-component prefix', () => {
  it('does not resolve a deep JSON-pointer ref to an unrelated same-named top-level schema', () => {
    const registry = new SchemaRegistry({
      Foo: { type: 'object', properties: { bar: { type: 'string' } } },
      // An unrelated top-level schema that happens to share the deep pointer's last segment.
      bar: { type: 'number' },
    });

    // A pointer *into* Foo must not silently resolve to the top-level `bar` schema.
    expect(() => registry.resolveRef('#/components/schemas/Foo/properties/bar')).toThrow(
      /Unknown schema ref/,
    );
    // The plain named component still resolves via the prefix shortcut.
    expect(registry.resolveRef('#/components/schemas/Foo')).toStrictEqual({
      type: 'object',
      properties: { bar: { type: 'string' } },
    });
  });
});

describe('resolve() terminates on schemas that self-reference at a combinator position', () => {
  it('builds the tree for a oneOf whose branch $refs the enclosing schema without overflowing', () => {
    const Recursive = LanguageComponent.define(
      'Recursive',
      {
        type: 'object',
        oneOf: [
          { properties: { leaf: { type: 'string' } } },
          { $ref: '#/components/schemas/Recursive' },
        ],
      },
      {},
    );
    const Root = LanguageComponent.define(
      'Root',
      { type: 'object', properties: { thing: { $ref: '#/components/schemas/Recursive' } } },
      {},
    );
    const scanner = new Scanner(LanguageComponent.schemas([Root, Recursive]));
    const doc = { thing: { leaf: 'x' } };

    // The walk resolves combinators structurally, unbounded by the value; without a cycle
    // guard the self-ref branch expands forever (RangeError). buildTree validates against
    // ref-stripped schemas, so this exercises resolve's recursion, not jsonschema's.
    const tree = scanner.buildTree(doc, Root.schema);

    expect(tree.mounts.get('/thing')?.identity.name).toBe('Recursive');
  });
});

describe('childSchema() descends into tuple-form items arrays', () => {
  it('mounts a tagged element addressed by a positional items tuple', () => {
    const Tagged = LanguageComponent.define(
      'Tagged',
      { type: 'object', properties: { leaf: { type: 'string' } } },
      {},
    );
    const Root = LanguageComponent.define(
      'Root',
      {
        type: 'object',
        properties: {
          tuple: { type: 'array', items: [{ $ref: '#/components/schemas/Tagged' }] },
        },
      },
      {},
    );
    const scanner = new Scanner(LanguageComponent.schemas([Root, Tagged]));
    const doc = { tuple: [{ leaf: 'x' }] };

    const tree = scanner.buildTree(doc, Root.schema);

    expect(tree.mounts.get('/tuple/0')?.identity.name).toBe('Tagged');
  });
});

describe('resolve() keeps the enclosing schema as a governing winner', () => {
  it.each(['allOf', 'anyOf', 'oneOf'] as const)(
    'mounts a tagged child declared on the enclosing schema alongside a %s combinator',
    (combinator) => {
      const { root, schemas } = schemasFor(combinator);
      const doc = { derived: { a: 'x', child: { leaf: 'y' } } };

      const result = Scanner.run(schemas, doc, root);

      // The combinator itself resolves.
      expect(result.mounts.get('/derived')?.identity.name).toBe('Derived');
      // The child under the enclosing schema's own `properties` must still mount.
      expect(result.mounts.get('/derived/child')?.identity.name).toBe('TaggedChild');
    },
  );
});
