import { type RadioField, type RadioRequirement, Requirement } from '../../../block.js';

/**
 * Validates a radio picker based on a set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @returns The first requirement that failed validation.
 */
export function validateRadio(field: RadioField, value?: any): RadioRequirement {
  return field.requirements?.find((requirement) => {
    if (Requirement.Required in requirement) {
      return value === undefined;
    }

    if (Requirement.Prohibited in requirement) {
      return value !== undefined;
    }
  });
}
