import { type Schema } from 'jsonschema';

import {
  type CompileOptions,
  type DynamicChild,
  isTagged,
  LanguageComponent,
  type LanguageComponentBinding,
  LanguageCtx,
} from './language-component/index.js';

/**
 * The dialect layer: a dialect is its component set plus what compiling needs — a root and any
 * dialect-level resolve hooks. Where `LanguageComponent` declares one component and `annotate` bulk-tags
 * a schema registry, this composes those into the thing `LanguageCtx.compile` consumes, and owns the
 * one place a binding factory componentizes bulk-annotated schemas (`deriveBindings`/`mergeWithDerived`)
 * — kept out of `LanguageComponent` so the core stays a pure declaration surface.
 */

// Fills a binding for a bulk-annotated component (name + its annotated schema in, a binding or
// `undefined` out). The hook a consumer uses to attach behavior — e.g. a GUI editor's
// `getExtraAnnotations('gui-editor')` icons — to shipped schemas without hand-writing a `define` each.
export type AnnotationFactory = (
  name: string,
  schema: Schema,
) => LanguageComponentBinding | undefined;

/**
 * A dialect recipe: the full component set (introspectable), the compile root, the full schema registry
 * (components' schemas plus any referenced-but-non-component schemas), and any dialect-level
 * `dynamicChild`. `compileDialect` turns it into a `LanguageCtx`; each consumer compiles its own
 * instance (injecting its own `dynamicChild`/options), so lang-sdk owns the recipe, not a shared ctx.
 */
export interface Dialect {
  components: readonly LanguageComponent[];
  schemas: Record<string, Schema>;
  root: string;
  dynamicChild?: DynamicChild;
}

/**
 * Run the factory over the tagged schemas, keeping the non-`undefined` results — the bindings a factory
 * derives for bulk-annotated components. Pure: it knows nothing about explicit defs; `mergeWithDerived`
 * is where def ownership is applied. Untagged schemas are skipped (a binding there would never dispatch,
 * having no identity).
 *
 * @param annotated The bulk-annotated schemas keyed by name.
 * @param factory The factory invoked per tagged schema to produce a binding.
 * @returns A map from component name to the derived binding.
 */
export function deriveBindings(
  annotated: Record<string, Schema>,
  factory: AnnotationFactory,
): Map<string, LanguageComponentBinding> {
  const derived = new Map<string, LanguageComponentBinding>();
  for (const [name, schema] of Object.entries(annotated)) {
    if (!schema || typeof schema !== 'object' || !isTagged(schema)) {
      continue;
    }
    const binding = factory(name, schema);
    if (binding) {
      derived.set(name, binding);
    }
  }
  return derived;
}

/**
 * Componentize: the final component set + compile registry from explicit defs, the annotated schemas,
 * and the factory-`derived` bindings. Def names are excluded from the annotated half by construction
 * (so a def is never shadowed), each remaining tagged annotated schema becomes a component carrying its
 * derived binding (or none), and untagged annotated schemas stay in `schemas` as referenced-but-non-
 * component entries. The result is disjoint across both axes — no override, no double-mount.
 *
 * @param defs The explicit definitions that own their names.
 * @param annotated The bulk-annotated schemas keyed by name.
 * @param derived The factory-derived bindings for bulk-annotated components.
 * @returns The final component set plus the compile schema registry.
 */
export function mergeWithDerived(
  defs: readonly LanguageComponent[],
  annotated: Record<string, Schema>,
  derived: Map<string, LanguageComponentBinding>,
): { components: LanguageComponent[]; schemas: Record<string, Schema> } {
  const defNames = new Set(defs.map((def) => def.name));
  const componentized = Object.entries(annotated)
    .filter(
      ([name, schema]) =>
        !defNames.has(name) && schema && typeof schema === 'object' && isTagged(schema),
    )
    .map(([name, schema]) => LanguageComponent.define(name, schema, derived.get(name) ?? {}));
  return {
    components: [...defs, ...componentized],
    schemas: { ...annotated, ...LanguageComponent.schemas([...defs]) },
  };
}

/**
 * Compile a dialect recipe into a `LanguageCtx`. Bindings come from the components (each carries its
 * own); `dynamicChild` and other engine hooks come from `options`, falling back to the dialect's.
 *
 * @param dialect The dialect recipe to compile.
 * @param options Compile options; engine hooks fall back to the dialect's own.
 * @returns The compiled `LanguageCtx`.
 */
export function compileDialect(dialect: Dialect, options: CompileOptions = {}): LanguageCtx {
  return LanguageCtx.compile(dialect.schemas, dialect.root, {
    ...options,
    dynamicChild: options.dynamicChild ?? dialect.dynamicChild,
    binds: options.binds ?? LanguageComponent.bindings([...dialect.components]),
  });
}
