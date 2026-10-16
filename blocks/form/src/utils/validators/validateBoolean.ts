import { type Remapper } from '@appsemble/sdk';

import {
  type BooleanField,
  type BooleanRequirement,
  Requirement,
  type Values,
} from '../../../block.js';

/**
 * Validates a checkbox based on a set of requirements.
 *
 * A required checkbox must be checked, a prohibited checkbox must not be checked.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @param remap The remap function to use within the validators.
 * @param values The form values used in the remap function.
 * @returns The first requirement that failed validation.
 */
export function validateBoolean(
  field: BooleanField,
  value: any,
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
  values?: Values,
): BooleanRequirement {
  // @ts-expect-error strictNullChecks not assignable to type
  return field.requirements?.find((requirement) => {
    if (Requirement.Required in requirement && Boolean(remap(requirement.required, values))) {
      return value !== true;
    }

    if (Requirement.Prohibited in requirement && Boolean(remap(requirement.prohibited, values))) {
      return value === true;
    }
  });
}
