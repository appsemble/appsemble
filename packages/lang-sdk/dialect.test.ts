import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { compileDialect, deriveBindings, mergeWithDerived } from './dialect.js';
import { LanguageComponent, readExtraAnnotations } from './language-component/index.js';

/*
 * The dialect layer composes bulk-annotated schemas with explicit defs and a binding factory. `define`d
 * defs own their bindings; the factory fills bindings for the bulk-annotated components no def owns, and
 * `mergeWithDerived` componentizes the result — a disjoint union across both axes (no def is shadowed, a
 * primitive is never a component, an untagged referenced schema survives in the registry, not as a component).
 */

const Defined = LanguageComponent.define(
  'Defined',
  { type: 'object', properties: { kind: { const: 'defined' } } },
  { describe: () => 'from the def' },
);

// Bulk-annotated registry: a tagged object + tagged array (both components), an untagged primitive.
const annotated = LanguageComponent.annotate({
  Widget: { type: 'object', properties: { label: { type: 'string' } } },
  Chain: { type: 'array', items: { $ref: '#/components/schemas/Widget' } },
  Count: { type: 'number' },
});

describe('dialect composition', () => {
  it('derives bindings only for tagged schemas via the factory', () => {
    const derived = deriveBindings(annotated, (name) => ({ describe: () => `annotated ${name}` }));
    expect([...derived.keys()].sort()).toStrictEqual(['Chain', 'Widget']);
    expect(derived.has('Count')).toBe(false);
  });

  it('componentizes annotated schemas without shadowing a def', () => {
    const derived = deriveBindings(annotated, () => ({ describe: () => 'from the factory' }));
    const { components } = mergeWithDerived([Defined], annotated, derived);
    const byName = new Map(components.map((component) => [component.name, component]));
    // The def keeps its own binding; the factory never overrides it.
    expect(byName.get('Defined')?.binding.describe?.(undefined as never, undefined as never)).toBe(
      'from the def',
    );
    // Tagged annotated schemas become components carrying their derived binding.
    expect(byName.get('Widget')?.binding.describe?.(undefined as never, undefined as never)).toBe(
      'from the factory',
    );
    expect(byName.get('Chain')).toBeDefined();
    // The untagged primitive is not a component.
    expect(byName.has('Count')).toBe(false);
  });

  it('keeps untagged referenced schemas in the compile registry, not as components', () => {
    const { components, schemas } = mergeWithDerived([Defined], annotated, new Map());
    expect(components.some((component) => component.name === 'Count')).toBe(false);
    expect(schemas.Count).toBeDefined();
  });

  it('compiles a dialect and dispatches a factory-derived getExtraAnnotations', () => {
    const derived = deriveBindings(annotated, (name) => ({
      getExtraAnnotations: (scope) => (scope === 'gui-editor' ? { icon: `icon-${name}` } : null),
    }));
    const { components, schemas } = mergeWithDerived([], annotated, derived);
    const ctx = compileDialect({
      components,
      schemas: schemas as Record<string, Schema>,
      root: 'Widget',
    });
    const icon = readExtraAnnotations<{ icon: string }>(ctx.bindingFor('Widget'), 'gui-editor');
    expect(icon?.icon).toBe('icon-Widget');
  });
});
