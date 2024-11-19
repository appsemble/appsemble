import { type NumberField, type NumberRequirement, Requirement } from '../../../block.js';

export function validateNumber(field: NumberField, value: number): NumberRequirement {
  return field.requirements?.find((requirement) => {
    if (Requirement.Required in requirement && !Number.isFinite(value)) {
      return true;
    }

    if (Requirement.Prohibited in requirement && Number.isFinite(value)) {
      return true;
    }

    if (Requirement.Max in requirement && value > requirement.max) {
      return true;
    }

    if (Requirement.Min in requirement && value < requirement.min) {
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
