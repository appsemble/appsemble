import { type Schema } from 'jsonschema';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { LanguageComponent, type RegistryOf } from './languageComponent.js';
import { LanguageCtx } from './languageCtx.js';

// A deliberately self-referential value type — the cyclic shape that made schema-derived cursors
// over-instantiate (TS2589). Hand-written, it is tied off nominally, so `Node` slices it freely.
interface Menu {
  label: string;
  children: Menu[];
}

// The runtime schema is loose (the runtime never trusts the value type); `children` refs `Menu`.
const menuSchema: Schema = {
  $id: 'Menu',
  type: 'object',
  required: ['label', 'children'],
  properties: {
    label: { type: 'string' },
    children: { type: 'array', items: { $ref: 'Menu' } },
  },
};

// The value type is injected here, at the `define` boundary, not derived inside `Node`.
const menu = LanguageComponent.define<'Menu', Menu>('Menu', menuSchema, {});

describe('phantom-typed define', () => {
  it('harvests the value registry from the definitions', () => {
    // The registry is contained in the defs: name -> injected value type, no separate hand-off.
    expectTypeOf<RegistryOf<[typeof menu]>>().toEqualTypeOf<{ Menu: Menu }>();
    // Runtime mirror: the schema registry is keyed by the same component name the type registry uses.
    expect(Object.keys(LanguageComponent.schemas([menu]))).toStrictEqual(['Menu']);
  });

  it('navigates a recursive component without widening or TS2589', () => {
    const ctx = LanguageCtx.compileComponents([menu], 'Menu');
    const data: Menu = { label: 'root', children: [{ label: 'child', children: [] }] };
    const root = ctx.root(data);

    // Runtime navigation is honest through the cycle.
    expect(root.val.label).toBe('root');
    expect(root.child('children')?.child(0)?.val.label).toBe('child');

    // Types resolve through the recursion and stay exact — neither widened to `unknown` nor blown up.
    expectTypeOf(root.val).toEqualTypeOf<Menu>();
    expectTypeOf(root.child('children')?.child(0)?.val).toEqualTypeOf<Menu | undefined>();
    expectTypeOf(root.asLocalValid('Menu')?.val).toEqualTypeOf<Menu | undefined>();
  });

  it('marks a value narrowed by identity alone as possibly half-written, through the cycle', () => {
    const ctx = LanguageCtx.compileComponents([menu], 'Menu');
    const root = ctx.root({ label: 'root', children: [] } as Menu);
    const draft = root.as('Menu');

    expectTypeOf(draft?.val?.label).toEqualTypeOf<string | undefined>();
    expectTypeOf(draft?.val?.children?.[0]?.children?.[0]?.label).toEqualTypeOf<
      string | undefined
    >();
    expect(draft?.val?.label).toBe('root');
  });
});
