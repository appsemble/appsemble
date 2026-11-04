import { describe, expect, expectTypeOf, it } from 'vitest';

import { LanguageComponent } from './languageComponent.js';
import { LanguageCtx } from './languageCtx.js';
import { type LCValue, type LocalValue } from './overlay-schema.js';

/*
 * Language components whose value types are derived from `const` schema literals instead of
 * hand-written interfaces. `LocalValue` cuts every `$ref` to `unknown` (the type-level ref-cut), so a
 * recursive component is fine; `as` re-types the referenced node by its own component. `LCValue`
 * follows `$ref`s and suits only non-recursive references.
 */
const linkSchema = {
  $id: 'Link',
  type: 'object',
  required: ['label', 'href'],
  additionalProperties: false,
  properties: { label: { type: 'string' }, href: { type: 'string' } },
} as const;

const menuSchema = {
  $id: 'Menu',
  type: 'object',
  required: ['label', 'children'],
  additionalProperties: false,
  properties: {
    label: { type: 'string' },
    children: { type: 'array', items: { oneOf: [{ $ref: 'Menu' }, { $ref: 'Link' }] } },
  },
} as const;

const link = LanguageComponent.defineFromSchema('Link', linkSchema, {});
const menu = LanguageComponent.defineFromSchema('Menu', menuSchema, {});

describe('schema-derived language components', () => {
  const ctx = LanguageCtx.compileComponents([menu, link], 'Menu');
  const root = ctx.root({ label: 'Main', children: [{ label: 'Home', href: '/' }] });

  it('derives local value types with $ref slots cut to unknown', () => {
    expectTypeOf(root.val).toEqualTypeOf<{ label: string; children: unknown[] }>();
    expect(root.is('Menu')).toBe(true);
  });

  it('re-types a referenced node by its own component', () => {
    const item = root.child('children')?.child(0);
    expectTypeOf(item?.val).toEqualTypeOf<unknown>();
    expectTypeOf(item?.asLocalValid('Link')?.val).toEqualTypeOf<
      { label: string; href: string } | undefined
    >();

    expect(item?.asLocalValid('Link')?.val.href).toBe('/');
    expect(item?.as('Menu')).toBeNull();
  });

  it('follows non-recursive references with LCValue', () => {
    const pageSchema = {
      $id: 'Page',
      type: 'object',
      required: ['links'],
      additionalProperties: false,
      properties: { links: { type: 'array', items: { $ref: 'Link' } } },
    } as const;
    type Page = LCValue<typeof pageSchema, [typeof linkSchema]>;
    expectTypeOf<Page>().toEqualTypeOf<{ links: { label: string; href: string }[] }>();
    expectTypeOf<LocalValue<typeof pageSchema>>().toEqualTypeOf<{ links: unknown[] }>();

    // A deep root type next to local registry entries: only the root follows its references.
    const page = LanguageComponent.defineFromSchema('Page', pageSchema, {});
    const deep = LanguageCtx.compile<Page, { Link: LocalValue<typeof linkSchema> }>(
      LanguageComponent.schemas([page, link]),
      'Page',
    ).root({ links: [{ label: 'Home', href: '/' }] });
    expectTypeOf(deep.child('links')?.child(0)?.val.href).toEqualTypeOf<string | undefined>();
    expect(deep.child('links')?.child(0)?.val.href).toBe('/');
  });
});
