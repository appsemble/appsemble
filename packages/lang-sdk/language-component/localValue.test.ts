import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { LanguageComponent, LanguageCtx } from './index.js';

// `Node.localValue()` projects a value onto its local (ref-cut) shape: own inline fields kept, slots
// that mount a separate component ($ref or value-directed child) blanked to `undefined`, unowned keys
// passed through, containers preserved. These tests read the observable projection, not internals.
function compile(schemas: Record<string, Schema>, root: string): LanguageCtx {
  return LanguageCtx.compile(schemas, root);
}

describe('Node.localValue', () => {
  it('cuts $ref child slots to undefined while keeping inline fields and unowned keys', () => {
    const Child = LanguageComponent.define(
      'Child',
      { type: 'object', properties: { name: { type: 'string' } } },
      {},
    );
    const Root = LanguageComponent.define(
      'Root',
      {
        type: 'object',
        properties: {
          title: { type: 'string' },
          sub: { $ref: '#/components/schemas/Child' },
          inlineObj: { type: 'object', properties: { nested: { type: 'string' } } },
        },
      },
      {},
    );
    const node = compile(LanguageComponent.schemas([Root, Child]), 'Root').root({
      title: 'hello',
      sub: { name: 'y' },
      inlineObj: { nested: 'z' },
      extra: 1,
    });

    // Sub ($ref) is cut to undefined; inlineObj (inline sub-schema) is kept and recursively projected;
    // extra (outside the vocabulary) passes through unchanged.
    expect(node.localValue()).toStrictEqual({
      title: 'hello',
      sub: undefined,
      inlineObj: { nested: 'z' },
      extra: 1,
    });
  });

  it('preserves array and map containers while blanking $ref-mounted children', () => {
    const Badge = LanguageComponent.define(
      'Badge',
      { type: 'object', properties: { label: { type: 'string' } } },
      {},
    );
    const Root = LanguageComponent.define(
      'Root',
      {
        type: 'object',
        properties: {
          gallery: { type: 'array', items: { $ref: '#/components/schemas/Badge' } },
          registry: {
            type: 'object',
            additionalProperties: { $ref: '#/components/schemas/Badge' },
          },
        },
      },
      {},
    );
    const node = compile(LanguageComponent.schemas([Root, Badge]), 'Root').root({
      gallery: [{ label: 'a' }, { label: 'b' }],
      registry: { primary: { label: 'c' } },
    });

    // Length and keys survive (editable container state); each ref'd child is blanked.
    expect(node.localValue()).toStrictEqual({
      gallery: [undefined, undefined],
      registry: { primary: undefined },
    });
  });

  it('follows combinator resolution — projects the winning branch, not losing-branch fields', () => {
    const Sub = LanguageComponent.define(
      'Sub',
      { type: 'object', properties: { v: { type: 'string' } } },
      {},
    );
    const BranchA = LanguageComponent.define(
      'BranchA',
      {
        type: 'object',
        required: ['kind'],
        properties: { kind: { const: 'a' }, refField: { $ref: '#/components/schemas/Sub' } },
      },
      {},
    );
    const BranchB = LanguageComponent.define(
      'BranchB',
      {
        type: 'object',
        required: ['kind'],
        properties: { kind: { const: 'b' }, inlineField: { type: 'string' } },
      },
      {},
    );
    const Root = LanguageComponent.define(
      'Root',
      {
        oneOf: [{ $ref: '#/components/schemas/BranchA' }, { $ref: '#/components/schemas/BranchB' }],
      },
      {},
    );
    const node = compile(LanguageComponent.schemas([Root, BranchA, BranchB, Sub]), 'Root').root({
      kind: 'a',
      refField: { v: 'x' },
    });

    // BranchA wins: its `kind` is kept, its `refField` ($ref) is cut. BranchB's `inlineField` never
    // appears (not in the value, and not a winning-branch field to invent).
    expect(node.localValue()).toStrictEqual({ kind: 'a', refField: undefined });
  });

  it('returns scalars and null unchanged', () => {
    const Root = LanguageComponent.define(
      'Root',
      { type: 'object', properties: { n: { type: 'number' } } },
      {},
    );
    const ctx = compile(LanguageComponent.schemas([Root]), 'Root');

    expect(ctx.root(null).localValue()).toBeNull();
    expect(ctx.root(42).localValue()).toBe(42);
  });
});
