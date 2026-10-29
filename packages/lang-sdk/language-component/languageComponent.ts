import { type JSONSchema } from '@ngruychev/json-schema-to-ts';
import { type Schema } from 'jsonschema';

import { mapValues } from '../mapValues.js';
import { type Node } from './node.js';
import { type LocalValue } from './overlay-schema.js';
import {
  COMPONENT_KEY,
  isTagged,
  type NodePath,
  type TagMode,
  type TaggedSchema,
} from './types.js';

/**
 * One semantic problem a `validate` binding reports: a message plus where it belongs. `path` locates
 * the offending value RELATIVE to the node the binding runs on — `[]` (or omitted) pins it to the node
 * itself, `['pages', 0, 'name']` to a descendant — so a whole-component check (e.g. a wrapped
 * `validateAppDefinition`) can place each error on its own node rather than piling them on the root. A
 * consumer resolves the absolute location by prefixing the node's path.
 */
export interface Diagnostic {
  message: string;
  path?: NodePath;
}

// Classify a schema for tagging: a combinator by its keyword, or a structured value (object or array)
// by its `type`/`properties`/`items`. Null for a bare primitive — a scalar/enum/const/format leaf
// carries no mountable identity. A deliberately-named array (e.g. `ArrayRemapperDefinition`, a remapper
// chain) is a structured value and tags as a component; only primitives are excluded.
function tagMode(schema: Schema): TagMode | null {
  const combinator = (['oneOf', 'anyOf', 'allOf'] as const).find((keyword) => schema[keyword]);
  if (combinator) {
    return combinator;
  }
  const structured =
    schema.type === 'object' ||
    schema.type === 'array' ||
    schema.properties != null ||
    schema.items != null;
  return structured ? 'single' : null;
}

/**
 * The names of any tagged component in `schemas` that is a bare primitive — the dialect-sanity guard.
 * A dialect author drops this into their own test suite and asserts it returns `[]`, proving no
 * primitive was fed into `define`/`annotate` as a component (`annotate` won't tag one; `define` always
 * tags, so this is what catches a mistaken `define('X', { type: 'string' }, …)`). Primitives belong as
 * `enum`/`const`/`format`/`pattern`-controlled *properties*, never as standalone identities.
 *
 * @param schemas The tagged schema registry to scan.
 * @returns The names of tagged components that are bare primitives.
 */
