import { type Schema } from 'jsonschema';

import {
  localShapeFactory,
  resolve,
  resolveChild,
  type ResolveContext,
  type ResolveOptions,
  type Resolution,
} from './resolve.js';
import { SchemaRegistry } from './schemaRegistry.js';
import { type Identity, type NodePath } from './types.js';

/**
 * A zipper over (value, schema) pairs. Each focus derives its identity by resolving the
 * schema against the value, and `child` moves down both the schema (via `resolveChild`)
 * and the value together, yielding a new cursor. It reuses the same `resolve` and
 * `resolveChild` the analyzer uses, so identity is decided identically. The raw value
 * is never mutated; a cursor is just `(schema, value, path)` plus its parent.
 */
export class Cursor {
  private cachedResolution?: Resolution;

  private readonly ctx: ResolveContext;

  readonly schema: Schema;

  readonly value: unknown;

  readonly path: NodePath;

  private readonly parentCursor: Cursor | null;

  // Private: a cursor is only ever rooted via `Cursor.at` (which builds the internal
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
   * @param options The value-directed resolver (see ResolveOptions).
   * @returns A cursor focused on the document root.
   */
  static at(
    schemas: Record<string, Schema>,
    rootSchema: Schema,
    data: unknown,
    options: ResolveOptions = {},
  ): Cursor {
    const registry = new SchemaRegistry(schemas);
    const ctx: ResolveContext = {
      resolveRef: (ref) => registry.resolveRef(ref),
      validator: options.validatorFactory?.() ?? registry.createValidator(),
      localShape: localShapeFactory(),
      dynamicChild: options.dynamicChild,
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

  // Move down to `key`, navigating schema and value together; null when unowned. A
  // value-directed resolver (if configured) is consulted before the structural lookup, so
  // cursor descent matches the walk (BLOCKS.md, Approach B).
  child(key: number | string): Cursor | null {
    const resolution = this.resolution();
    const schema = resolveChild(
      this.ctx,
      resolution.identity?.name ?? null,
      this.value,
      String(key),
      resolution.winners,
    );
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
