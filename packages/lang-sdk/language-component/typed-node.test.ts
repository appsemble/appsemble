import { describe, expect, expectTypeOf, it } from 'vitest';

import type { BlockDefinition } from '../types/index.js';
import { LanguageComponent, LanguageCtx, type Node } from './index.js';

/*
 * Outside-consumer view of typed `Node`s. The consumer brings its OWN value types — real lang-sdk
 * interfaces, which are natively recursive so cyclic components need no `Omit` — and a `Components`
 * registry mapping component name -> value type. `Node` slices those plain types by indexed access
 * and narrows by registry lookup. No `FromSchema`, no fork: the type assertions here (`expectTypeOf`)
 * compile precisely, and the runtime navigation is honest.
 */
interface MiniApp {
  name: string;
  blocks: BlockDefinition[];
}
interface AppComponents {
  AppDefinition: MiniApp;
  BlockDefinition: BlockDefinition;
}

const schemas = LanguageComponent.schemas([
  LanguageComponent.define(
    'BlockDefinition',
    {
      type: 'object',
      required: ['type', 'version'],
      properties: { type: { type: 'string' }, version: { type: 'string' } },
    },
    {},
  ),
  LanguageComponent.define(
    'AppDefinition',
    {
      type: 'object',
      properties: {
        name: { type: 'string' },
        blocks: { type: 'array', items: { $ref: '#/components/schemas/BlockDefinition' } },
      },
    },
    {},
  ),
]);

describe('typed Node (outside consumer, plain value types)', () => {
  const ctx = LanguageCtx.compile<MiniApp, AppComponents>(schemas, 'AppDefinition');
  const root = ctx.root({ name: 'Shop', blocks: [{ type: 'form', version: '0.0.0' }] });

  it('types the root value and slices objects and arrays by indexed access', () => {
    expectTypeOf(root.val).toEqualTypeOf<MiniApp>();
    // Object slice: a literal key indexes the value type.
    expectTypeOf(root.child('name')).toEqualTypeOf<Node<string, AppComponents> | null>();
    // Array slice: blocks -> BlockDefinition[], then index -> the element type (array-aware ChildValue).
    const block = root.child('blocks')?.child(0);
    expectTypeOf(block?.val).toEqualTypeOf<BlockDefinition | undefined>();
    // Runtime navigation is honest.
    expect(root.child('blocks')?.child(0)?.val).toStrictEqual({ type: 'form', version: '0.0.0' });
  });

  it('narrows by registry lookup with as/is', () => {
    const block = root.child('blocks')?.child(0)?.asLocalValid('BlockDefinition');
    expectTypeOf(block?.val).toEqualTypeOf<BlockDefinition | undefined>();
    // Typed field access on the narrowed value (BlockDefinition.version is a string).
    expectTypeOf(block?.val?.version).toEqualTypeOf<string | undefined>();
    // Runtime: the block node resolves to the BlockDefinition identity.
    expect(root.child('blocks')?.child(0)?.is('BlockDefinition')).toBe(true);
  });

  it('types localValue to the value shape and cuts ref slots at runtime', () => {
    expectTypeOf(root.localValue()).toEqualTypeOf<MiniApp>();
    // Name is an inline field (kept); each block is a $ref-mounted component (blanked).
    expect(root.localValue()).toStrictEqual({ name: 'Shop', blocks: [undefined] });
  });
});
