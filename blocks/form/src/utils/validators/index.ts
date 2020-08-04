import type { Remapper } from '@appsemble/sdk';
import type { BaseRequirement, Field, FileField } from 'blocks/form/block';

import validateNumber from './validateNumber';
import validateString from './validateString';

export default {
  file: (field: FileField, value) => {
    const required = field.requirements?.find((requirement) => requirement.required && !value);

    if (((field.repeated && !(value as File[])?.length) || value === null) && !required) {
      return undefined;
    }

    if (field.accept) {
      if (field.repeated) {
        return (
          !(
            (value as File[]).some((file) => field.accept.includes(file.type)) &&
            (value as File[]).length >= 1
          ) && {}
        );
      }

      // XXX: Implement field requirements
      return !field.accept.includes((value as File).type) && {};
    }

    return undefined;
  },
  geocoordinates: (_, value: { longitude: number; latitude: number }) =>
    !(value.latitude && value.longitude) && {},
  hidden: (): boolean => undefined,
  string: validateString,
  number: validateNumber,
  integer: validateNumber,
  boolean: () => undefined,
  enum: () => undefined,
} as { [name: string]: Validator };

type Validator = (
  field: Field,
  value: any,
  remap: (remapper: Remapper, data: any) => any,
) => BaseRequirement;
