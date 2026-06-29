import { type Schema } from 'jsonschema';

import { metaMode } from './annotate.js';
import { type Cursor } from './cursor.js';
import { META_KEY, metaTag } from './types.js';

/**
 * Behaviors attached to a meta-object identity. Every hook receives a cursor focused on
 * an instance of the meta-object, so it can read the value, the schema, and — via
 * `cursor.nearest(...)` — its surrounding context. All hooks are optional.
 */
export interface MetaBinding {
  validate?: (cursor: Cursor) => string[];
  complete?: (cursor: Cursor) => string[];
  describe?: (cursor: Cursor) => string;
}

export interface MetaObjectDef {
  name: string;
  schema: Schema;
  binding: MetaBinding;
}

/**
 * Declare a meta-object: its identity name, its schema (auto-annotated under `metaKey` so
 * the analyzer mounts it), and its behaviors. Collect the returned defs with
 * `metaSchemas` / `metaBindings` to build an analyzer's schema set and binding registry.
 *
 * Unlike the bulk `annotateSchemas` heuristic, this always tags the schema (an explicit
 * declaration is an opt-in whatever the shape), falling back to `object` mode; an
 * existing annotation is kept.
 *
 * @param name The identity name.
 * @param schema The schema for the meta-object; annotated in the returned def.
 * @param binding The behaviors to attach to this identity.
 * @param metaKey The keyword to annotate under (defaults to META_KEY).
 * @returns The def carrying the annotated schema and its binding.
 */
export function defineMetaObject(
  name: string,
  schema: Schema,
  binding: MetaBinding,
  metaKey: string = META_KEY,
): MetaObjectDef {
  const annotated = metaTag(schema, metaKey)
    ? schema
    : { ...schema, [metaKey]: { name, mode: metaMode(schema) ?? 'object' } };
  return { name, schema: annotated, binding };
}

/**
 * Build a `name -> schema` registry from a list of defs, for `MetaAnalyzer` / `cursorAt`.
 *
 * @param defs The meta-object defs to collect.
 * @returns The schema registry keyed by identity name.
 */
export function metaSchemas(defs: MetaObjectDef[]): Record<string, Schema> {
  return Object.fromEntries(defs.map((def) => [def.name, def.schema]));
}

/**
 * Build a `name -> binding` registry from a list of defs, to dispatch behaviors by the
 * identity a cursor resolves to.
 *
 * @param defs The meta-object defs to collect.
 * @returns The binding registry keyed by identity name.
 */
export function metaBindings(defs: MetaObjectDef[]): Map<string, MetaBinding> {
  return new Map(defs.map((def) => [def.name, def.binding]));
}
