import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { LanguageComponent, LanguageCtx } from './index.js';

/*
 * Compile-time distinguishability + runtime escalation. A union whose branches differ only BELOW a
 * `$ref` can't be told apart by ref-cut local shape; the analysis flags it, and `resolve` escalates to
 * full validation to break the tie — fixing over-broad anyOf and under-resolved oneOf — while leaving
 * ref-cut-separable unions on the fast path untouched.
 */

// Two payload shapes that a ref hides: an object (needs `n`) vs a plain string.
const NarrowInner = LanguageComponent.define(
  'NarrowInner',
  { type: 'object', required: ['n'], properties: { n: { type: 'integer' } } },
  {},
);
const WideInner = LanguageComponent.define('WideInner', { type: 'string' }, {});

// Two branches whose ONLY difference is the ref'd type of `payload` — identical ref-cut local shape.
const BranchA = LanguageComponent.define(
  'BranchA',
  {
    type: 'object',
    required: ['payload'],
    additionalProperties: false,
    properties: { payload: { $ref: '#/components/schemas/NarrowInner' } },
  },
  {},
);
const BranchB = LanguageComponent.define(
  'BranchB',
  {
    type: 'object',
    required: ['payload'],
    additionalProperties: false,
    properties: { payload: { $ref: '#/components/schemas/WideInner' } },
  },
  {},
);

// The same ambiguous branch pair under each combinator.
const AnyRoot = LanguageComponent.define(
  'AnyRoot',
  { anyOf: [{ $ref: '#/components/schemas/BranchA' }, { $ref: '#/components/schemas/BranchB' }] },
  {},
);
const OneRoot = LanguageComponent.define(
  'OneRoot',
  { oneOf: [{ $ref: '#/components/schemas/BranchA' }, { $ref: '#/components/schemas/BranchB' }] },
  {},
);

// A labeled component whose two (unlabeled, inline) forms have identical ref-cut shape — the same
// pattern as the real AppMemberPropertyDefinition. The component identifies fine; only its fields
// over-broaden, so this is a `warning`, not an `error`.
const FormUnion = LanguageComponent.define(
  'FormUnion',
  {
    anyOf: [
      {
        type: 'object',
        required: ['payload'],
        additionalProperties: false,
        properties: { payload: { $ref: '#/components/schemas/NarrowInner' } },
      },
      {
        type: 'object',
        required: ['payload'],
        additionalProperties: false,
        properties: { payload: { $ref: '#/components/schemas/WideInner' } },
      },
    ],
  },
  {},
);

// A ref-cut-separable union: branches pinned by a `kind` const, distinguishable without escalation.
const Cat = LanguageComponent.define(
  'Cat',
  { type: 'object', required: ['kind'], properties: { kind: { const: 'cat' } } },
  {},
);
const Dog = LanguageComponent.define(
  'Dog',
  { type: 'object', required: ['kind'], properties: { kind: { const: 'dog' } } },
  {},
);
const Pet = LanguageComponent.define(
  'Pet',
  { oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }] },
  {},
);

// A union split only by integer-vs-number on a guaranteed field. Those types OVERLAP (a whole number
// satisfies both), so it must NOT be judged separable — guards the soundness of `typesDisjoint`.
const IntThing = LanguageComponent.define(
  'IntThing',
  { type: 'object', required: ['n'], properties: { n: { type: 'integer' } } },
  {},
);
const NumThing = LanguageComponent.define(
  'NumThing',
  { type: 'object', required: ['n'], properties: { n: { type: 'number' } } },
  {},
);
const NumRoot = LanguageComponent.define(
  'NumRoot',
  { anyOf: [{ $ref: '#/components/schemas/IntThing' }, { $ref: '#/components/schemas/NumThing' }] },
  {},
);

const components = [
  NarrowInner,
  WideInner,
  BranchA,
  BranchB,
  AnyRoot,
  OneRoot,
  FormUnion,
  Cat,
  Dog,
  Pet,
  IntThing,
  NumThing,
  NumRoot,
];
const schemas = LanguageComponent.schemas(components);

const compile = (root: string): LanguageCtx => LanguageCtx.compile(schemas, root);

