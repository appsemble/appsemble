import { type SelectionField, type TagsRequirement } from '../../../block.js';

export function validateSelection(field: SelectionField, value: unknown[]): TagsRequirement {
  return field.requirements?.find((requirement) => {
    if (!Array.isArray(value)) {
      return true;
    }

    if ('minItems' in requirement && value.length < requirement.minItems) {
      return true;
    }

    if ('maxItems' in requirement && value.length > requirement.maxItems) {
      return true;
    }

    return false;
  });
}
