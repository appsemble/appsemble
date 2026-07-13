import { type Schema, Validator } from 'jsonschema';

export class SchemaRegistry {
  readonly schemas: Record<string, Schema>;

  constructor(schemas: Record<string, Schema>) {
    this.schemas = schemas;
  }

  createValidator(): Validator {
    const validator = new Validator();
    for (const [name, schema] of Object.entries(this.schemas)) {
      validator.addSchema(schema, this.refFor(name));
    }
    return validator;
  }

  refFor(name: string): string {
    return name.includes('://') ? name : `#/components/schemas/${name}`;
  }

  resolveRef(ref: string): Schema {
    // The registry is keyed by component name, so only the `#/components/schemas/{name}` prefix
    // maps to a key. A deeper pointer (e.g. `.../Foo/properties/bar`) is not a named component;
    // matching on its last segment would return an unrelated same-named schema, so it falls
    // through to the unknown-ref error rather than resolving to the wrong shape.
    const prefix = '#/components/schemas/';
    const name = ref.startsWith(prefix) ? ref.slice(prefix.length) : ref;
    const schema = this.schemas[ref] ?? this.schemas[name];
    if (!schema) {
      throw new Error(`Unknown schema ref: ${ref}`);
    }
    return schema;
  }
}
