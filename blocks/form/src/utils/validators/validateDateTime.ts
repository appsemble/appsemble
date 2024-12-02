import { type Remapper } from '@appsemble/sdk';

import {
  type DateField,
  type DateTimeField,
  type DateTimeRequirement,
  Requirement,
  type Values,
} from '../../../block.js';
import { isValidDate } from '../requirements.js';

/**
 * Validates a date time based on a set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @param remap The remap function to use within the validators.
 * @param values The form values used in the remap function.
 * @returns The first requirement that failed validation.
 */
export function validateDateTime(
  field: DateField | DateTimeField,
  value: string,
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
  values?: Values,
): DateTimeRequirement {
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

    if (Requirement.From in requirement && value) {
      const fromDate = new Date(remap(requirement.from, values));

      if (!isValidDate(fromDate)) {
        return false;
      }

      const isoDate =
        field.type === 'date-time' ? fromDate.toISOString() : fromDate.toISOString().split('T')[0];
      return isoDate > value;
    }

    if (Requirement.To in requirement && value) {
      const toDate = new Date(remap(requirement.to, values));

      if (!isValidDate(toDate)) {
        return false;
      }

      const isoDate =
        field.type === 'date-time' ? toDate.toISOString() : toDate.toISOString().split('T')[0];
      return isoDate < value;
    }
  });
}
