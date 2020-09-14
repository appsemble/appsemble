import type { FieldErrorMap } from '../../block';

/**
 * Check an entire form for validity.
 *
 * @param errors - The form errors to check.
 * @param fields - The fields to validate. By default all fields are validated.
 *
 * @returns If all given fields are valid.
 */
export function isFormValid(errors: FieldErrorMap, fields = Object.keys(errors)): boolean {
  return fields.every((key) => {
    const error = errors[key];
    if (error instanceof Object) {
      return isFormValid(error);
    }
    return !error;
  });
}
