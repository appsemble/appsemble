import { type Schema } from 'jsonschema';

import { type CompileOptions, LanguageCtx } from './languageCtx.js';
import { type NodePath } from './types.js';

/**
 * Tier-2 type overlay — a typed VIEW over the runtime cursor: `import type` plus one boundary cast,
 * zero runtime cost, and NO json-schema dependency. A consumer brings a `Components` registry
 * (component name -> that component's value type) and the materialized value types themselves —
 * hand-written lang-sdk interfaces (natively recursive, so cyclic components need no `Omit`), or types
 * derived from `const` schemas via the opt-in `overlay-schema` helper (which is the only part that
 * touches `FromSchema`/the fork).
 *
 * The cursor slices the value type by plain indexed access and narrows by registry lookup; it never
 * transforms a schema type internally. That is why it stays finite even over deeply recursive
 * component graphs: a hand-written recursive interface is already tied off nominally (`V['pages']
 * [number]` is cheap), whereas re-deriving that shape from schema literals inside a recursive cursor
 * surface over-instantiates (TS2589). Schema-literal slicing for LSP/GUI tooling therefore belongs in
 * opt-in helpers, never threaded through this cursor's own types.
 */

// A component registry: component name -> the component's value type. A documentation alias — the
// generics below do NOT constrain to it, so a consumer's `interface` registry works directly (an
// interface is not assignable to a `Record` index signature, but indexed access `C[N]` needs no such
// constraint).
export type Components = Record<string, unknown>;

// The value at key `K` of `V`: the element type for an array/tuple, the property type for an object.
// Array-aware so indexed access does not drag in array method types (`length`, `map`, ...).
export type ChildValue<V, K extends PropertyKey> = V extends readonly (infer E)[]
  ? E
  : K extends keyof V
    ? V[K]
    : unknown;

// The union of a value's child value types, for `children()`. Array-aware, one level, deferred.
export type ChildValues<V> = V extends readonly (infer E)[]
  ? E
  : V extends object
    ? V[keyof V]
    : never;

/**
 * The typed view of a runtime `Node` at a known value type `V`, over registry `C`. The runtime node
 * conforms to this structurally (same method names), so the typed entrypoint casts once and every hop
 * stays a typed lens over honest runtime navigation — sound as long as `V` describes the data (the
 * consumer's promise; the runtime never trusts `V`). Navigators return typed views; `child` slices `V`
 * by a literal key.
 */
export interface TypedNode<V, C> {
  readonly val: V;
  readonly path: NodePath;
  readonly localValid: boolean;

  // Descend to `key`; a literal key slices `V` precisely. Null when the runtime does not own the key.
  child: <K extends PropertyKey>(key: K) => TypedNode<ChildValue<V, K>, C> | null;
  // Every owned child; the value type widens to the union of children.
  children: () => TypedNode<ChildValues<V>, C>[];
  parent: () => TypedNode<unknown, C> | null;
  cursorAt: (relativePath: NodePath) => TypedNode<unknown, C> | null;

  // Registry narrowing without hand-written predicates: `as`/`nearest` return the resolved component's
  // typed view; `is` stays a boolean check (preferred over a `this is` guard, whose self-intersection
  // accumulates on a recursive self type).
  as: <N extends keyof C & string>(name: N) => TypedNode<C[N], C> | null;
  nearest: <N extends keyof C & string>(name: N) => TypedNode<C[N], C> | null;
  is: (name: string) => boolean;

  // The value projected onto its local (ref-cut) shape (own fields kept, cut slots `undefined`).
  localValue: () => V;
}

// The typed view of a compiled context: `root(data)` yields the root node typed to `Root`.
export interface TypedLanguageCtx<Root, C> {
  root: (data: Root) => TypedNode<Root, C>;
}

// View an already-compiled `LanguageCtx` through registry `C` with root value type `Root`. A single
// boundary cast — the runtime is untouched; the types are the consumer's promise about their data.
export function typed<Root, C>(ctx: LanguageCtx): TypedLanguageCtx<Root, C> {
  return ctx as unknown as TypedLanguageCtx<Root, C>;
}

// Compile a schema set and view it typed in one step, passing the root value type and registry.
export function compileTyped<Root, C>(
  schemas: Record<string, Schema>,
  rootName: string,
  options?: CompileOptions,
): TypedLanguageCtx<Root, C> {
  return typed<Root, C>(LanguageCtx.compile(schemas, rootName, options));
}
