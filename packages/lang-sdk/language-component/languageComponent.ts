import { type Schema } from 'jsonschema';

import { mapValues } from '../mapValues.js';
import { type Cursor } from './cursor.js';
import { COMPONENT_KEY, isTagged, type TagMode, type TaggedSchema } from './types.js';

// Classify a schema for tagging: a combinator by its keyword, an object by its `type`/
// `properties`, or null for anything else (scalars, which carry no children to mount).
function tagMode(schema: Schema): TagMode | null {
  const combinator = (['oneOf', 'anyOf', 'allOf'] as const).find((keyword) => schema[keyword]);
  if (combinator) {
    return combinator;
  }
  return schema.type === 'object' || schema.properties ? 'single' : null;
}

// Attach the language-component tag naming `name` with resolution `mode`.
function withTag(schema: Schema, name: string, mode: TagMode): TaggedSchema {
  return { ...schema, [COMPONENT_KEY]: { name, mode } };
}

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

/**
 * A declared language component: its identity name, its annotated schema, and its behaviors.
 * `define` declares one; `schemas` and `bindings` collect a def list into the `name -> schema`
 * registry for `Scanner` / `Cursor.at` and the `name -> binding` registry for behavior
 * dispatch; `annotate` bulk-tags an existing schema registry (e.g. the shipped Appsemble
 * schemas) so the analyzer mounts identities for it without per-component defs.
 */
export class LanguageComponent {
  readonly name: string;

  readonly schema: TaggedSchema;

  readonly binding: LanguageComponentBinding;

  private constructor(name: string, schema: TaggedSchema, binding: LanguageComponentBinding) {
    this.name = name;
    this.schema = schema;
    this.binding = binding;
  }

  /**
   * Declare a language component: its identity name, its schema (auto-annotated so the
   * analyzer mounts it), and its behaviors.
   *
   * Unlike the bulk `annotate` heuristic, this always tags the schema (an explicit
   * declaration is an opt-in whatever the shape), falling back to `single` mode; an
   * existing annotation is kept.
   *
   * @param name The identity name.
   * @param schema The schema for the language component; annotated in the returned def.
   * @param binding The behaviors to attach to this identity.
   * @returns The def carrying the annotated schema and its binding.
   */
  static define(
    name: string,
    schema: Schema,
    binding: LanguageComponentBinding,
  ): LanguageComponent {
    const annotated = isTagged(schema)
      ? schema
      : withTag(schema, name, tagMode(schema) ?? 'single');
    return new LanguageComponent(name, annotated, binding);
  }

  /**
   * Build a `name -> schema` registry from a list of defs, for `Scanner` / `Cursor.at`.
   *
   * @param defs The language component defs to collect.
   * @returns The schema registry keyed by identity name.
   */
  static schemas(defs: LanguageComponent[]): Record<string, Schema> {
    return Object.fromEntries(defs.map((def) => [def.name, def.schema]));
  }

  /**
   * Build a `name -> binding` registry from a list of defs, to dispatch behaviors by the
   * identity a cursor resolves to.
   *
   * @param defs The language component defs to collect.
   * @returns The binding registry keyed by identity name.
   */
  static bindings(defs: LanguageComponent[]): Map<string, LanguageComponentBinding> {
    return new Map(defs.map((def) => [def.name, def.binding]));
  }

  /**
   * Bulk-tag an existing `name -> schema` registry, tagging each schema by its key so the
   * analyzer mounts identities for it without per-component `define` calls. Unlike `define`,
   * this only tags taggable shapes (objects and combinators); a scalar or an already-tagged
   * schema is left untouched, so the Appsemble schemas can be opted in wholesale.
   *
   * @param schemas The registry of named schemas.
   * @returns A new registry with each taggable schema annotated by its key.
   */
  static annotate(schemas: Record<string, Schema>): Record<string, Schema> {
    return mapValues(schemas, (schema, name) => {
      if (!schema || typeof schema !== 'object' || isTagged(schema)) {
        return schema;
      }
      const mode = tagMode(schema);
      return mode ? withTag(schema, name, mode) : schema;
    });
  }
}
