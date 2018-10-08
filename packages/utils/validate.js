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
      err.data = errors.map(error => ({ field: (error.path.join('.') || error.params).toString(), code: error.code, message: error.message }));
      reject(err);
    });
  });
}
