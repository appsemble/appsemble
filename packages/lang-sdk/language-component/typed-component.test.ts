import { describe, expect, expectTypeOf, it } from 'vitest';

import { LanguageComponent } from './languageComponent.js';
import { LanguageCtx } from './languageCtx.js';

// The README "Typed nodes" example, kept compiling and true.
interface Menu {
  label: string;
  children: (Link | Menu)[];
}
interface Link {
  label: string;
  href: string;
}

const menu = LanguageComponent.define<'Menu', Menu>(
  'Menu',
  {
    type: 'object',
    required: ['label', 'children'],
    properties: {
      label: { type: 'string' },
      children: { type: 'array', items: { oneOf: [{ $ref: 'Menu' }, { $ref: 'Link' }] } },
    },
  },
  {},
);
const link = LanguageComponent.define<'Link', Link>(
  'Link',
  {
    type: 'object',
    required: ['label', 'href'],
    properties: { label: { type: 'string' }, href: { type: 'string' } },
  },
  {},
);

describe('typed component definitions', () => {
  const ctx = LanguageCtx.compileComponents([menu, link], 'Menu');
  const root = ctx.root({ label: 'Main', children: [{ label: 'Home', href: '/' }] });

  it('types the context from the definitions', () => {
    expectTypeOf(ctx).toEqualTypeOf<LanguageCtx<Menu, { Menu: Menu; Link: Link }>>();
    expectTypeOf(root.val.label).toEqualTypeOf<string>();
    expect(root.is('Menu')).toBe(true);
  });

  it('slices children and narrows by component name', () => {
    const item = root.child('children')?.child(0);
    expectTypeOf(item?.val).toEqualTypeOf<Link | Menu | undefined>();
    expectTypeOf(item?.asLocalValid('Link')?.val.href).toEqualTypeOf<string | undefined>();

    expect(item?.asLocalValid('Link')?.val.href).toBe('/');
    expect(item?.as('Menu')).toBeNull();
  });
});
