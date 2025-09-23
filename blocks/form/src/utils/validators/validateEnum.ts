import { type Remapper } from '@appsemble/sdk';

import { type EnumField, type EnumRequirement, Requirement, type Values } from '../../../block.js';

/**
 * Validates an enum picker based on a set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @param remap The remap function to use within the validators.
 * @param values The form values used in the remap function.
 * @returns The first requirement that failed validation.
 */
export function validateEnum(
  field: EnumField,
  value: any,
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
  values?: Values,
): EnumRequirement {
  // @ts-expect-error strictNullChecks not assignable to type
  return field.requirements?.find((requirement) => {
    if (Requirement.Required in requirement && Boolean(remap(requirement.required, values))) {
      return value === undefined || value == null;
    }

    if (Requirement.Prohibited in requirement && Boolean(remap(requirement.prohibited, values))) {
      return value !== undefined && value != null;
    }
  });
}
