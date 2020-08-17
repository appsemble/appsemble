import type { OpenAPIV3 } from 'openapi-types';
import ZSchema from 'z-schema';

const validator = new ZSchema({
  breakOnFirstError: false,
  reportPathAsArray: true,
  ignoreUnknownFormats: true,
});

export class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaValidationError';
  }

  data: { [key: string]: unknown };
}

export function validate(schema: OpenAPIV3.SchemaObject, data: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    validator.validate(data, schema, (errors, valid) => {
      if (valid) {
        resolve();
        return;
      }
      const err = new SchemaValidationError('Schema Validation Failed');
      err.data = errors.reduce((acc: { [key: string]: any }, error: any) => {
        const path = error.path.join('.');

        switch (error.code) {
          case 'OBJECT_MISSING_REQUIRED_PROPERTY':
            error.params.forEach((param: string[]) => {
              const paramPath = error.path.concat(param).join('.');
              acc[paramPath] = { ...acc[paramPath], required: true };
            });
            break;
          case 'ENUM_MISMATCH':
            acc[path] = { ...acc[path], invalidEnumValue: true };
            break;
          case 'INVALID_TYPE':
            acc[path] = { ...acc[path], invalidType: true };
            break;
          default:
            acc[path] = { ...acc[path] };
        }
        return acc;
      }, {});
      reject(err);
    });
  });
}
