import { type Remapper } from '@appsemble/sdk';

import {
  Requirement,
  type StringField,
  type StringRequirement,
  type Values,
} from '../../../block.js';

/**
 * Validates a string based on a set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @param remap The remap function to use within the validators.
 * @param values The form values used in the remap function.
 * @returns The first requirement that failed validation.
 */
export function validateString(
  field: StringField,
  value: string,
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
  values?: Values,
): StringRequirement {
  return field.requirements?.find((requirement) => {
    if (
      Requirement.Required in requirement &&
      Boolean(remap(requirement.required, values)) &&
      !value
    ) {
      return true;
    }

    if (
      Requirement.Prohibited in requirement &&
      Boolean(remap(requirement.prohibited, values)) &&
      value
    ) {
      return true;
    }

    if (Requirement.Regex in requirement) {
      const regex = new RegExp(requirement.regex, requirement.flags || 'g');
      return !regex.test(value);
    }

    if (
      Requirement.MaxLength in requirement &&
      (value == null || value.length > remap(requirement.maxLength, values))
    ) {
      return true;
    }

    if (
      Requirement.MinLength in requirement &&
      (value == null || value.length < remap(requirement.minLength, values))
    ) {
      return true;
    }

    return false;
  });
}
