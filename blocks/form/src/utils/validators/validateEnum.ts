import { type EnumField, type EnumRequirement, Requirement } from '../../../block.js';

/**
 * Validates an enum picker based on a set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @returns The first requirement that failed validation.
 */
export function validateEnum(field: EnumField, value?: any): EnumRequirement {
  return field.requirements?.find((requirement) => {
    if (Requirement.Required in requirement) {
      return value === undefined;
    }

    if (Requirement.Prohibited in requirement) {
      return value !== undefined;
    }
  });
}