const partNames = (identity: unknown): string[] => {
  const id = identity as { kind?: string; parts?: { name: string }[] };
  return id?.kind === 'composite' && id.parts ? id.parts.map((part) => part.name) : [];
};

describe('compile-time distinguishability', () => {
  it('flags a union whose branches differ only below a $ref', () => {
    const lint = compile('AnyRoot').distinguishabilityLint;
    expect(lint).toHaveLength(1);
    expect(lint[0].mode).toBe('anyOf');
    expect([lint[0].branchA, lint[0].branchB]).toStrictEqual([0, 1]);
  });

  it('clears a union whose branches are separable by a top-level const', () => {
    expect(compile('Pet').distinguishabilityLint).toStrictEqual([]);
  });

  it('does not treat integer and number branches as separable (they overlap)', () => {
    expect(compile('NumRoot').distinguishabilityLint.length).toBeGreaterThan(0);
  });

  it('rates two indistinguishable distinct labeled components an error', () => {
    // AnyRoot's arms are the labeled components BranchA and BranchB — declared distinct, yet
    // ref-cut can't tell them apart: a labeling-vs-shape contradiction.
    const ctx = compile('AnyRoot');
    expect(ctx.distinguishabilityErrors).toHaveLength(1);
    const [error] = ctx.distinguishabilityErrors;
    expect(error.severity).toBe('error');
    expect([error.componentA, error.componentB]).toStrictEqual(['BranchA', 'BranchB']);
  });

  it('rates a labeled component with overlapping unlabeled forms a warning', () => {
    const [collision] = compile('FormUnion').distinguishabilityLint;
    expect(collision.severity).toBe('warning');
    expect(collision.componentA).toBeUndefined();
  });
});

describe('runtime escalation', () => {
  it('narrows an over-broad anyOf to the single branch the value truly satisfies', () => {
    const ctx = compile('AnyRoot');
    // A string payload ref-cut-matches both branches, but only WideInner accepts it.
    expect(partNames(ctx.root({ payload: 'hello' }).identity)).toStrictEqual(['BranchB']);
    // An object payload with `n` satisfies only NarrowInner.
    expect(partNames(ctx.root({ payload: { n: 1 } }).identity)).toStrictEqual(['BranchA']);
  });

  it('resolves an ambiguous oneOf instead of leaving it unresolved', () => {
    const { identity } = compile('OneRoot').root({ payload: 'hello' });
    expect(identity?.kind).toBe('composite');
    expect(partNames(identity)).toStrictEqual(['BranchB']);
  });

  it('keeps the lenient ref-cut set when the value fully satisfies no branch (mid-edit)', () => {
    // `{}` payload satisfies neither NarrowInner (needs n) nor WideInner (string) — stay permissive.
    expect(partNames(compile('AnyRoot').root({ payload: {} }).identity).sort()).toStrictEqual([
      'BranchA',
      'BranchB',
    ]);
  });

  it('leaves a ref-cut-separable union on the fast path', () => {
    const { identity } = compile('Pet').root({ kind: 'cat' });
    expect(partNames(identity)).toStrictEqual(['Cat']);
  });
});

describe('discriminator short-circuit', () => {
  it('treats a discriminated union as sufficient without local-shape analysis', () => {
    const Link = LanguageComponent.define(
      'Link',
      { type: 'object', required: ['type'], properties: { type: { const: 'link' } } },
      {},
    );
    const Dialog = LanguageComponent.define(
      'Dialog',
      { type: 'object', required: ['type'], properties: { type: { const: 'dialog' } } },
      {},
    );
    const Action = LanguageComponent.define(
      'Action',
      {
        oneOf: [
          { $ref: '#/components/schemas/Link' },
          { $ref: '#/components/schemas/Dialog' },
        ],
        discriminator: { propertyName: 'type' },
      } as Schema,
      {},
    );
    const ctx = LanguageCtx.compile(
      LanguageComponent.schemas([Link, Dialog, Action]),
      'Action',
    );
    expect(ctx.distinguishabilityLint).toStrictEqual([]);
    expect(partNames(ctx.root({ type: 'dialog' }).identity)).toContain('Dialog');
  });
});
