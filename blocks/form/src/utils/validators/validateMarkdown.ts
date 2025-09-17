import { type Remapper } from '@appsemble/sdk';

import {
  type MarkdownField,
  Requirement,
  type StringRequirement,
  type Values,
} from '../../../block.js';

/**
 * Validates markdown based on a set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @param remap The remap function to use within the validators.
 * @param values The form values used in the remap function.
 * @returns The first requirement that failed validation.
 */
export function validateMarkdown(
  field: MarkdownField,
  value: string,
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
  values?: Values,
): StringRequirement {
  // @ts-expect-error strictNullChecks not assignable to type
  return field.requirements?.find((requirement) => {
    if (
      Requirement.Required in requirement &&
      Boolean(remap(requirement.required, values)) &&
      !value
    ) {
      return true;
    }

    return false;
  });
}
