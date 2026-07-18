import { type Schema } from 'jsonschema';

import { mapValues } from '../mapValues.js';
import { type Node } from './node.js';
import { COMPONENT_KEY, isTagged, type TagMode, type TaggedSchema } from './types.js';

// Classify a schema for tagging: a combinator by its keyword, an object by its `type`/`properties`,
// or null for anything else (scalars carry no children to mount).
function tagMode(schema: Schema): TagMode | null {
  const combinator = (['oneOf', 'anyOf', 'allOf'] as const).find((keyword) => schema[keyword]);
  if (combinator) {
    return combinator;
  }
  return schema.type === 'object' || schema.properties ? 'single' : null;
}

function withTag(schema: Schema, name: string, mode: TagMode): TaggedSchema {
  return { ...schema, [COMPONENT_KEY]: { name, mode } };
}

/**
 * Post-choice behaviors on a resolved identity. They run only after the walk decides a node's
 * identity — a binding never takes part in that discrimination (the schema alone drives it). Each
 * hook gets the `Node` on an already-resolved instance, reading value, schema, and (via
 * `node.nearest`) surrounding context. This is the semantic layer: it reports what a schema can't
 * express (reference validity, context-dependent rules), given the node is known to be this component.
 */
export interface LanguageComponentBinding {
  // Post-choice semantic checks; one diagnostic message per problem.
  validate?: (node: Node) => string[];
  // Context-aware completion values offered at this node.
  complete?: (node: Node) => string[];
  // A human-readable label for this node (hover / describe).
  describe?: (node: Node) => string;
}

/**
 * A declared language component: identity name, annotated schema, behaviors. `define` declares one;
 * `schemas`/`bindings` collect a def list into the `name -> schema` and `name -> binding` registries
 * for `LanguageCtx.compile`; `annotate` bulk-tags an existing schema registry (e.g. the shipped
 * Appsemble schemas) so the analyzer mounts identities without per-component defs.
 */
export class LanguageComponent<Name extends string = string, V = unknown> {
  readonly name: Name;

  readonly schema: TaggedSchema;

  readonly binding: LanguageComponentBinding;

  // The materialized TS type of a node of this component, injected at `define`: a hand-written
  // interface for cyclic components (natively recursive, no `Omit`), or an opt-in `FromSchema`
  // derivation for simple ones. Type-only (`declare`, never assigned) so it adds no runtime cost and
  // never widens the schema. The typed overlay harvests it (`RegistryOf`/`compileComponents`); the
  // runtime never reads it, and the recursion-heavy derivation stays at this `define` boundary rather
  // than inside the recursive cursor — which is what keeps the cursor free of TS2589.
  declare readonly valueType: V;

  private constructor(name: Name, schema: TaggedSchema, binding: LanguageComponentBinding) {
    this.name = name;
    this.schema = schema;
    this.binding = binding;
  }

  // Declare a language component: name, schema (auto-annotated so the analyzer mounts it), behaviors.
  // Unlike the `annotate` heuristic, `define` always tags (an explicit declaration is opt-in whatever
  // the shape), falling back to `single` mode; an existing annotation is kept. Pass the value type
  // explicitly (`define<'Menu', Menu>(…)`) to carry it into the typed overlay; it defaults to
  // `unknown` and is erased at runtime either way.
  static define<const Name extends string, V = unknown>(
    name: Name,
    schema: Schema,
    binding: LanguageComponentBinding,
  ): LanguageComponent<Name, V> {
    const annotated = isTagged(schema)
      ? schema
      : withTag(schema, name, tagMode(schema) ?? 'single');
    return new LanguageComponent<Name, V>(name, annotated, binding);
  }

  // The `name -> schema` registry from a def list, for `LanguageCtx.compile`. Every value is tagged
  // (each def carries a `TaggedSchema`), unlike `annotate`'s mixed output.
  static schemas(defs: LanguageComponent[]): Record<string, TaggedSchema> {
    return Object.fromEntries(defs.map((def) => [def.name, def.schema]));
  }

  // The `name -> binding` registry from a def list, to dispatch behaviors by the identity a node
  // resolves to.
  static bindings(defs: LanguageComponent[]): Map<string, LanguageComponentBinding> {
    return new Map(defs.map((def) => [def.name, def.binding]));
  }

  // Bulk-tag an existing `name -> schema` registry by key, so the analyzer mounts identities without
  // per-component `define` calls. Unlike `define`, only taggable shapes (objects, combinators) are
  // tagged; scalars and already-tagged schemas pass through — so the Appsemble schemas opt in wholesale.
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
