import type { DateTimeField, DateTimeRequirement } from '../../../block';

/**
 * Validates a date time based on a set of requirements.
 *
 * @param field - The field to validate.
 * @param value - The value of the field.
 * @returns The first requirement that failed validation.
 */
export function validateDateTime(field: DateTimeField, value: string): DateTimeRequirement {
  return field.requirements?.find((requirement) => 'required' in requirement && !value);
}