export function findPrimitiveComponents(schemas: Record<string, Schema>): string[] {
  return Object.entries(schemas)
    .filter(
      ([, schema]) =>
        schema &&
        typeof schema === 'object' &&
        isTagged(schema) &&
        !schema.$ref &&
        tagMode(schema) == null,
    )
    .map(([name]) => name);
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
 *
 * `Ctx` is the dialect's environment bag, declared once by the dialect and threaded to every hook at
 * `compile({ context })`. It carries what the semantic layer needs but the document doesn't hold — a
 * block registry, resource catalog, feature config — kept separate from the value graph the `Node`
 * navigates. It defaults to `unknown`; a dialect narrows it (`define<'X', V, MyCtx>`), and a plain
 * DSL that needs no environment ignores it.
 */
export interface LanguageComponentBinding<Ctx = unknown> {
  // Post-choice semantic checks: one `Diagnostic` per problem, each carrying its own path so a
  // whole-component check places errors on the right descendant, not all on this node. May be async
  // (`Promise<Diagnostic[]>`) so a check can await what it needs — e.g. block manifests reached through
  // `ctx`, or a wrapped `validateAppDefinition` — inline, without a sync cache-and-retry dance.
  // Validation runs off the render path (debounced, on demand), so awaiting is fine; a consumer
  // dispatches it and `await`s the result. A sync check just returns the array.
  validate?: (node: Node, ctx: Ctx) => Diagnostic[] | Promise<Diagnostic[]>;
  // Context-aware completion values offered at this node — the candidate strings themselves, not
  // diagnostics. Async for the same reason (e.g. completing block types or resource names from a remote
  // reached via `ctx`); requested on demand, never in render.
  complete?: (node: Node, ctx: Ctx) => string[] | Promise<string[]>;
  // A human-readable label for this node (hover / describe). Sync — may be rendered inline. Gets `ctx`
  // for symmetry (a label may name an environment fact) but a pure-shape label ignores it.
  describe?: (node: Node, ctx: Ctx) => string;
  // Open, consumer-specific metadata, namespaced by `scope`. The core engine never reads this — a tool
  // built on top of a DSL (e.g. the GUI editor asking for a `'gui-editor'` icon/color) reads its own
  // scope and the DSL author decides what to return. Returns `unknown`; the consumer asserts the shape
  // it declared for its scope. A method (not a static field) so it can be computed per query.
  getExtraAnnotations?: (scope: string) => unknown;
}

/**
 * Read a binding's `scope`-namespaced extra annotations, asserted to the shape `R` the caller declared
 * for that scope. `null` when the binding is absent or offers nothing for the scope. The DSL author owns
 * what a scope returns; the consumer owns `R` — the two agree by convention on the scope name.
 *
 * @param binding The binding to read from, or undefined.
 * @param scope The scope name whose annotations to read.
 * @returns The scope's annotations asserted to `R`, or null when absent.
 */
export function readExtraAnnotations<R>(
  binding: LanguageComponentBinding<unknown> | undefined,
  scope: string,
): R | null {
  return (binding?.getExtraAnnotations?.(scope) as R | undefined) ?? null;
}

/**
 * A declared language component: identity name, annotated schema, behaviors. `define` declares one;
 * `schemas`/`bindings` collect a def list into the `name -> schema` and `name -> binding` registries
 * for `LanguageCtx.compile`; `annotate` bulk-tags an existing schema registry (e.g. the shipped
 * Appsemble schemas) so the analyzer mounts identities without per-component defs.
 */
// The component registry harvested from a tuple of definitions: each def's name -> its `define`-time
// value type.
export type RegistryOf<Defs extends readonly LanguageComponent[]> = {
  [Def in Defs[number] as Def['name']]: Def['valueType'];
};

// The value type of the def named `RootName`.
export type RootValue<Defs extends readonly LanguageComponent[], RootName extends string> = Extract<
  Defs[number],
  { name: RootName }
>['valueType'];

export class LanguageComponent<Name extends string = string, V = unknown, Ctx = unknown> {
  readonly name: Name;

  readonly schema: TaggedSchema;

  readonly binding: LanguageComponentBinding<Ctx>;

  // The materialized TS type of a node of this component, injected at `define`: a hand-written
  // interface for cyclic components (natively recursive, no `Omit`), or an opt-in `FromSchema`
  // derivation for simple ones. Type-only (`declare`, never assigned) so it adds no runtime cost and
  // never widens the schema. `LanguageCtx.compileComponents` harvests it (`RegistryOf`) to type `Node`;
  // the runtime never reads it, and any recursion-heavy derivation stays at this `define` boundary
  // rather than inside the recursive `Node` types, which is what keeps them free of TS2589.
  declare readonly valueType: V;

  private constructor(name: Name, schema: TaggedSchema, binding: LanguageComponentBinding<Ctx>) {
    this.name = name;
    this.schema = schema;
    this.binding = binding;
  }

  // Declare a language component: name, schema (auto-annotated so the analyzer mounts it), behaviors.
  // Unlike the `annotate` heuristic, `define` always tags (an explicit declaration is opt-in whatever
  // the shape), falling back to `single` mode; an existing annotation is kept. Pass the value type
  // explicitly (`define<'Menu', Menu>(…)`) to type the `Node`s over it; it defaults to
  // `unknown` and is erased at runtime either way.
  static define<const Name extends string, V = unknown, Ctx = unknown>(
    name: Name,
    schema: Schema,
    binding: LanguageComponentBinding<Ctx>,
  ): LanguageComponent<Name, V, Ctx> {
    const annotated = isTagged(schema)
      ? schema
      : withTag(schema, name, tagMode(schema) ?? 'single');
    return new LanguageComponent<Name, V, Ctx>(name, annotated, binding);
  }

  // `define` for a `const` schema literal: the value type is its `LocalValue`. The cast only drops
  // `as const`'s readonly, which jsonschema's mutable `Schema` does not accept.
  static defineFromSchema<const Name extends string, const Comp extends JSONSchema, Ctx = unknown>(
    name: Name,
    schema: Comp,
    binding: LanguageComponentBinding<Ctx>,
  ): LanguageComponent<Name, LocalValue<Comp>, Ctx> {
    return LanguageComponent.define<Name, LocalValue<Comp>, Ctx>(
      name,
      schema as unknown as Schema,
      binding,
    );
  }

  // The `name -> schema` registry from a def list, for `LanguageCtx.compile`. Every value is tagged
  // (each def carries a `TaggedSchema`), unlike `annotate`'s mixed output.
  static schemas(defs: LanguageComponent[]): Record<string, TaggedSchema> {
    return Object.fromEntries(defs.map((def) => [def.name, def.schema]));
  }

  // The `name -> binding` registry from a component list, to dispatch behaviors by the identity a node
  // resolves to. Each component carries its own binding (a `define`d def its declared one; a
  // dialect-componentized schema its factory-derived one — see `mergeWithDerived`), so this just
  // collects them.
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
