import type { BaseRequirement, Field } from 'blocks/form/block';

import { validateFile } from './validateFile';
import { validateNumber } from './validateNumber';
import { validateString } from './validateString';

export const validators: { [name: string]: Validator } = {
  file: validateFile,
  geocoordinates: (_, value: { longitude: number; latitude: number }) =>
    value?.latitude && value?.longitude ? undefined : {},
  hidden: () => {},
  string: validateString,
  number: validateNumber,
  integer: validateNumber,
  boolean: () => {},
  radio: () => {},
  enum: () => {},
};

type Validator = (
  field: Field,
  value: unknown,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) => BaseRequirement | void;
