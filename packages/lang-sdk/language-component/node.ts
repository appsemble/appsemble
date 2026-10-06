import { type Schema } from 'jsonschema';

import { childNode, localValue, resolve, type ResolveContext, type Resolution } from './resolve.js';
import { type Identity, type NodePath } from './types.js';

// A component registry: component name -> the component's value type. The default `C` of an untyped
// `Node`; a consumer's `interface` registry works directly (indexed access `C[N]` needs no index
// signature).
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
 * One document node: a `(comp, val, path)` focus plus its parent. Each focus derives its identity by
 * resolving `comp` against `val`; `child` moves down both via the shared `childNode` step, so a node
 * descends exactly as the walk does. The value is never mutated.
 *
 * `Node` is the interactive/navigable form (parent-linked, memoized). The eager walk deliberately
 * does NOT mint a `Node` per document node — it steps over transient frames (perf guardrail). Nodes
 * are minted only where navigation is needed: a tree root, `cursorAt`, `boundaryAt`, `MountIndex.nodeAt`.
 *
 * `V` (the value type) and `C` (the component registry) are phantom: the runtime never trusts them,
 * they are the consumer's promise about the data. `child` slices `V` by a literal key and `as`/`nearest`
 * narrow by registry lookup, both by plain indexed access, so a natively recursive value interface
 * stays finite (no TS2589). Untyped use defaults to `Node<unknown, Components>`.
 */
export class Node<V = unknown, C = Components> {
  private cachedResolution?: Resolution;

  private readonly ctx: ResolveContext;

  // The schema governing this node (may itself be a `$ref`, resolved lazily).
  readonly comp: Schema;

  readonly val: V;

  readonly path: NodePath;

  private readonly parentNode: Node<unknown, C> | null;

  constructor(
    ctx: ResolveContext,
    comp: Schema,
    val: V,
    path: NodePath,
    parentNode: Node<unknown, C> | null,
  ) {
    this.ctx = ctx;
    this.comp = comp;
    this.val = val;
    this.path = path;
    this.parentNode = parentNode;
  }

  // Resolve this node, memoized for its lifetime and — via the ctx's value-keyed cache — across cursor
  // instances too. A fresh cursor minted over an unchanged value (re-render, or an edit that structurally
  // shares this subtree) reuses the prior `Resolution` instead of paying resolve() again; the cache
  // self-invalidates because an edit mints a new value object for the changed path.
  resolve(): Resolution {
    if (this.cachedResolution) {
      return this.cachedResolution;
    }
    const cache = this.ctx.resolutionCache;
    if (cache && this.val != null && typeof this.val === 'object') {
      const key = this.val as object;
      let bySchema = cache.get(key);
      const hit = bySchema?.get(this.comp);
      if (hit) {
        this.cachedResolution = hit;
        return hit;
      }
      const result = resolve(this.comp, this.val, this.ctx);
      if (!bySchema) {
        bySchema = new Map();
        cache.set(key, bySchema);
      }
      bySchema.set(this.comp, result);
      this.cachedResolution = result;
      return result;
    }
    this.cachedResolution = resolve(this.comp, this.val, this.ctx);
    return this.cachedResolution;
  }

  get identity(): Identity | null {
    return this.resolve().identity;
  }

  // Whether the value satisfies its own (ref-cut) schema.
  get localValid(): boolean {
    return this.resolve().matched;
  }

  // This node's value projected onto its local (ref-cut) shape: own inline fields kept, slots that
  // mount a separate component (`$ref` or value-directed child) blanked to `undefined`, containers
  // preserved. The value-level mirror of the schema ref-cut — the editable shape of just this
  // component, for a GUI editor. Navigate to a child node for a sub-component's own local value.
  localValue(): V {
    return localValue(this.comp, this.val, this.ctx) as V;
  }

  // Move down to `key`, schema + value together; null when unowned. Value-directed resolver first
  // (BLOCKS.md), so it descends exactly as the walk does.
  child<K extends number | string>(key: K): Node<ChildValue<V, K>, C> | null {
    const child = childNode(this.val, this.path, this.resolve(), key, this.ctx);
    if (!child) {
      return null;
    }
    return new Node<ChildValue<V, K>, C>(
      this.ctx,
      child.schema,
      child.value as ChildValue<V, K>,
      child.path,
      this as Node<unknown, C>,
    );
  }

  // `child`, but first `await`s the value-directed load for `key` (if the context supplies one), so a
  // `dynamicChild` backed by an async source (e.g. a block manifest) can answer. The load runs inline
  // right before the sync step — no prime-everything pass; a context without `loadDynamicChild` just
  // resolves to `child(key)`.
  async childAsync<K extends number | string>(key: K): Promise<Node<ChildValue<V, K>, C> | null> {
    const identity = this.resolve().identity?.name ?? null;
    await this.ctx.loadDynamicChild?.(identity, this.val, String(key));
    return this.child(key);
  }

  parent(): Node<unknown, C> | null {
    return this.parentNode;
  }

  // Nodes for every owned key of the current value.
  children(): Node<ChildValues<V>, C>[] {
    if (!this.val || typeof this.val !== 'object') {
      return [];
    }
    return Object.keys(this.val)
      .map((key) => this.child(key) as Node<ChildValues<V>, C> | null)
      .filter((node): node is Node<ChildValues<V>, C> => node != null);
  }

  // Navigate a relative path from this node, one `child` per segment; null if any step is unowned.
  cursorAt(relativePath: NodePath): Node<unknown, C> | null {
    if (!relativePath.length) {
      return this as Node<unknown, C>;
    }
    const [key, ...rest] = relativePath;
    return this.child(key)?.cursorAt(rest) ?? null;
  }

  // The nearest enclosing `$ref` boundary at or below this node along `targetPath` — the outermost
  // re-walk root for an edit there. The ref-cutoff makes a node's resolution depend on its value only
  // down to the next `$ref`, so re-walking from the boundary reproduces the subtree. Falls back to
  // this node when the path crosses no `$ref`; stops early at a removed value.
  boundaryAt(targetPath: NodePath): Node<unknown, C> {
    return this.boundaryFrom(this as Node<unknown, C>, targetPath);
  }

  // Recurse `targetPath`, carrying `boundary` as the last `$ref` node seen; stops at an unowned or
  // removed key. A method (not a `this`-alias) so the fold state travels as parameters.
  private boundaryFrom(boundary: Node<unknown, C>, targetPath: NodePath): Node<unknown, C> {
    if (!targetPath.length) {
      return boundary;
    }
    const [key, ...rest] = targetPath;
    const next = this.child(key);
    if (!next || next.val === undefined) {
      return boundary;
    }
    return next.boundaryFrom(next.comp.$ref ? next : boundary, rest);
  }

  // The nearest node at or above this one whose identity has `name`.
  nearest<N extends keyof C & string>(name: N): Node<C[N], C> | null {
    if (this.identity?.name === name) {
      return this as unknown as Node<C[N], C>;
    }
    return this.parent()?.nearest(name) ?? null;
  }

  // Whether this node resolves to component `name`. A plain boolean rather than a `this is` guard, whose
  // self-intersection accumulates on a recursive value type; `as` is the narrowing form.
  is(name: string): boolean {
    return this.identity?.name === name;
  }

  // This node typed to `name` when it resolves to that component, else null — the handle form of `is`.
  as<N extends keyof C & string>(name: N): Node<C[N], C> | null {
    return this.is(name) ? (this as unknown as Node<C[N], C>) : null;
  }
}
