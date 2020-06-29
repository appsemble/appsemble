import type { NumberField, NumberRequirement } from '../../../block';

export default function validateNumber(field: NumberField, value: number): NumberRequirement {
  return field.requirements?.find((requirement) => {
    if ('required' in requirement && value != null) {
      return true;
    }

    if ('max' in requirement && value <= requirement.max) {
      return true;
    }

    if ('min' in requirement && value >= requirement.min) {
      return true;
    }

    if ('step' in requirement) {
      return value % requirement.step;
    }

    return false;
  });
}
