import { type Schema } from 'jsonschema';

import { tagMode } from './annotate.js';
import { type Cursor } from './cursor.js';
import { COMPONENT_KEY, schemaTag } from './types.js';

/**
 * Behaviors attached to a language component identity. Every hook receives a cursor focused on
 * an instance of the language component, so it can read the value, the schema, and — via
 * `cursor.nearest(...)` — its surrounding context. All hooks are optional.
 */
export interface LanguageComponentBinding {
  validate?: (cursor: Cursor) => string[];
  complete?: (cursor: Cursor) => string[];
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
 * `componentSchemas` / `componentBindings` to build an analyzer's schema set and binding registry.
 *
 * Unlike the bulk `annotateSchemas` heuristic, this always tags the schema (an explicit
 * declaration is an opt-in whatever the shape), falling back to `object` mode; an
 * existing annotation is kept.
 *
 * @param name The identity name.
 * @param schema The schema for the language component; annotated in the returned def.
 * @param binding The behaviors to attach to this identity.
 * @param componentKey The keyword to annotate under (defaults to COMPONENT_KEY).
 * @returns The def carrying the annotated schema and its binding.
 */
export function defineLanguageComponent(
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
 * Build a `name -> schema` registry from a list of defs, for `Scanner` / `cursorAt`.
 *
 * @param defs The language component defs to collect.
 * @returns The schema registry keyed by identity name.
 */
export function componentSchemas(defs: LanguageComponent[]): Record<string, Schema> {
  return Object.fromEntries(defs.map((def) => [def.name, def.schema]));
}

/**
 * Build a `name -> binding` registry from a list of defs, to dispatch behaviors by the
 * identity a cursor resolves to.
 *
 * @param defs The language component defs to collect.
 * @returns The binding registry keyed by identity name.
 */
export function componentBindings(
  defs: LanguageComponent[],
): Map<string, LanguageComponentBinding> {
  return new Map(defs.map((def) => [def.name, def.binding]));
}
