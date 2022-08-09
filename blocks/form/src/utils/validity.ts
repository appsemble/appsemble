import { FieldError, FieldErrorMap } from '../../block.js';

function isValid(error: FieldError): boolean {
  if (Array.isArray(error)) {
    return error.every((err) => isValid(err));
  }
  if (error instanceof Object) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return isFormValid(error);
  }
  return !error;
}

/**
 * Check an entire form for validity.
 *
 * @param errors The form errors to check.
 * @param fields The fields to validate. By default all fields are validated.
 * @returns If all given fields are valid.
 */
export function isFormValid(errors: FieldErrorMap, fields = Object.keys(errors)): boolean {
  return fields.every((key) => isValid(errors[key]));
}
