import { StringField, StringRequirement } from '../../../block';

/**
 * Validates a string based on a set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @returns The first requirement that failed validation.
 */
export function validateString(field: StringField, value: string): StringRequirement {
  return field.requirements?.find((requirement) => {
    if ('required' in requirement && !value) {
      return true;
    }

    if ('regex' in requirement) {
      const regex = new RegExp(requirement.regex, requirement.flags || 'g');
      return !regex.test(value);
    }

    if ('maxLength' in requirement && (value == null || value.length > requirement.maxLength)) {
      return true;
    }

    if ('minLength' in requirement && (value == null || value.length < requirement.minLength)) {
      return true;
    }

    return false;
  });
}
