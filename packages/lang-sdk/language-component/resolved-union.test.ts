import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { LanguageComponent, LanguageCtx } from './index.js';

/*
 * The union a node resolves through is surfaced on its `Resolution` (`union`), so a consumer (the GUI
 * editor's kind switcher) can enumerate every branch and switch kind. The point of carrying it on the
 * resolution — rather than reading it off the node's `comp` schema — is that `comp` may bury the union
 * inside a nested `allOf` when compiled with `draftChildSchemas`, where structural inspection can't
 * find it. The resolver decides the union wherever it sits and bubbles it up. See resolve.ts.
 */

// The real action shape: `allOf[base, { anyOf, discriminator }]` — a shared base plus a discriminated
// union of branches. The union sits one level down inside the `allOf`.
const LinkAction = LanguageComponent.define(
  'LinkAction',
  { type: 'object', required: ['type', 'to'], properties: { type: { const: 'link' }, to: {} } },
  {},
);
const DialogAction = LanguageComponent.define(
  'DialogAction',
  { type: 'object', required: ['type'], properties: { type: { const: 'dialog' } } },
  {},
);
const ActionDefinition = LanguageComponent.define(
  'ActionDefinition',
  {
    allOf: [
      { type: 'object', properties: { onSuccess: {}, remapBefore: {} } },
      {
        discriminator: { propertyName: 'type' },
        anyOf: [
          { $ref: '#/components/schemas/LinkAction' },
          { $ref: '#/components/schemas/DialogAction' },
        ],
      },
    ],
  } as Schema,
  {},
);

const actionCtx = LanguageCtx.compile(
  LanguageComponent.schemas([LinkAction, DialogAction, ActionDefinition]),
  'ActionDefinition',
);

// A holder whose `act` key points at the action union from every branch of its own `anyOf`. Compiled
// with `draftChildSchemas`, the child schema for `act` merges across branches into a nested `allOf`,
// burying the discriminated union deeper still — the exact shape structural union-detection misses.
const Holder = LanguageComponent.define(
  'Holder',
  {
    anyOf: [
      { type: 'object', properties: { act: { $ref: '#/components/schemas/ActionDefinition' } } },
      {
        type: 'object',
        properties: {
          act: { $ref: '#/components/schemas/ActionDefinition' },
          other: {},
        },
      },
    ],
  } as Schema,
  {},
);

const draftCtx = LanguageCtx.compile(
  LanguageComponent.schemas([LinkAction, DialogAction, ActionDefinition, Holder]),
  'Holder',
  { draftChildSchemas: true },
);

describe('resolved union exposure', () => {
  it('surfaces the discriminated union one level down inside an allOf', () => {
    const { union } = actionCtx.root({ type: 'link', to: 'Home' }).resolve();
    expect(union?.mode).toBe('anyOf');
    expect(union?.discriminator?.propertyNames).toStrictEqual(['type']);
    expect(union?.branches).toHaveLength(2);
  });

  it('still surfaces the union for an incomplete value with no discriminant', () => {
    // A freshly-added action `{}` has no `type` yet; the kind switcher must still offer every branch.
    const { union } = actionCtx.root({}).resolve();
    expect(union?.branches).toHaveLength(2);
    expect(union?.branches.map((branch) => branch.name)).toStrictEqual([
      'LinkAction',
      'DialogAction',
    ]);
    expect(union?.discriminator?.propertyNames).toStrictEqual(['type']);
  });

  it('surfaces the union even when draftChildSchemas merges comp into a nested allOf', () => {
    const node = draftCtx.root({ act: { type: 'link', to: 'Home' } }).child('act');
    // The child schema is a merged allOf that buries the union, yet the resolver still finds and
    // carries it — so the GUI reads the kinds off the resolution, not the unreadable comp.
    const { union } = node!.resolve();
    expect(union?.mode).toBe('anyOf');
    expect(union?.branches).toHaveLength(2);
    expect(union?.discriminator?.propertyNames).toStrictEqual(['type']);
  });

  it('carries no union for a node that resolves through none', () => {
    const { union } = actionCtx.root({ type: 'link', to: 'Home' }).child('to')!.resolve();
    expect(union).toBeUndefined();
  });
});
