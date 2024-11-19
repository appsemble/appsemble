import { Requirement, type StringField, type StringRequirement } from '../../../block.js';

/**
 * Validates a string based on a set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @returns The first requirement that failed validation.
 */
export function validateString(field: StringField, value: string): StringRequirement {
  return field.requirements?.find((requirement) => {
    if (Requirement.Required in requirement && !value) {
      return true;
    }

    if (Requirement.Prohibited in requirement && value) {
      return true;
    }

    if (Requirement.Regex in requirement) {
      const regex = new RegExp(requirement.regex, requirement.flags || 'g');
      return !regex.test(value);
    }

    if (
      Requirement.MaxLength in requirement &&
      (value == null || value.length > requirement.maxLength)
    ) {
      return true;
    }

    if (
      Requirement.MinLength in requirement &&
      (value == null || value.length < requirement.minLength)
    ) {
      return true;
    }

    return false;
  });
}
