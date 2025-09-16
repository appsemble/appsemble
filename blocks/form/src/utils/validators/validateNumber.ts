import { type Remapper } from '@appsemble/sdk';

import {
  type NumberField,
  type NumberRequirement,
  Requirement,
  type Values,
} from '../../../block.js';

export function validateNumber(
  field: NumberField,
  value: number,
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
  values?: Values,
): NumberRequirement {
  // @ts-expect-error strictNullChecks not assignable to type
  return field.requirements?.find((requirement) => {
    if (
      Requirement.Required in requirement &&
      Boolean(remap(requirement.required, values)) &&
      !Number.isFinite(value)
    ) {
      return true;
    }

    if (
      Requirement.Prohibited in requirement &&
      Boolean(remap(requirement.prohibited, values)) &&
      Number.isFinite(value)
    ) {
      return true;
    }

    if (Requirement.Max in requirement && value > requirement.max!) {
      return true;
    }

    if (Requirement.Min in requirement && value < requirement.min!) {
      return true;
    }

    if (Requirement.Step in requirement) {
      return field.type === 'integer'
        ? value % Math.floor(requirement.step)
        : value % requirement.step;
    }

    return false;
  });
}
