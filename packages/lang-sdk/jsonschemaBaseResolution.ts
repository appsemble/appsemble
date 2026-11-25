import { type Options, type Schema, type SchemaContext } from 'jsonschema';
// `jsonschema` ships no types for its internal helpers module, which is where the schema context
// it builds while validating lives.
// @ts-expect-error 7016 -- untyped module
import { SchemaContext as UntypedSchemaContext } from 'jsonschema/lib/helpers.js';

const SchemaContextConstructor = UntypedSchemaContext as {
  new (
    schema: Schema,
    options: Options,
    path: (number | string)[],
    base: string,
    schemas: Record<string, Schema>,
  ): SchemaContext;
  prototype: SchemaContext;
};

/**
 * Resolve a child schema's base URI only when that schema declares an id.
 *
 * `jsonschema` resolves a base URI for every schema node it visits, and that URL resolution is the
 * single most expensive part of validating a large app definition. A schema without an `$id` or
 * `id` always resolves to its parent's base, so the resolution only carries information when an id
 * is present. Appsemble's schemas declare no ids, which makes the resolution pure overhead for
 * every node in the document.
 *
 * Calling this more than once is harmless: it installs the same implementation each time rather
 * than wrapping whatever is already there.
 */
export function skipBaseResolutionForSchemasWithoutId(): void {
  SchemaContextConstructor.prototype.makeChild = function makeChild(
    this: SchemaContext,
    schema: Schema,
    propertyName: string,
  ): SchemaContext {
    const path = propertyName === undefined ? this.path : [...this.path, propertyName];
    const id = schema.$id ?? schema.id;
    const base = id ? this.resolve(id) : this.base;
    const ctx = new SchemaContextConstructor(
      schema,
      this.options,
      path,
      base,
      Object.create(this.schemas),
    );
    if (id && !ctx.schemas[base]) {
      ctx.schemas[base] = schema;
    }
    return ctx;
  };
}
