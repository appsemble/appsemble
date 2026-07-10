import { type Schema } from 'jsonschema';

import { annotateSchemas, tagMode } from './annotate.js';
import { type Cursor } from './cursor.js';
import { COMPONENT_KEY, schemaTag } from './types.js';

/**
 * Post-choice behaviors attached to a resolved language component identity. They run only after
 * the walk has decided a node's identity; a binding never takes part in that discrimination and
 * cannot change which identity a node gets (the schema alone drives resolution). Each hook receives
 * a cursor focused on an already-resolved instance, so it reads the value, the schema, and — via
 * `cursor.nearest(...)` — its surrounding context. All hooks are optional.
 *
 * This is the semantic layer, distinct from schema validation: the walk's local-shape check
 * (`Mount.localValid`) and the whole-document `jsonschema` pass already cover structural conformance.
 * `validate` reports what a schema cannot express — reference validity, context-dependent rules —
 * as diagnostics, given that the node is known to be this component.
 */
export interface LanguageComponentBinding {
  // Post-choice semantic checks for a resolved node; returns one diagnostic message per problem.
  validate?: (cursor: Cursor) => string[];
  // Context-aware completion values offered at this node.
  complete?: (cursor: Cursor) => string[];
  // A human-readable label for this node (hover / describe).
  describe?: (cursor: Cursor) => string;
}

export interface LanguageComponent {
  name: string;
  schema: Schema;
  binding: LanguageComponentBinding;
}

/**
 * Declare a language component: its identity name, its schema (auto-annotated under `componentKey` so
 * the analyzer mounts it), and its behaviors. Collect the returned defs with
 * `LanguageComponent.schemas` / `LanguageComponent.bindings` to build an analyzer's schema set and
 * binding registry.
 *
 * Unlike the bulk `annotateSchemas` heuristic, this always tags the schema (an explicit
 * declaration is an opt-in whatever the shape), falling back to `single` mode; an
 * existing annotation is kept.
 *
 * @param name The identity name.
 * @param schema The schema for the language component; annotated in the returned def.
 * @param binding The behaviors to attach to this identity.
 * @param componentKey The keyword to annotate under (defaults to COMPONENT_KEY).
 * @returns The def carrying the annotated schema and its binding.
 */
function defineLanguageComponent(
  name: string,
  schema: Schema,
  binding: LanguageComponentBinding,
  componentKey: string = COMPONENT_KEY,
): LanguageComponent {
  const annotated = schemaTag(schema, componentKey)
    ? schema
    : { ...schema, [componentKey]: { name, mode: tagMode(schema) ?? 'single' } };
  return { name, schema: annotated, binding };
}

/**
 * Build a `name -> schema` registry from a list of defs, for `Scanner` / `Cursor.at`.
 *
 * @param defs The language component defs to collect.
 * @returns The schema registry keyed by identity name.
 */
function componentSchemas(defs: LanguageComponent[]): Record<string, Schema> {
  return Object.fromEntries(defs.map((def) => [def.name, def.schema]));
}

/**
 * Build a `name -> binding` registry from a list of defs, to dispatch behaviors by the
 * identity a cursor resolves to.
 *
 * @param defs The language component defs to collect.
 * @returns The binding registry keyed by identity name.
 */
function componentBindings(defs: LanguageComponent[]): Map<string, LanguageComponentBinding> {
  return new Map(defs.map((def) => [def.name, def.binding]));
}

/**
 * The language-component authoring surface, merged with the `LanguageComponent` type so one name
 * carries both the def shape and the functions that build and collect defs.
 *
 * `define(name, schema, binding, key?)` declares a component (auto-annotated). `schemas(defs)` and
 * `bindings(defs)` collect a def list into the `name -> schema` registry for `Scanner` / `Cursor`
 * and the `name -> binding` registry for behavior dispatch. `annotate(schemas, key?)` bulk-tags an
 * existing schema registry (e.g. the shipped Appsemble schemas) so the analyzer mounts identities
 * for it without per-component defs.
 */
export const LanguageComponent = {
  define: defineLanguageComponent,
  schemas: componentSchemas,
  bindings: componentBindings,
  annotate: annotateSchemas,
};
