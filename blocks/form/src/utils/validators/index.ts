import type { BaseRequirement, Field } from '../../../block';
import { validateDate } from './validateDate';
import { validateFile } from './validateFile';
import { validateNumber } from './validateNumber';
import { validateString } from './validateString';

export const validators: { [name: string]: Validator } = {
  file: validateFile,
  geocoordinates: (_, value: { longitude: number; latitude: number }) =>
    value?.latitude && value?.longitude ? undefined : {},
  string: validateString,
  number: validateNumber,
  integer: validateNumber,
  date: validateDate,
  'date-time': validateDate,
  time: validateDate,
};

type Validator = (field: Field, value: unknown) => BaseRequirement;
