import { type Schema } from 'jsonschema';

import {
  createShallow,
  governingChild,
  resolve,
  type ResolveContext,
  type Resolution,
} from './scanner.js';
import { SchemaRegistry } from './schemaRegistry.js';
import { COMPONENT_KEY, type Identity, type NodePath } from './types.js';

/**
 * A zipper over (value, schema) pairs. Each focus derives its identity by resolving the
 * schema against the value, and `child` moves down both the schema (via `governingChild`)
 * and the value together, yielding a new cursor. It reuses the same `resolve` and
 * `governingChild` the analyzer uses, so identity is decided identically. The raw value
 * is never mutated; a cursor is just `(schema, value, path)` plus its parent.
 */
export class Cursor {
  private cachedResolution?: Resolution;

  private readonly ctx: ResolveContext;

  readonly schema: Schema;

  readonly value: unknown;

  readonly path: NodePath;

  private readonly parentCursor: Cursor | null;

  // Private: a cursor is only ever rooted via `cursorAt` / `Cursor.at` (which build the internal
  // ResolveContext) or descended via `child`, never constructed directly by a consumer.
  private constructor(
    ctx: ResolveContext,
    schema: Schema,
    value: unknown,
    path: NodePath,
    parentCursor: Cursor | null,
  ) {
    this.ctx = ctx;
    this.schema = schema;
    this.value = value;
    this.path = path;
    this.parentCursor = parentCursor;
  }

  /**
   * Root a cursor at `rootSchema` over `data`, compiling a schema registry for this cursor tree.
   *
   * @param schemas The registry of named schemas.
   * @param rootSchema The schema at the root of the document.
   * @param data The document to navigate.
   * @param componentKey The keyword identities are read from (defaults to COMPONENT_KEY).
   * @returns A cursor focused on the document root.
   */
  static at(
    schemas: Record<string, Schema>,
    rootSchema: Schema,
    data: unknown,
    componentKey: string = COMPONENT_KEY,
  ): Cursor {
    const registry = new SchemaRegistry(schemas);
    const ctx: ResolveContext = {
      resolveRef: (ref) => registry.resolveRef(ref),
      validator: registry.createValidator(),
      shallow: createShallow(),
      componentKey,
    };
    return new Cursor(ctx, rootSchema, data, [], null);
  }

  private resolution(): Resolution {
    this.cachedResolution ??= resolve(this.schema, this.value, this.ctx);
    return this.cachedResolution;
  }

  // The language component identity at this focus, or null when the schema is untagged.
  get identity(): Identity | null {
    return this.resolution().identity;
  }

  // Whether the value satisfies its own (ref-cut) schema at this focus.
  get localValid(): boolean {
    return this.resolution().matched;
  }

  // Move down to `key`, navigating schema and value together; null when unowned.
  child(key: number | string): Cursor | null {
    const schema = governingChild(this.resolution().winners, String(key), this.ctx.resolveRef);
    if (!schema) {
      return null;
    }
    const value =
      this.value == null ? undefined : (this.value as Record<number | string, unknown>)[key];
    return new Cursor(this.ctx, schema, value, [...this.path, key], this);
  }

  parent(): Cursor | null {
    return this.parentCursor;
  }

  // Cursors for every owned key of the current value.
  children(): Cursor[] {
    if (!this.value || typeof this.value !== 'object') {
      return [];
    }
    return Object.keys(this.value)
      .map((key) => this.child(key))
      .filter((cursor): cursor is Cursor => cursor != null);
  }

  // The nearest cursor at or above this one whose identity has `name`.
  nearest(name: string): Cursor | null {
    if (this.identity?.name === name) {
      return this;
    }
    return this.parent()?.nearest(name) ?? null;
  }
}

/**
 * Root a cursor at `rootSchema` over `data`. Compiles a schema registry per call; when
 * navigating repeatedly, reuse one cursor tree rather than re-rooting.
 *
 * @param schemas The registry of named schemas.
 * @param rootSchema The schema at the root of the document.
 * @param data The document to navigate.
 * @param componentKey The keyword identities are read from (defaults to COMPONENT_KEY).
 * @returns A cursor focused on the document root.
 */
export function cursorAt(
  schemas: Record<string, Schema>,
  rootSchema: Schema,
  data: unknown,
  componentKey: string = COMPONENT_KEY,
): Cursor {
  return Cursor.at(schemas, rootSchema, data, componentKey);
}
