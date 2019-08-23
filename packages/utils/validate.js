import ZSchema from 'z-schema';

const validator = new ZSchema({
  breakOnFirstError: false,
  reportPathAsArray: true,
});

export class SchemaValidationError extends Error {
  constructor(message) {
    super(message);
    Error.captureStackTrace(this, SchemaValidationError);
  }
}

export default function validate(schema, data) {
  return new Promise((resolve, reject) => {
    validator.validate(data, schema, (errors, valid) => {
      if (valid) {
        resolve();
        return;
      }
      const err = new SchemaValidationError('Schema Validation Failed');
      err.data = errors.reduce((acc, error) => {
        const path = error.path.join('.');

        switch (error.code) {
          case 'OBJECT_MISSING_REQUIRED_PROPERTY':
            error.params.forEach(param => {
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
