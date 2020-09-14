import type { DateTimeField, DateTimeRequirement } from '../../../block';

export function validateDate(field: DateTimeField, value: Date): DateTimeRequirement {
  return field.requirements?.find((requirement) => {
    console.log(value, requirement);
    return false;
  });
}
