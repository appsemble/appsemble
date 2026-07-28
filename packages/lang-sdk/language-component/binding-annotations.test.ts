import { describe, expect, it } from 'vitest';

import { LanguageComponent, LanguageCtx, readExtraAnnotations } from './index.js';

// A consumer-specific annotation shape (e.g. what the GUI editor would declare for its scope).
interface GuiMeta {
  icon: string;
  color: string;
}

const Menu = LanguageComponent.define(
  'Menu',
  { type: 'object', properties: { items: { type: 'array' } } },
  {
    getExtraAnnotations: (scope) =>
      scope === 'gui-editor' ? { icon: 'fontawesome/bars', color: 'blue' } : null,
  },
);

const ctx = LanguageCtx.compile(LanguageComponent.schemas([Menu]), 'Menu', {
  binds: LanguageComponent.bindings([Menu]),
});

describe('binding extra annotations (Phase 4)', () => {
  it('a consumer reads its scope, typed to the shape it declared', () => {
    const meta = readExtraAnnotations<GuiMeta>(ctx.bindingFor('Menu'), 'gui-editor');
    expect(meta).toStrictEqual({ icon: 'fontawesome/bars', color: 'blue' });
  });

  it('returns null for an unknown scope or an absent binding', () => {
    expect(readExtraAnnotations<GuiMeta>(ctx.bindingFor('Menu'), 'other')).toBeNull();
    expect(readExtraAnnotations<GuiMeta>(ctx.bindingFor('Nope'), 'gui-editor')).toBeNull();
  });
});
