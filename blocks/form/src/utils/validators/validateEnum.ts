import { EnumField, RadioField, RequiredRequirement } from '../../../block.js';

/**
 * Validates an enum picker based on a set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @returns The first requirement that failed validation.
 */
export function validateEnum(field: EnumField, value?: any): RequiredRequirement {
  return field.requirements?.find((requirement) => {
    if ('required' in requirement) {
      return value === undefined;
    }
  });
}

/**
 * Validates an radio picker based on a set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @returns The first requirement that failed validation.
 */
export function validateRadio(field: RadioField, value?: any): RequiredRequirement {
  return field.requirements?.find((requirement) => {
    if ('required' in requirement) {
      return value === undefined;
    }
  });
}
