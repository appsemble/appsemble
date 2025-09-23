import { Requirement, type SelectionField, type TagsRequirement } from '../../../block.js';

export function validateSelection(field: SelectionField, value: unknown[]): TagsRequirement {
  // @ts-expect-error strictNullChecks not assignable to type
  return field.requirements?.find((requirement) => {
    if (!Array.isArray(value)) {
      return true;
    }

    if (Requirement.MinItems in requirement && value.length < requirement.minItems!) {
      return true;
    }

    if (Requirement.MaxItems in requirement && value.length > requirement.maxItems!) {
      return true;
    }

    return false;
  });
}
