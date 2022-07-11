import { Remapper, Utils } from '@appsemble/sdk';
import { has } from '@appsemble/utils';

import { BaseRequirement, Field } from '../../../block';
import { isRequired } from '../requirements';
import { validateDateTime } from './validateDateTime';
import { validateEnum, validateRadio } from './validateEnum';
import { validateFile } from './validateFile';
import { validateNumber } from './validateNumber';
import { validateString } from './validateString';

export const validators: Record<string, Validator> = {
  date: validateDateTime,
  'date-time': validateDateTime,
  enum: validateEnum,
  radio: validateRadio,
  file: validateFile,
  geocoordinates: (field, value: { longitude: number; latitude: number }) =>
    value?.latitude && value?.longitude ? undefined : {},
  string: validateString,
  number: validateNumber,
  integer: validateNumber,
};

type Validator = (
  field: Field,
  value: unknown,
  remap?: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
) => BaseRequirement;

/**
 * Validate a field based on its set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @param utils Utility functions used in the validation process.
 * @param defaultError The default error message if a specific one
 * isn’t defined for a specific requirement.
 * @param defaultValue The default value of this field.
 * @returns - A string containing an error message
 * or a boolean value indicating that there is an error.
 */
export function validate(
  field: Field,
  value: any,
  utils: Utils,
  defaultError: Remapper,
  defaultValue: any,
): boolean | string {
  if (!has(validators, field.type)) {
    return;
  }

  if (!isRequired(field) && value === defaultValue) {
    // Consider empty/unchanged fields that aren’t required as valid.
    return;
  }

  const requirement = validators[field.type](field, value, utils.remap);
  if (requirement) {
    return (
      (utils.remap(requirement.errorMessage, value) as string) ||
      (utils.remap(defaultError, value) as string) ||
      true
    );
  }
}
