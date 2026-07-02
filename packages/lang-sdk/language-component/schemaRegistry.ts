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
    const schema = this.schemas[ref] ?? this.schemas[ref.split('/').pop()!];
    if (!schema) {
      throw new Error(`Unknown schema ref: ${ref}`);
    }
    return schema;
  }
}
