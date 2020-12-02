import { EnumField, RadioField, RequiredRequirement } from '../../../block';

/**
 * Validates an enum picker based on a set of requirements.
 *
 * @param field - The field to validate.
 * @param value - The value of the field.
 * @returns The first requirement that failed validation.
 */
export function validateEnum(field: EnumField, value: any): RequiredRequirement {
  return field.requirements?.find((requirement) => {
    if (!('required' in requirement)) {
      return false;
    }
    if (value === undefined) {
      return true;
    }
    if ('enum' in field) {
      return !field.enum.some((choice) => choice.value === value);
    }
  });
}

/**
 * Validates an radio picker based on a set of requirements.
 *
 * @param field - The field to validate.
 * @param value - The value of the field.
 * @returns The first requirement that failed validation.
 */
export function validateRadio(field: RadioField, value: any): RequiredRequirement {
  return field.requirements?.find((requirement) => {
    if (
      'required' in requirement &&
      (value === undefined || !field.options.find((choice) => choice.value === value))
    ) {
      return true;
    }
  });
}
