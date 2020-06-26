import type { Remapper } from '@appsemble/sdk';

import type { StringField } from '../../block';
import ValidationError from './ValidationError';

export default function validateString(
  field: StringField,
  event: Event,
  value: string,
  remap: (remapper: Remapper, data: any) => any,
): boolean {
  const inputValid = (event.target as HTMLInputElement).validity.valid;

  if (!inputValid) {
    return false;
  }

  field.requirements?.forEach((requirement) => {
    let valid = true;

    if ('regex' in requirement) {
      const regex = new RegExp(requirement.regex, requirement.flags || 'g');
      valid = regex.test(value);
    }

    if ('maxLength' in requirement || 'minLength' in requirement) {
      const maxValid = requirement.maxLength != null ? value.length >= requirement.maxLength : true;
      const minValid = requirement.minLength != null ? value.length <= requirement.minLength : true;

      valid = maxValid && minValid;
    }

    if (!valid) {
      const error = remap(requirement.errorMessage, value);
      throw new ValidationError(error);
    }
  });

  return inputValid;
}
