import type { Remapper, Utils } from '@appsemble/sdk';

import type { BaseRequirement, Field } from '../../../block';
import { validateDateTime } from './validateDateTime';
import { validateEnum, validateRadio } from './validateEnum';
import { validateFile } from './validateFile';
import { validateNumber } from './validateNumber';
import { validateString } from './validateString';

export const validators: { [name: string]: Validator } = {
  date: validateDateTime,
  'date-time': validateDateTime,
  enum: validateEnum,
  radio: validateRadio,
  file: validateFile,
  geocoordinates: (_, value: { longitude: number; latitude: number }) =>
    value?.latitude && value?.longitude ? undefined : {},
  string: validateString,
  number: validateNumber,
  integer: validateNumber,
};

type Validator = (
  field: Field,
  value: unknown,
  remap?: (remapper: Remapper, data: any, context?: { [key: string]: any }) => any,
) => BaseRequirement;

export function validate(field: Field, value: any, utils: Utils): boolean | string {
  if (!Object.hasOwnProperty.call(validators, field.type)) {
    return;
  }
  const requirement = validators[field.type](field, value, utils.remap);
  if (requirement) {
    return utils.remap(requirement.errorMessage, value) || true;
  }
}
